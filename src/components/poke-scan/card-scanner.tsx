import { useState, useCallback, useRef } from "react";
import { Upload, Camera } from "lucide-react";
import { PokedexCard } from "./pokedex-card";
import { ScannerFrame } from "./scanner-frame";
import { EvolutionLoader } from "./evolution-loader";
import { RarityStars } from "./rarity-stars";
import { supabase } from "@/integrations/supabase/client";
import { PTCGO_CODES } from "@/lib/set-codes";

type ScanState = "idle" | "scanning" | "result" | "error";

interface CardResult {
  cardName: string;
  nameEn?: string;
  set: string;
  setCode?: string;
  number: string;
  rarity: string;
  language: string;
  visual_type?: string;
}

type Prices = {
  min: number | null;
  trend: number | null;
  url: string | null;
  found: boolean;
  verifiedSet?: string;
  verifiedName?: string;
  tcgdexSet?: string | null;
  localId?: string | null;
  image?: string | null;
};

function getSessionId(): string {
  const key = "poke_scan_session_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function getRarityInfo(rarity: string): { stars: number; label: string } {
  const lower = (rarity ?? "").toLowerCase();
  if (lower.includes("ultra") || lower.includes("secret")) return { stars: 5, label: "ULTRA RARE" };
  if (lower.includes("holo")) return { stars: 4, label: "HOLO RARE" };
  if (lower.includes("rare")) return { stars: 3, label: "RARE" };
  if (lower.includes("uncommon")) return { stars: 2, label: "UNCOMMON" };
  return { stars: 1, label: "COMMON" };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Bild konnte nicht geladen werden"));
    img.src = src;
  });
}

// Das NVIDIA-Fallback akzeptiert Inline-Bilder nur bis ~180 KB (Base64).
// Iterativ verkleinern, bis das Limit sicher unterschritten ist.
async function compressImage(base64: string): Promise<string> {
  const img = await loadImage(base64);
  const MAX_CHARS = 170_000;
  const widths = [1000, 800, 640, 512];
  const qualities = [0.8, 0.65, 0.5];
  let result = "";
  for (const w of widths) {
    for (const q of qualities) {
      const canvas = document.createElement("canvas");
      const ratio = Math.min(1, w / img.width, w / img.height);
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      result = canvas.toDataURL("image/jpeg", q);
      if (result.length <= MAX_CHARS) return result;
    }
  }
  return result;
}

function getCardmarketUrl(cardName: string, _set: string, number?: string): string {
  const num = number?.split('/')[0]?.replace(/^0+/, '') || '';
  const query = num ? `${cardName} ${num}` : cardName;
  return "https://www.cardmarket.com/de/Pokemon/Products/Search?searchString=" +
    encodeURIComponent(query);
}

