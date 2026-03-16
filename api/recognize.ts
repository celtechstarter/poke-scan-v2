import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  maxDuration: 60
};

const VISION_MODELS = [
  'meta/llama-3.2-11b-vision-instruct',
  'microsoft/phi-3.5-vision-instruct',
];

const PROMPT = `Du bist ein Pokemon-Karten-Scanner. Antworte AUSSCHLIESSLICH mit einem JSON-Objekt.
KEINE Erklaerungen. KEIN Markdown. KEINE Aufzaehlungen. NUR das JSON-Objekt.

PFLICHTFORMAT (exakt so, kein anderer Text):
{"cardName":"...","nameEn":"...","set":"...","setCode":"...","number":"...","rarity":"...","language":"...","visual_type":"..."}

Bei nicht erkennbarer Karte: {"error":"not_recognized"}

--- ERKENNUNGS-REGELN ---

ZONE A (hoechste Prioritaet) - unten links auf der Karte:
Format: [Set-Symbol] [SETCODE] [Sprache] [Nummer/Gesamt]
Beispiele:
  "MEW de 006/165" => setCode="MEW", number="006/165"
  "TEF de 197/192" => setCode="TEF", number="197/192"
  "SVP de 047"     => setCode="SVP", number="047" (Promo: keine Gesamtzahl!)
Gueltiger setCode: MEW, TEF, OBF, PAR, TWM, SSP, SCR, SFA, SVI, PAL, SVP, PRE, JTG
NIEMALS als setCode: "ex","GX","V","VMAX","VSTAR" (Kartentitel!) oder "de","en","fr" (Sprache!)
OCR-Korrekturen: O->0 und I->1 in Nummern, 0->O in setCode wenn sinnvoll

Set-Code Mapping:
MEW=151 | TEF=Temporal Forces | OBF=Obsidian Flames | PAR=Paradox Rift
TWM=Twilight Masquerade | SSP=Stellar Crown | SCR=Surging Sparks
SFA=Shrouded Fable | SVI=Scarlet & Violet | PAL=Paldea Evolved | SVP=Scarlet & Violet Promos

Gesamtzahl-Kontrolle: /165=MEW | /182=TEF | /197=OBF | /193=PAR | /162=TWM
Gesamtzahl >110 => KEIN Vintage-Set. "ex" im Namen => KEIN WotC-Set (1999-2003).

ZONE B (nur wenn kein setCode) - Copyright-Zeile ganz unten:
1999 Wizards=Base Set | 2000 Wizards=Base Set 2 | Blatt=Jungle | Spirale=Fossil
Rakete=Team Rocket | Abzeichen 2000=Gym Heroes | Abzeichen 2001=Gym Challenge
Kugel=Neo Genesis | Sonne=Neo Discovery | Halbmond=Neo Revelation | Stern=Neo Destiny

ZONE C - visual_type:
normal | holo | reverse_holo | full_art | illustration_rare | rainbow | gold

--- FELDER ---
cardName: Name auf Karte inkl. Suffix (z.B. "Glurak ex", "Pikachu V")
nameEn:   Englischer Name (z.B. "Charizard ex", "Pikachu V")
set:      Set-Name Englisch (z.B. "151", "Base Set")
setCode:  3-Buchstaben-Code oder "" fuer Vintage
number:   Kartennummer OCR-korrigiert (z.B. "006/165", "047")
rarity:   Common / Uncommon / Rare / Holo Rare / Ultra Rare / Secret Rare
language: Deutsch / Englisch / Japanisch / Franzoesisch etc.
visual_type: siehe Zone C

ANTWORT: NUR das JSON-Objekt. Kein Text davor oder danach.`;

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

    if (!response.ok) {
      console.error(`[recognize] ${model} HTTP ${response.status} ${response.statusText}`);
      return null;
    }

    // Fix 3: HTTP 200 kann trotzdem einen Fehler-Body enthalten (z.B. Rate Limit)
    const data = await response.json();
    if (data.error || data.detail) {
      console.error(`[recognize] ${model} API-Fehler im Body:`, data.error ?? data.detail);
      return null;
    }

    return data;
  } catch (err) {
    const reason = (err as Error).name === 'AbortError' ? `Timeout nach ${timeoutMs}ms` : (err as Error).message;
    console.error(`[recognize] ${model} Exception: ${reason}`);
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
  const TOTAL_BUDGET_MS = 25000; // Fix 1: 25s statt 8.5s

  for (const model of VISION_MODELS) {
    const elapsed = Date.now() - start;
    const remaining = TOTAL_BUDGET_MS - elapsed;
    if (remaining < 2000) {
      console.error(`[recognize] Budget erschöpft (${elapsed}ms), überspringe ${model}`);
      break;
    }

    console.error(`[recognize] Versuche ${model} (${elapsed}ms elapsed, ${remaining}ms remaining)`);
    const data = await callModel(model, image, apiKey, remaining);

    if (data) {
      console.error(`[recognize] Erfolg mit ${model} nach ${Date.now() - start}ms`);
      return res.status(200).json({ ...data, model_used: model });
    }

    console.error(`[recognize] ${model} fehlgeschlagen nach ${Date.now() - start}ms – nächstes Modell`);
  }

  console.error(`[recognize] Alle Modelle fehlgeschlagen nach ${Date.now() - start}ms`);
  return res.status(500).json({ error: 'Karte nicht erkannt. Bitte erneut versuchen.' });
}
