# Poke-Scan V2 — Fix- und Umbau-Anweisungen für Claude Code

> **Anleitung für Claude Code:** Arbeite die Fixes in der angegebenen Reihenfolge ab (FIX 1 zuerst).
> Jeder Fix nennt die Datei und enthält den fertigen Code. Nach allen Fixes den Abschnitt
> "Verifikation" ausführen. PHASE 2 am Ende NICHT automatisch mitbauen — erst mit dem User
> besprechen. Commit-Format: `[Fix] Kurze Beschreibung` bzw. `[Feature] ...`.
>
> **Hintergrund:** Audit vom 2026-07-08. Die Kartenerkennung schlägt intermittierend fehl.
> Hauptursachen: (1) App crasht bei nicht erkannter Karte, (2) falsche Set-Daten im Prompt
> und im Preis-Mapping (SSP/SCR vertauscht, falsche Gesamtzahlen), (3) Sets ab 2025 fehlen
> komplett, (4) Bilder überschreiten teils das NVIDIA-NIM-Inline-Limit (~180 KB),
> (5) diverse fehlende Fehlerbehandlung, (6) das Vision-Modell (Llama 3.2 11B) ist zu schwach
> für kleine Kartentexte. Deshalb wird die Erkennung auf **Google Gemini (Free Tier) als
> primäres Backend** umgebaut, NVIDIA NIM bleibt als Fallback. Alle Set-Daten unten wurden
> am 2026-07-08 live gegen die TCGdex-API verifiziert.

---

## FIX 1 (KRITISCH): Neue Datei `api/_sets.ts` — eine gemeinsame Quelle für Set-Daten

**Problem:** Prompt (`api/recognize.ts`) und Preis-Mapping (`api/prices.ts`) pflegen dieselben
Set-Daten doppelt und widersprechen sich bereits: SSP/SCR sind in BEIDEN Dateien vertauscht
(richtig: SSP = Surging Sparks = sv08, SCR = Stellar Crown = sv07). JTG steht im Prompt, fehlt
aber im Mapping. PAF ist gemappt, fehlt aber im Prompt. Alle Sets nach Journey Together fehlen.

**Lösung:** Neue Datei anlegen (Unterstrich-Präfix, damit Vercel sie nicht als Endpoint deployed):

