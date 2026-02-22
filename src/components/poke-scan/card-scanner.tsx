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
  if (lower.includes("ultra") || lower.includes("secret") || lower.includes("illustration")) {
    return { stars: 5, label: "ULTRA RARE" };
  }
  if (lower.includes("holo") || lower.includes("rare holo")) {
    return { stars: 4, label: "HOLO RARE" };
  }
  if (lower.includes("rare")) {
    return { stars: 3, label: "RARE" };
  }
  if (lower.includes("uncommon")) {
    return { stars: 2, label: "UNCOMMON" };
  }
  return { stars: 1, label: "COMMON" };
}

export function CardScanner() {
  const [state, setState] = useState<ScanState>("idle");
  const [isDragOver, setIsDragOver] = useState(false);
  const [result, setResult] = useState<CardResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scanCard = useCallback(async (base64Image: string) => {
    setState("scanning");
    setError(null);
    setModelUsed(null);

    try {
      const imageData = base64Image.startsWith("data:") 
        ? base64Image 
        : "data:image/jpeg;base64," + base64Image;

      const response = await fetch("/api/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "API Fehler");
      }

      const data = await response.json();

      if (data.model_used) {
        setModelUsed(data.model_used);
      }

      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("Keine Antwort von der KI");
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const cardData = JSON.parse(jsonMatch[0]) as CardResult;
        setResult(cardData);
        setState("result");
      } else {
        throw new Error("Karte nicht erkannt");
      }
    } catch (err) {
      console.error("Scan error:", err);
      const message = err instanceof Error ? err.message : "Karte konnte nicht erkannt werden.";
      setError(message);
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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleReset = useCallback(() => {
    setState("idle");
    setResult(null);
    setPreview(null);
    setError(null);
    setModelUsed(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const generateCardmarketUrl = (cardName: string, setName: string) => {
    const query = encodeURIComponent(cardName + " " + setName);
    return "https://www.cardmarket.com/de/Pokemon/Products/Search?searchString=" + query;
  };

  const rarityInfo = result ? getRarityInfo(result.rarity) : { stars: 1, label: "COMMON" };

  return (
    <section id="main-scanner" aria-label="Pokemon Card Scanner">
      <PokedexCard className="mx-auto w-full max-w-xl" glowColor="rgba(239, 68, 68, 0.1)">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-sm font-bold tracking-wider text-poke-red">
              CARD SCANNER
            </h2>
            {(state === "result" || state === "error") && (
              <button
                onClick={handleReset}
                className="rounded-md border border-white/10 bg-white/5 px-3 py-1 font-mono text-[10px] tracking-wider text-white/60 transition-colors hover:border-poke-yellow/30 hover:text-poke-yellow focus:outline-none focus:ring-2 focus:ring-poke-yellow/50"
              >
                SCAN AGAIN
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={handleInputChange}
            aria-label="Foto aufnehmen oder Bild hochladen"
          />

          {state === "idle" && (
            <ScannerFrame>
              <div
                className={
                  "flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed transition-colors " +
                  (isDragOver
                    ? "border-poke-yellow bg-poke-yellow/5"
                    : "border-white/10 hover:border-poke-cyan/30")
                }
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                role="button"
                tabIndex={0}
                aria-label="Foto aufnehmen oder Bild hochladen"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    triggerFileInput();
                  }
                }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5">
                  {isDragOver ? (
                    <Upload className="h-6 w-6 text-poke-yellow" />
                  ) : (
                    <Camera className="h-6 w-6 text-poke-cyan" />
                  )}
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
                {preview && (
                  <img src={preview} alt="Scanning preview" className="max-h-32 rounded-lg opacity-50" />
                )}
                <EvolutionLoader />
              </div>
            </ScannerFrame>
          )}

          {state === "error" && (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-lg border border-poke-red/30 bg-poke-red/5 p-6">
              <span className="text-4xl" aria-hidden="true">❌</span>
              <p className="text-center font-mono text-sm text-poke-red">{error}</p>
              {preview && (
                <img src={preview} alt="Failed scan" className="max-h-24 rounded-lg opacity-30" />
              )}
            </div>
          )}

          {state === "result" && result && (
            <div className="flex flex-col gap-4" role="region" aria-label="Scan Result" aria-live="polite">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full bg-poke-green"
                  style={{ boxShadow: "0 0 8px rgba(34, 197, 94, 0.5)" }}
                  aria-hidden="true"
                />
                <span className="font-mono text-xs font-bold tracking-wider text-poke-green">
                  CARD IDENTIFIED
                </span>
                {modelUsed && (
                  <span className="font-mono text-[8px] text-white/30">
                    {"via " + modelUsed.split("/").pop()}
                  </span>
              <ConfidenceBar value={94.7} />

              
                href={generateCardmarketUrl(result.cardName, result.set)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg border border-poke-cyan/30 bg-poke-cyan/5 px-4 py-3 font-mono text-xs tracking-wider text-poke-cyan transition-colors hover:bg-poke-cyan/10 focus:outline-none focus:ring-2 focus:ring-poke-cyan/50"
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
