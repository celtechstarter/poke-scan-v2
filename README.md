# 🎮 POKE-SCAN V2

### AI-POWERED CARD RECOGNITION • EST. 2026

<p align="center">
  <img src="https://img.shields.io/badge/Status-Live_🚀-brightgreen?style=for-the-badge" />
  <img src="https://img.shields.io/badge/AI_Agents-4_Online-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Design-2050_Futuristic-purple?style=for-the-badge" />
</p>

<p align="center">
  <a href="https://poke-scan-v2.vercel.app">🌐 Live Demo</a> •
  <a href="#-how-it-works">🔍 How it Works</a> •
  <a href="#-tech-stack">⚡ Tech Stack</a> •
  <a href="#-the-team">👥 The Team</a>
</p>

---

## 🎯 Live Demo

**👉 [poke-scan-v2.vercel.app](https://poke-scan-v2.vercel.app)**

Upload a photo of your Pokémon card → Get the market price in seconds!

---

## 🤔 What is this?

You find an old Pokémon card in the attic or at a flea market and wonder:

> **"Is this worth anything?"**

**Poke-Scan** gives you the answer in seconds:

```
📸 Take Photo → 🦙 AI Recognizes Card → 💰 Price Displayed
```

No Googling. No guessing. Just scan.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🦙 **AI Card Recognition** | Llama 3.2 Vision identifies cards from photos |
| 🔄 **3-Model Fallback** | Always works - even when APIs are overloaded |
| 💰 **Cardmarket Link** | Direct link to current market prices |
| 📱 **Mobile-First** | Works on any device |
| ♿ **Accessible** | WCAG AA compliant |
| 🎮 **2050 Design** | Futuristic Pokemon + AI + Cyberpunk aesthetic |

---

## 🔍 How it Works

We don't use OCR — it fails on holographic cards. Instead: **AI Vision with Fallback Chain**

```
📸 Card Photo
     │
     ▼
┌─────────────────────────────────────────────┐
│  🦙 NVIDIA NIM Vision API                   │
│                                             │
│  Fallback Chain:                            │
│  1. meta/llama-3.2-90b-vision-instruct     │
│  2. meta/llama-3.2-11b-vision-instruct     │
│  3. microsoft/phi-3.5-vision-instruct      │
│                                             │
│  → Extracts: Name, Set, Number, Rarity     │
└─────────────────────────────────────────────┘
     │
     ▼
📊 Cardmarket Link Generated
     │
     ▼
📱 Result on Screen!
```

**Smart Prompt Engineering:** The AI is specifically instructed to read the card number from the **bottom left** (e.g., "012/172") — not the Pokédex number in the top right.

---

## ⚡ Tech Stack

### System Architecture

```
╔══════════════════════════════════════╗
║  ⚡ SYSTEM.POKEDEX                   ║
╠══════════════════════════════════════╣
║  FRONTEND                            ║
║  ├─ React 18 + TypeScript            ║
║  ├─ Vite + Tailwind CSS              ║
║  └─ Vercel Edge Functions            ║
║                                      ║
║  AI CORE                             ║
║  ├─ Llama 3.2 Vision (90B)           ║
║  ├─ NVIDIA NIM API (FREE!)           ║
║  └─ 3-Model Fallback Chain           ║
║                                      ║
║  INFRASTRUCTURE                      ║
║  ├─ ▲ Vercel (Frontend + Edge)       ║
║  ├─ 🟦 Hostinger VPS (AI Agents)     ║
║  └─ 🐙 GitHub (Source Code)          ║
╚══════════════════════════════════════╝
```

### Architecture Flow

```
┌─────────────────────────────────────────────────────┐
│                    BROWSER                          │
│  React + TypeScript + Tailwind                      │
└────────────────────┬────────────────────────────────┘
                     │ POST /api/recognize
                     ▼
┌─────────────────────────────────────────────────────┐
│              VERCEL EDGE FUNCTION                   │
│              /api/recognize.ts                      │
│  • Validates request                                │
│  • Tries 3 models in sequence                       │
│  • Returns JSON result                              │
└────────────────────┬────────────────────────────────┘
                     │ Authorization: Bearer $KEY
                     ▼
┌─────────────────────────────────────────────────────┐
│              NVIDIA NIM API                         │
│  Models (Fallback Order):                           │
│  1. llama-3.2-90b-vision-instruct                  │
│  2. llama-3.2-11b-vision-instruct                  │
│  3. phi-3.5-vision-instruct                        │
└─────────────────────────────────────────────────────┘
```

---

## 🎨 Design: Pokemon × AI × 2050

The UI was designed to visualize the fusion of:
- **Pokemon Universe** — Pokeballs, energy particles, Pokedex-style displays
- **AI/Neural Networks** — Data streams, connection lines, status indicators
- **Year 2050 Aesthetics** — Cyberpunk, holographic effects, dark theme

### Design Features
- 🔮 **Holographic Pokeball** — Pulses with energy
- ⚡ **Neural Network Background** — Animated nodes and connections
- ✨ **Energy Particles** — Floating Pokemon stardust
- 🖥️ **Pokedex-Style UI** — Card results displayed like Pokedex entries
- 🟢 **AI Status Bar** — Shows all 4 agents are LIVE

### Accessibility (WCAG AA)
- ⌨️ Keyboard navigation
- 🔗 Skip-to-content link
- 👁️ Visible focus states
- 🏷️ ARIA labels everywhere
- 🎬 Respects `prefers-reduced-motion`

---

## 👥 The Team

This project was built by **one human coordinating multiple AI agents**:

```
┌─ POKEMON TRAINER ─────────────────────────────────┐
│                                                   │
│              👨‍💻 MARCEL WELK                       │
│              Lead Trainer & Project Architect     │
│                                                   │
└───────────────────────────────────────────────────┘

┌─ AI PARTNER POKEMON (AGENTS) ─────────────────────┐
│                                                   │
│  🧠 Claude        │  Architect - Planning & Code  │
│  🦞 OpenClaw      │  Builder - Implementation     │
│  🦙 Llama Vision  │  Eyes - Card Recognition      │
│  🎨 v0.dev        │  Designer - UI Generation     │
│                                                   │
└───────────────────────────────────────────────────┘

┌─ POWERED BY ──────────────────────────────────────┐
│                                                   │
│  ⚡ NVIDIA NIM    │  Free Vision API              │
│  ▲ Vercel        │  Frontend + Edge Functions    │
│  🟦 Hostinger    │  VPS for AI Agents            │
│  📊 Cardmarket   │  Price Data                   │
│  🐙 GitHub       │  Version Control              │
│                                                   │
└───────────────────────────────────────────────────┘
```

---

## 🚀 Run Locally

### Prerequisites
- Node.js 18+
- NVIDIA NIM API Key (free at [build.nvidia.com](https://build.nvidia.com))

### Installation

```bash
# Clone
git clone https://github.com/celtechstarter/poke-scan-v2.git
cd poke-scan-v2

# Install
npm install

# Configure
cp .env.example .env.local
# Add your NVIDIA_API_KEY to .env.local

# Run
npm run dev
```

Open `http://localhost:5173` 🎉

### Environment Variables

```env
# Local Development (.env.local)
VITE_NVIDIA_API_KEY=nvapi-xxx

# Vercel Production (Project Settings)
NVIDIA_API_KEY=nvapi-xxx
```

**Important:** Edge Functions need `NVIDIA_API_KEY` (without `VITE_` prefix)!

---

## 📁 Project Structure

```
poke-scan-v2/
├── api/
│   └── recognize.ts           # Edge Function (3-Model Fallback)
├── src/
│   ├── components/
│   │   └── poke-scan/
│   │       ├── ai-status-bar.tsx
│   │       ├── card-scanner.tsx      # Main Scanner (Real API!)
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
│   ├── services/
│   │   └── kimiVision.ts
│   ├── App.tsx
│   └── index.css
└── package.json
```

---

## 📋 Roadmap

- [x] 🏗️ React + TypeScript + Vite foundation
- [x] 🦙 Llama Vision Integration
- [x] 🔄 3-Model Fallback Chain
- [x] 📊 Cardmarket Link
- [x] 🎮 Futuristic 2050 Design
- [x] ♿ WCAG AA Accessibility
- [x] 🟢 AI Status Bar (4 Agents LIVE)
- [ ] 📱 PWA Support
- [ ] 🦞 Telegram Bot
- [ ] 💰 Direct Price Scraping
- [ ] 📈 Price History Charts
- [ ] 🗃️ Collection Management

---

## 💰 Running Costs

| Service | Cost |
|---------|------|
| NVIDIA NIM API | €0 (free!) |
| Vercel Hosting | €0 (free tier) |
| Hostinger VPS | ~€9/month |
| **Total** | **~€9/month** |

Development: Claude Pro €18/month (for architecture & planning)

---

## 🔒 Security

- ✅ API keys server-side only (Edge Functions)
- ✅ No secrets in client code
- ✅ HTTPS everywhere
- ✅ Input validation

---

## 📄 License

MIT — Do whatever you want. ✌️

---

<p align="center">
  <b>● ALL SYSTEMS OPERATIONAL</b><br/>
  <sub>HOSTED ON HOSTINGER • DEPLOYED ON VERCEL</sub>
</p>

<p align="center">
  <b>Created by Marcel Welk</b><br/>
  <sub>With 🧠 Claude • 🦞 OpenClaw • 🦙 Llama Vision • 🎨 v0.dev</sub>
</p>

<p align="center">
  <b>© 2026 POKE-SCAN • GOTTA SCAN 'EM ALL • HUMANS + AI = FUTURE</b>
</p>

<p align="center">
  <a href="https://github.com/celtechstarter/poke-scan-v2">
    <img src="https://img.shields.io/github/stars/celtechstarter/poke-scan-v2?style=social" alt="GitHub Stars" />
  </a>
</p>