```ts
// api/_sets.ts
// Einzige Quelle für Set-Daten. Wird von recognize.ts (Prompt) und prices.ts (Mapping) genutzt.
// Verifiziert gegen https://api.tcgdex.net/v2/en/sets am 2026-07-08.

export interface SetInfo {
  ptcgo: string;            // Set-Code unten links auf der Karte
  tcgdexId: string;         // TCGdex API Set-ID
  name: string;             // englischer Set-Name
  official: number | null;  // offizielle Kartenzahl (Zahl hinter dem "/"), null = Promo
}

export const SETS: SetInfo[] = [
  { ptcgo: 'SVI', tcgdexId: 'sv01',    name: 'Scarlet & Violet',        official: 198 },
  { ptcgo: 'PAL', tcgdexId: 'sv02',    name: 'Paldea Evolved',          official: 193 },
  { ptcgo: 'OBF', tcgdexId: 'sv03',    name: 'Obsidian Flames',         official: 197 },
  { ptcgo: 'MEW', tcgdexId: 'sv03.5',  name: '151',                     official: 165 },
  { ptcgo: 'PAR', tcgdexId: 'sv04',    name: 'Paradox Rift',            official: 182 },
  { ptcgo: 'PAF', tcgdexId: 'sv04.5',  name: 'Paldean Fates',           official: 91 },
  { ptcgo: 'TEF', tcgdexId: 'sv05',    name: 'Temporal Forces',         official: 162 },
  { ptcgo: 'TWM', tcgdexId: 'sv06',    name: 'Twilight Masquerade',     official: 167 },
  { ptcgo: 'SFA', tcgdexId: 'sv06.5',  name: 'Shrouded Fable',          official: 64 },
  { ptcgo: 'SCR', tcgdexId: 'sv07',    name: 'Stellar Crown',           official: 142 },
  { ptcgo: 'SSP', tcgdexId: 'sv08',    name: 'Surging Sparks',          official: 191 },
  { ptcgo: 'PRE', tcgdexId: 'sv08.5',  name: 'Prismatic Evolutions',    official: 131 },
  { ptcgo: 'JTG', tcgdexId: 'sv09',    name: 'Journey Together',        official: 159 },
  { ptcgo: 'DRI', tcgdexId: 'sv10',    name: 'Destined Rivals',         official: 182 },
  { ptcgo: 'BLK', tcgdexId: 'sv10.5b', name: 'Black Bolt',              official: 86 },
  { ptcgo: 'WHT', tcgdexId: 'sv10.5w', name: 'White Flare',             official: 86 },
  { ptcgo: 'MEG', tcgdexId: 'me01',    name: 'Mega Evolution',          official: 132 },
  { ptcgo: 'SVP', tcgdexId: 'svp',     name: 'Scarlet & Violet Promos', official: null },
  // TODO (Claude Code): Die ptcgo-Codes der neuesten Sets bitte selbst verifizieren, bevor du
  // sie ergänzt (Code steht unten links auf echten Karten). TCGdex-IDs existieren bereits für:
  // me02 (Phantasmal Flames), me02.5 (Ascended Heroes), me03 (Perfect Order), me04 (Chaos Rising).
];

export const PTCGO_TO_TCGDEX: Record<string, string> =
  Object.fromEntries(SETS.map((s) => [s.ptcgo, s.tcgdexId]));

export const VALID_SET_CODES: string[] = SETS.map((s) => s.ptcgo);

// Vintage-Sets (kein Set-Code auf der Karte, Erkennung über Copyright-Zeile/Symbol)
export const SETNAME_TO_TCGDEX: Record<string, string> = {
  'Base Set':      'base1',
  'Jungle':        'base2',
  'Fossil':        'base3',
  'Base Set 2':    'base4',
  'Team Rocket':   'base5',
  'Gym Heroes':    'gym1',
  'Gym Challenge': 'gym2',
  'Neo Genesis':   'neo1',
  'Neo Discovery': 'neo2',
  'Neo Revelation':'neo3',
  'Neo Destiny':   'neo4',
};

// Hilfsfunktionen: generieren die Tabellen für den KI-Prompt aus denselben Daten
export function promptSetTable(): string {
  return SETS.filter((s) => s.official !== null)
    .map((s) => `${s.ptcgo}=${s.name}`)
    .join(' | ');
}

export function promptTotalsTable(): string {
  return SETS.filter((s) => s.official !== null)
    .map((s) => `/${s.official}=${s.ptcgo}`)
    .join(' | ');
}
```

---

## FIX 2 (KRITISCH, UMBAU): `api/recognize.ts` — Gemini als primäres Vision-Backend, NVIDIA als Fallback, korrigierter Prompt, serverseitige Validierung

**Probleme im Ist-Zustand:**
1. Llama 3.2 11B (2023er-Modell) liest kleine Set-Codes/Kartennummern schlecht — die Hauptursache
   für die schwankende Erkennungsquote. Gemini Flash (Google, Free Tier ~1.500 Requests/Tag)
   ist bei Vision/OCR deutlich stärker und hat einen echten JSON-Mode.
2. Der Prompt enthält falsche Fakten: `SSP=Stellar Crown | SCR=Surging Sparks` ist vertauscht;
   die Gesamtzahl-Kontrolle ist falsch (TEF=162, nicht 182; PAR=182, nicht 193; TWM=167,
   nicht 162); das Beispiel `"TEF de 197/192"` ist eine unmögliche Kartennummer.
3. Der Server gibt die rohe NIM-Antwort ungeprüft an den Client durch. Wenn das Modell Müll
   liefert (kein JSON, `{"error":"not_recognized"}`), gibt es KEINEN Retry.
4. Kein sauberer Response-Vertrag.

**Vorbereitung (User-Aufgabe, Claude Code soll daran erinnern):**
- Gemini-API-Key holen: https://aistudio.google.com → API Key erstellen (kostenlos, keine Kreditkarte)
- In Vercel als Environment Variable `GEMINI_API_KEY` eintragen (Production + Preview)
- In `.env.example` ergänzen: `GEMINI_API_KEY=xxx`

