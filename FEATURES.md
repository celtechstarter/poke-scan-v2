# Poke-Scan V2 — Feature-Ausbau für Claude Code

> **Anleitung für Claude Code:** Arbeite die Phasen in Reihenfolge ab (A → B → C) und committe
> pro Phase. Nach jeder Phase: `npm run lint && npm run check && npm run build` — muss grün sein.
> Supabase-Migrationen zuerst gegen die Datenbank ausführen (der User macht das im Supabase
> SQL-Editor, oder du gibst ihm das SQL zum Kopieren), DANN erst den Code dazu bauen.
> Commit-Format: `[Feature] ...`.
>
> **Kontext:** Die App (React/Vite + Vercel Serverless + Supabase + Gemini Vision + TCGdex)
> erkennt Karten und zeigt EUR-Preise. Es fehlt der Grund wiederzukommen: eine Sammlung.
> Ausbau: (A) Sammlung + Kartenbild + Korrektur, (B) Set-Fortschritt, (C) Preisverlauf.
> Design-Entscheidung: KEIN Login — Sammlung hängt an der bestehenden `session_id`
> (localStorage), Tabellen sind aber Auth-ready (user_id-Spalte kann später ergänzt werden).
> Das aktive Supabase-Projekt ist "poke-scanv2" (`rigooegpcmrxzaqqnkdr`) — NICHT das alte
> "pokeappOCR" aus der config.toml.

---

## PHASE A: Sammlung ("Mein Pokédex") + Kartenbild + Korrektur

### A1: Supabase-Migration (SQL für den User zum Ausführen)

```sql
-- Sammlung: eine Zeile pro Karte+Variante pro Session
create table if not exists collection (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  tcgdex_set text not null,        -- TCGdex Set-ID, z.B. 'sv03.5'
  local_id   text not null,        -- TCGdex Karten-ID im Set, z.B. '6'
  card_name  text not null,        -- verifizierter Name aus TCGdex
  set_name   text not null,        -- verifizierter Set-Name aus TCGdex
  number     text,                 -- Anzeige-Nummer, z.B. '006/165'
  variant    text not null default 'normal',  -- normal | holo | reverse_holo | ...
  quantity   int  not null default 1 check (quantity > 0),
  image_url  text,                 -- TCGdex Bild-Basis-URL
  added_at   timestamptz not null default now(),
  unique (session_id, tcgdex_set, local_id, variant)
);

alter table collection enable row level security;
create policy collection_select on collection for select using (true);
create policy collection_insert on collection for insert with check (true);
create policy collection_update on collection for update using (true) with check (true);
create policy collection_delete on collection for delete using (true);
```

Hinweis: Die Policies sind bewusst offen (kein Auth vorhanden) — gleiche Abwägung wie bei
`scan_history`. Beim späteren Auth-Umbau werden sie auf `auth.uid()` umgestellt.

Danach `src/integrations/supabase/types.ts` um die `collection`-Tabelle erweitern
(Row/Insert/Update analog zu `scan_history`).

### A2: `api/prices.ts` — TCGdex-Identität und Bild mitliefern

`fetchFromTCGdex` gibt zusätzlich zurück (Felder im `PriceResult`-Typ ergänzen):

```ts
tcgdexSet: tcgdexId,                            // z.B. 'sv03.5'
localId,                                        // z.B. '6'
image: (card?.image as string) || null,         // Bild-Basis-URL von TCGdex
```

TCGdex-Bild-URLs funktionieren so: `{image}/low.webp` (klein) bzw. `{image}/high.webp` (groß).
Der Handler reicht die Felder im Response durch. Wichtig: `tcgdexSet`/`localId`/`image` nur
setzen, wenn die Quelle TCGdex war (bei den Pokemon-TCG-API-Fallbacks bleiben sie null —
dann ist "Zur Sammlung hinzufügen" deaktiviert, siehe A4).

### A3: Scan-Ergebnis — Kartenbild anzeigen + Korrektur

In `card-scanner.tsx`, Result-Ansicht:

1. **Kartenbild:** Wenn `prices.image` vorhanden, statt des Nutzer-Fotos das offizielle
   TCGdex-Bild anzeigen (`${prices.image}/low.webp`), das Nutzer-Foto klein daneben/darunter.
   So sieht der Nutzer sofort, ob die richtige Karte erkannt wurde.
