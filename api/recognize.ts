export const config = { runtime: 'edge' };

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ 
      error: 'Invalid request JSON', 
      message: String(e)
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
        model: 'moonshotai/kimi-k2.5',
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

    const responseText = await response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return new Response(JSON.stringify({ 
        error: 'NVIDIA returned invalid JSON', 
        status: response.status,
        responsePreview: responseText.substring(0, 500)
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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
    return new Response(JSON.stringify({ error: 'Fetch error', message: String(error) }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
