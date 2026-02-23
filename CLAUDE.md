# 🎮 POKE-SCAN V2 - Kontext für Claude

> Diese Datei enthält den kompletten Projektkontext. Claude sollte sie bei jeder Konversation berücksichtigen.

---

## 📋 Projekt-Übersicht

**Name:** Poke-Scan V2
**Ziel:** Pokemon-Karten per Foto scannen → KI erkennt die Karte → Marktpreis anzeigen
**Live URL:** https://poke-scan-v2.vercel.app
**Repo:** https://github.com/celtechstarter/poke-scan-v2

---

## 👤 Über den Entwickler (Marcel)

- **Alter:** 38 Jahre
- **Standort:** Dortmund
- **Hintergrund:** 1 Jahr Vollzeit-Weiterbildung Cloud Computing & Web Development (Techstarter)
- **Zertifikate:** LPIC-1, AWS re/Start, Azure Fundamentals (AZ-900)
- **Arbeitsweise:** Nutzt KI-Tools (Claude, etc.) für Entwicklung - kein klassischer Programmierer
- **Präferenz:** Automatisierung, wenig manuelles Eingreifen, deutsche Erklärungen

---

## 🛠 Tech Stack

| Bereich | Technologie |
|---------|-------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| **Backend** | Vercel Serverless Functions |
| **KI-Vision** | NVIDIA NIM API (Llama 3.2 Vision) mit 3-Model Fallback |
| **Datenbank** | Supabase (PostgreSQL) |
| **Hosting** | Vercel (Frontend + API), Hostinger VPS (für OpenClaw Agent) |
| **CI/CD** | GitHub → Vercel Auto-Deploy |

---

## 🤖 KI-Vision Fallback Chain

```
1. meta/llama-3.2-11b-vision-instruct (Primary - schnell, für Free Tier)
2. microsoft/phi-3.5-vision-instruct (Fallback)
```
Hinweis: 90b Modell entfernt (zu langsam für Vercel Free Tier 10s Limit)

API Endpoint: `https://integrate.api.nvidia.com/v1/chat/completions`

---

## 📁 Projektstruktur

```
poke-scan-v2/
├── api/
│   └── recognize.ts          # Serverless Function (Vision API)
├── src/
│   ├── components/
│   │   └── poke-scan/
│   │       ├── card-scanner.tsx      # Haupt-Scanner Komponente
│   │       ├── ai-status-bar.tsx
│   │       ├── confidence-bar.tsx
│   │       ├── energy-particles.tsx
│   │       ├── evolution-loader.tsx
│   │       ├── holographic-pokeball.tsx
│   │       ├── neural-background.tsx
│   │       ├── poke-scan-header.tsx
│   │       ├── pokedex-card.tsx
│   │       ├── rarity-stars.tsx
│   │       ├── scanner-frame.tsx
│   │       └── trainer-footer.tsx
│   ├── App.tsx
│   └── index.css
├── vercel.json
├── package.json
└── CLAUDE.md                 # Diese Datei
```

---

## 🚧 Aktueller Stand (23.02.2026)

### ✅ Funktioniert:
- Kartenerkennung am PC und Mobile (Bild hochladen)
- 2-Model Fallback Chain (11b → phi-3.5)
- Bildkomprimierung client-seitig (800px, JPEG 80%)
- Futuristisches 2050 Design (Design #1 live)
- Cardmarket Link-Generierung
- Vercel Deployment
- PWA Support (installierbar auf Mobilgeräten)

### 📝 Offene Tasks:
- Scan-Genauigkeit weiter verbessern
- Scan-History / Verlauf speichern (Supabase)

---

## 🔧 Bekannte Limitierungen

- **Vercel Free Tier:** Max 10s für Serverless Functions
- **Edge Functions:** Max 30s, aber keine Node.js APIs
- **Lösung:** Client-seitige Bildkomprimierung vor API-Call

---

## 📝 Code-Stil Präferenzen

- TypeScript strict mode
- Funktionale React-Komponenten mit Hooks
- Tailwind CSS für Styling
- Deutsche Kommentare sind okay
- Keine `console.log` in Production (nur `console.error`)
- Commit-Format: `[Typ] Kurze Beschreibung`
  - Typen: [Feature], [Fix], [Refactor], [Style], [Docs], [Config]

---

## 🔑 Environment Variables

```env
# Vercel (Production)
NVIDIA_API_KEY=nvapi-xxx

# Lokal (.env.local)
VITE_NVIDIA_API_KEY=nvapi-xxx
```

**Wichtig:** Serverless Functions brauchen `NVIDIA_API_KEY` (ohne VITE_ prefix)!

---

## 🚀 Deployment

```bash
# Lokal testen
npm run dev

# Build
npm run build

# Deploy (automatisch via GitHub push)
git add .
git commit -m "[Feature] Beschreibung"
git push origin main
```

---

## 💡 Hinweise für Claude

1. **Sprache:** Antworte auf Deutsch
2. **Code:** Immer vollständig und kopierbar
3. **Erklärungen:** Einfach halten, Marcel ist kein klassischer Programmierer
4. **Dateipfade:** Immer mit angeben
5. **Git:** Direkt auf `main` pushen (kein dev Branch mehr)
6. **Keine Übertreibung:** Nur vorschlagen was wirklich nötig ist

---

## 📞 Bei Fragen

Wenn dir Kontext fehlt, frag Marcel! Er kann:
- Terminal-Output zeigen
- Screenshots machen
- Dateien öffnen

---

*Zuletzt aktualisiert: 23.02.2026*
