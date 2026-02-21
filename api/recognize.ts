export const config = { 
  runtime: 'edge',
  maxDuration: 30
};

const VISION_MODELS = [
  'meta/llama-3.2-90b-vision-instruct',
  'meta/llama-3.2-11b-vision-instruct',
  'microsoft/phi-3.5-vision-instruct'
];

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { image } = body;
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'NVIDIA_API_KEY not configured' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!image) {
    return new Response(JSON.stringify({ error: 'No image provided' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const prompt = `Analysiere diese Pokemon-Karte und extrahiere folgende Informationen:

WICHTIG: Die Kartennummer findest du UNTEN LINKS auf der Karte (z.B. "012/172" oder "025/198"). 
Das ist NICHT die Pokedex-Nummer oben rechts neben den HP!

Antworte NUR mit diesem JSON-Format:
{
  "cardName": "Name des Pokemon",
  "set": "Name des Sets (z.B. Brilliant Stars, Obsidian Flames)",
  "number": "Kartennummer UNTEN LINKS (z.B. 012/172)",
  "rarity": "Seltenheit (Common, Uncommon, Rare, Holo Rare, Ultra Rare, etc.)",
  "language": "Sprache der Karte (English, German, Japanese, etc.)"
}`;

  let lastError = null;
  
  for (const model of VISION_MODELS) {
    try {
      const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: image } }
            ]
          }],
          max_tokens: 300,
          temperature: 0.2
        })
      });

      const data = await response.json();
      
      if (response.ok && data.choices?.[0]?.message?.content) {
        return new Response(JSON.stringify({ ...data, model_used: model }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      lastError = { model, status: response.status, details: data };
      
    } catch (error) {
      lastError = { model, error: String(error) };
    }
  }

  return new Response(JSON.stringify({ 
    error: 'All models failed', 
    lastError,
    triedModels: VISION_MODELS 
  }), { 
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  });
}
