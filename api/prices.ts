import type { VercelRequest, VercelResponse } from '@vercel/node';

const TCG_API = 'https://api.pokemontcg.io/v2/cards';

function buildUrl(name: string, num?: string): string {
  const encodedName = name.includes(' ')
    ? `%22${encodeURIComponent(name)}%22`
    : encodeURIComponent(name);
  const namePart = `name:${encodedName}`;
  const numPart = num ? `%20number:${num}` : '';
  return `${TCG_API}?q=${namePart}${numPart}&pageSize=10`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, number } = req.body ?? {};
  if (!name) return res.status(400).json({ error: 'name required' });

  const headers: Record<string, string> = {};
  const apiKey = process.env.POKEMON_TCG_API_KEY;
  if (apiKey) headers['X-Api-Key'] = apiKey;

  const firstName = (name as string).split(' ')[0];
  const rawNum = (number as string | undefined)?.split('/')[0] ?? '';
  const num = rawNum.replace(/^0+/, '') || rawNum;

  const urls = [
    buildUrl(name as string, num || undefined),
    buildUrl(name as string),
    buildUrl(firstName, num || undefined),
    buildUrl(firstName),
  ];

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const apiRes = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timer);

      if (!apiRes.ok) continue;

      const data = await apiRes.json();
      for (const card of (data.data ?? [])) {
        const cm = (card as Record<string, unknown>).cardmarket as Record<string, unknown> | undefined;
        if (!cm) continue;
        const prices = cm.prices as Record<string, number> | undefined;
        if (!prices) continue;
        const min = prices.lowPrice ?? null;
        const trend = prices.trendPrice ?? null;
        if (min !== null || trend !== null) {
          return res.status(200).json({ min, trend, url: (cm.url as string) ?? null, found: true });
        }
      }
    } catch {
      continue;
    }
  }

  return res.status(200).json({ min: null, trend: null, url: null, found: true });
}
