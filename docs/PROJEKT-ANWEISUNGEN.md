# 🃏 Poke-Scan-V2 — Projekt-Anweisungen für den Agent

## 🎯 Projektziel
Eine Web-App die Pokémon-Karten per Foto erkennt und den aktuellen Marktwert anzeigt.

## 🛠️ Tech-Stack
- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **Datenbank:** Supabase (PostgreSQL)
- **Kartenerkennung:** Kimi K2.5 Vision API (NVIDIA NIM)
- **Preisdaten:** Pokémon TCG API

## 📁 Git-Regeln (WICHTIG!)
- **NUR auf `dev` Branch arbeiten!**
- **NIEMALS** direkt auf `main` pushen
- **NIEMALS** Force-Push verwenden
- Commit-Format: `[Typ] Kurze Beschreibung`
  - Typen: [Feature], [Fix], [Refactor], [Style], [Docs], [Config], [Test]

## 🔐 Sicherheit
- **KEINE API-Keys im Code!**
- Alles über Environment Variables
- `.env` Dateien NIEMALS committen

## 📋 Aktuelle Aufgaben
1. EasyOCR durch Kimi K2.5 Vision API ersetzen
2. Pokémon TCG API anbinden
3. Preisanzeige implementieren
