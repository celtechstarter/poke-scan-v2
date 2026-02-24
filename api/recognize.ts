import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  maxDuration: 60
};

const VISION_MODELS = [
  'meta/llama-3.2-11b-vision-instruct',
  'microsoft/phi-3.5-vision-instruct',
];

const PROMPT = `Du analysierst eine Pokemon-Karte. Deine wichtigste Aufgabe ist es, die kleinen Codes in der UNTEREN LINKEN ECKE der Karte zu lesen.

=== SCHRITT 1: UNTERE LINKE ECKE (zuerst lesen!) ===

In der unteren linken Ecke steht immer diese Sequenz in kleiner Schrift:
  [Set-Symbol]  [SETCODE]  [Sprachkuerzel]  [Nummer/Gesamt]

Konkrete Beispiele - genau so sieht es auf der Karte aus:
  "MEW de 006/165"  =>  setCode="MEW"  number="006/165"
  "TEF de 197/192"  =>  setCode="TEF"  number="197/192"
  "OBF en 215/230"  =>  setCode="OBF"  number="215/230"
  "PAR en 068/193"  =>  setCode="PAR"  number="068/193"

Regeln fuer setCode:
  - Immer 2-4 GROSSBUCHSTABEN direkt nach dem Set-Symbol, VOR dem Sprachkuerzel
  - Gueltige Beispiele: MEW, TEF, OBF, SIT, PAR, SVP, PRE, SSP, TWM, SCR, SFA, SVI, PAL

  NIEMALS als setCode verwenden:
  - "ex", "GX", "V", "VMAX", "VSTAR" => das sind Kartentitel-Suffixe oben auf der Karte, NICHT unten!
  - "de", "en", "fr", "it", "es", "pt" => Sprachkuerzel, kommen NACH dem setCode
  - Pokedex-Nummer oben rechts => gehoert nicht hierher

Wenn unten links kein Buchstaben-Code erkennbar ist (aeltere Karten) => setCode: ""

=== SCHRITT 2: KARTEN-INFORMATIONEN ===

- cardName: Name oben auf der Karte (z.B. "Glurak ex", "Pikachu", "Mewtu ex"). "ex"/"GX" etc. gehoeren zum Namen!
- nameEn: Englischer Name der Karte (z.B. "Charizard ex", "Pikachu", "Mewtwo ex")
- set: Set-Name auf Englisch (z.B. "151", "Temporal Forces", "Obsidian Flames")
- rarity: Common / Uncommon / Rare / Holo Rare / Ultra Rare / Secret Rare
- language: Deutsch / Englisch / Japanisch / Franzoesisch etc.

=== VINTAGE-KARTEN (WotC 1999-2003, kein setCode) ===

Diese Karten haben kein Buchstaben-Kuerzel. Erkenne das Set am kleinen Symbol + Copyright:
  Kein Symbol + "1999 Wizards" => set: "Base Set"
  Blatt-Symbol => set: "Jungle"
  Fossil-Symbol => set: "Fossil"
  Raketen-Symbol => set: "Team Rocket"
  Abzeichen-Symbol => set: "Gym Heroes" oder "Gym Challenge"
  Kugel-Symbol => set: "Neo Genesis"

Antworte ausschliesslich mit: {"cardName":"...","nameEn":"...","set":"...","setCode":"...","number":"...","rarity":"...","language":"..."}
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
