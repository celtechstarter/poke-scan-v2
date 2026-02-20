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
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase" />
</p>

---

## 📖 Inhaltsverzeichnis

- [🤔 Was ist Poke-Scan?](#-was-ist-poke-scan)
- [✨ Features](#-features)
- [🎮 Nutzungswege](#-nutzungswege)
- [🛠️ Tech-Stack](#️-tech-stack)
- [🤖 Das KI-Team](#-das-ki-team)
- [🏗️ Architektur](#️-architektur)
- [🔄 Wie funktioniert die Kartenerkennung?](#-wie-funktioniert-die-kartenerkennung)
- [📁 Projektstruktur](#-projektstruktur)
- [🚀 Installation & Setup](#-installation--setup)
- [⚙️ Konfiguration](#️-konfiguration)
- [🗺️ Roadmap](#️-roadmap)
- [💰 Betriebskosten](#-betriebskosten)
- [🤝 Contributing](#-contributing)
- [📄 Lizenz](#-lizenz)

---

## 🤔 Was ist Poke-Scan?

Du findest eine alte Pokémon-Karte auf dem Dachboden oder auf dem Flohmarkt und fragst dich:

> **"Ist die was wert?"**

**Poke-Scan** gibt dir die Antwort in Sekunden:

```
📸 Foto machen → 🧠 KI erkennt die Karte → 💰 Preis wird angezeigt
```

**Kein Googlen. Kein Rätselraten. Einfach scannen.**

### Das Besondere an diesem Projekt

Dieses Projekt wurde **fast komplett von KI-Agenten gebaut**. Ein Mensch koordiniert, mehrere KI-Assistenten arbeiten zusammen – vollautomatisiert, 24/7, für unter 30€ im Monat.

---

## ✨ Features

| Feature | Beschreibung | Status |
|---------|--------------|--------|
| 📸 **Karten-Erkennung** | KI erkennt Pokémon-Karten per Foto | ✅ Implementiert |
| 💰 **Preisabfrage** | Aktuelle Marktpreise von Pokémon TCG API | ✅ Implementiert |
| ⭐ **Set & Seltenheit** | Erkennt Set, Nummer und Seltenheit | ✅ Implementiert |
| 📱 **Responsive Design** | Funktioniert auf Desktop & Mobile | ✅ Implementiert |
| 🦞 **Telegram Bot** | Foto schicken → Preis bekommen | ✅ Läuft |
| 🔄 **Auto-Updates** | Preise aktualisieren sich automatisch | 🚧 In Arbeit |
| 📊 **Preis-Verlauf** | Historische Preisdaten als Graph | 📋 Geplant |
| 🪙 **Sammlung** | Eigene Kartensammlung verwalten | 📋 Geplant |
| 📱 **PWA Support** | Als App auf dem Handy installierbar | 📋 Geplant |

---

## 🎮 Nutzungswege

Du hast **3 Wege** die App zu nutzen:

| Weg | Wie | Für wen | Status |
|-----|-----|---------|--------|
| 🌐 **Browser** | Webseite öffnen → Foto hochladen | Alle | ✅ |
| 📲 **Handy** | Webseite auf dem Handy → Kamera nutzen | Unterwegs | ✅ |
| 🦞 **Telegram-Bot** | Foto an @herbekantebot schicken → Preis kommt zurück | Flohmarkt-Profis | ✅ |

---

## 🛠️ Tech-Stack

### Frontend

| Technologie | Version | Verwendung |
|-------------|---------|------------|
| ⚛️ **React** | 18.x | UI Framework |
| 📘 **TypeScript** | 5.x | Typsichere Entwicklung |
| ⚡ **Vite** | 5.x | Build Tool & Dev Server |
| 🎨 **Tailwind CSS** | 3.x | Utility-First Styling |
| 🧩 **shadcn/ui** | Latest | UI-Komponenten-Bibliothek |
| 📡 **Axios** | Latest | HTTP Client für API-Calls |

### Backend & Services

| Service | Anbieter | Verwendung | Kosten |
|---------|----------|------------|--------|
| 🧠 **Kimi K2.5 Vision** | NVIDIA NIM | KI-Kartenerkennung | Kostenlos |
| 🃏 **Pokémon TCG API** | pokemontcg.io | Kartendaten & Preise | Kostenlos |
| 🗄️ **Supabase** | supabase.com | PostgreSQL Datenbank | Kostenlos (Free Tier) |
| 🚀 **Vercel** | vercel.com | Frontend Hosting | Kostenlos (Free Tier) |

### Infrastruktur & Agenten

| Komponente | Anbieter | Verwendung | Kosten |
|------------|----------|------------|--------|
| 🖥️ **VPS Server** | Hostinger KVM 2 | OpenClaw Host, 24/7 Betrieb | ~9€/Monat |
| 🦞 **OpenClaw** | openclaw.ai | KI-Agent Framework | Kostenlos |
| 🤖 **Llama 3.3 70B** | NVIDIA NIM | OpenClaw's Denkmaschine | Kostenlos |
| 📱 **Telegram Bot API** | Telegram | Bot-Kommunikation | Kostenlos |
| 🔄 **GitHub Actions** | GitHub | CI/CD Pipeline | Kostenlos |

### Entwicklungstools

| Tool | Verwendung |
|------|------------|
| 🧠 **Claude** (Anthropic) | Architektur-Planung, Code-Review |
| 🦞 **OpenClaw + Kimi/Llama** | Automatisierte Code-Implementierung |
| 🎨 **v0.dev** | UI-Komponenten-Generierung |
| 📦 **npm** | Package Manager |
| 🔀 **Git + GitHub** | Versionskontrolle |

---

## 🤖 Das KI-Team

Dieses Projekt wird von einem **Team aus KI-Agenten** gebaut und gewartet:

```
👨‍💻 Mensch (der Chef)
 │
 ├── 🧠 Claude ──────── Der Architekt
 │                      Plant die Architektur, schreibt Code-Vorlagen,
 │                      reviewt und debuggt.
 │
 ├── 🦞 OpenClaw ────── Der Handwerker
 │    │                 Implementiert auf dem VPS, testet, deployed.
 │    │                 Arbeitet 24/7, schläft nie 💪
 │    │
 │    └── 🤖 Llama 3.3 ─ Das Gehirn von OpenClaw
 │                       70B Parameter, läuft kostenlos via NVIDIA NIM
 │
 ├── 🎨 v0.dev ──────── Der Designer
 │                      Generiert UI-Komponenten aus Beschreibungen
 │
 ├── ⚙️ GitHub Actions ─ Der Qualitätsprüfer
 │                       Automatische Tests bei jedem Push
 │
 └── 🚀 Vercel ──────── Der Deployment-Manager
                        Automatisches Hosting, Preview URLs
```

### Kommunikation & Workflow

```
┌─────────────┐     Aufgabe      ┌─────────────┐
│   Mensch    │ ───────────────► │   Claude    │
│  (Telegram) │                  │ (Architekt) │
└─────────────┘                  └──────┬──────┘
       ▲                                │
       │                           Code & Plan
       │                                │
       │ Status                         ▼
       │                         ┌─────────────┐
       └──────────────────────── │  OpenClaw   │
                                 │ (Handwerker)│
                                 └──────┬──────┘
                                        │
                                   Commit & Push
                                        │
                                        ▼
                                 ┌─────────────┐
                                 │   GitHub    │
                                 │  Actions    │
                                 └──────┬──────┘
                                        │
                                   Auto-Deploy
                                        │
                                        ▼
                                 ┌─────────────┐
                                 │   Vercel    │
                                 │   (Live!)   │
                                 └─────────────┘
```

---

## 🏗️ Architektur

### System-Übersicht

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React 18 + TypeScript + Vite                               │
│  Tailwind CSS + shadcn/ui                                   │
│  PWA-fähig (installierbar auf Mobilgeräten)                 │
│  Hosted auf Vercel (Free Tier)                              │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND / SERVICES                        │
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐           │
│  │  Kimi K2.5 Vision   │  │   Pokémon TCG API   │           │
│  │  (NVIDIA NIM API)   │  │   (Kartendaten)     │           │
│  │  Kartenerkennung    │  │   Preise & Sets     │           │
│  │  Kostenlos! 🎉      │  │   Kostenlos! 🎉     │           │
│  └─────────────────────┘  └─────────────────────┘           │
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐           │
│  │     Supabase        │  │   OpenClaw Agent    │           │
│  │  (PostgreSQL DB)    │  │  (VPS @ Hostinger)  │           │
│  │   Cache + Auth      │  │  Cron-Jobs, Scraping│           │
│  │   Free Tier         │  │   Telegram Bot      │           │
│  └─────────────────────┘  └─────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### Technische Entscheidungen

| Entscheidung | Alternative | Warum diese Wahl |
|-------------|-------------|------------------|
| **Kimi K2.5 Vision** statt OCR | EasyOCR, Tesseract | OCR versagt bei holographischen Karten, KI-Vision erkennt das gesamte Bild |
| **TypeScript only** | Python + TypeScript | Ein Tech-Stack = weniger Bugs, einfacher zu warten |
| **Supabase** statt eigener DB | MongoDB, Firebase | PostgreSQL + kostenlos + Auth + Realtime out of the box |
| **NVIDIA NIM API** | Moonshot API, OpenRouter | Komplett kostenlos, keine Rate Limits dokumentiert |
| **Vercel** statt Netlify | Netlify, Railway | Auto-Deploy, Preview URLs, perfekte GitHub Integration |
| **OpenClaw + VPS** | Lokaler Betrieb | 24/7 Betrieb, Telegram-Bot braucht Always-On Server |
| **Llama 3.3 70B** statt GPT-4 | OpenAI API | Kostenlos via NVIDIA, schnell, gute Code-Qualität |

---

## 🔄 Wie funktioniert die Kartenerkennung?

Wir nutzen **KEINE klassische Texterkennung (OCR)** – das funktioniert bei Pokémon-Karten schlecht wegen der bunten Hintergründe und Spezial-Schriften.

Stattdessen nutzen wir **KI-Vision**:

```
📸 Foto der Karte
     │
     ▼
┌─────────────────────────────────────────┐
│  🤖 Kimi K2.5 Vision API (NVIDIA NIM)   │
│                                         │
│  "Das ist Glurak (Charizard)            │
│   Set: Obsidian Flames                  │
│   Nummer: 006/197                       │
│   Seltenheit: Ultra Rare"               │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  🔎 Pokémon TCG API                     │
│                                         │
│  Kartendaten abrufen:                   │
│  - Offizielles Bild                     │
│  - Marktpreise (TCGPlayer)              │
│  - Set-Informationen                    │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  📱 Ergebnis auf dem Bildschirm         │
│                                         │
│  Kartenname: Glurak                     │
│  Set: Obsidian Flames (006/197)         │
│  Seltenheit: Ultra Rare ⭐              │
│  Preis: ~47,50€                         │
└─────────────────────────────────────────┘
```

### Code-Beispiel

```typescript
// 1. Bild an Kimi K2.5 Vision senden
const recognition = await recognizeCard(base64Image);
// → { cardName: "Charizard", set: "Obsidian Flames", number: "006/197", rarity: "Ultra Rare" }

// 2. Pokémon TCG API abfragen
const cardData = await searchCard(recognition.cardName, recognition.set, recognition.number);
// → { id: "sv3-006", imageUrl: "...", prices: { market: 47.50 } }

// 3. Ergebnis anzeigen
displayResult(cardData);
```

---

## 📁 Projektstruktur

```
poke-scan-v2/
├── 📁 src/
│   ├── 📁 components/          # React UI-Komponenten
│   │   ├── CardScanner.tsx       # Hauptkomponente: Kamera + Upload
│   │   ├── CardResult.tsx        # Ergebnis-Anzeige
│   │   └── PriceDisplay.tsx      # Preis + Trend
│   │
│   ├── 📁 services/            # API-Integrationen
│   │   ├── kimiVision.ts         # Kimi K2.5 Vision API
│   │   ├── pokemonTCG.ts         # Pokémon TCG API
│   │   ├── priceService.ts       # Preis-Aggregation
│   │   └── supabase.ts           # Datenbank-Client
│   │
│   ├── 📁 hooks/               # Custom React Hooks
│   ├── 📁 types/               # TypeScript Definitionen
│   ├── 📁 utils/               # Hilfsfunktionen
│   │
│   ├── App.tsx                 # Haupt-App-Komponente
│   └── main.tsx                # Entry Point
│
├── 📁 docs/                    # Dokumentation
│   ├── PROJEKT-ANWEISUNGEN.md    # Anweisungen für KI-Agenten
│   └── AGENT-RICHTLINIEN.md      # Regeln für OpenClaw
│
├── 📁 supabase/                # Datenbank-Migrationen
├── 📁 public/                  # Statische Assets
├── 📁 .github/workflows/       # CI/CD Pipeline
│
├── 📄 package.json             # Dependencies
├── 📄 tsconfig.json            # TypeScript Config
├── 📄 vite.config.ts           # Vite Config
├── 📄 tailwind.config.ts       # Tailwind Config
└── 📄 .env.example             # Environment Variables Template
```

---

## 🚀 Installation & Setup

### Voraussetzungen

- Node.js 18+ (empfohlen: 20 LTS)
- npm oder pnpm
- Git

### Lokale Installation

```bash
# 1. Repository klonen
git clone https://github.com/celtechstarter/poke-scan-v2.git

# 2. In den Ordner wechseln
cd poke-scan-v2

# 3. Abhängigkeiten installieren
npm install

# 4. Environment Variables setzen
cp .env.example .env.local
# Dann .env.local mit deinen API-Keys füllen

# 5. Entwicklungsserver starten
npm run dev
```

Dann öffne `http://localhost:5173` im Browser. 🎉

### Produktions-Build

```bash
# Build erstellen
npm run build

# Build lokal testen
npm run preview
```

---

## ⚙️ Konfiguration

### Environment Variables

Erstelle eine `.env.local` Datei mit folgenden Variablen:

```env
# Supabase (Datenbank)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# NVIDIA NIM API (Kimi K2.5 Vision)
VITE_NVIDIA_API_KEY=nvapi-your_nvidia_api_key

# Pokémon TCG API
VITE_POKEMON_TCG_API_KEY=your_pokemon_tcg_api_key
```

### API-Keys bekommen

| Service | Wo bekommst du den Key? | Kosten |
|---------|------------------------|--------|
| **Supabase** | [supabase.com](https://supabase.com) → Neues Projekt → Settings → API | Kostenlos |
| **NVIDIA NIM** | [build.nvidia.com](https://build.nvidia.com) → Sign Up → API Keys | Kostenlos |
| **Pokémon TCG** | [pokemontcg.io](https://pokemontcg.io) → Get API Key | Kostenlos |

---

## 🗺️ Roadmap

### ✅ Erledigt

- [x] 🏗️ Grundgerüst mit React + TypeScript + Vite
- [x] 🎨 UI mit Tailwind + shadcn/ui
- [x] 🗄️ Supabase Datenbank Setup
- [x] 🤖 Kimi K2.5 Vision API Integration
- [x] 🔎 Pokémon TCG API Anbindung
- [x] 🦞 OpenClaw Agent auf VPS
- [x] 📱 Telegram Bot (@herbekantebot)
- [x] 📸 CardScanner UI-Komponente
- [x] 🔄 GitHub → Dev Branch Workflow

### 🚧 In Arbeit

- [ ] 🧪 End-to-End Tests
- [ ] 🔒 Error Handling verbessern
- [ ] 📊 Loading States & Skeleton UI

### 📋 Geplant

- [ ] 💰 Cardmarket Preis-Scraping via OpenClaw
- [ ] 📱 PWA Support (App-Icon auf Handy)
- [ ] 📈 Preis-Verlaufs-Graphen
- [ ] 🪙 Sammlungs-Verwaltung
- [ ] 🌍 Multi-Language Support (EN/DE)
- [ ] 🔔 Preis-Alerts

---

## 💰 Betriebskosten

| Service | Kosten/Monat | Notwendig? |
|---------|--------------|------------|
| 🧠 Claude Pro | 18€ | Ja (Architekt) |
| 🖥️ Hostinger VPS KVM 2 | ~9€ | Ja (24/7 Bot) |
| 🤖 NVIDIA NIM API | 0€ | Kostenlos |
| 🃏 Pokémon TCG API | 0€ | Kostenlos |
| 🗄️ Supabase | 0€ | Free Tier |
| 🚀 Vercel | 0€ | Free Tier |
| 🔄 GitHub Actions | 0€ | Free Tier |
| **Gesamt** | **~27€/Monat** | |

> 💡 **Tipp:** Das entspricht etwa den Kosten von Netflix + Spotify – für einen vollautomatisierten KI-Entwicklungs-Workflow!

---

## 🤝 Contributing

Contributions sind willkommen! Bitte beachte:

1. **Fork** das Repository
2. Erstelle einen **Feature Branch** (`git checkout -b feature/NeuesFeature`)
3. **Committe** deine Änderungen (`git commit -m '[Feature] Beschreibung'`)
4. **Pushe** den Branch (`git push origin feature/NeuesFeature`)
5. Öffne einen **Pull Request**

### Commit-Format

```
[Typ] Kurze Beschreibung

Typen:
- [Feature] Neue Funktionalität
- [Fix] Bugfix
- [Refactor] Code-Umbau
- [Style] CSS/UI-Änderungen
- [Docs] Dokumentation
- [Config] Konfiguration
- [Test] Tests
```

---

## 📄 Lizenz

MIT License – Mach damit was du willst. ✌️

```
MIT License

Copyright (c) 2026 celtechstarter

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

---

<p align="center">
  <b>Gebaut mit 💛 und einer Menge KI</b><br/>
  <sub>Von einem Menschen mit Ideen und 6 KI-Agenten mit Skills</sub><br/><br/>
  <img src="https://img.shields.io/badge/Made_with-Claude_+_OpenClaw_+_Kimi-FF6B6B?style=for-the-badge" />
</p>

---

## 🔗 Links

- **Live Demo:** *Coming Soon*
- **GitHub:** [github.com/celtechstarter/poke-scan-v2](https://github.com/celtechstarter/poke-scan-v2)
- **Telegram Bot:** [@herbekantebot](https://t.me/herbekantebot)
- **Pokémon TCG API:** [pokemontcg.io](https://pokemontcg.io)
- **NVIDIA NIM:** [build.nvidia.com](https://build.nvidia.com)
