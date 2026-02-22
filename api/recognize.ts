import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  maxDuration: 60
};

const VISION_MODELS = [
  'meta/llama-3.2-90b-vision-instruct',
  'meta/llama-3.2-11b-vision-instruct',
  'microsoft/phi-3.5-vision-instruct'
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image } = req.body;
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'NVIDIA_API_KEY not configured' });
  }

  if (!image) {
    return res.status(400).json({ error: 'No image provided' });
  }

  for (const model of VISION_MODELS) {
    try {
      const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [{
            role: 'user',
            content: [
              { 
                type: 'text', 
                text: 'Analysiere diese Pokemon-Karte. WICHTIG: Die Kartennummer findest du UNTEN LINKS auf der Karte (z.B. "012/172"). Das ist NICHT die Pokedex-Nummer oben rechts! Antworte NUR mit JSON: {"cardName":"...","set":"...","number":"...","rarity":"...","language":"..."}' 
              },
              { 
                type: 'image_url', 
                image_url: { url: image } 
              }
            ]
          }],
          max_tokens: 500,
          temperature: 0.3
        })
      });

      if (response.ok) {
        const data = await response.json();
        return res.status(200).json({ ...data, model_used: model });
      }
    } catch (error) {
      console.error(`Model ${model} failed:`, error);
    }
  }

  return res.status(500).json({ error: 'All models failed' });
}
