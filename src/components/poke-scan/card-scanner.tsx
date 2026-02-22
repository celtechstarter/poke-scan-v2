import { useState, useCallback, useRef } from "react";
import { Upload, Camera } from "lucide-react";
import { PokedexCard } from "./pokedex-card";
import { ScannerFrame } from "./scanner-frame";
import { EvolutionLoader } from "./evolution-loader";
import { RarityStars } from "./rarity-stars";
import { ConfidenceBar } from "./confidence-bar";

type ScanState = "idle" | "scanning" | "result" | "error";

interface CardResult {
  cardName: string;
  set: string;
  number: string;
  rarity: string;
  language: string;
}

function getRarityInfo(rarity: string): { stars: number; label: string } {
  const lower = rarity.toLowerCase();
  if (lower.includes("ultra") || lower.includes("secret")) return { stars: 5, label: "ULTRA RARE" };
  if (lower.includes("holo")) return { stars: 4, label: "HOLO RARE" };
  if (lower.includes("rare")) return { stars: 3, label: "RARE" };
  if (lower.includes("uncommon")) return { stars: 2, label: "UNCOMMON" };
  return { stars: 1, label: "COMMON" };
}

function compressImage(base64: string, maxWidth: number = 800): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.src = base64;
  });
}

export function CardScanner() {
  const [state, setState] = useState<ScanState>("idle");
  const [isDragOver, setIsDragOver] = useState(false);
  const [result, setResult] = useState<CardResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scanCard = useCallback(async (base64Image: string) => {
    setState("scanning");
    setError(null);
    try {
      const compressed = await compressImage(base64Image, 800);
      const response = await fetch("/api/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: compressed }),
      });
      if (!response.ok) throw new Error("API Fehler");
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("Keine Antwort");
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        setResult(JSON.parse(jsonMatch[0]));
        setState("result");
      } else {
        throw new Error("Nicht erkannt");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
      setState("error");
    }
  }, []);

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
    setState("idle");
    setResult(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const rarityInfo = result ? getRarityInfo(result.rarity) : { stars: 1, label: "COMMON" };

  const getCardmarketUrl = () => {
    if (!result) return "#";
    return "https://www.cardmarket.com/de/Pokemon/Products/Search?searchString=" + encodeURIComponent(result.cardName + " " + result.set);
  };

  return (
    <section id="main-scanner" aria-label="Pokemon Card Scanner">
      <PokedexCard className="mx-auto w-full max-w-xl" glowColor="rgba(239, 68, 68, 0.1)">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-sm font-bold tracking-wider text-poke-red">CARD SCANNER</h2>
            {(state === "result" || state === "error") && (
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

              {preview && <img src={preview} alt={result.cardName} className="mx-auto max-h-48 rounded-lg shadow-lg shadow-poke-cyan/20" />}

              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-lg border border-white/5 bg-white/5 p-4">
                <span className="font-mono text-[10px] tracking-wider text-white/40">NAME</span>
                <span className="font-mono text-xs font-bold text-white">{result.cardName}</span>
                <span className="font-mono text-[10px] tracking-wider text-white/40">SET</span>
                <span className="font-mono text-xs text-white">{result.set}</span>
                <span className="font-mono text-[10px] tracking-wider text-white/40">NUMBER</span>
                <span className="font-mono text-xs text-white">{result.number}</span>
                <span className="font-mono text-[10px] tracking-wider text-white/40">RARITY</span>
                <RarityStars rating={rarityInfo.stars} label={rarityInfo.label} />
                <span className="font-mono text-[10px] tracking-wider text-white/40">LANGUAGE</span>
                <span className="font-mono text-xs text-white">{result.language}</span>
              </div>

              <ConfidenceBar value={94.7} />

              
                href={getCardmarketUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg border border-poke-cyan/30 bg-poke-cyan/5 px-4 py-3 font-mono text-xs tracking-wider text-poke-cyan hover:bg-poke-cyan/10"
              >
                VIEW ON CARDMARKET
              </a>
            </div>
          )}
        </div>
      </PokedexCard>
    </section>
  );
}