2. **Korrektur:** Unter dem Ergebnis ein dezenter Link/Button "Nicht die richtige Karte?".
   Klick öffnet zwei kleine Inputs (Set-Code als Dropdown mit den Codes aus einer neuen
   Konstante, Kartennummer als Textfeld) + "Neu suchen"-Button. Der ruft `/api/prices` mit den
   korrigierten Werten auf und aktualisiert Ergebnis + Bild. Die Set-Code-Liste dafür:
   neue Datei `src/lib/set-codes.ts` mit einem Array der ptcgo-Codes (Kopie der Codes aus
   `api/_sets.ts` — NICHT aus api/ importieren, Vite und Vercel bundeln getrennt; ein
   Kommentar in beiden Dateien verweist aufeinander: "Bei Änderungen beide Listen pflegen").

### A4: "Zur Sammlung / Verwerfen" nach dem Scan

In der Result-Ansicht zwei prominente Buttons:

- **"➕ ZUR SAMMLUNG"** (nur aktiv wenn `prices.tcgdexSet && prices.localId`):
  Upsert in `collection` — wenn (session_id, tcgdex_set, local_id, variant) existiert,
  `quantity + 1`, sonst neue Zeile. Variante aus `result.visual_type` übernehmen
  (Default 'normal'). Danach kurzes Erfolgs-Feedback ("In deiner Sammlung: 2×") und Button
  wird zu "NOCH EINE HINZUFÜGEN (+1)".
- **"✖ VERWERFEN"** = bisheriges Reset-Verhalten.

Supabase-Upsert: `supabase.from('collection').upsert({...}, { onConflict: 'session_id,tcgdex_set,local_id,variant' })`
funktioniert NICHT für quantity+1 — stattdessen: erst select, dann insert oder update.
Fehler loggen wie beim History-Insert.

### A5: Sammlungs-Seite ("MEIN POKÉDEX")

Neue Komponente `src/components/poke-scan/my-collection.tsx`, in `App.tsx` zwischen
CardScanner und ScanHistory einbinden (mit ErrorBoundary):

- Kopfzeile: "MEIN POKÉDEX" + **Gesamtwert** + Kartenzahl:
  "42 Karten · Gesamtwert ≈ 87,50 €". Gesamtwert = Summe (aktueller Trend-Preis × quantity).
  Preise beim Laden der Seite live von TCGdex holen: `https://api.tcgdex.net/v2/en/sets/{set}/{localId}`
  direkt vom Client (TCGdex hat offenes CORS, kein Key nötig). Requests parallel mit
  `Promise.all`, Fehler einzelner Karten ignorieren (dann zählt die Karte mit 0 €).
  Bei mehr als ~50 Karten: Preise in Batches von 20 laden.
- Grid der Karten: TCGdex-Bild (`${image_url}/low.webp`), Name, Set, Anzahl-Badge ("2×"),
  aktueller Trend-Preis, Variante als kleines Label wenn nicht 'normal'.
- Pro Karte: Buttons **+** / **−** (quantity ändern; bei 0 → Zeile löschen mit kurzer
  Bestätigung "Wirklich entfernen?") und Link zur Cardmarket-Suche.
- Leerer Zustand: "Noch keine Karten — scanne deine erste Karte!"
- Sortierung: neueste zuerst; optional Dropdown "Nach Wert / Nach Set / Neueste".

---

## PHASE B: Set-Fortschritt

Neue Komponente `src/components/poke-scan/set-progress.tsx`, innerhalb der Sammlungs-Seite
(unter der Kopfzeile, einklappbar):

1. Aus der Sammlung gruppieren: pro `tcgdex_set` die Anzahl VERSCHIEDENER `local_id`s
   (distinct, quantity egal).
2. Set-Infos live von TCGdex: `https://api.tcgdex.net/v2/en/sets/{tcgdexSet}` liefert
   `name`, `cardCount.official`, `cardCount.total` und `logo` (Logo-URL + '.webp').
   Nur Sets anzeigen, aus denen der Nutzer mindestens 1 Karte hat.
3. Pro Set eine Zeile: Set-Logo klein, Name, Fortschrittsbalken, "12 / 165" (gegen
   `cardCount.official`; wer Secret Rares hat, kann über 100 % kommen — dann bei 100 % kappen
   und "165 / 165 ✓ KOMPLETT" mit Gold-Akzent feiern).
4. Design im bestehenden Stil (font-mono, poke-cyan/poke-yellow Akzente).

---

## PHASE C: Preisverlauf (tägliche Snapshots + Graph)

### C1: Migration

```sql
create table if not exists price_snapshots (
  id bigint generated always as identity primary key,
  tcgdex_set text not null,
  local_id   text not null,
  snapshot_date date not null default current_date,
  price_min   numeric,
  price_trend numeric,
  unique (tcgdex_set, local_id, snapshot_date)
);

alter table price_snapshots enable row level security;
create policy snapshots_select on price_snapshots for select using (true);
-- KEINE insert-Policy für anon: Schreiben darf nur der Cron mit Service-Role-Key
```