export function CardScanner() {
  const [state, setState] = useState<ScanState>("idle");
  const [isDragOver, setIsDragOver] = useState(false);
  const [result, setResult] = useState<CardResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prices, setPrices] = useState<Prices | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanIdRef = useRef(0);

  // Korrektur-State
  const [showCorrection, setShowCorrection] = useState(false);
  const [corrSetCode, setCorrSetCode] = useState("");
  const [corrNumber, setCorrNumber] = useState("");
  const [correcting, setCorrecting] = useState(false);

  // Sammlung-State
  const [collectionCount, setCollectionCount] = useState<number | null>(null);
  const [addingToCollection, setAddingToCollection] = useState(false);

  const scanCard = useCallback(async (base64Image: string) => {
    const scanId = ++scanIdRef.current;
    setState("scanning");
    setError(null);
    setPrices(null);
    setCollectionCount(null);
    setShowCorrection(false);
    try {
      const compressed = await compressImage(base64Image);
      const response = await fetch("/api/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: compressed }),
      });
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        const msg = (errBody as Record<string, unknown>)?.error ?? `HTTP ${response.status}`;
        console.error("[scanner] /api/recognize Fehler:", msg);
        throw new Error(String(msg));
      }
      const data = await response.json() as Record<string, unknown>;
      const cardResult = data.card as CardResult | undefined;
      if (!cardResult?.cardName) {
        throw new Error("Karte nicht erkannt. Bitte erneut versuchen.");
      }
      if (scanIdRef.current !== scanId) return;

      setResult(cardResult);
      setState("result");

      const searchName = cardResult.nameEn || cardResult.cardName;
      const pricesRes = await fetch("/api/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: searchName,
          number: cardResult.number,
          setCode: cardResult.setCode,
          set: cardResult.set,
        }),
      });
      const cardPrices: Prices = pricesRes.ok
        ? await pricesRes.json() as Prices
        : { min: null, trend: null, url: null, found: false };
      if (scanIdRef.current !== scanId) return;
      setPrices(cardPrices);

      const cardmarketUrl = cardPrices.url ?? getCardmarketUrl(cardResult.cardName, cardResult.set, cardResult.number);
      const { error: dbError } = await supabase.from("scan_history").insert({
        session_id: getSessionId(),
        card_name: cardResult.cardName,
        set_name: cardPrices.verifiedSet ?? cardResult.set,
        card_number: cardResult.number,
        rarity: cardResult.rarity,
        language: cardResult.language,
        tcg_price_usd: cardPrices.trend,
        cardmarket_url: cardmarketUrl,
      });
      if (dbError) console.error("[scanner] History-Insert fehlgeschlagen:", dbError.message);
    } catch (err) {
      if (scanIdRef.current !== scanId) return;
      setError(err instanceof Error ? err.message : "Fehler");
      setState("error");
    }
  }, []);

  const addToCollection = useCallback(async () => {
    if (!result || !prices?.tcgdexSet || !prices?.localId) return;
    setAddingToCollection(true);
    try {
      const variant = result.visual_type ?? "normal";
      const sessionId = getSessionId();
      const { data: existing } = await supabase
        .from("collection")
        .select("id, quantity")
        .eq("session_id", sessionId)
        .eq("tcgdex_set", prices.tcgdexSet)
        .eq("local_id", prices.localId)
        .eq("variant", variant)
        .maybeSingle();

      if (existing) {
        const { error: dbError } = await supabase
          .from("collection")
          .update({ quantity: existing.quantity + 1 })
          .eq("id", existing.id);
        if (dbError) console.error("[scanner] Collection update fehlgeschlagen:", dbError.message);
        else setCollectionCount(existing.quantity + 1);
      } else {
        const { error: dbError } = await supabase
          .from("collection")
          .insert({
            session_id: sessionId,
            tcgdex_set: prices.tcgdexSet,
            local_id: prices.localId,
            card_name: prices.verifiedName ?? result.cardName,
            set_name: prices.verifiedSet ?? result.set,
            number: result.number,
            variant,
            image_url: prices.image ?? null,
          });
        if (dbError) console.error("[scanner] Collection insert fehlgeschlagen:", dbError.message);
        else setCollectionCount(1);
      }
    } finally {
      setAddingToCollection(false);
    }
  }, [result, prices]);

  const applyCorrection = useCallback(async () => {
    if (!corrSetCode || !corrNumber || !result) return;
    setCorrecting(true);
    setPrices(null);
    setCollectionCount(null);
    setResult(prev => prev ? { ...prev, setCode: corrSetCode, number: corrNumber } : prev);
    try {
      const pricesRes = await fetch("/api/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: result.nameEn || result.cardName,
          number: corrNumber,
          setCode: corrSetCode,
        }),
      });
      const cardPrices: Prices = pricesRes.ok
        ? await pricesRes.json() as Prices
        : { min: null, trend: null, url: null, found: false };
      setPrices(cardPrices);
      setShowCorrection(false);
    } finally {
      setCorrecting(false);
    }
  }, [corrSetCode, corrNumber, result]);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setPreview(base64);
      scanCard(base64);
    };
    reader.readAsDataURL(file);
  }, [scanCard]);

  const handleReset = useCallback(() => {
    scanIdRef.current++;
    setState("idle");
    setResult(null);
    setPreview(null);
    setError(null);
    setPrices(null);
    setShowCorrection(false);
    setCorrSetCode("");
    setCorrNumber("");
    setCollectionCount(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const rarityInfo = result ? getRarityInfo(result.rarity) : { stars: 1, label: "COMMON" };

  const handleDemoCard = useCallback(async (src: string) => {
    const res = await fetch(src);
    const blob = await res.blob();
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setPreview(base64);
      scanCard(base64);
    };
    reader.readAsDataURL(blob);
  }, [scanCard]);

  return (
    <section id="main-scanner" aria-label="Pokemon Card Scanner">
      <PokedexCard className="mx-auto w-full max-w-xl" glowColor="rgba(239, 68, 68, 0.1)">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-sm font-bold tracking-wider text-poke-red">CARD SCANNER</h2>
            {state === "error" && (
              <button
                onClick={handleReset}
                className="rounded-md border border-white/10 bg-white/5 px-3 py-1 font-mono text-[10px] tracking-wider text-white/60 hover:border-poke-yellow/30 hover:text-poke-yellow"
              >
                SCAN AGAIN
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />

          {state === "idle" && (
            <ScannerFrame>
              <div
                className={"flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed transition-colors " + (isDragOver ? "border-poke-yellow bg-poke-yellow/5" : "border-white/10 hover:border-poke-cyan/30")}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleFile(file); }}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5">
                  {isDragOver ? <Upload className="h-6 w-6 text-poke-yellow" /> : <Camera className="h-6 w-6 text-poke-cyan" />}
                </div>
                <div className="text-center">
                  <p className="font-mono text-xs font-medium text-white">SCAN YOUR CARD</p>
                  <p className="font-mono text-[10px] text-white/50">Tap to open camera or drop image</p>
                </div>
              </div>
            </ScannerFrame>
          )}

          {state === "scanning" && (
            <ScannerFrame scanning>
              <div className="flex min-h-[220px] flex-col items-center justify-center gap-4">
                {preview && <img src={preview} alt="Preview" className="max-h-32 rounded-lg opacity-50" />}
                <EvolutionLoader />
              </div>
            </ScannerFrame>
          )}

          {state === "error" && (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-lg border border-poke-red/30 bg-poke-red/5 p-6">
              <span className="text-4xl">❌</span>
              <p className="text-center font-mono text-sm text-poke-red">{error}</p>
            </div>
          )}

          {state === "result" && result && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-poke-green" style={{ boxShadow: "0 0 8px rgba(34, 197, 94, 0.5)" }} />
                <span className="font-mono text-xs font-bold tracking-wider text-poke-green">CARD IDENTIFIED</span>
              </div>

              {/* Kartenbild: offizielles TCGdex-Bild wenn verfügbar, sonst Nutzer-Foto */}
              {prices?.image ? (
                <div className="flex items-start justify-center gap-3">
                  <img
                    src={`${prices.image}/low.webp`}
                    alt={result.cardName}
                    className="max-h-48 rounded-lg shadow-lg shadow-poke-cyan/20"
                  />
                  {preview && (
                    <img
                      src={preview}
                      alt="Dein Foto"
                      className="h-16 w-auto rounded opacity-40 self-start mt-1"
                    />
                  )}
                </div>
              ) : (
                preview && (
                  <img
                    src={preview}
                    alt={result.cardName}
                    className="mx-auto max-h-48 rounded-lg shadow-lg shadow-poke-cyan/20"
                  />
                )
              )}

              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-lg border border-white/5 bg-white/5 p-4">
                <span className="font-mono text-[10px] tracking-wider text-white/40">NAME</span>
                <span className="font-mono text-xs font-bold text-white">{result.cardName}</span>
                <span className="font-mono text-[10px] tracking-wider text-white/40">SET</span>
                <span className="font-mono text-xs text-white">
                  {prices?.verifiedSet ?? result.set}
                  {prices?.verifiedSet && prices.verifiedSet !== result.set && (
                    <span className="ml-1 text-[9px] text-white/30">(KI: {result.set})</span>
                  )}
                </span>
                <span className="font-mono text-[10px] tracking-wider text-white/40">NUMBER</span>
                <span className="font-mono text-xs text-white">{result.number}</span>
                <span className="font-mono text-[10px] tracking-wider text-white/40">RARITY</span>
                <RarityStars rating={rarityInfo.stars} label={rarityInfo.label} />
                <span className="font-mono text-[10px] tracking-wider text-white/40">LANGUAGE</span>
                <span className="font-mono text-xs text-white">{result.language}</span>
                {result.visual_type && result.visual_type !== "normal" && (
                  <>
                    <span className="font-mono text-[10px] tracking-wider text-white/40">VISUAL</span>
                    <span className="font-mono text-xs text-poke-cyan">
                      {result.visual_type.replace(/_/g, " ").toUpperCase()}
                    </span>
                  </>
                )}
              </div>

              {/* Cardmarket Preise */}
              <div className="rounded-lg border border-poke-yellow/20 bg-poke-yellow/5 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-poke-yellow" />
                  <span className="font-mono text-[10px] font-bold tracking-wider text-poke-yellow">CARDMARKET PREISE (EUR)</span>
                </div>
                {prices === null ? (
                  <p className="font-mono text-[10px] text-white/40 animate-pulse">Preise werden geladen…</p>
                ) : prices.found && (prices.min !== null || prices.trend !== null) ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-[9px] tracking-wider text-white/40">AB (MIN)</span>
                      <span className="font-mono text-sm font-bold text-white">
                        {prices.min !== null ? `€${prices.min.toFixed(2)}` : "–"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-[9px] tracking-wider text-white/40">TREND</span>
                      <span className="font-mono text-sm font-bold text-poke-yellow">
                        {prices.trend !== null ? `€${prices.trend.toFixed(2)}` : "–"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="font-mono text-[10px] text-white/40">
                      Kein Preis in der Datenbank gefunden.
                    </p>
                    <a
                      href={getCardmarketUrl(result.cardName, result.set, result.number)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-md border border-poke-yellow/40 bg-poke-yellow/10 px-3 py-2 font-mono text-[10px] tracking-wider text-poke-yellow hover:bg-poke-yellow/20"
                    >
                      PREIS AUF CARDMARKET PRÜFEN →
                    </a>
                  </div>
                )}
              </div>

              {/* Zur Sammlung / Verwerfen */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleReset}
                  className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 font-mono text-xs tracking-wider text-red-400/70 hover:border-red-500/40 hover:text-red-400"
                >
                  ✖ VERWERFEN
                </button>
                <button
                  onClick={addToCollection}
                  disabled={!prices?.tcgdexSet || !prices?.localId || addingToCollection}
                  className="rounded-lg border border-poke-green/30 bg-poke-green/5 px-4 py-3 font-mono text-xs tracking-wider text-poke-green hover:bg-poke-green/10 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  {collectionCount !== null
                    ? `NOCH EINE (+1) · ${collectionCount}×`
                    : addingToCollection
                      ? "HINZUFÜGEN…"
                      : "➕ ZUR SAMMLUNG"}
                </button>
              </div>

              <a
                href={prices?.url ?? getCardmarketUrl(result.cardName, result.set)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg border border-poke-cyan/30 bg-poke-cyan/5 px-4 py-3 font-mono text-xs tracking-wider text-poke-cyan hover:bg-poke-cyan/10"
              >
                AUF CARDMARKET ANSCHAUEN
              </a>

              {/* Korrektur */}
              {!showCorrection ? (
                <button
                  onClick={() => {
                    setShowCorrection(true);
                    setCorrSetCode(result.setCode ?? "");
                    setCorrNumber(result.number);
                  }}
                  className="text-center font-mono text-[10px] text-white/25 hover:text-white/50"
                >
                  Nicht die richtige Karte?
                </button>
              ) : (
                <div className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="font-mono text-[10px] tracking-wider text-white/40">KARTE KORRIGIEREN</p>
                  <div className="flex gap-2">
                    <select
                      value={corrSetCode}
                      onChange={(e) => setCorrSetCode(e.target.value)}
                      className="flex-1 rounded border border-white/10 bg-black/60 px-2 py-1.5 font-mono text-xs text-white"
                    >
                      <option value="">Set wählen…</option>
                      {PTCGO_CODES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <input
                      value={corrNumber}
                      onChange={(e) => setCorrNumber(e.target.value)}
                      placeholder="z.B. 006"
                      className="w-24 rounded border border-white/10 bg-black/60 px-2 py-1.5 font-mono text-xs text-white placeholder:text-white/20"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={applyCorrection}
                      disabled={!corrSetCode || !corrNumber || correcting}
                      className="flex-1 rounded-md border border-poke-cyan/30 bg-poke-cyan/5 px-4 py-2 font-mono text-xs text-poke-cyan hover:bg-poke-cyan/10 disabled:opacity-40"
                    >
                      {correcting ? "SUCHE…" : "NEU SUCHEN"}
                    </button>
                    <button
                      onClick={() => setShowCorrection(false)}
                      className="rounded-md border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-white/40 hover:text-white/60"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </PokedexCard>

      {/* Demo-Bereich */}
      {state === "idle" && (
        <div className="mx-auto mt-4 w-full max-w-xl rounded-lg border border-white/5 bg-white/5 p-4">
          <p className="mb-3 text-center font-mono text-[11px] tracking-wider text-white/50">
            KEINE KARTE ZUR HAND? TESTE MIT EINER DEMO:
          </p>
          <div className="flex items-center justify-center gap-4">
            {[
              { src: "/demo/pokescan1.png", label: "VENUSAUR EX" },
              { src: "/demo/pokescan2.png", label: "CHARIZARD EX" },
              { src: "/demo/pokescan3.png", label: "BLASTOISE EX" },
            ].map((card) => (
              <button
                key={card.src}
                onClick={() => handleDemoCard(card.src)}
                className="group flex flex-col items-center gap-1.5 rounded-lg border border-white/10 bg-black/30 p-2 transition-all hover:border-poke-cyan/40 hover:bg-poke-cyan/5"
                aria-label={`Demo: ${card.label} scannen`}
              >
                <img
                  src={card.src}
                  alt={card.label}
                  className="h-24 w-auto rounded shadow-md shadow-black/40 transition-transform group-hover:scale-105"
                />
                <span className="font-mono text-[9px] tracking-wider text-white/40 group-hover:text-poke-cyan">
                  {card.label.toUpperCase()}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
