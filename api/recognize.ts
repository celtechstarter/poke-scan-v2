import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  maxDuration: 60
};

const VISION_MODELS = [
  'meta/llama-3.2-11b-vision-instruct',
  'microsoft/phi-3.5-vision-instruct',
];

const PROMPT = `Du analysierst eine Pokemon-Karte. Scanne die Karte in 3 Zonen der Reihe nach.

=== ZONE A: UNTERE KARTENECKEN (hoechste Prioritaet) ===

Das Format unten links auf der Karte lautet immer:
  [Set-Symbol]  [SETCODE]  [Sprachkuerzel]  [Nummer/Gesamt]

Beispiele - genau so steht es auf echten Karten:
  "MEW de 006/165"  =>  setCode="MEW",  number="006/165"
  "TEF de 197/192"  =>  setCode="TEF",  number="197/192"
  "OBF en 215/230"  =>  setCode="OBF",  number="215/230"
  "PAR en 068/193"  =>  setCode="PAR",  number="068/193"
  "TWM de 103/162"  =>  setCode="TWM",  number="103/162"

Gueltige setCode-Werte: MEW, TEF, OBF, SIT, PAR, SVP, PRE, SSP, TWM, SCR, SFA, SVI, PAL, SSP, SCR, SFA, PRE, JTG

OCR-Korrekturen - korrigiere diese haeufigen Lesefehler automatisch:
  Nummer enthaelt "O" (Buchstabe) => ersetze durch "0" (Zahl):  z.B. "OO6/165" => "006/165"
  Nummer enthaelt "I" (Buchstabe) => ersetze durch "1" (Zahl):  z.B. "I97/192" => "197/192"
  Nummer enthaelt "G" (Buchstabe) => ersetze durch "6" (Zahl):  z.B. "0G6/165" => "006/165"
  setCode enthaelt "0" (Zahl)     => ersetze durch "O" (Buchstabe): z.B. "ME0" => "MEW" (pruefe ob sinnvoll)

NIEMALS als setCode verwenden:
  "ex", "GX", "V", "VMAX", "VSTAR" => das sind Kartentitel-Suffixe oben auf der Karte!
  "de", "en", "fr", "it", "es", "pt" => das sind Sprachkuerzel, sie kommen NACH dem setCode!

Kein Code sichtbar => setCode: "" (dann Zone B lesen)

=== ZONE B: COPYRIGHT-ZEILE GANZ UNTEN (nur wenn Zone A keinen setCode lieferte) ===

Lies die Jahreszahl in der Copyright-Zeile ganz am unteren Rand:
  Kein Symbol + "1999 Wizards" oder "(C)1999"  =>  set: "Base Set"
  Kein Symbol + "2000 Wizards"                 =>  set: "Base Set 2"
  Blatt-Symbol + 1999-2000                     =>  set: "Jungle"
  Fossil-Symbol (Spirale) + 1999-2000          =>  set: "Fossil"
  Raketen-Symbol                               =>  set: "Team Rocket"
  Abzeichen-Symbol, 2000                       =>  set: "Gym Heroes"
  Abzeichen-Symbol, 2001                       =>  set: "Gym Challenge"
  Kugel-Symbol                                 =>  set: "Neo Genesis"
  Sonne-Symbol                                 =>  set: "Neo Discovery"
  Halbmond-Symbol                              =>  set: "Neo Revelation"
  Stern-Symbol                                 =>  set: "Neo Destiny"

=== ZONE C: VISUELLE ANALYSE ===

Bestimme visual_type anhand des Kartendesigns:
  normal           - Standardkarte, kein Glaenzer
  holo             - Glaenzendes/holografisches Muster NUR im Artwork-Bereich
  reverse_holo     - Glaenzendes Muster ueberall AUSSER dem Artwork
  full_art         - Artwork geht bis zum Kartenrand, kaum weisser Rahmen, Kartentitel am unteren Rand
  illustration_rare - Grosses Artwork mit sehr kleinem Textbereich (typisch SV-Aera)
  rainbow          - Regenbogen-Farbverlauf ueber die gesamte Karte
  gold             - Goldene/metallische Optik der gesamten Karte

=== JSON-OUTPUT ===

Gib folgende Felder zurueck:
- cardName:    Name oben auf der Karte inkl. Suffix (z.B. "Glurak ex", "Pikachu V", "Mewtu VSTAR")
- nameEn:      Englischer Kartenname (z.B. "Charizard ex", "Pikachu V", "Mewtwo VSTAR")
- set:         Set-Name auf Englisch (z.B. "151", "Temporal Forces", "Base Set")
- setCode:     Code aus Zone A (z.B. "MEW") oder "" fuer Vintage
- number:      Kartennummer aus Zone A, OCR-korrigiert (z.B. "006/165", "197/192")
- rarity:      Common / Uncommon / Rare / Holo Rare / Ultra Rare / Secret Rare
- language:    Deutsch / Englisch / Japanisch / Franzoesisch etc.
- visual_type: Wert aus Zone C (normal / holo / reverse_holo / full_art / illustration_rare / rainbow / gold)

Antworte ausschliesslich mit:
{"cardName":"...","nameEn":"...","set":"...","setCode":"...","number":"...","rarity":"...","language":"...","visual_type":"..."}
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
        max_tokens: 400,
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
