import type { VercelRequest, VercelResponse } from '@vercel/node';

const TCG_API = 'https://api.pokemontcg.io/v2/cards';

// Suche per setCode + Nummer (präziseste Methode – nutzt den Code unten auf der Karte)
function buildSetCodeUrl(setCode: string, num: string): string {
  return `${TCG_API}?q=set.ptcgoCode:${encodeURIComponent(setCode)}%20number:${encodeURIComponent(num)}&pageSize=5`;
}

// Suche per set.name + Nummer (Prio 0.5 – für Vintage-Karten ohne setCode)
function buildSetNameUrl(setName: string, num: string): string {
  return `${TCG_API}?q=set.name:%22${encodeURIComponent(setName)}%22%20number:${encodeURIComponent(num)}&pageSize=5`;
}

// Suche per Name (Fallback wenn kein setCode vorhanden)
function buildNameUrl(name: string, num?: string): string {
  const encodedName = name.includes(' ')
    ? `%22${encodeURIComponent(name)}%22`
    : encodeURIComponent(name);
  const namePart = `name:${encodedName}`;
  const numPart = num ? `%20number:${num}` : '';
  return `${TCG_API}?q=${namePart}${numPart}&pageSize=10`;
}

async function fetchPriceFromUrl(url: string, headers: Record<string, string>): Promise<{ min: number | null; trend: number | null; url: string | null } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const apiRes = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timer);
    if (!apiRes.ok) return null;

    const data = await apiRes.json();
    for (const card of (data.data ?? [])) {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, number, setCode, set } = req.body ?? {};
  if (!name) return res.status(400).json({ error: 'name required' });

  const headers: Record<string, string> = {};
  const apiKey = process.env.POKEMON_TCG_API_KEY;
  if (apiKey) headers['X-Api-Key'] = apiKey;

  const firstName = (name as string).split(' ')[0];
  const rawNum = (number as string | undefined)?.split('/')[0] ?? '';
  const num = rawNum.replace(/^0+/, '') || rawNum;

  // Prio 0: setCode + Nummer (exakt) – moderne Karten mit Buchstaben-Kürzel
  if (setCode && num) {
    const result = await fetchPriceFromUrl(buildSetCodeUrl(setCode as string, num), headers);
    if (result) return res.status(200).json({ ...result, found: true, source: 'setCode' });
  }

  // Prio 0.5: set.name + Nummer – Vintage-Karten ohne setCode (Base Set, Jungle, Fossil ...)
  if (!setCode && set && num) {
    const result = await fetchPriceFromUrl(buildSetNameUrl(set as string, num), headers);
    if (result) return res.status(200).json({ ...result, found: true, source: 'setName' });
  }

  // Prio 1–4: Name-basierte Fallbacks (wie bisher)
  const fallbackUrls = [
    buildNameUrl(name as string, num || undefined),
    buildNameUrl(name as string),
    buildNameUrl(firstName, num || undefined),
    buildNameUrl(firstName),
  ];

  for (const url of fallbackUrls) {
    const result = await fetchPriceFromUrl(url, headers);
    if (result) return res.status(200).json({ ...result, found: true, source: 'name' });
  }

  return res.status(200).json({ min: null, trend: null, url: null, found: false });
}
