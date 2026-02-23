import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { maxDuration: 15 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const name = (req.query.name as string) || 'Charizard ex';
  const num = (req.query.num as string) || '6';

  const nameEncoded = encodeURIComponent(name);
  const firstName = encodeURIComponent(name.split(' ')[0]);

  const urls = [
    `https://api.pokemontcg.io/v2/cards?q=name:%22${nameEncoded}%22%20number:${num}&pageSize=5`,
    `https://api.pokemontcg.io/v2/cards?q=name:%22${nameEncoded}%22&pageSize=5`,
    `https://api.pokemontcg.io/v2/cards?q=name:${firstName}%20number:${num}&pageSize=5`,
    `https://api.pokemontcg.io/v2/cards?q=name:${firstName}&pageSize=5`,
  ];

  const results: Record<string, unknown>[] = [];

  for (const url of urls) {
    try {
      const r = await fetch(url);
      const data = await r.json();
      const cards = (data.data ?? []).map((c: Record<string, unknown>) => ({
        name: c.name,
        number: c.number,
        set: (c.set as Record<string, unknown>)?.name,
        cm_low: (c.cardmarket as Record<string, unknown>)?.prices
          ? ((c.cardmarket as Record<string, unknown>).prices as Record<string, unknown>).lowPrice
          : null,
        cm_trend: (c.cardmarket as Record<string, unknown>)?.prices
          ? ((c.cardmarket as Record<string, unknown>).prices as Record<string, unknown>).trendPrice
          : null,
      }));
      results.push({ url, status: r.status, cards });
    } catch (e) {
      results.push({ url, error: String(e) });
    }
  }

  return res.status(200).json({ searched_name: name, searched_num: num, results });
}
