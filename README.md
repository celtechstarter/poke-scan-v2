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
  <img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=flat-square&logo=vercel" />
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
- [♿ Barrierefreiheit](#-barrierefreiheit)
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

### Die Geschichte dahinter

Dieses Projekt startete vor 2 Jahren als Idee in einer Cloud- und Webentwicklungs-Weiterbildung. Damals scheiterte es an der Bilderkennung (OCR funktionierte nicht bei holographischen Karten). Jetzt, mit moderner KI-Vision-Technologie (Kimi K2.5), kann das Projekt endlich fertiggestellt werden.

---

## ✨ Features

| Feature | Beschreibung | Status |
|---------|--------------|--------|
| 📸 **Karten-Erkennung** | KI erkennt Pokémon-Karten per Foto (Kimi K2.5 Vision) | ✅ Implementiert |
| 💰 **Preisabfrage** | Direkte Verlinkung zu Cardmarket | ✅ Implementiert |
| ⭐ **Set & Seltenheit** | Erkennt Set, Nummer und Seltenheit | ✅ Implementiert |
| 🌍 **Mehrsprachig** | Erkennt DE, EN, JP, KR, CN Karten | ✅ Implementiert |
| 📱 **Responsive Design** | Funktioniert auf Desktop & Mobile | ✅ Implementiert |
| 🦞 **Telegram Bot** | Entwickler-Bot für Code-Aufgaben | ✅ Läuft |
| ♿ **Barrierefrei** | ARIA Labels, Keyboard Navigation | ✅ Implementiert |
| 🔄 **Auto-Deploy** | Vercel CI/CD Pipeline | ✅ Aktiv |
| 📊 **Preis-Verlauf** | Historische Preisdaten als Graph | 📋 Geplant |
| 🪙 **Sammlung** | Eigene Kartensammlung verwalten | 📋 Geplant |
| 🔐 **Google Login** | Authentifizierung via Supabase | 📋 Geplant |

---

## 🎮 Nutzungswege

Du hast **3 Wege** die App zu nutzen:

| Weg | Wie | Für wen | Status |
|-----|-----|---------|--------|
| 🌐 **Web-App** | [poke-scan-v2.vercel.app](https://poke-scan-v2.vercel.app) öffnen → Foto hochladen | Alle | ✅ Live |
| 📲 **Handy** | Webseite auf dem Handy → Kamera nutzen | Unterwegs | ✅ |
| 🦞 **Telegram-Bot** | @herbekantebot für Entwickler-Aufgaben | Entwickler | ✅ |

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

### Backend & APIs

| Service | Anbieter | Verwendung | Kosten |
|---------|----------|------------|--------|
| 🧠 **Kimi K2.5 Vision** | NVIDIA NIM | KI-Kartenerkennung (Bilder → Text) | Kostenlos |
| 🃏 **Pokémon TCG API** | pokemontcg.io | Kartendaten & US-Preise | Kostenlos |
| 💰 **Cardmarket** | cardmarket.com | EU-Preise (Verlinkung) | Kostenlos |
| 🗄️ **Supabase** | supabase.com | PostgreSQL Datenbank | Kostenlos |
| 🚀 **Vercel** | vercel.com | Hosting + Serverless Functions | Kostenlos |

### Infrastruktur & DevOps

| Komponente | Anbieter | Verwendung | Kosten |
|------------|----------|------------|--------|
| 🖥️ **VPS Server** | Hostinger KVM 2 | OpenClaw Host, 24/7 Betrieb | ~9€/Monat |
| 🦞 **OpenClaw** | openclaw.ai | KI-Agent Framework | Kostenlos |
| 🤖 **Llama 3.3 70B** | NVIDIA NIM | OpenClaw's Denkmaschine | Kostenlos |
| 📱 **Telegram Bot API** | Telegram | Bot-Kommunikation | Kostenlos |
| 🔄 **GitHub Actions** | GitHub | CI/CD Pipeline | Kostenlos |
| ☁️ **Vercel Edge Functions** | Vercel | API Proxy (CORS-Lösung) | Kostenlos |

### Entwicklungstools

| Tool | Verwendung |
|------|------------|
| 🧠 **Claude** (Anthropic) | Architektur-Planung, Code-Design, Debugging |
| 🦞 **OpenClaw + Llama** | Automatisierte Code-Implementierung via Telegram |
| 🎨 **v0.dev** | UI-Komponenten-Generierung |
| 📦 **npm** | Package Manager |
| 🔀 **Git + GitHub** | Versionskontrolle mit Branch-Strategie (main/dev) |

---

## 🤖 Das KI-Team

Dieses Projekt wird von einem **Team aus KI-Agenten** gebaut und gewartet:

```
👨‍💻 Mensch (der Chef)
 │
 ├── 🧠 Claude ──────── Der Architekt
 │                      Plant die Architektur, schreibt Code-Vorlagen,
 │                      reviewt und debuggt. Arbeitet mit dem Menschen
 │                      direkt im Chat.
 │
 ├── 🦞 OpenClaw ────── Der Handwerker
 │    │                 Implementiert auf dem VPS, testet, deployed.
 │    │                 Erreichbar via Telegram (@herbekantebot)
 │    │                 Arbeitet 24/7, schläft nie 💪
 │    │
 │    └── 🤖 Llama 3.3 ─ Das Gehirn von OpenClaw
 │                       70B Parameter, läuft kostenlos via NVIDIA NIM
 │
 ├── 👁️ Kimi K2.5 ───── Der Seher
 │                      Vision-Model für Kartenerkennung
 │                      Kann Bilder "sehen" und analysieren
 │
 ├── 🎨 v0.dev ──────── Der Designer
 │                      Generiert UI-Komponenten aus Beschreibungen
 │
 └── 🚀 Vercel ──────── Der Deployment-Manager
                        Automatisches Hosting, Preview URLs
```

### Der Workflow

```
┌─────────────┐     Aufgabe      ┌─────────────┐
│   Mensch    │ ───────────────► │   Claude    │
│   (Chat)    │                  │ (Architekt) │
└─────────────┘                  └──────┬──────┘
       │                                │
       │ Telegram                  Code & Plan
       │                                │
       ▼                                ▼
┌─────────────┐                  ┌─────────────┐
│  OpenClaw   │ ◄─────────────── │   Mensch    │
│ (Handwerker)│   kopiert Code   │   (Chat)    │
└──────┬──────┘                  └─────────────┘
       │
       │ git push
       ▼
┌─────────────┐
│   GitHub    │
│    (dev)    │
└──────┬──────┘
       │
       │ merge to main
       ▼
┌─────────────┐
│   Vercel    │
│  (Deploy)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  🌐 Live!   │
└─────────────┘
```

---

## 🏗️ Architektur

### System-Übersicht

```
┌─────────────────────────────────────────────────────────────┐
│                     USER (Browser/Handy)                     │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL (Frontend + API)                   │
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐           │
│  │   React Frontend    │  │  Edge Function      │           │
│  │   (Static Files)    │  │  /api/recognize     │           │
│  │                     │  │  (Proxy für NVIDIA) │           │
│  └─────────────────────┘  └──────────┬──────────┘           │
└─────────────────────────────────────┬───────────────────────┘
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
┌─────────────────────────────┐  ┌─────────────────────────────┐
│    NVIDIA NIM API           │  │      Cardmarket.com         │
│    (Kimi K2.5 Vision)       │  │      (Preise - Link)        │
│                             │  │                             │
│  Bild → Karteninfos         │  │  Wird im neuen Tab geöffnet │
└─────────────────────────────┘  └─────────────────────────────┘
```

### Warum diese Architektur?

| Entscheidung | Problem | Lösung |
|-------------|---------|--------|
| **Edge Function** | CORS blockiert Browser→NVIDIA | Server-Side Proxy |
| **Kimi K2.5 Vision** | OCR versagt bei Holo-Karten | KI "sieht" das ganze Bild |
| **Cardmarket Link** | Keine offizielle API | Direkte Verlinkung zur Suche |
| **Vercel** | Einfaches Deployment | Auto-Deploy bei Git Push |
| **TypeScript** | Fehleranfällig | Typsicherheit |

---

## 🔄 Wie funktioniert die Kartenerkennung?

```
📸 User lädt Foto hoch
     │
     ▼
┌─────────────────────────────────────────┐
│  Frontend (React)                       │
│  - Konvertiert Bild zu Base64           │
│  - Sendet an /api/recognize             │
└────────────────┬────────────────────────┘
                 │ POST
                 ▼
┌─────────────────────────────────────────┐
│  Vercel Edge Function                   │
│  - Empfängt Base64-Bild                 │
│  - Leitet an NVIDIA API weiter          │
│  - Gibt Antwort zurück                  │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  NVIDIA NIM (Kimi K2.5 Vision)          │
│                                         │
│  Prompt: "Analysiere diese Pokémon-     │
│  Karte und gib mir: cardName, set,      │
│  number, rarity, language als JSON"     │
│                                         │
│  Antwort: {                             │
│    "cardName": "Xerneas",               │
│    "set": "Celebrations",               │
│    "number": "012/025",                 │
│    "rarity": "Holo Rare",               │
│    "language": "English"                │
│  }                                      │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Frontend zeigt Ergebnis                │
│  + Link zu Cardmarket                   │
│                                         │
│  "Auf Cardmarket ansehen" →             │
│  cardmarket.com/Pokemon/Search?...      │
└─────────────────────────────────────────┘
```

---

## 📁 Projektstruktur

```
poke-scan-v2/
├── 📁 api/                     # Vercel Serverless Functions
│   └── recognize.ts              # NVIDIA API Proxy (CORS-Lösung)
│
├── 📁 src/
│   ├── 📁 components/          # React UI-Komponenten
│   │   └── CardScanner.tsx       # Hauptkomponente mit Upload + Ergebnis
│   │
│   ├── 📁 services/            # API-Integrationen
│   │   ├── kimiVision.ts         # Ruft /api/recognize auf
│   │   ├── cardmarketPrice.ts    # Generiert Cardmarket-URL
│   │   └── pokemonTCG.ts         # Pokémon TCG API Client
│   │
│   ├── App.tsx                 # Haupt-App mit Layout
│   └── main.tsx                # Entry Point
│
├── 📁 docs/                    # Dokumentation
│   ├── PROJEKT-ANWEISUNGEN.md    # Regeln für KI-Agenten
│   └── AGENT-RICHTLINIEN.md      # Git-Workflow Regeln
│
├── 📄 package.json             # Dependencies
├── 📄 tsconfig.json            # TypeScript Config
├── 📄 vite.config.ts           # Vite Config
├── 📄 tailwind.config.ts       # Tailwind Config
└── 📄 vercel.json              # Vercel Config (optional)
```

---

## 🚀 Installation & Setup

### Voraussetzungen

- Node.js 18+ (empfohlen: 20 LTS)
- npm
- Git
- NVIDIA NIM API Key (kostenlos auf build.nvidia.com)

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
# Dann .env.local editieren und API-Keys eintragen

# 5. Entwicklungsserver starten
npm run dev
```

Dann öffne `http://localhost:5173` im Browser. 🎉

### Vercel Deployment

1. Repo mit Vercel verbinden (vercel.com → Import Project)
2. Environment Variables hinzufügen:
   - `NVIDIA_API_KEY` = dein NVIDIA NIM Key
3. Deploy!

---

## ⚙️ Konfiguration

### Environment Variables

**Für lokale Entwicklung** (`.env.local`):
```env
VITE_NVIDIA_API_KEY=nvapi-xxx
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

**Für Vercel** (Settings → Environment Variables):
```env
NVIDIA_API_KEY=nvapi-xxx
```

> ⚠️ **Wichtig:** Vercel Server Functions brauchen Keys **ohne** `VITE_` Prefix!

### API-Keys bekommen

| Service | URL | Kosten |
|---------|-----|--------|
| **NVIDIA NIM** | [build.nvidia.com](https://build.nvidia.com) | Kostenlos |
| **Supabase** | [supabase.com](https://supabase.com) | Kostenlos |
| **Pokémon TCG** | [pokemontcg.io](https://pokemontcg.io) | Kostenlos |

---

## 🗺️ Roadmap

### ✅ Erledigt

- [x] 🏗️ Grundgerüst mit React + TypeScript + Vite
- [x] 🎨 UI mit Tailwind + shadcn/ui
- [x] 🗄️ Supabase Datenbank Setup
- [x] 🤖 Kimi K2.5 Vision API Integration
- [x] 🔎 Pokémon TCG API Anbindung
- [x] 💰 Cardmarket-Verlinkung
- [x] 🦞 OpenClaw Agent auf VPS (Telegram: @herbekantebot)
- [x] 📸 CardScanner UI-Komponente
- [x] 🚀 Vercel Deployment mit Edge Functions
- [x] 🔄 GitHub → Vercel CI/CD Pipeline
- [x] ♿ Barrierefreiheit (ARIA Labels)
- [x] 📝 Professionelle README

### 🚧 In Arbeit

- [ ] 🔧 API-Fehlerbehandlung verbessern
- [ ] 🧪 End-to-End Tests

### 📋 Geplant

- [ ] 🔐 Google Login via Supabase Auth
- [ ] 🪙 Kartensammlung speichern
- [ ] 📊 Preis-Verlauf Graphen
- [ ] 📱 PWA Support
- [ ] 🔗 n8n Workflow Integration
- [ ] 🐳 Docker Setup

---

## 💰 Betriebskosten

| Service | Kosten/Monat | Notwendig? |
|---------|--------------|------------|
| 🧠 Claude Pro | 18€ | Ja (Architekt) |
| 🖥️ Hostinger VPS | ~9€ | Ja (24/7 Bot) |
| 🤖 NVIDIA NIM API | 0€ | Kostenlos |
| 🃏 Pokémon TCG API | 0€ | Kostenlos |
| 🗄️ Supabase | 0€ | Free Tier |
| 🚀 Vercel | 0€ | Free Tier |
| 🔄 GitHub | 0€ | Free Tier |
| **Gesamt** | **~27€/Monat** | |

> 💡 Das entspricht etwa Netflix + Spotify – für einen vollautomatisierten KI-Entwicklungs-Workflow!

---

## ♿ Barrierefreiheit

Dieses Projekt legt besonderen Wert auf Barrierefreiheit:

| Feature | Umsetzung |
|---------|-----------|
| **Screen Reader** | ARIA Labels auf allen interaktiven Elementen |
| **Tastatur-Navigation** | Alle Funktionen per Tab erreichbar |
| **Kontraste** | WCAG AA konform |
| **Loading States** | Klare Rückmeldung während Ladezeiten |
| **Fehlermeldungen** | Verständlich, nicht technisch |
| **Einfache Sprache** | Keine unnötigen Fachbegriffe in der UI |

### Warum?

Der Entwickler dieses Projekts lebt selbst mit ADHS und anderen Herausforderungen. Die App soll für **alle** Menschen nutzbar sein – unabhängig von Einschränkungen.

---

## 🤝 Contributing

Contributions sind willkommen! Bitte beachte:

### Branch-Strategie

```
main (geschützt) ← nur über Pull Request
  └── dev        ← hier wird entwickelt
```

### Workflow

1. Fork das Repository
2. Erstelle einen Branch von `dev`
3. Mache deine Änderungen
4. Erstelle einen Pull Request nach `dev`
5. Nach Review: Merge in `dev`
6. Regelmäßig: `dev` → `main` (Production)

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

---

<p align="center">
  <b>Gebaut mit 💛 und einer Menge KI</b><br/>
  <sub>Von einem Menschen mit Ideen und einem Team aus KI-Agenten</sub><br/><br/>
  <img src="https://img.shields.io/badge/Made_with-Claude_+_OpenClaw_+_Kimi-FF6B6B?style=for-the-badge" />
</p>

---

## 🔗 Links

| Was | URL |
|-----|-----|
| 🌐 **Live App** | [poke-scan-v2.vercel.app](https://poke-scan-v2.vercel.app) |
| 📦 **GitHub** | [github.com/celtechstarter/poke-scan-v2](https://github.com/celtechstarter/poke-scan-v2) |
| 🦞 **Telegram Bot** | [@herbekantebot](https://t.me/herbekantebot) |
| 🧠 **NVIDIA NIM** | [build.nvidia.com](https://build.nvidia.com) |
| 🃏 **Pokémon TCG API** | [pokemontcg.io](https://pokemontcg.io) |
| 💰 **Cardmarket** | [cardmarket.com](https://www.cardmarket.com/en/Pokemon) |