**Wichtig für Claude Code:** Den exakten Namen des aktuellen Gemini-Flash-Modells VOR dem
Implementieren prüfen (Modellnamen ändern sich):

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models" -H "x-goog-api-key: $GEMINI_API_KEY"
```

Das aktuelle Flash-Modell mit Vision wählen (Stand Juli 2026 z.B. `gemini-3-flash` oder neuer)
und unten in `GEMINI_MODEL` eintragen.

**Lösung:** Datei komplett ersetzen:

```ts
// api/recognize.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { VALID_SET_CODES, promptSetTable, promptTotalsTable } from './_sets';

export const config = {
  maxDuration: 60,
};

// Primäres Backend: Google Gemini (Free Tier, starke Vision/OCR, echter JSON-Mode).
// Fallback: NVIDIA NIM (bisherige Modelle) — greift, wenn GEMINI_API_KEY fehlt oder Gemini ausfällt.
const GEMINI_MODEL = 'gemini-3-flash'; // TODO: exakten Modellnamen verifizieren (siehe FIXES.md)

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

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
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
    const data = await response.json();
    if (data.error || data.detail) {
      console.error(`[recognize] ${model} API-Fehler im Body:`, data.error ?? data.detail);
      return null;
    }

    const content = data?.choices?.[0]?.message?.content;
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
```

**Zusätzlich:** In `.env.example` ergänzen:

```
# Google Gemini API Key (primaeres Vision-Backend, kostenlos via aistudio.google.com)
GEMINI_API_KEY=xxx
```

---

## FIX 3 (KRITISCH): `src/components/poke-scan/card-scanner.tsx` — Crash bei unerkannter Karte, hängende Kompression, NIM-Limit, Race Condition

**Probleme im Ist-Zustand:**
1. **App-Crash:** `{"error":"not_recognized"}` von der KI passiert den JSON-Regex, wird als
   `CardResult` gesetzt, und beim Rendern wirft `getRarityInfo(undefined)` einen TypeError
   (`undefined.toLowerCase()`) → weißer Bildschirm. Das ist der Hauptgrund, warum die App
   "manchmal kaputt" wirkt.
2. **`compressImage` hängt ewig**, wenn das Bild nicht lädt (kein `onerror`).
3. **NIM-Limit:** Das NVIDIA-Fallback akzeptiert Inline-Base64-Bilder nur bis ~180 KB.
   Die Kompression muss darunter bleiben, damit der Fallback immer funktioniert
   (Gemini verträgt auch größere Bilder — das Limit richtet sich nach dem schwächsten Backend).
4. **Race Condition:** "SCAN AGAIN" während laufendem Preis-Fetch → alte Antwort überschreibt
   später den State.
5. **Supabase-Insert-Fehler werden verschluckt** (kein Check des `error`-Objekts).

**Änderungen:**

**3a)** `getRarityInfo` defensiv machen:

```ts
function getRarityInfo(rarity: string): { stars: number; label: string } {
  const lower = (rarity ?? "").toLowerCase();
  // ... Rest unverändert
}
```

**3b)** `compressImage` komplett ersetzen durch:

```ts
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Bild konnte nicht geladen werden"));
    img.src = src;
  });
}

