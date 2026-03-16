import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PokedexCard } from "./pokedex-card";

interface ScanEntry {
  id: string;
  card_name: string;
  set_name: string;
  card_number: string;
  tcg_price_usd: number | null;
  cardmarket_url: string | null;
  scanned_at: string;
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

const ITEM_HEIGHT_PX = 56; // ca. Höhe eines Eintrags inkl. gap
const VISIBLE_COUNT = 5;

export function ScanHistory() {
  const [entries, setEntries] = useState<ScanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("scan_history")
      .select("id, card_name, set_name, card_number, tcg_price_usd, cardmarket_url, scanned_at")
      .eq("session_id", getSessionId())
      .order("scanned_at", { ascending: false })
      .limit(50);
    setEntries(data ?? []);
    setLoading(false);
  }, []);

  const clearHistory = useCallback(async () => {
    await supabase.from("scan_history").delete().eq("session_id", getSessionId());
    setEntries([]);
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const maxHeight = ITEM_HEIGHT_PX * VISIBLE_COUNT;

  return (
    <PokedexCard className="w-full" glowColor="rgba(0, 240, 255, 0.08)">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-sm font-bold tracking-wider text-poke-cyan">
            SCAN HISTORY
            {entries.length > 0 && (
              <span className="ml-2 text-white/40">({entries.length} Scans)</span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            {entries.length > 0 && (
              <button
                onClick={clearHistory}
                className="rounded-md border border-red-500/20 bg-red-500/5 px-3 py-1 font-mono text-[10px] tracking-wider text-red-400/60 hover:border-red-500/40 hover:text-red-400"
              >
                CLEAR
              </button>
            )}
            {entries.length > 0 && (
              <button
                onClick={() => setCollapsed((c) => !c)}
                className="rounded-md border border-white/10 bg-white/5 px-3 py-1 font-mono text-[10px] tracking-wider text-white/60 hover:border-poke-cyan/30 hover:text-poke-cyan"
              >
                {collapsed ? "▼ ANZEIGEN" : "▲ EINKLAPPEN"}
              </button>
            )}
            <button
              onClick={loadHistory}
              className="rounded-md border border-white/10 bg-white/5 px-3 py-1 font-mono text-[10px] tracking-wider text-white/60 hover:border-poke-cyan/30 hover:text-poke-cyan"
            >
              REFRESH
            </button>
          </div>
        </div>

        {loading && (
          <p className="font-mono text-[11px] text-white/40 text-center py-4">LOADING...</p>
        )}

        {!loading && entries.length === 0 && (
          <p className="font-mono text-[11px] text-white/40 text-center py-4">
            Noch keine Scans in dieser Session
          </p>
        )}

        {!loading && entries.length > 0 && !collapsed && (
          <div
            className="flex flex-col gap-2 overflow-y-auto pr-1"
            style={{ maxHeight: `${maxHeight}px` }}
          >
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-lg border border-white/5 bg-white/5 px-3 py-2"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-mono text-xs font-bold text-white truncate">{entry.card_name}</span>
                  <span className="font-mono text-[10px] text-white/40 truncate">
                    {entry.set_name} · {entry.card_number}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                  <span className="font-mono text-xs text-poke-yellow">
                    {entry.tcg_price_usd !== null ? `€${entry.tcg_price_usd.toFixed(2)}` : "–"}
                  </span>
                  {entry.cardmarket_url && (
                    <a
                      href={entry.cardmarket_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[9px] text-poke-cyan/60 hover:text-poke-cyan"
                    >
                      CM
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PokedexCard>
  );
}
