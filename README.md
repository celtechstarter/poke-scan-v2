# 🃏 Poke-Scan V2

### Pokémon-Karte fotografieren → Preis erfahren. So einfach.

<p align="center">
  <img src="https://img.shields.io/badge/Status-In_Entwicklung_🚧-yellow?style=for-the-badge" />
  <img src="https://img.shields.io/badge/KI--gesteuert-🤖_Ja!-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Kosten-~27€%2FMonat-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Open_Source-MIT-brightgreen?style=for-the-badge" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite" />
  <img src="https://img.shields.io/badge/Tailwind-3.x-06B6D4?style=flat-square&logo=tailwindcss" />
  <img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=flat-square&logo=vercel" />
</p>

---

## 📖 Inhaltsverzeichnis

- [Was ist Poke-Scan?](#-was-ist-poke-scan)
- [Live Demo](#-live-demo)
- [Tech-Stack](#️-tech-stack)
- [Architektur](#️-architektur)
- [API-Flow: Kartenerkennung](#-api-flow-kartenerkennung)
- [Projektstruktur](#-projektstruktur)
- [Installation](#-installation)
- [Environment Variables](#️-environment-variables)
- [Deployment](#-deployment)
- [KI-gestützte Entwicklung](#-ki-gestützte-entwicklung)
- [Roadmap](#️-roadmap)
- [Barrierefreiheit](#-barrierefreiheit)
- [Lizenz](#-lizenz)

---

## 🤔 Was ist Poke-Scan?

Eine Web-App die Pokémon-Karten per Foto erkennt und den Cardmarket-Preis anzeigt.

**Das Problem:** Klassische OCR (EasyOCR, Tesseract) versagt bei holographischen Karten wegen reflektierender Oberflächen und Spezialschriften.

**Die Lösung:** KI-Vision (Kimi K2.5) analysiert das gesamte Bild – nicht nur Text, sondern auch Artwork, Set-Symbole und Layout.

---

## 🌐 Live Demo

**[poke-scan-v2.vercel.app](https://poke-scan-v2.vercel.app)**

---

## 🛠️ Tech-Stack

### Frontend
| Technologie | Verwendung |
|-------------|------------|
| React 18 | UI Framework |
| TypeScript 5 | Typsicherheit |
| Vite 5 | Build Tool |
| Tailwind CSS 3 | Styling |
| shadcn/ui | UI-Komponenten |

### Backend / APIs
| Service | Verwendung | Endpoint |
|---------|------------|----------|
| **Kimi K2.5 Vision** (NVIDIA NIM) | Bilderkennung | `integrate.api.nvidia.com/v1` |
| **Vercel Edge Functions** | API Proxy (CORS) | `/api/recognize` |
| **Cardmarket** | Preisanzeige | Direktlink zur Suche |

### Infrastruktur
| Service | Verwendung |
|---------|------------|
| Vercel | Hosting + Serverless Functions |
| GitHub | Versionskontrolle |
| Hostinger VPS | OpenClaw Agent (Entwicklungs-Bot) |

---

## 🏗️ Architektur

```
┌──────────────────────────────────────────────────────────────────┐
│                          CLIENT                                   │
│                     (Browser / Mobile)                            │
└────────────────────────────┬─────────────────────────────────────┘
                             │ 
                             │ POST /api/recognize
                             │ Body: { image: "data:image/jpeg;base64,..." }
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                    VERCEL EDGE FUNCTION                           │
│                     /api/recognize.ts                             │
│                                                                   │
│  • Empfängt Base64-Bild vom Client                               │
│  • Leitet Request an NVIDIA API weiter                           │
│  • Löst CORS-Problem (Browser → NVIDIA direkt = blockiert)       │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             │ POST /v1/chat/completions
                             │ Authorization: Bearer $NVIDIA_API_KEY
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                      NVIDIA NIM API                               │
│                   (Kimi K2.5 Vision Model)                        │
│                                                                   │
│  Model: moonshotai/kimi-k2-5                                     │
│  Input: Bild + Prompt                                            │
│  Output: JSON { cardName, set, number, rarity, language }        │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             │ Response
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT                                    │
│                                                                   │
│  • Zeigt Karteninfos an                                          │
│  • Generiert Cardmarket-Link:                                    │
│    cardmarket.com/en/Pokemon/Products/Search?searchString=...    │
└──────────────────────────────────────────────────────────────────┘
```

### Warum Edge Function?

NVIDIA NIM API erlaubt keine direkten Browser-Requests (CORS). Die Edge Function fungiert als Proxy:

```
Browser → NVIDIA API     ❌ CORS blockiert
Browser → Edge Function → NVIDIA API     ✅ Funktioniert
```

---

## 🔄 API-Flow: Kartenerkennung

### 1. Client sendet Bild

```typescript
// src/services/kimiVision.ts
const response = await fetch('/api/recognize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ image: base64Image })
});
```

### 2. Edge Function leitet weiter

```typescript
// api/recognize.ts
const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'moonshotai/kimi-k2-5',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: 'Analysiere diese Pokemon-Karte...' },
        { type: 'image_url', image_url: { url: image } }
      ]
    }],
    max_tokens: 500
  })
});
```

### 3. Kimi K2.5 analysiert

**Input:** Bild einer Pokémon-Karte

**Output:**
```json
{
  "cardName": "Xerneas",
  "set": "Celebrations",
  "number": "012/025",
  "rarity": "Holo Rare",
  "language": "English"
}
```

### 4. Client zeigt Ergebnis + Cardmarket-Link

```typescript
// src/services/cardmarketPrice.ts
const searchQuery = encodeURIComponent(`${cardName} ${setName} ${cardNumber}`);
const cardmarketUrl = `https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${searchQuery}`;
```

---

## 📁 Projektstruktur

```
poke-scan-v2/
├── api/
│   └── recognize.ts          # Vercel Edge Function (NVIDIA Proxy)
│
├── src/
│   ├── components/
│   │   └── CardScanner.tsx   # Upload + Scan + Ergebnis-Anzeige
│   │
│   ├── services/
│   │   ├── kimiVision.ts     # Ruft /api/recognize auf
│   │   ├── cardmarketPrice.ts # Generiert Cardmarket-URL
│   │   └── pokemonTCG.ts     # Pokémon TCG API (optional)
│   │
│   ├── App.tsx               # Layout
│   └── main.tsx              # Entry Point
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.ts
```

---

## 🚀 Installation

```bash
# Klonen
git clone https://github.com/celtechstarter/poke-scan-v2.git
cd poke-scan-v2

# Dependencies
npm install

# Environment Variables (siehe unten)
cp .env.example .env.local

# Development Server
npm run dev

# Production Build
npm run build
```

---

## ⚙️ Environment Variables

### Lokal (`.env.local`)

```env
VITE_NVIDIA_API_KEY=nvapi-xxx    # Für lokale Entwicklung (Client-Side)
```

### Vercel (Settings → Environment Variables)

```env
NVIDIA_API_KEY=nvapi-xxx         # Für Edge Function (Server-Side)
```

> ⚠️ **Wichtig:** Vercel Server Functions haben keinen Zugriff auf `VITE_` Variablen. Deshalb braucht man beide.

### API Key bekommen

1. [build.nvidia.com](https://build.nvidia.com) → Account erstellen
2. API Key generieren (kostenlos)

---

## 🚢 Deployment

### Vercel (empfohlen)

1. Repo mit Vercel verbinden
2. Environment Variable `NVIDIA_API_KEY` setzen
3. Deploy

Vercel erkennt automatisch:
- Vite als Framework
- `/api` Ordner als Serverless Functions

### Manuell

```bash
npm run build
# Output in /dist
```

---

## 🤖 KI-gestützte Entwicklung

Dieses Projekt nutzt KI-Agenten für die Entwicklung:

### Architektur & Code-Design
**Claude** (Anthropic) – Plant die Architektur, schreibt Code-Vorlagen, debuggt.

### Automatisierte Implementierung
**OpenClaw** mit **Llama 3.3 70B** – Ein Bot auf einem VPS, erreichbar via Telegram (@herbekantebot). Führt Git-Befehle aus, erstellt Dateien, pusht Code.

### Bilderkennung (Produktion)
**Kimi K2.5 Vision** (NVIDIA NIM) – Multimodales Modell das Bilder analysieren kann. Wird in der Web-App für die Kartenerkennung verwendet.

### Workflow

```
1. Mensch beschreibt Aufgabe an Claude
2. Claude schreibt Code + Anweisungen
3. Mensch kopiert Anweisungen zu Telegram → OpenClaw
4. OpenClaw führt aus, committed, pusht auf 'dev'
5. Mensch merged 'dev' → 'main'
6. Vercel deployed automatisch
```

---

## 🗺️ Roadmap

### ✅ Fertig
- [x] React + TypeScript + Vite Setup
- [x] Tailwind + shadcn/ui
- [x] Kimi K2.5 Vision Integration
- [x] Vercel Edge Function (CORS-Lösung)
- [x] Cardmarket-Verlinkung
- [x] Responsive Design
- [x] ARIA Labels (Barrierefreiheit)

### 🚧 In Arbeit
- [ ] Error Handling verbessern
- [ ] Loading States optimieren

### 📋 Geplant
- [ ] Google Login (Supabase Auth)
- [ ] Kartensammlung speichern
- [ ] Preisverlauf-Graphen
- [ ] PWA Support
- [ ] Cardmarket Scraping (echte Preise statt nur Link)

---

## ♿ Barrierefreiheit

| Feature | Implementierung |
|---------|-----------------|
| Screen Reader | `aria-label` auf allen interaktiven Elementen |
| Tastatur | Alle Funktionen per Tab erreichbar |
| Loading States | `aria-live="polite"` für Status-Updates |
| Fehler | `role="alert"` für Fehlermeldungen |
| Kontraste | WCAG AA konform |

---

## 💰 Betriebskosten

| Service | Kosten |
|---------|--------|
| NVIDIA NIM API | 0€ (Free Tier) |
| Vercel | 0€ (Hobby) |
| GitHub | 0€ |
| Hostinger VPS (für Dev-Bot) | ~9€/Monat |
| **Gesamt** | **~9€/Monat** |

---

## 📄 Lizenz

MIT

---

## 🔗 Links

| | |
|---|---|
| **Live** | [poke-scan-v2.vercel.app](https://poke-scan-v2.vercel.app) |
| **Repo** | [github.com/celtechstarter/poke-scan-v2](https://github.com/celtechstarter/poke-scan-v2) |
| **NVIDIA NIM** | [build.nvidia.com](https://build.nvidia.com) |
| **Cardmarket** | [cardmarket.com](https://www.cardmarket.com/en/Pokemon) |