// Das NVIDIA-Fallback akzeptiert Inline-Bilder nur bis ~180 KB (Base64).
// Iterativ verkleinern, bis das Limit sicher unterschritten ist.
async function compressImage(base64: string): Promise<string> {
  const img = await loadImage(base64);
  const MAX_CHARS = 170_000; // Base64-Zeichen, entspricht ~127 KB binaer - sicher unter dem Limit
  const widths = [1000, 800, 640, 512];
  const qualities = [0.8, 0.65, 0.5];
  let result = "";
  for (const w of widths) {
    for (const q of qualities) {
      const canvas = document.createElement("canvas");
      const ratio = Math.min(1, w / img.width, w / img.height);
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      result = canvas.toDataURL("image/jpeg", q);
      if (result.length <= MAX_CHARS) return result;
    }
  }
  return result; // kleinste Variante, auch wenn knapp drueber
}
```

**3c)** `scanCard` an den neuen Server-Vertrag (`{ card, model_used }`) anpassen + Race-Guard +
Insert-Fehler loggen. Zuerst oben im Component einen Ref ergänzen:

```ts
const scanIdRef = useRef(0);
```

Dann `scanCard` ersetzen durch:

```ts
const scanCard = useCallback(async (base64Image: string) => {
  const scanId = ++scanIdRef.current;
  setState("scanning");
  setError(null);
  setPrices(null);
  try {
    const compressed = await compressImage(base64Image);
    const response = await fetch("/api/recognize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: compressed }),
    });
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const msg = errBody?.error ?? `HTTP ${response.status}`;
      console.error("[scanner] /api/recognize Fehler:", msg);
      throw new Error(msg);
    }
    const data = await response.json();
    const cardResult: CardResult | undefined = data.card;
    if (!cardResult?.cardName) {
      throw new Error("Karte nicht erkannt. Bitte erneut versuchen.");
    }
    if (scanIdRef.current !== scanId) return; // Nutzer hat inzwischen resettet

    setResult(cardResult);
    setState("result");

    // Preise ueber eigene API-Route laden
    const searchName = cardResult.nameEn || cardResult.cardName;
    const pricesRes = await fetch("/api/prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: searchName,
        number: cardResult.number,
        setCode: cardResult.setCode,
        set: cardResult.set,
      }),
    });
    const cardPrices = pricesRes.ok
      ? await pricesRes.json()
      : { min: null, trend: null, url: null, found: false };
    if (scanIdRef.current !== scanId) return;
    setPrices(cardPrices);

    const cardmarketUrl = cardPrices.url ?? getCardmarketUrl(cardResult.cardName, cardResult.set, cardResult.number);
    const { error: dbError } = await supabase.from("scan_history").insert({
      session_id: getSessionId(),
      card_name: cardResult.cardName,
      set_name: cardPrices.verifiedSet ?? cardResult.set,
      card_number: cardResult.number,
      rarity: cardResult.rarity,
      language: cardResult.language,
      tcg_price_usd: cardPrices.trend,
      cardmarket_url: cardmarketUrl,
    });
    if (dbError) console.error("[scanner] History-Insert fehlgeschlagen:", dbError.message);
  } catch (err) {
    if (scanIdRef.current !== scanId) return;
    setError(err instanceof Error ? err.message : "Fehler");
    setState("error");
  }
}, []);
```

**3d)** In `handleReset` als erste Zeile ergänzen: `scanIdRef.current++;`

**3e)** Fake-Confidence entfernen: die Zeile `<ConfidenceBar value={94.7} />` und den
zugehörigen Import löschen. Die 94,7 % sind hartkodiert und damit eine erfundene Angabe —
passt nicht zu einem Bewerbungsportfolio. Die Datei `confidence-bar.tsx` löschen, sofern
sie nirgendwo sonst importiert wird.

---

## FIX 4 (KRITISCH): `api/prices.ts` — Mappings aus `_sets.ts`, Holo-Preise, API-Key für alle Anfragen

**Änderungen:**

**4a)** Die lokalen Konstanten `PTCGO_TO_TCGDEX` und `SETNAME_TO_TCGDEX` löschen und ersetzen durch:

```ts
import { PTCGO_TO_TCGDEX, SETNAME_TO_TCGDEX } from './_sets';
```

(Damit sind SSP/SCR korrekt und JTG, DRI, BLK, WHT, MEG ergänzt.)

**4b)** Holo-Preis-Fallback in `fetchFromTCGdex`: TCGdex liefert bei manchen Karten nur
`low-holo`/`trend-holo` statt `low`/`trend`. Die beiden Zeilen ersetzen:

```ts
const min = cm.low ?? cm['low-holo'] ?? null;
const trend = cm.trend ?? cm['trend-holo'] ?? null;
```

**4c)** API-Key für ALLE Pokemon-TCG-API-Anfragen: Im `handler` die Zeilen

```ts
const apiKey = process.env.POKEMON_TCG_API_KEY;
const headers: Record<string, string> = apiKey ? { 'X-Api-Key': apiKey } : {};
```

VOR den Block "Prio 2" verschieben und bei Prio 2 und Prio 3 statt `{}` das `headers`-Objekt
übergeben. (Aktuell laufen Prio 2/3 ohne Key und damit ins aggressive Rate-Limit.)

**4d) (optional, empfohlen)** Hintergrund: pokemontcg.io ist inzwischen Teil des kommerziellen
Scrydex und faktisch im Wartungsmodus — die Name-Fallbacks (Prio 4–7) hängen an einer
sterbenden API. Wenn der User einen (kostenlosen) JustTCG-API-Key besorgt hat
(https://justtcg.com), die Name-Fallbacks durch eine JustTCG-Suche ersetzen:
Env-Var `JUSTTCG_API_KEY`, Implementierung gemäß https://justtcg.com/docs
(Claude Code: Docs lesen und Response-Format vor dem Implementieren prüfen).
pokemontcg.io nur noch als allerletzten Fallback behalten. Ohne Key diesen Schritt überspringen.

---

## FIX 5: ErrorBoundary (verhindert weiße Seite bei jedem künftigen Render-Fehler)

**Neue Datei `src/components/error-boundary.tsx`:**

```tsx
import { Component, type ReactNode } from "react";

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[ErrorBoundary]", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-6">
          <span className="text-3xl">⚠️</span>
          <p className="text-center font-mono text-sm text-red-400">
            Etwas ist schiefgelaufen. Bitte Seite neu laden.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**In `src/App.tsx`:** `CardScanner` und `ScanHistory` jeweils in `<ErrorBoundary>…</ErrorBoundary>`
