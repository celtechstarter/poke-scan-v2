// api/recognize.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { VALID_SET_CODES, promptSetTable, promptTotalsTable } from './_sets.js';

export const config = {
  maxDuration: 60,
};

// Primäres Backend: Google Gemini (Free Tier, starke Vision/OCR, echter JSON-Mode).
// Fallback: NVIDIA NIM (bisherige Modelle) — greift, wenn GEMINI_API_KEY fehlt oder Gemini ausfällt.
const GEMINI_MODEL = 'gemini-2.5-flash'; // TODO: exakten Modellnamen verifizieren (siehe FIXES.md)

const NVIDIA_MODELS = [
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
  "TEF de 097/162" => setCode="TEF", number="097/162"
  "SVP de 047"     => setCode="SVP", number="047" (Promo: keine Gesamtzahl!)
Gueltiger setCode: ${VALID_SET_CODES.join(', ')}
NIEMALS als setCode: "ex","GX","V","VMAX","VSTAR" (Kartentitel!) oder "de","en","fr" (Sprache!)
OCR-Korrekturen: O->0 und I->1 in Nummern, 0->O in setCode wenn sinnvoll

Set-Code Mapping:
${promptSetTable()}

Gesamtzahl-Kontrolle (Zahl hinter dem "/"): ${promptTotalsTable()}
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
setCode:  Set-Code oder "" fuer Vintage
number:   Kartennummer OCR-korrigiert (z.B. "006/165", "047")
rarity:   Common / Uncommon / Rare / Holo Rare / Ultra Rare / Secret Rare
language: Deutsch / Englisch / Japanisch / Franzoesisch etc.
visual_type: siehe Zone C

ANTWORT: NUR das JSON-Objekt. Kein Text davor oder danach.`;

interface CardResult {
  cardName: string;
  nameEn?: string;
  set: string;
  setCode?: string;
  number: string;
  rarity: string;
  language: string;
  visual_type?: string;
}

// ── Gemini-Backend ──────────────────────────────────────────────────────────
async function callGemini(image: string, apiKey: string, timeoutMs: number): Promise<string | null> {
  // image ist eine Data-URL ("data:image/jpeg;base64,...") — Gemini braucht nur den Base64-Teil
  const base64 = image.replace(/^data:image\/\w+;base64,/, '');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: PROMPT },
              { inline_data: { mime_type: 'image/jpeg', data: base64 } },
            ],
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 400,
            // Echter JSON-Mode: Gemini liefert garantiert parsebares JSON
            response_mime_type: 'application/json',
          },
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error(`[recognize] Gemini HTTP ${response.status}: ${body.slice(0, 300)}`);
      return null;
    }

    const data = await response.json() as Record<string, unknown>;
    const candidates = data?.candidates as Array<{content?: {parts?: Array<{text?: unknown}>}}> | undefined;
    const text = candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === 'string' ? text : null;
  } catch (err) {
    const reason = (err as Error).name === 'AbortError'
      ? `Timeout nach ${timeoutMs}ms`
      : (err as Error).message;
    console.error(`[recognize] Gemini Exception: ${reason}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ── NVIDIA-NIM-Backend (Fallback) ───────────────────────────────────────────
async function callNvidia(model: string, image: string, apiKey: string, timeoutMs: number): Promise<string | null> {
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
            { type: 'image_url', image_url: { url: image } },
          ],
        }],
        max_tokens: 400,
        temperature: 0.1,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(`[recognize] ${model} HTTP ${response.status} ${response.statusText}`);
      return null;
    }

    // HTTP 200 kann trotzdem einen Fehler-Body enthalten (z.B. Rate Limit)
    const data = await response.json() as Record<string, unknown>;
    if (data.error || data.detail) {
      console.error(`[recognize] ${model} API-Fehler im Body:`, data.error ?? data.detail);
      return null;
    }

    const choices = data?.choices as Array<{message?: {content?: unknown}}> | undefined;
    const content = choices?.[0]?.message?.content;
    return typeof content === 'string' ? content : null;
  } catch (err) {
    const reason = (err as Error).name === 'AbortError'
      ? `Timeout nach ${timeoutMs}ms`
      : (err as Error).message;
    console.error(`[recognize] ${model} Exception: ${reason}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ── Gemeinsame Validierung ──────────────────────────────────────────────────
// Rueckgabe: { card } bei Erfolg, { unrecognized: true } wenn das Modell die Karte
// nicht erkennen konnte, {} bei Muell-Antwort (=> naechstes Backend probieren).
function extractCard(content: string): { card?: CardResult; unrecognized?: boolean } {
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) {
    console.error('[recognize] Antwort enthaelt kein JSON:', content.slice(0, 200));
    return {};
  }
  try {
    const parsed = JSON.parse(match[0]);
    if (parsed?.error) return { unrecognized: true };
    if (typeof parsed?.cardName === 'string' && parsed.cardName.length > 0
        && typeof parsed?.number === 'string') {
      return { card: parsed as CardResult };
    }
    console.error('[recognize] JSON ohne Pflichtfelder:', match[0].slice(0, 200));
    return {};
  } catch {
    console.error('[recognize] JSON.parse fehlgeschlagen:', match[0].slice(0, 200));
    return {};
  }
}

// ── Handler ─────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;
  const nvidiaKey = process.env.NVIDIA_API_KEY;

  if (!geminiKey && !nvidiaKey) {
    return res.status(500).json({ error: 'Kein Vision-API-Key konfiguriert' });
  }
  if (!image) return res.status(400).json({ error: 'No image provided' });

  console.error(`[recognize] Bildgroesse: ${Math.round(image.length / 1024)} KB (Base64)`);

  // Backend-Reihenfolge: Gemini zuerst, dann NVIDIA-Modelle
  const attempts: { name: string; run: (timeoutMs: number) => Promise<string | null> }[] = [];
  if (geminiKey) {
    attempts.push({ name: GEMINI_MODEL, run: (t) => callGemini(image, geminiKey, t) });
  }
  if (nvidiaKey) {
    for (const model of NVIDIA_MODELS) {
      attempts.push({ name: model, run: (t) => callNvidia(model, image, nvidiaKey, t) });
    }
  }

  const start = Date.now();
  const TOTAL_BUDGET_MS = 25000;
  let sawUnrecognized = false;

  for (const attempt of attempts) {
    const elapsed = Date.now() - start;
    const remaining = TOTAL_BUDGET_MS - elapsed;
    if (remaining < 2000) {
      console.error(`[recognize] Budget erschoepft (${elapsed}ms), ueberspringe ${attempt.name}`);
      break;
    }

    const content = await attempt.run(remaining);
    if (!content) continue;

    const { card, unrecognized } = extractCard(content);
    if (card) {
      console.error(`[recognize] Erfolg mit ${attempt.name} nach ${Date.now() - start}ms`);
      return res.status(200).json({ card, model_used: attempt.name });
    }
    if (unrecognized) sawUnrecognized = true;
    console.error(`[recognize] ${attempt.name}: keine verwertbare Antwort - naechster Versuch`);
  }

  if (sawUnrecognized) {
    return res.status(422).json({
      error: 'Karte nicht erkannt. Bitte naeher, gerade und bei gutem Licht fotografieren.',
    });
  }
  return res.status(502).json({ error: 'KI-Dienst nicht erreichbar. Bitte erneut versuchen.' });
}
