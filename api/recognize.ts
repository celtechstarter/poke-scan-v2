import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  maxDuration: 60
};

const VISION_MODELS = [
  'meta/llama-3.2-11b-vision-instruct',
  'microsoft/phi-3.5-vision-instruct',
];

const PROMPT = `Analysiere diese Pokemon-Karte genau und antworte NUR mit einem JSON-Objekt.

Felder:
- cardName: Kartenname in der Sprache der Karte (z.B. "Glurak VMAX" auf Deutsch, "Charizard VMAX" auf Englisch)
- nameEn: Englischer Kartenname (IMMER auf Englisch, z.B. "Charizard VMAX" auch wenn die Karte deutsch ist)
- set: Name des Sets (z.B. "Darkness Ablaze", "Vivid Voltage", "Evolving Skies")
- number: Kartennummer UNTEN LINKS (z.B. "020/189") - NICHT die Pokédex-Nummer oben rechts!
- rarity: Seltenheit (Common / Uncommon / Rare / Holo Rare / Ultra Rare / Secret Rare)
- language: Sprache der Karte (Englisch / Deutsch / Japanisch / Französisch etc.)

Antworte ausschließlich mit: {"cardName":"...","nameEn":"...","set":"...","number":"...","rarity":"...","language":"..."}
Kein weiterer Text, keine Erklärung.`;

interface CardmarketPrices {
  min: number | null;
  trend: number | null;
  url: string | null;
}

async function fetchCardmarketPrices(nameEn: string, number: string): Promise<CardmarketPrices> {
  const empty: CardmarketPrices = { min: null, trend: null, url: null };

  // Nummer normalisieren: "006/165" → "6"
  const cardNum = number.split('/')[0].replace(/^0+/, '') || number.split('/')[0];
  // Erstes Wort des englischen Namens (z.B. "Charizard" aus "Charizard ex")
  const firstName = nameEn.split(' ')[0];

  // WICHTIG: Doppelpunkte NICHT encoden - sind Teil der Lucene-Syntax
  // Nur den Namens-Wert encoden (Leerzeichen etc.)
  const nameEncoded = encodeURIComponent(nameEn);
  const firstNameEncoded = encodeURIComponent(firstName);

  const urls = [
    // Vollständiger Name + Nummer
    `https://api.pokemontcg.io/v2/cards?q=name:${nameEncoded}+number:${cardNum}&pageSize=8`,
    // Nur vollständiger Name (kein Set-Filter)
    `https://api.pokemontcg.io/v2/cards?q=name:${nameEncoded}&pageSize=8`,
    // Erster Name + Nummer
    `https://api.pokemontcg.io/v2/cards?q=name:${firstNameEncoded}+number:${cardNum}&pageSize=8`,
    // Nur erster Name
    `https://api.pokemontcg.io/v2/cards?q=name:${firstNameEncoded}&pageSize=8`,
  ];

  const controller = new AbortController();
  setTimeout(() => controller.abort(), 5000);

  for (const url of urls) {
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) continue;
      const data = await res.json();
      for (const card of (data.data ?? [])) {
        const cm = card.cardmarket;
        if (cm?.prices?.lowPrice || cm?.prices?.trendPrice) {
          return {
            min: cm.prices.lowPrice ?? null,
            trend: cm.prices.trendPrice ?? null,
            url: cm.url ?? null,
          };
        }
      }
    } catch {
      break;
    }
  }
  return empty;
}

async function callModel(model: string, image: string, apiKey: string, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: PROMPT },
            { type: 'image_url', image_url: { url: image } }
          ]
        }],
        max_tokens: 300,
        temperature: 0.1
      }),
      signal: controller.signal
    });
    return response.ok ? response : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image } = req.body;
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'NVIDIA_API_KEY not configured' });
  if (!image) return res.status(400).json({ error: 'No image provided' });

  const start = Date.now();

  for (const model of VISION_MODELS) {
    const elapsed = Date.now() - start;
    const remaining = 8500 - elapsed;
    if (remaining < 1000) break;

    const response = await callModel(model, image, apiKey, remaining);
    if (!response) {
      console.error(`Model ${model} failed after ${Date.now() - start}ms`);
      continue;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      try {
        const card = JSON.parse(jsonMatch[0]);
        const searchName = card.nameEn || card.cardName;
        const prices = await fetchCardmarketPrices(searchName, card.number ?? '');
        return res.status(200).json({
          ...data,
          model_used: model,
          cardmarket: prices,
        });
      } catch {
        return res.status(200).json({ ...data, model_used: model });
      }
    }

    return res.status(200).json({ ...data, model_used: model });
  }

  return res.status(500).json({ error: 'Karte nicht erkannt. Bitte erneut versuchen.' });
}
