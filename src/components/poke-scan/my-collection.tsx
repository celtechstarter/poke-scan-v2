import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PokedexCard } from "./pokedex-card";
import { SetProgress } from "./set-progress";

interface CollectionEntry {
  id: string;
  tcgdex_set: string;
  local_id: string;
  card_name: string;
  set_name: string;
  number: string | null;
  variant: string;
  quantity: number;
  image_url: string | null;
  added_at: string;
}

type CardPrice = { min: number | null; trend: number | null };
type SortOption = "newest" | "value" | "set";

interface Snapshot {
  snapshot_date: string;
  price_trend: number | null;
}

function getSessionId(): string {
  const key = "poke_scan_session_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

async function fetchCardPrice(tcgdexSet: string, localId: string): Promise<CardPrice> {
  try {
    const res = await fetch(`https://api.tcgdex.net/v2/en/sets/${tcgdexSet}/${localId}`);
    if (!res.ok) return { min: null, trend: null };
    const card = await res.json() as Record<string, unknown>;
    const pricing = card?.pricing as Record<string, unknown> | undefined;
    const cm = pricing?.cardmarket as Record<string, number> | null | undefined;
    if (!cm) return { min: null, trend: null };
    return {
      min: cm.low ?? cm["low-holo"] ?? null,
      trend: cm.trend ?? cm["trend-holo"] ?? null,
    };
  } catch {
    return { min: null, trend: null };
  }
}

// SVG-Preisverlaufsgraph (keine externe Bibliothek)
function PriceChart({ data }: { data: Array<{ date: string; value: number }> }) {
  if (data.length < 2) return null;
  const values = data.map((d) => d.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;
  const W = 260;
  const H = 50;
  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - 8 - ((d.value - minV) / range) * (H - 16);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 50 }}>
      <polyline points={points} fill="none" stroke="rgb(0, 240, 255)" strokeWidth="1.5" strokeLinejoin="round" />
      <text x="2" y={H - 2} fontSize="7" fill="rgba(255,255,255,0.35)">{`€${minV.toFixed(2)}`}</text>
      <text x={W - 2} y={H - 2} fontSize="7" fill="rgba(255,255,255,0.35)" textAnchor="end">{`€${maxV.toFixed(2)}`}</text>
    </svg>
  );
}

