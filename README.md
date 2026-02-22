# 🎮 POKE-SCAN V2

### KI-gestützte Pokémon-Kartenerkennung • Seit 2026

<p align="center">
  <img src="https://img.shields.io/badge/Status-Live_🚀-brightgreen?style=for-the-badge" />
  <img src="https://img.shields.io/badge/KI_Agenten-4_Online-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Design-2050_Futuristisch-purple?style=for-the-badge" />
</p>

<p align="center">
  <a href="https://poke-scan-v2.vercel.app">🌐 Live Demo</a> •
  <a href="#-so-funktionierts">🔍 So funktioniert's</a> •
  <a href="#-tech-stack">⚡ Tech Stack</a> •
  <a href="#-das-team">👥 Das Team</a>
</p>

---

## 🎯 Live Demo

**👉 [poke-scan-v2.vercel.app](https://poke-scan-v2.vercel.app)**

Lade ein Foto deiner Pokémon-Karte hoch → Erhalte den Marktwert in Sekunden!

---

## 🤔 Was ist das?

Du findest eine alte Pokémon-Karte auf dem Dachboden oder auf dem Flohmarkt und fragst dich:

> **"Ist die was wert?"**

**Poke-Scan** gibt dir die Antwort in Sekunden:

```
📸 Foto machen → 🦙 KI erkennt die Karte → 💰 Preis wird angezeigt
```

Kein Googlen. Kein Rätselraten. Einfach scannen.

---

## ✨ Features

| Feature | Beschreibung |
|---------|--------------|
| 🦙 **KI-Kartenerkennung** | Llama 3.2 Vision erkennt Karten per Foto |
| 🔄 **3-Model Fallback** | Funktioniert immer - auch bei API-Überlastung |
| 📱 **Handy-Kamera** | Direkt mit der Smartphone-Kamera scannen |
| 💰 **Cardmarket-Link** | Direkter Link zu aktuellen Marktpreisen |
| ♿ **Barrierefrei** | WCAG AA konform |
| 🎮 **2050 Design** | Futuristisches Pokemon + KI + Cyberpunk Design |

---

## 🔍 So funktioniert's

Wir nutzen **KEINE klassische Texterkennung (OCR)** — das funktioniert bei holografischen Karten schlecht.

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
📊 Cardmarket-Link wird generiert
     │
     ▼
📱 Ergebnis auf dem Bildschirm!
```

**Smartes Prompt Engineering:** Die KI ist speziell angewiesen, die Kartennummer **unten links** zu lesen (z.B. "012/172") — nicht die Pokédex-Nummer oben rechts.

---

## ⚡ Tech Stack

### Systemarchitektur

```
╔══════════════════════════════════════╗
║  ⚡ SYSTEM.POKEDEX                   ║
╠══════════════════════════════════════╣
║  FRONTEND                            ║
║  ├─ React 18 + TypeScript            ║
║  ├─ Vite + Tailwind CSS              ║
║  └─ Vercel Serverless Functions      ║
║                                      ║
║  KI-KERN                             ║
║  ├─ Llama 3.2 Vision (90B)           ║
║  ├─ NVIDIA NIM API (KOSTENLOS!)      ║
║  └─ 3-Model Fallback-Chain           ║
║                                      ║
║  INFRASTRUKTUR                       ║
║  ├─ ▲ Vercel (Frontend + API)        ║
║  ├─ 🟦 Hostinger VPS (KI-Agenten)    ║
║  └─ 🐙 GitHub (Quellcode)            ║
╚══════════════════════════════════════╝
```

### Architektur-Fluss

```
┌─────────────────────────────────────────────────────┐
│                    BROWSER                          │
│  React + TypeScript + Tailwind                      │
│  + Bildkomprimierung (800px, JPEG 80%)             │
└────────────────────┬────────────────────────────────┘
                     │ POST /api/recognize
                     ▼
┌─────────────────────────────────────────────────────┐
│           VERCEL SERVERLESS FUNCTION                │
│              /api/recognize.ts                      │
│  • Validiert Anfrage                                │
│  • Probiert 3 Models nacheinander                   │
│  • Gibt JSON-Ergebnis zurück                        │
└────────────────────┬────────────────────────────────┘
                     │ Authorization: Bearer $KEY
                     ▼
┌─────────────────────────────────────────────────────┐
│              NVIDIA NIM API                         │
│  Models (Fallback-Reihenfolge):                     │
│  1. llama-3.2-90b-vision-instruct                  │
│  2. llama-3.2-11b-vision-instruct                  │
│  3. phi-3.5-vision-instruct                        │
└─────────────────────────────────────────────────────┘
```

---

## 🎨 Design: Pokemon × KI × 2050

Das UI wurde entworfen um die Fusion zu visualisieren:
- **Pokemon-Universum** — Pokébälle, Energie-Partikel, Pokédex-Style
- **KI/Neuronale Netze** — Datenströme, Verbindungslinien, Status-Indikatoren
- **Jahr 2050 Ästhetik** — Cyberpunk, holografische Effekte, dunkles Theme

### Design-Features
- 🔮 **Holografischer Pokéball** — Pulsiert mit Energie
- ⚡ **Neural Network Hintergrund** — Animierte Knoten und Verbindungen
- ✨ **Energie-Partikel** — Schwebender Pokemon-Sternenstaub
- 🖥️ **Pokédex-Style UI** — Ergebnisse wie Pokédex-Einträge
- 🟢 **KI Status-Leiste** — Zeigt alle 4 Agenten als LIVE

### Barrierefreiheit (WCAG AA)
- ⌨️ Tastatur-Navigation
- 🔗 Skip-to-Content Link
- 👁️ Sichtbare Fokus-Zustände
- 🏷️ ARIA-Labels überall
- 🎬 Respektiert `prefers-reduced-motion`

---

## 👥 Das Team

Dieses Projekt wurde von **einem Menschen mit mehreren KI-Agenten** gebaut:

```
┌─ POKEMON-TRAINER ─────────────────────────────────┐
│                                                   │
│              👨‍💻 MARCEL WELK                       │
│              Lead Trainer & Projekt-Architekt     │
│                                                   │
└───────────────────────────────────────────────────┘

┌─ KI PARTNER-POKEMON (AGENTEN) ────────────────────┐
│                                                   │
│  🧠 Claude        │  Architekt - Planung & Code   │
│  🦞 OpenClaw      │  Baumeister - Implementierung │
│  🦙 Llama Vision  │  Augen - Kartenerkennung      │
│  🎨 v0.dev        │  Designer - UI-Generierung    │
│                                                   │
└───────────────────────────────────────────────────┘

┌─ POWERED BY ──────────────────────────────────────┐
│                                                   │
│  ⚡ NVIDIA NIM    │  Kostenlose Vision API        │
│  ▲ Vercel        │  Frontend + Serverless        │
│  🟦 Hostinger    │  VPS für KI-Agenten           │
│  📊 Cardmarket   │  Preisdaten                   │
│  🐙 GitHub       │  Versionskontrolle            │
│                                                   │
└───────────────────────────────────────────────────┘
```

---

## 🚀 Lokal ausführen

### Voraussetzungen
- Node.js 18+
- NVIDIA NIM API Key (kostenlos auf [build.nvidia.com](https://build.nvidia.com))

### Installation

```bash
# Klonen
git clone https://github.com/celtechstarter/poke-scan-v2.git
cd poke-scan-v2

# Installieren
npm install

# Konfigurieren
cp .env.example .env.local
# Füge deinen NVIDIA_API_KEY in .env.local ein

# Starten
npm run dev
```

Öffne `http://localhost:5173` 🎉

### Umgebungsvariablen

```env
# Lokale Entwicklung (.env.local)
VITE_NVIDIA_API_KEY=nvapi-xxx

# Vercel Produktion (Projekt-Einstellungen)
NVIDIA_API_KEY=nvapi-xxx
```

**Wichtig:** Serverless Functions brauchen `NVIDIA_API_KEY` (ohne `VITE_` Prefix)!

---

## 📁 Projektstruktur

```
poke-scan-v2/
├── api/
│   └── recognize.ts           # Serverless Function (3-Model Fallback)
├── src/
│   ├── components/
│   │   └── poke-scan/
│   │       ├── ai-status-bar.tsx
│   │       ├── card-scanner.tsx      # Haupt-Scanner (mit Kamera!)
│   │       ├── confidence-bar.tsx
│   │       ├── energy-particles.tsx
│   │       ├── evolution-loader.tsx
│   │       ├── holographic-pokeball.tsx
│   │       ├── neural-background.tsx
│   │       ├── poke-scan-header.tsx
│   │       ├── pokedex-card.tsx
│   │       ├── rarity-stars.tsx
│   │       ├── scanner-frame.tsx
│   │       ├── tech-stack-pokedex.tsx
│   │       └── trainer-footer.tsx
│   ├── App.tsx
│   └── index.css
├── vercel.json
└── package.json
```

---

## 📋 Roadmap

- [x] 🏗️ React + TypeScript + Vite Grundgerüst
- [x] 🦙 Llama Vision Integration
- [x] 🔄 3-Model Fallback-Chain
- [x] 📊 Cardmarket-Link
- [x] 📱 HTML5 Kamera-Integration
- [x] 🎮 Futuristisches 2050 Design
- [x] ♿ WCAG AA Barrierefreiheit
- [x] 🟢 KI Status-Leiste (4 Agenten LIVE)
- [ ] 🗜️ Bildkomprimierung für schnellere Erkennung
- [ ] 📱 PWA Support
- [ ] 💰 Direkte Preis-Anzeige
- [ ] 📈 Preisverlaufs-Graphen
- [ ] 🗃️ Sammlungs-Verwaltung

---

## 💰 Betriebskosten

| Service | Kosten |
|---------|--------|
| NVIDIA NIM API | 0€ (kostenlos!) |
| Vercel Hosting | 0€ (Free Tier) |
| Hostinger VPS | ~9€/Monat |
| **Gesamt** | **~9€/Monat** |

Entwicklung: Claude Pro 18€/Monat (für Architektur & Planung)

---

## 🔒 Sicherheit

- ✅ API-Keys nur serverseitig (Serverless Functions)
- ✅ Keine Secrets im Client-Code
- ✅ HTTPS überall
- ✅ Input-Validierung

---

## 📄 Lizenz

MIT — Mach damit was du willst. ✌️

---

<p align="center">
  <b>● ALLE SYSTEME OPERATIONAL</b><br/>
  <sub>GEHOSTET AUF HOSTINGER • DEPLOYED AUF VERCEL</sub>
</p>

<p align="center">
  <b>Erstellt von Marcel Welk</b><br/>
  <sub>Mit 🧠 Claude • 🦞 OpenClaw • 🦙 Llama Vision • 🎨 v0.dev</sub>
</p>

<p align="center">
  <b>© 2026 POKE-SCAN • SCHNAPP SIE DIR ALLE • MENSCH + KI = ZUKUNFT</b>
</p>