### C2: Cron-Route `api/snapshot.ts`

- Läuft täglich, geschützt per Secret: Request muss Header `Authorization: Bearer ${CRON_SECRET}`
  tragen (Vercel setzt das bei Cron-Jobs automatisch, wenn die Env-Var `CRON_SECRET` existiert;
  andernfalls 401).
- Ablauf: alle DISTINCT (tcgdex_set, local_id) aus `collection` holen (Supabase mit
  `SUPABASE_SERVICE_ROLE_KEY` — neue Env-Var, NUR serverseitig, niemals VITE_!) →
  für jede Karte TCGdex-Preis holen (sequentiell mit ~100 ms Pause, Timeout je 5 s) →
  Upsert in `price_snapshots` (onConflict: tcgdex_set,local_id,snapshot_date).
- `vercel.json` ergänzen:

```json
"crons": [{ "path": "/api/snapshot", "schedule": "0 6 * * *" }]
```

  (Hobby-Plan erlaubt tägliche Crons.) Env-Vars beim User anfordern:
  `SUPABASE_SERVICE_ROLE_KEY` (aus Supabase Dashboard → Settings → API) und
  `CRON_SECRET` (beliebiger langer Zufallsstring) in Vercel eintragen.

### C3: Graph in der Sammlung

- In `my-collection.tsx`: Klick auf eine Karte öffnet ein Detail-Panel mit Preisverlauf:
  `select snapshot_date, price_trend from price_snapshots where ... order by snapshot_date`.
- Rendering als schlichte SVG-Linie (KEINE Chart-Library als neue Dependency — bei den
  Datenmengen reicht ein selbstgebautes SVG-Polyline mit Min/Max-Skalierung; passt zum
  Prinzip "möglichst wenige Dependencies").
- Zusätzlich Gesamtwert-Verlauf oben in der Sammlung, sobald mindestens 2 Snapshot-Tage
  existieren: Summe pro Tag über alle Sammlungs-Karten.
- Hinweis im UI, solange Daten fehlen: "Preisverlauf entsteht ab jetzt — täglich ein Datenpunkt."

---

## Aufräumen (in Phase A miterledigen)

1. `supabase/config.toml`: `project_id` von `ztlctqpckcfqwzmmwibs` auf `rigooegpcmrxzaqqnkdr`
   ändern (die App nutzt das Projekt "poke-scanv2", nicht das alte "pokeappOCR").
2. `scan_history`-RLS nachziehen (SQL für den User): die `allow_all`-Policy ersetzen durch
   getrennte Policies für select/insert/delete (kein update):

```sql
drop policy if exists allow_all on scan_history;
create policy history_select on scan_history for select using (true);
create policy history_insert on scan_history for insert with check (true);
create policy history_delete on scan_history for delete using (true);
```

---

## Verifikation

1. `npm run lint && npm run check && npm run build` → grün
2. Scan einer Demo-Karte → offizielles TCGdex-Kartenbild erscheint im Ergebnis
3. "Zur Sammlung" 2× klicken → Pokédex zeigt die Karte mit "2×" und Gesamtwert > 0 €
4. "−" bis 0 → Karte verschwindet nach Bestätigung
5. "Nicht die richtige Karte?" → Set MEW / Nummer 6 eingeben → Venusaur ex erscheint... 
   (Gegenprobe: PAL / 3 → Jumpluff)
6. Set-Fortschritt zeigt "x / 165" für 151
7. `/api/snapshot` manuell mit korrektem Bearer-Token aufrufen → Zeilen in `price_snapshots`
8. Browser-Neuladen → Sammlung bleibt erhalten (gleiche session_id)

## Ausblick (NICHT bauen, nur für später notiert)

- **Supabase Auth:** Login via Magic Link, `user_id` in collection/scan_history, RLS auf
  `auth.uid()` — macht Sammlungen geräteübergreifend
- **Discord-Preisalarm via n8n:** n8n-Workflow liest täglich `price_snapshots`, vergleicht
  mit Wunschpreisen (neue Tabelle `wishlist`) und pusht in einen eigenen Discord-Kanal per
  **Webhook** (Kanal → Integrationen → Webhook; einfaches POST mit JSON-Embed, kein Bot/Token
  nötig) — das geplante n8n-Portfolio-Projekt. Telegram ist gestrichen.
- **Bulk-Scan:** mehrere Karten in einem Foto (YOLO-Detection, siehe Phase-2-Plan in FIXES.md)