wrappen (Import ergänzen).

---

## FIX 6: `apps/telegram-bot/` löschen (toter Code)

`apps/telegram-bot/index.ts` importiert `telegraf` und `dotenv`, die nirgends installiert sind
(kein eigenes `package.json`, nicht in den Root-Dependencies). Der Bot kann so nie laufen.
Ordner `apps/` komplett löschen. Falls der Telegram-Bot später kommt: eigenes Package mit
eigenem `package.json` anlegen.

---

## FIX 7: Lint-Fehler in `tailwind.config.ts`

`npm run lint` schlägt fehl wegen `require()`-Import (Zeile ~41). Die `require(...)`-Aufrufe
im `plugins`-Array durch ES-Imports ersetzen, z.B.:

```ts
import animate from "tailwindcss-animate";
// ggf. weitere, je nachdem was aktuell per require() geladen wird
// ...
plugins: [animate],
```

Danach muss `npm run lint` ohne Fehler durchlaufen.

---

## FIX 8: TypeScript-Check für `api/` (wird aktuell NIE geprüft)

Kein tsconfig deckt `api/` ab und `@vercel/node` fehlt — Typfehler dort fallen erst in
Production auf.

**8a)** `npm install -D @vercel/node`

**8b)** Neue Datei `tsconfig.api.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["api"]
}
```

**8c)** In `package.json` ein Script ergänzen:

```json
"check": "tsc -b && tsc -p tsconfig.api.json"
```

---

## FIX 9: CI mit GitHub Actions (fehlt komplett, obwohl in der Roadmap versprochen)

**Neue Datei `.github/workflows/ci.yml`:**

```yaml
name: CI
on:
  push:
    branches: [main, dev]
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run check
      - run: npm run build
```

---

## FIX 10 (optional, aber empfohlen): Aufräumarbeiten

**10a) Spaltenname lügt:** `scan_history.tcg_price_usd` speichert EUR-Trendpreise.
Supabase-Migration: Spalte zu `price_eur` umbenennen, danach `src/integrations/supabase/types.ts`,
den Insert in `card-scanner.tsx` und das Feld in `scan-history.tsx` anpassen. Nur machen,
wenn Migration + Code in EINEM Commit landen.

**10b) PWA-Anspruch:** `public/manifest.json` existiert, aber ohne Service Worker ist die App
nicht installierbar. Entweder `vite-plugin-pwa` einbauen oder PWA nirgends bewerben.

**10c) Supabase Free-Tier:** Die Datenbank hat beim Audit auf Verbindungen nicht reagiert
(Timeout) — Free-Tier-Projekte pausieren nach Inaktivität. Im Supabase-Dashboard prüfen und
ggf. wiederherstellen. Der Insert-Fehler-Log aus FIX 3c macht solche Ausfälle künftig sichtbar.

