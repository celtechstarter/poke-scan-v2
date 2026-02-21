export const config = { runtime: 'edge' };

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const rawBody = await request.text();
  const preview = rawBody.substring(0, 200);
  
  let body;
  try {
    body = JSON.parse(rawBody);
  } catch (e) {
    return new Response(JSON.stringify({ 
      error: 'Invalid JSON', 
      message: String(e),
      bodyPreview: preview,
      bodyLength: rawBody.length
    }), { 
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

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'moonshotai/kimi-k2-5',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'Analysiere diese Pokemon-Karte. Antworte NUR mit JSON: {"cardName":"...","set":"...","number":"...","rarity":"...","language":"..."}' },
            { type: 'image_url', image_url: { url: image } }
          ]
        }],
        max_tokens: 500,
        temperature: 0.3
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'NVIDIA API error', details: data }), { 
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Server error', message: String(error) }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
