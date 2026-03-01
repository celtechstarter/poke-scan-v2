# 🃏 Poke-Scan V2

### Pokémon-Karte fotografieren → Preis erfahren. So einfach.

<p align="center">
  <img src="https://img.shields.io/badge/Status-Beta_🚀-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/KI--Vision-NVIDIA_NIM-76B900?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Kosten-~27€%2FMonat-blue?style=for-the-badge" />
</p>

<p align="center">
  <a href="https://poke-scan-v2.vercel.app">🔗 Live Demo</a>
</p>

---

## 🤔 Was ist das?

Du findest eine alte Pokémon-Karte auf dem Dachboden oder auf dem Flohmarkt und fragst dich:

> **"Ist die was wert?"**

**Poke-Scan** gibt dir die Antwort in Sekunden:

```
📸 Foto machen → 🧠 KI erkennt die Karte → 💰 Preis wird angezeigt
```

Kein Googlen. Kein Rätseln. Einfach scannen.

---

## 🎮 Wie benutze ich das?

| Weg | Wie | Für wen |
|-----|-----|---------|
| 🌐 **Browser** | [poke-scan-v2.vercel.app](https://poke-scan-v2.vercel.app) öffnen → Foto hochladen | Alle |
| 📱 **Handy** | Webseite öffnen → "Zum Startbildschirm" → App nutzen | Unterwegs |
| 📷 **Kamera** | Direkt Foto aufnehmen oder aus Galerie wählen | Flohmarkt |

---

## ✨ Features

| Feature | Status |
|---------|--------|
| 🤖 KI-Vision Kartenerkennung | ✅ Läuft |
| 💰 Preise (TCGdex + Pokemon TCG API + Cardmarket) | ✅ Läuft |
| 🏷️ Set-Code Erkennung (moderne Karten) | ✅ Gut |
| 🎴 Vintage-Karten (Base Set, Jungle, Fossil...) | ✅ Basis |
| ⭐ Promo-Karten (SVP) | ✅ Gefixt |
| 🔍 Multi-Zonen-Scan | ✅ Aktiv |
| ✨ Visual Type (Holo, Full Art, Rainbow...) | ✅ Aktiv |
| 📱 PWA / Mobile installierbar | ✅ Ja |
| 📊 Scan-History (Supabase) | ⚠️ In Arbeit |

---

## 🔍 Wie funktioniert die Erkennung?

Wir nutzen **KI-Vision** statt klassischem OCR:

```
📸 Foto der Karte
     │
     ▼
🤖 NVIDIA NIM API (Llama 3.2 Vision)
   ├─ Zone A: Set-Code + Kartennummer (unten)
   ├─ Zone B: Copyright-Jahr (für Vintage)
   └─ Zone C: Kartentyp (Holo, Full Art, etc.)
     │
     ▼
🔎 Preisabfrage
   ├─ TCGdex (EUR, Prio 1)
   ├─ Pokemon TCG API (USD → EUR)
   └─ Cardmarket Link (Fallback)
     │
     ▼
📱 Ergebnis mit Preis!
```

Die KI **sieht** die Karte wie ein Mensch – nicht nur Text, sondern das ganze Bild.

---

## 🛠️ Tech-Stack

| Bereich | Technologie |
|---------|-------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **UI** | shadcn/ui, Framer Motion |
| **Backend** | Vercel Serverless Functions |
| **KI-Vision** | NVIDIA NIM API (Llama 3.2 90B Vision) |
| **Preise** | TCGdex API, Pokemon TCG API, Cardmarket |
| **Datenbank** | Supabase (PostgreSQL) |
| **Deployment** | Vercel (Auto-Deploy) |

---

## 📁 Projektstruktur

```
poke-scan-v2/
├── api/                    # Vercel Serverless Functions
│   ├── recognize.ts        # KI-Vision Kartenerkennung
│   ├── pokemon-price.ts    # Preisabfrage
│   └── cardmarket-price.ts # Cardmarket Integration
├── src/
│   ├── components/         # React Komponenten
│   │   └── CardScanner.tsx # Hauptkomponente
│   ├── hooks/              # Custom Hooks
│   ├── lib/                # Utils & API Clients
│   └── pages/              # Seiten
├── public/                 # Statische Assets
└── supabase/               # DB Migrationen
```

---

## 🚀 Lokal starten

```bash
# Repo klonen
git clone https://github.com/celtechstarter/poke-scan-v2.git
cd poke-scan-v2

# Dependencies installieren
npm install

# Environment Variables (.env.local)
cp .env.example .env.local
# NVIDIA API Key eintragen!

# Starten
npm run dev
```

Öffne `http://localhost:5173` 🎉

---

## 🔑 Environment Variables

```env
NVIDIA_API_KEY=nvapi-xxx          # NVIDIA NIM API
POKEMON_TCG_API_KEY=xxx           # Optional
VITE_SUPABASE_URL=xxx             # Supabase
VITE_SUPABASE_ANON_KEY=xxx        # Supabase
```

---

## 📈 Entwicklungs-Timeline

| Phase | Datum | Was passiert ist |
|-------|-------|------------------|
| 1 | 03/2025 | Projekt-Start mit Lovable |
| 2 | 04/2025 | OCR-Experimente (Tesseract, EasyOCR) → verworfen |
| 3 | 20.02.2026 | KI-Vision Revolution (Kimi API) |
| 4 | 21.02.2026 | NVIDIA NIM API + Fallback Chain |
| 5 | 22.02.2026 | Mobile/PWA + Kamera-Integration |
| 6 | 23.02.2026 | Preissystem (TCG API, Cardmarket) |
| 7 | 24.02.2026 | Präzisions-Optimierung, Multi-Zonen-Scan |

---

## 🤖 Das Team

Dieses Projekt wird von einem **Mensch + KI Team** gebaut:

| Wer | Rolle |
|-----|-------|
| 👨‍💻 **Marcel** | Chef, Ideen, Koordination |
| 🧠 **Claude** | Architekt, Plant & schreibt Code |
| 💻 **Claude Code** | Implementierung, Debugging |
| 🎨 **v0.dev** | UI Komponenten |
| 🚀 **Vercel** | Auto-Deployment |

---

## 💰 Betriebskosten

| Service | Kosten |
|---------|--------|
| Claude Pro | 18€/Monat |
| VPS (Hostinger) | ~9€/Monat |
| NVIDIA NIM API | 0€ (Free Tier) |
| Vercel | 0€ (Free Tier) |
| Supabase | 0€ (Free Tier) |
| **Gesamt** | **~27€/Monat** |

---

## 📝 Roadmap

- [x] KI-Vision Kartenerkennung
- [x] Preisabfrage (Multi-Source)
- [x] PWA / Mobile Support
- [x] Vintage-Karten Erkennung
- [x] Multi-Zonen-Scan
- [ ] Scan-History im Frontend
- [ ] Sammlungs-Verwaltung
- [ ] Preis-Benachrichtigungen
- [ ] Telegram Bot

---

## 📄 Lizenz

MIT – Mach damit was du willst. ✌️

---

<p align="center">
  <b>Gebaut mit 💛 und KI</b><br/>
  <sub>Von einem Menschen mit Ideen und KI-Tools mit Skills</sub>
</p>
