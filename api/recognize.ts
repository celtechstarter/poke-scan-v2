import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  maxDuration: 60
};

// Schnelle Modelle zuerst - Vercel Free Tier hat 10s Limit
const VISION_MODELS = [
  'meta/llama-3.2-11b-vision-instruct',
  'microsoft/phi-3.5-vision-instruct',
];

const PROMPT = `Analysiere diese Pokemon-Karte genau und antworte NUR mit einem JSON-Objekt.

Felder:
- cardName: Vollständiger Kartenname (z.B. "Charizard VMAX", "Pikachu V", "Umbreon VMAX")
- set: Name des Sets (z.B. "Darkness Ablaze", "Vivid Voltage", "Evolving Skies")
- number: Kartennummer UNTEN LINKS (z.B. "020/189") - NICHT die Pokédex-Nummer oben rechts!
- rarity: Seltenheit (Common / Uncommon / Rare / Holo Rare / Ultra Rare / Secret Rare)
- language: Sprache der Karte (Englisch / Deutsch / Japanisch / Französisch etc.)

Antworte ausschließlich mit: {"cardName":"...","set":"...","number":"...","rarity":"...","language":"..."}
Kein weiterer Text, keine Erklärung.`;

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
    const remaining = 8500 - elapsed; // 8.5s Budget (1.5s Puffer für Vercel)
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