---

## Verifikation (nach allen Fixes ausführen)

1. `npm run lint` → 0 Fehler
2. `npm run check` → 0 Fehler (prüft jetzt auch `api/`)
3. `npm run build` → erfolgreich
4. Sicherstellen, dass `GEMINI_API_KEY` in Vercel gesetzt ist (sonst läuft nur das NVIDIA-Fallback)
5. Manuell testen (Dev-Server oder Vercel-Preview):
   - Alle 3 Demo-Karten scannen → Name, Set, Nummer, Preis erscheinen
   - Ein Foto OHNE Pokémon-Karte hochladen → freundliche Fehlermeldung, KEIN weißer Bildschirm
   - Während des Preis-Ladens "SCAN AGAIN" klicken → kein alter State taucht wieder auf
   - Ein großes, detailreiches Foto (>3 MB) scannen → funktioniert (Kompression unter 170 KB Base64)
6. Vercel-Logs nach einem Scan prüfen:
   - `[recognize] Bildgroesse: xx KB` muss < 170 KB zeigen
   - `[recognize] Erfolg mit gemini-...` → Gemini ist aktiv (nicht nur das Fallback)

---

## PHASE 2 (NICHT automatisch bauen — erst mit dem User besprechen)

### Bild-Matching per Perceptual Hash (langfristig der beste Erkennungsweg)

Profi-Scanner-Apps vergleichen das Foto per Perceptual Hash gegen eine Datenbank aller
Kartenbilder, statt ein Sprachmodell Text lesen zu lassen. Deterministisch, kostenlos,
erkennt die exakte Variante. TCGdex liefert die Bilder aller ~25.000 Karten kostenlos.

**Architektur-Plan (Aufwand: mehrere Tage):**

1. **Hash-Datenbank aufbauen** — Script `scripts/build-hashes.ts` (lokal ausgeführt, nicht auf Vercel):
   - Alle Sets/Karten von TCGdex laden (`https://api.tcgdex.net/v2/en/sets`, dann je Karte
     das Bild in niedriger Qualität: `{cardImageUrl}/low.webp`)
   - Perceptual Hash berechnen (z.B. `sharp` + Blockhash/`imghash`)
   - In neue Supabase-Tabelle `card_hashes` schreiben:
     `(card_id text PK, tcgdex_set text, local_id text, name text, phash text)`
   - Mit Service-Role-Key lokal ausführen, Rate-Limits respektieren (Pausen zwischen Requests)
2. **Neue API-Route `api/match.ts`:**
   - Empfängt das Foto, berechnet den pHash, sucht per Hamming-Distanz den nächsten Treffer
     in `card_hashes` (bei ~25k Einträgen reicht ein Full Scan im Speicher; Hashes einmalig
     laden und cachen)
   - Liefert bei Distanz unter Schwellwert die Karte direkt zurück — sonst Fallback auf
     `/api/recognize` (Gemini)
3. **Client-Vorverarbeitung:** Karte im Foto finden und perspektivisch entzerren
   (OpenCV.js: größtes Rechteck-Kontur finden, warpPerspective). Das verbessert auch die
   Gemini-Erkennung. Referenzprojekte: github.com/1vcian/Pokemon-TCGP-Card-Scanner,
   github.com/NolanAmblard/Pokemon-Card-Scanner
4. **Echter Confidence-Wert:** aus der Hamming-Distanz ableiten und im UI anzeigen
   (ersetzt die entfernte Fake-ConfidenceBar durch eine ehrliche).

### Weitere Ideen (Backlog)

- Erkannte Karten cachen: Tabelle `recognition_cache` (pHash → Karte). Jeder erfolgreiche
  Scan macht die App schneller und spart API-Calls.
- `visual_type` aus der Erkennung mit den TCGdex-Feldern `low-holo`/`trend-holo` verknüpfen,
  damit Holo-/Reverse-Varianten den korrekten Preis zeigen.
- Unit-Tests (Vitest) für `extractCard`, Set-Mappings und `localId`-Berechnung — hätte den
  SSP/SCR-Tausch automatisch gefangen.