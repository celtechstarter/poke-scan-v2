# 🃏 Poke-Scan V2

### Pokémon-Karte fotografieren → Preis erfahren. So einfach.

<p align="center">
  <img src="https://img.shields.io/badge/Status-Live_🚀-brightgreen?style=for-the-badge" />
  <img src="https://img.shields.io/badge/KI--gesteuert-🤖_Ja!-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Kosten-~9€%2FMonat-green?style=for-the-badge" />
</p>

<p align="center">
  <a href="https://poke-scan-v2.vercel.app">🌐 Live Demo</a> •
  <a href="#-wie-funktioniert-die-kartenerkennung">🔍 Wie es funktioniert</a> •
  <a href="#%EF%B8%8F-tech-stack">🛠️ Tech-Stack</a> •
  <a href="#-das-team">👥 Das Team</a>
</p>

---

## 🎯 Live Demo

**👉 [poke-scan-v2.vercel.app](https://poke-scan-v2.vercel.app)**

Einfach Foto hochladen und in Sekunden den Marktwert erfahren!

---

## 🤔 Was ist das?

Du findest eine alte Pokémon-Karte auf dem Dachboden oder auf dem Flohmarkt und fragst dich:

> **"Ist die was wert?"**

**Poke-Scan** gibt dir die Antwort in Sekunden:

```
📸 Foto machen → 🦙 KI erkennt die Karte → 💰 Preis wird angezeigt
```

Kein Googlen. Kein Rätseln. Einfach scannen.

---

## ✨ Features

| Feature | Beschreibung |
|---------|-------------|
| 📸 **KI-Kartenerkennung** | Llama 3.2 Vision erkennt Pokémon-Karten aus Fotos |
| 🔄 **Fallback-System** | 3 Vision-Models für maximale Zuverlässigkeit |
| 💰 **Cardmarket-Link** | Direkter Link zum aktuellen Marktpreis |
| 📱 **Mobile-First** | Responsive Design, funktioniert auf jedem Gerät |
| ♿ **Barrierefrei** | WCAG AA konform (Screen Reader, Tastaturnavigation) |
| ✨ **Animationen** | Schönes UI mit Pokéball-Animation & Sparkles |

---

## 🔍 Wie funktioniert die Kartenerkennung?

Wir nutzen **KEINE klassische Texterkennung (OCR)** — das funktioniert bei Pokémon-Karten schlecht wegen der bunten Hintergründe und holografischen Effekte.

Stattdessen: **KI-Vision mit Fallback-Chain**

```
📸 Foto der Karte
     │
     ▼
┌─────────────────────────────────────────────┐
│  🦙 NVIDIA NIM Vision API                   │
│                                             │
│  Fallback-Chain:                            │
│  1. meta/llama-3.2-90b-vision-instruct     │
│  2. meta/llama-3.2-11b-vision-instruct     │
│  3. microsoft/phi-3.5-vision-instruct      │
│                                             │
│  → Erkennt: Name, Set, Nummer, Seltenheit  │
└─────────────────────────────────────────────┘
     │
     ▼
📊 Cardmarket-Link generiert
     │
     ▼
📱 Ergebnis auf dem Bildschirm!
```

**Warum Fallback?** Manchmal sind die großen Models überlastet. Mit 3 Models ist immer eins verfügbar.

**Warum die Nummer unten links?** Die Kartennummer (z.B. "012/172") steht unten links auf der Karte — nicht die Pokédex-Nummer oben rechts. Unser Prompt ist darauf optimiert.

---

## 🛠️ Tech-Stack

### Frontend
| Technologie | Verwendung |
|-------------|------------|
| **React 18** | UI-Framework |
| **TypeScript** | Typsicherheit |
| **Vite** | Build-Tool |
| **Tailwind CSS** | Styling |

### Backend / API
| Technologie | Verwendung |
|-------------|------------|
| **Vercel Edge Functions** | Serverless API |
| **NVIDIA NIM** | KI Vision API (kostenlos!) |
| **Llama 3.2 Vision** | Kartenerkennung |

### Infrastruktur
| Technologie | Verwendung |
|-------------|------------|
| **Vercel** | Hosting & Deployment |
| **GitHub** | Versionskontrolle |
| **Hostinger VPS** | OpenClaw Agent |

### Architektur-Diagramm

```
┌─────────────────────────────────────────────────────┐
│                    BROWSER                          │
│  React + TypeScript + Tailwind                      │
└────────────────────┬────────────────────────────────┘
                     │ POST /api/recognize
                     │ Body: { image: "data:image/..." }
                     ▼
┌─────────────────────────────────────────────────────┐
│              VERCEL EDGE FUNCTION                   │
│              /api/recognize.ts                      │
│                                                     │
│  • Validiert Request                                │
│  • Fallback-Chain durch 3 Models                   │
│  • Gibt JSON zurück                                 │
└────────────────────┬────────────────────────────────┘
                     │ Authorization: Bearer $NVIDIA_KEY
                     ▼
┌─────────────────────────────────────────────────────┐
│              NVIDIA NIM API                         │
│                                                     │
│  Models (in Reihenfolge):                          │
│  1. meta/llama-3.2-90b-vision-instruct            │
│  2. meta/llama-3.2-11b-vision-instruct            │
│  3. microsoft/phi-3.5-vision-instruct             │
└─────────────────────────────────────────────────────┘
```

### Warum diese Entscheidungen?

| Entscheidung | Alternative | Warum diese Wahl |
|-------------|------------|------------------|
| **Llama Vision statt OCR** | EasyOCR, Tesseract | OCR versagt bei holografischen Karten |
| **Edge Functions** | Eigener Server | CORS-Problem gelöst, kein Server nötig |
| **Fallback-Chain** | Einzelnes Model | Zuverlässigkeit bei API-Überlastung |
| **NVIDIA NIM** | OpenAI, Anthropic | Komplett kostenlos! |
| **Vercel** | Netlify, Railway | Auto-Deploy, perfekte GitHub Integration |

---

## 🎨 Design & Accessibility

Das UI wurde mit **v0.dev** generiert und ist vollständig **barrierefrei** (WCAG AA):

### Design-Features
- 🎱 **Animierter Pokéball** — dreht sich sanft im Header
- ✨ **Floating Sparkles** — schwebende Sterne für mehr Leben
- 🎊 **Konfetti-Animation** — bei erfolgreicher Erkennung
- 🌈 **Gradient-Header** — Blau → Lila → Pink

### Accessibility-Features
- ⌨️ **Tastaturnavigation** — alle Elemente erreichbar
- 🔗 **Skip-to-Content Link** — für Screen Reader
- 👁️ **Focus-States** — sichtbare Fokus-Ringe
- 🏷️ **ARIA-Labels** — alle Elemente beschriftet
- 🎬 **Reduced Motion** — Animationen respektieren System-Einstellung

---

## 📁 Projektstruktur

```
poke-scan-v2/
├── api/
│   └── recognize.ts        # Vercel Edge Function
├── src/
│   ├── components/
│   │   ├── AnimatedPokeball.tsx
│   │   ├── AppFooter.tsx
│   │   ├── AppHeader.tsx
│   │   ├── CardScanner.tsx
│   │   ├── FloatingSparkles.tsx
│   │   ├── GitHubLink.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── SuccessAnimation.tsx
│   ├── services/
│   │   └── kimiVision.ts   # API Client
│   ├── App.tsx
│   └── index.css           # Animationen
├── .env.example
└── package.json
```

---

## 🚀 Selber ausprobieren

### Voraussetzungen
- Node.js 18+
- NVIDIA NIM API Key (kostenlos auf [build.nvidia.com](https://build.nvidia.com))

### Installation

```bash
# Repository klonen
git clone https://github.com/celtechstarter/poke-scan-v2.git

# In den Ordner wechseln
cd poke-scan-v2

# Abhängigkeiten installieren
npm install

# Environment Variables setzen
cp .env.example .env.local
# Dann NVIDIA_API_KEY in .env.local eintragen

# Starten!
npm run dev
```

Dann öffne `http://localhost:5173` im Browser. 🎉

### Environment Variables

```env
# Für lokale Entwicklung (.env.local)
VITE_NVIDIA_API_KEY=nvapi-xxx

# Für Vercel (in Project Settings)
NVIDIA_API_KEY=nvapi-xxx
```

**Wichtig:** Vercel Edge Functions brauchen `NVIDIA_API_KEY` (ohne `VITE_` Prefix)!

---

## 📋 Roadmap

- [x] 🏗️ Grundgerüst mit React + TypeScript + Vite
- [x] 🎨 UI mit Tailwind CSS
- [x] 🦙 Llama Vision Integration
- [x] 🔄 Fallback-Chain mit 3 Models
- [x] 🎨 Professionelles Design (v0.dev)
- [x] ♿ Accessibility (WCAG AA)
- [x] 📊 Cardmarket-Link
- [ ] 📱 PWA Support (App installierbar)
- [ ] 🦞 Telegram Bot
- [ ] 💰 Preis direkt von Cardmarket scrapen
- [ ] 📈 Preis-Verlaufs-Graphen
- [ ] 🗃️ Sammlungs-Verwaltung

---

## 👥 Das Team

Dieses Projekt wurde von **einem Menschen und mehreren KI-Agenten** gebaut:

| Wer | Rolle | Was |
|-----|-------|-----|
| 👨‍💻 **Marcel Welk** | Creator & Chef | Idee, Koordination, Entscheidungen |
| 🧠 **Claude** | Architekt | Planung, Code, Debugging |
| 🦞 **OpenClaw** | Handwerker | Implementierung auf VPS |
| 🎨 **v0.dev** | Designer | UI-Komponenten generiert |
| 🦙 **Llama 3.2 Vision** | Kartenerkennung | Das "Auge" der App |
| ⚡ **NVIDIA NIM** | Infrastruktur | Kostenlose Vision API |
| 🚀 **Vercel** | Deployment | Hosting & Edge Functions |

---

## 💰 Was kostet der Betrieb?

| Service | Kosten |
|---------|--------|
| NVIDIA NIM API | 0€ (kostenlos!) |
| Vercel Hosting | 0€ (Free Tier) |
| Hostinger VPS | ~9€/Monat |
| **Gesamt** | **~9€/Monat** |

**Entwicklungskosten:**
- Claude Pro: 18€/Monat (für Architektur & Planung)

---

## 🔒 Sicherheit

- ✅ API-Keys nur serverseitig (Edge Functions)
- ✅ Keine Secrets im Client-Code
- ✅ HTTPS überall
- ✅ Input-Validierung

---

## 📄 Lizenz

MIT — Mach damit was du willst. ✌️

---

<p align="center">
  <b>Created by Marcel Welk</b><br/>
  <sub>Mit Unterstützung von Claude 🧠 • OpenClaw 🦞 • Llama Vision 🦙</sub>
</p>

<p align="center">
  <a href="https://github.com/celtechstarter/poke-scan-v2">
    <img src="https://img.shields.io/github/stars/celtechstarter/poke-scan-v2?style=social" alt="GitHub Stars" />
  </a>
</p>