export function MyCollection() {
  const [entries, setEntries] = useState<CollectionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState<Map<string, CardPrice>>(new Map());
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  // Phase C: Preisverlauf
  const [selectedCard, setSelectedCard] = useState<CollectionEntry | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loadingSnapshots, setLoadingSnapshots] = useState(false);

  const loadCollection = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("collection")
      .select("*")
      .eq("session_id", getSessionId())
      .order("added_at", { ascending: false });
    const loaded = (data ?? []) as CollectionEntry[];
    setEntries(loaded);
    setLoading(false);

    if (loaded.length === 0) return;

    // Preise in Batches von 20 parallel laden
    const BATCH = 20;
    const newPrices = new Map<string, CardPrice>();
    for (let i = 0; i < loaded.length; i += BATCH) {
      const batch = loaded.slice(i, i + BATCH);
      await Promise.all(batch.map(async (entry) => {
        const price = await fetchCardPrice(entry.tcgdex_set, entry.local_id);
        newPrices.set(`${entry.tcgdex_set}/${entry.local_id}`, price);
      }));
      setPrices(new Map(newPrices));
    }
  }, []);

  useEffect(() => { void loadCollection(); }, [loadCollection]);

  const changeQuantity = useCallback(async (entry: CollectionEntry, delta: number) => {
    const newQty = entry.quantity + delta;
    if (newQty <= 0) {
      setConfirmDelete(entry.id);
      return;
    }
    const { error } = await supabase
      .from("collection")
      .update({ quantity: newQty })
      .eq("id", entry.id);
    if (error) { console.error("[collection] quantity update fehlgeschlagen:", error.message); return; }
    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, quantity: newQty } : e));
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    const { error } = await supabase.from("collection").delete().eq("id", id);
    if (error) { console.error("[collection] delete fehlgeschlagen:", error.message); return; }
    setEntries(prev => prev.filter(e => e.id !== id));
    setConfirmDelete(null);
    if (selectedCard?.id === id) setSelectedCard(null);
  }, [selectedCard]);

  const loadSnapshots = useCallback(async (entry: CollectionEntry) => {
    if (selectedCard?.id === entry.id) { setSelectedCard(null); return; }
    setSelectedCard(entry);
    setLoadingSnapshots(true);
    setSnapshots([]);
    try {
      const { data } = await supabase
        .from("price_snapshots")
        .select("snapshot_date, price_trend")
        .eq("tcgdex_set", entry.tcgdex_set)
        .eq("local_id", entry.local_id)
        .order("snapshot_date", { ascending: true });
      setSnapshots((data ?? []) as Snapshot[]);
    } catch {
      // Tabelle existiert noch nicht — kein Fehler anzeigen
    } finally {
      setLoadingSnapshots(false);
    }
  }, [selectedCard]);

  const totalCards = entries.reduce((sum, e) => sum + e.quantity, 0);
  const totalValue = entries.reduce((sum, e) => {
    const p = prices.get(`${e.tcgdex_set}/${e.local_id}`);
    return sum + (p?.trend ?? 0) * e.quantity;
  }, 0);

  const sortedEntries = [...entries].sort((a, b) => {
    if (sortBy === "value") {
      const pa = (prices.get(`${a.tcgdex_set}/${a.local_id}`)?.trend ?? 0) * a.quantity;
      const pb = (prices.get(`${b.tcgdex_set}/${b.local_id}`)?.trend ?? 0) * b.quantity;
      return pb - pa;
    }
    if (sortBy === "set") return a.set_name.localeCompare(b.set_name);
    return 0; // newest: bereits nach added_at sortiert
  });

  const chartData = snapshots
    .filter(s => s.price_trend !== null)
    .map(s => ({ date: s.snapshot_date, value: s.price_trend as number }));

  return (
    <div id="my-collection">
    <PokedexCard className="w-full" glowColor="rgba(255, 215, 0, 0.05)">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="font-mono text-sm font-bold tracking-wider text-poke-yellow">
              MEIN POKÉDEX
            </h2>
            {!loading && entries.length > 0 && (
              <p className="mt-0.5 font-mono text-[10px] text-white/40">
                {totalCards} Karte{totalCards !== 1 ? "n" : ""} · Gesamtwert ≈ €{totalValue.toFixed(2)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {entries.length > 1 && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="rounded border border-white/10 bg-black/40 px-2 py-1 font-mono text-[10px] text-white/60"
              >
                <option value="newest">Neueste</option>
                <option value="value">Nach Wert</option>
                <option value="set">Nach Set</option>
              </select>
            )}
            {entries.length > 0 && (
              <button
                onClick={() => setShowProgress(p => !p)}
                className="rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] tracking-wider text-white/60 hover:border-poke-cyan/30 hover:text-poke-cyan"
              >
                {showProgress ? "SETS ▲" : "SETS ▼"}
              </button>
            )}
            {entries.length > 0 && (
              <button
                onClick={() => setCollapsed(c => !c)}
                className="rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] tracking-wider text-white/60 hover:border-poke-cyan/30 hover:text-poke-cyan"
              >
                {collapsed ? "▼" : "▲"}
              </button>
            )}
            <button
              onClick={() => void loadCollection()}
              className="rounded-md border border-white/10 bg-white/5 px-3 py-1 font-mono text-[10px] tracking-wider text-white/60 hover:border-poke-cyan/30 hover:text-poke-cyan"
            >
              REFRESH
            </button>
          </div>
        </div>

        {/* Phase B: Set-Fortschritt */}
        {showProgress && entries.length > 0 && (
          <SetProgress entries={entries} />
        )}

        {loading && (
          <p className="py-4 text-center font-mono text-[11px] text-white/40">LOADING...</p>
        )}

        {!loading && entries.length === 0 && (
          <p className="py-6 text-center font-mono text-[11px] text-white/40">
            Noch keine Karten — scanne deine erste Karte!
          </p>
        )}

        {/* Karten-Grid */}
        {!loading && entries.length > 0 && !collapsed && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {sortedEntries.map((entry) => {
              const price = prices.get(`${entry.tcgdex_set}/${entry.local_id}`);
              const isSelected = selectedCard?.id === entry.id;
              return (
                <div
                  key={entry.id}
                  className={`relative flex flex-col rounded-lg border bg-white/5 p-2 gap-2 transition-colors ${isSelected ? "border-poke-cyan/40" : "border-white/5"}`}
                >
                  {/* Kartenbild */}
                  {entry.image_url ? (
                    <img
                      src={`${entry.image_url}/low.webp`}
                      alt={entry.card_name}
                      className="w-full rounded object-contain cursor-pointer"
                      style={{ maxHeight: 128 }}
                      onClick={() => void loadSnapshots(entry)}
                    />
                  ) : (
                    <div className="flex h-24 items-center justify-center rounded bg-white/5">
                      <span className="font-mono text-[9px] text-white/20">NO IMG</span>
                    </div>
                  )}

                  {/* Anzahl-Badge */}
                  {entry.quantity > 1 && (
                    <span className="absolute right-1 top-1 rounded-full bg-poke-yellow px-1.5 py-0.5 font-mono text-[9px] font-bold text-black">
                      {entry.quantity}×
                    </span>
                  )}

                  {/* Info */}
                  <div className="flex flex-col gap-0.5">
                    <span className="truncate font-mono text-[10px] font-bold text-white">{entry.card_name}</span>
                    <span className="truncate font-mono text-[9px] text-white/40">{entry.set_name}</span>
                    {entry.variant && entry.variant !== "normal" && (
                      <span className="font-mono text-[8px] text-poke-cyan/60">
                        {entry.variant.replace(/_/g, " ").toUpperCase()}
                      </span>
                    )}
                    {price?.trend != null ? (
                      <span className="font-mono text-xs font-bold text-poke-yellow">€{price.trend.toFixed(2)}</span>
                    ) : (
                      <span className="font-mono text-[9px] text-white/20">–</span>
                    )}
                  </div>

                  {/* +/- Controls */}
                  <div className="mt-auto flex items-center gap-1">
                    <button
                      onClick={() => void changeQuantity(entry, -1)}
                      className="flex-1 rounded border border-white/10 bg-white/5 py-0.5 font-mono text-xs text-white/60 hover:border-red-500/30 hover:text-red-400"
                    >
                      −
                    </button>
                    <span className="px-1 font-mono text-xs text-white/50">{entry.quantity}</span>
                    <button
                      onClick={() => void changeQuantity(entry, +1)}
                      className="flex-1 rounded border border-white/10 bg-white/5 py-0.5 font-mono text-xs text-white/60 hover:border-poke-green/30 hover:text-poke-green"
                    >
                      +
                    </button>
                  </div>

                  {/* Bestätigung vor Löschen */}
                  {confirmDelete === entry.id && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg bg-black/85 p-2">
                      <p className="text-center font-mono text-[9px] text-white/60">Wirklich entfernen?</p>
                      <div className="flex gap-1">
                        <button
                          onClick={() => void deleteEntry(entry.id)}
                          className="rounded border border-red-500/40 bg-red-500/10 px-2 py-1 font-mono text-[9px] text-red-400 hover:bg-red-500/20"
                        >
                          JA
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="rounded border border-white/10 bg-white/5 px-2 py-1 font-mono text-[9px] text-white/60"
                        >
                          NEIN
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Phase C: Preisverlauf-Panel */}
        {selectedCard && !collapsed && (
          <div className="rounded-lg border border-poke-cyan/20 bg-black/30 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-wider text-poke-cyan">
                PREISVERLAUF · {selectedCard.card_name}
              </span>
              <button
                onClick={() => setSelectedCard(null)}
                className="font-mono text-[10px] text-white/30 hover:text-white/60"
              >
                ✕
              </button>
            </div>
            {loadingSnapshots && (
              <p className="font-mono text-[10px] text-white/30 animate-pulse">Lade Verlauf…</p>
            )}
            {!loadingSnapshots && chartData.length >= 2 && (
              <PriceChart data={chartData} />
            )}
            {!loadingSnapshots && chartData.length < 2 && (
              <p className="font-mono text-[10px] text-white/30">
                Preisverlauf entsteht ab jetzt — täglich ein Datenpunkt.
              </p>
            )}
          </div>
        )}
      </div>
    </PokedexCard>
    </div>
  );
}
