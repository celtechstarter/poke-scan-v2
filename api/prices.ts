import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PTCGO_TO_TCGDEX, SETNAME_TO_TCGDEX } from './_sets.js';

// ─── TCGdex (Prio 0) ────────────────────────────────────────────────────────
// Direkte EUR-Preise von Cardmarket, kein API-Key nötig.
// Set-IDs sind NICHT identisch mit ptcgoCodes – Mapping-Tabelle nötig.

const TCGDEX_API = 'https://api.tcgdex.net/v2/en/sets';

type PriceResult = {
  min: number | null;
  trend: number | null;
  url: string | null;
  verifiedSet?: string;   // Set-Name aus TCGdex (z.B. "151", "Temporal Forces")
  verifiedName?: string;  // Kartenname aus TCGdex (z.B. "Charizard ex")
};

async function fetchFromTCGdex(tcgdexId: string, localId: string): Promise<PriceResult | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${TCGDEX_API}/${tcgdexId}/${localId}`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;

    const card = await res.json() as Record<string, unknown>;
    const pricing = card?.pricing as Record<string, unknown> | undefined;
    const cm = pricing?.cardmarket as Record<string, number> | null | undefined;
    if (!cm) return null;

    const min = cm.low ?? cm['low-holo'] ?? null;
    const trend = cm.trend ?? cm['trend-holo'] ?? null;
    if (min === null && trend === null) return null;

    // Set-Name und Karten-Name direkt aus TCGdex übernehmen – zuverlässiger als KI
    const setInfo = card?.set as Record<string, unknown> | undefined;
    const verifiedSet = (setInfo?.name as string) || undefined;
    const verifiedName = (card?.name as string) || undefined;

    // Cardmarket-Suchlink aus verifizierten Daten bauen (Name + Nummer ohne führende Nullen)
    const cmSearch = verifiedName
      ? `https://www.cardmarket.com/de/Pokemon/Products/Search?searchString=${encodeURIComponent(verifiedName + ' ' + localId)}`
      : null;

    return { min, trend, url: cmSearch, verifiedSet, verifiedName };
  } catch {
    clearTimeout(timer);
    return null;
  }
}

// ─── Pokemon TCG API (Fallback) ──────────────────────────────────────────────

const TCG_API = 'https://api.pokemontcg.io/v2/cards';

function buildSetCodeUrl(setCode: string, num: string): string {
  return `${TCG_API}?q=set.ptcgoCode:${encodeURIComponent(setCode)}%20number:${encodeURIComponent(num)}&pageSize=5`;
}

function buildSetNameUrl(setName: string, num: string): string {
  return `${TCG_API}?q=set.name:%22${encodeURIComponent(setName)}%22%20number:${encodeURIComponent(num)}&pageSize=5`;
}

function buildNameUrl(name: string, num?: string): string {
  const encodedName = name.includes(' ')
    ? `%22${encodeURIComponent(name)}%22`
    : encodeURIComponent(name);
  const numPart = num ? `%20number:${num}` : '';
  return `${TCG_API}?q=name:${encodedName}${numPart}&pageSize=10`;
}

async function fetchFromPokemonTCG(url: string, headers: Record<string, string>): Promise<PriceResult | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const apiRes = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timer);
    if (!apiRes.ok) return null;

    const data = await apiRes.json() as Record<string, unknown>;
    for (const card of ((data.data as unknown[]) ?? [])) {
      const cm = (card as Record<string, unknown>).cardmarket as Record<string, unknown> | undefined;
      if (!cm) continue;
      const prices = cm.prices as Record<string, number> | undefined;
      if (!prices) continue;
      const min = prices.lowPrice ?? null;
      const trend = prices.trendPrice ?? null;
      if (min !== null || trend !== null) {
        return { min, trend, url: (cm.url as string) ?? null };
      }
    }
    return null;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, number, setCode, set } = req.body ?? {};
  if (!name) return res.status(400).json({ error: 'name required' });

  const rawNum = (number as string | undefined)?.split('/')[0] ?? '';
  // localId für TCGdex: führende Nullen entfernen ("006" → "6")
  const localId = rawNum.replace(/^0+/, '') || rawNum;
  // num für Pokemon TCG API: führende Nullen entfernen
  const num = localId;

  const firstName = (name as string).split(' ')[0];

  // ── Prio 0: TCGdex via setCode (schnell, direkte EUR-Preise) ──────────────
  if (setCode && localId) {
    const tcgdexId = PTCGO_TO_TCGDEX[(setCode as string).toUpperCase()];
    if (tcgdexId) {
      const result = await fetchFromTCGdex(tcgdexId, localId);
      if (result) return res.status(200).json({ ...result, found: true, source: 'tcgdex' });
    }
  }

  // ── Prio 1: TCGdex via Set-Name (Vintage ohne setCode) ───────────────────
  if (!setCode && set && localId) {
    const tcgdexId = SETNAME_TO_TCGDEX[set as string];
    if (tcgdexId) {
      const result = await fetchFromTCGdex(tcgdexId, localId);
      if (result) return res.status(200).json({ ...result, found: true, source: 'tcgdex-vintage' });
    }
  }

  const apiKey = process.env.POKEMON_TCG_API_KEY;
  const headers: Record<string, string> = apiKey ? { 'X-Api-Key': apiKey } : {};

  // ── Prio 2: Pokemon TCG API via setCode (liefert direkten Cardmarket-Link) ─
  if (setCode && num) {
    const result = await fetchFromPokemonTCG(buildSetCodeUrl(setCode as string, num), headers);
    if (result) return res.status(200).json({ ...result, found: true, source: 'ptcg-setCode' });
  }

  // ── Prio 3: Pokemon TCG API via Set-Name (Vintage) ───────────────────────
  if (!setCode && set && num) {
    const result = await fetchFromPokemonTCG(buildSetNameUrl(set as string, num), headers);
    if (result) return res.status(200).json({ ...result, found: true, source: 'ptcg-setName' });
  }

  // ── Prio 4–7: Pokemon TCG API Name-Fallbacks ─────────────────────────────

  const fallbackUrls = [
    buildNameUrl(name as string, num || undefined),
    buildNameUrl(name as string),
    buildNameUrl(firstName, num || undefined),
    buildNameUrl(firstName),
  ];

  for (const url of fallbackUrls) {
    const result = await fetchFromPokemonTCG(url, headers);
    if (result) return res.status(200).json({ ...result, found: true, source: 'ptcg-name' });
  }

  return res.status(200).json({ min: null, trend: null, url: null, found: false });
}
