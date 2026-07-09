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
  verifiedSet?: string;       // Set-Name aus TCGdex (z.B. "151", "Temporal Forces")
  verifiedName?: string;      // Kartenname aus TCGdex (z.B. "Charizard ex")
  tcgdexSet?: string | null;  // TCGdex Set-ID (nur bei TCGdex-Quelle), z.B. 'sv03.5'
  localId?: string | null;    // TCGdex Karten-ID im Set, z.B. '6'
  image?: string | null;      // TCGdex Bild-Basis-URL (anhängen: /low.webp oder /high.webp)
  variantLabel?: string | null; // z.B. "HOLO" — nur wenn Varianten-Felder genutzt wurden
  nameMismatch?: boolean;       // true wenn TCGdex-Name stark vom Suchnamen abweicht
};

// useNameGuard: nur true wenn die Suche über einen Namen lief (nicht über setCode+Nummer).
// Bei setCode+Nummer ist die Identität gesichert — deutscher Kartenname (z.B. "Glurak") würde
// sonst fälschlich geblockt, weil TCGdex englische Namen liefert ("Charizard").
async function fetchFromTCGdex(
  tcgdexId: string,
  localId: string,
  searchName: string,
  visualType?: string,
  useNameGuard = false,
): Promise<PriceResult | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${TCGDEX_API}/${tcgdexId}/${localId}`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;

    const card = await res.json() as Record<string, unknown>;

    // Karte muss zumindest einen Namen haben, sonst ist die Response unbrauchbar
    const verifiedName = (card?.name as string) || undefined;
    if (!verifiedName) return null;

    // Name-Guard: nur anwenden wenn Suche via Name (nicht via setCode+Nummer).
    // Ohne Guard: bei Abweichung nameMismatch=true mitgeben (UI zeigt Hinweis).
    const firstWord = searchName.split(' ')[0].toLowerCase();
    const nameMatches = verifiedName.toLowerCase().includes(firstWord);
    if (useNameGuard && !nameMatches) return null;
    const nameMismatch = !nameMatches || undefined;

    const setInfo = card?.set as Record<string, unknown> | undefined;
    const verifiedSet = (setInfo?.name as string) || undefined;

    // Preise: fehlendes pricing-Objekt → min=trend=null (Karten-Identität bleibt gültig)
    const pricing = card?.pricing as Record<string, unknown> | undefined;
    const cm = pricing?.cardmarket as Record<string, number | null> | null | undefined;

    let min: number | null = null;
    let trend: number | null = null;
    let variantLabel: string | null = null;

    if (cm) {
      // TCGdex liefert: low, trend, low-holo, trend-holo (letztere oft null oder 0 = n.v.)
      if (visualType === 'holo') {
        const holoMin = cm['low-holo'];
        const holoTrend = cm['trend-holo'];
        if (holoMin != null && holoMin > 0) { min = holoMin; variantLabel = 'HOLO'; }
        if (holoTrend != null && holoTrend > 0) { trend = holoTrend; variantLabel = 'HOLO'; }
      }
      // Fallback auf Basis-Felder (auch für reverse_holo, full_art usw.)
      if (min === null) min = (cm.low != null && cm.low > 0 ? cm.low : null);
      if (trend === null) trend = (cm.trend != null && cm.trend > 0 ? cm.trend : null);
    }

    const cmSearch = verifiedName
      ? `https://www.cardmarket.com/de/Pokemon/Products/Search?searchString=${encodeURIComponent(verifiedName + ' ' + localId)}`
      : null;

    const image = (card?.image as string) || null;

    return { min, trend, url: cmSearch, verifiedSet, verifiedName, tcgdexSet: tcgdexId, localId, image, variantLabel, nameMismatch };
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

  const { name, number, setCode, set, visual_type } = req.body ?? {};
  if (!name) return res.status(400).json({ error: 'name required' });

  const rawNum = (number as string | undefined)?.split('/')[0] ?? '';
  // localId für TCGdex: führende Nullen entfernen ("006" → "6")
  const localId = rawNum.replace(/^0+/, '') || rawNum;
  // num für Pokemon TCG API: führende Nullen entfernen
  const num = localId;

  const firstName = (name as string).split(' ')[0];

  const vt = (visual_type as string | undefined) ?? undefined;

  // ── Prio 0: TCGdex via setCode (schnell, direkte EUR-Preise) ──────────────
  if (setCode && localId) {
    const tcgdexId = PTCGO_TO_TCGDEX[(setCode as string).toUpperCase()];
    if (tcgdexId) {
      const result = await fetchFromTCGdex(tcgdexId, localId, name as string, vt, false);
      if (result) return res.status(200).json({
        ...result,
        found: result.min !== null || result.trend !== null,
        source: 'tcgdex',
      });
    }
  }

  // ── Prio 1: TCGdex via Set-Name (Vintage ohne setCode) ───────────────────
  if (!setCode && set && localId) {
    const tcgdexId = SETNAME_TO_TCGDEX[set as string];
    if (tcgdexId) {
      const result = await fetchFromTCGdex(tcgdexId, localId, name as string, vt, false);
      if (result) return res.status(200).json({
        ...result,
        found: result.min !== null || result.trend !== null,
        source: 'tcgdex-vintage',
      });
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
