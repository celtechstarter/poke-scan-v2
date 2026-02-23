import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  maxDuration: 60
};

const VISION_MODELS = [
  'meta/llama-3.2-11b-vision-instruct',
  'microsoft/phi-3.5-vision-instruct',
];

const PROMPT = `Analysiere diese Pokemon-Karte und antworte NUR mit einem JSON-Objekt.

Felder:
- cardName: Name exakt wie auf der Karte gedruckt (z.B. "Glurak ex" auf Deutsch, "Charizard ex" auf Englisch)
- nameEn: IMMER der englische Kartenname (z.B. "Charizard ex" - auch wenn die Karte deutsch ist!)
- set: Set-Name auf Englisch - erkenne ihn am Set-Symbol und der Kartennummer (z.B. "Scarlet & Violet - 151", "Sword & Shield - Evolving Skies", "Base Set")
- number: Kartennummer UNTEN LINKS exakt wie gedruckt (z.B. "006/165") - NICHT die Pokédex-Nummer oben rechts!
- rarity: Common / Uncommon / Rare / Holo Rare / Ultra Rare / Secret Rare
- language: Deutsch / Englisch / Japanisch / Französisch etc.

Antworte ausschließlich mit: {"cardName":"...","nameEn":"...","set":"...","number":"...","rarity":"...","language":"..."}
Kein weiterer Text.`;

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
    if (response) {
      const data = await response.json();
      return res.status(200).json({ ...data, model_used: model });
    }
    console.error(`Model ${model} failed after ${Date.now() - start}ms`);
  }

  return res.status(500).json({ error: 'Karte nicht erkannt. Bitte erneut versuchen.' });
}
