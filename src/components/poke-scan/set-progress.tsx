import { useState, useEffect } from "react";

interface CollectionEntry {
  tcgdex_set: string;
  local_id: string;
}

interface SetMeta {
  name: string;
  official: number;
  logo: string | null;
}

interface Props {
  entries: CollectionEntry[];
}

export function SetProgress({ entries }: Props) {
  const [setMetas, setSetMetas] = useState<Map<string, SetMeta>>(new Map());

  // Karten pro Set gruppieren (distinct local_ids)
  const grouped = entries.reduce((acc, e) => {
    if (!acc.has(e.tcgdex_set)) acc.set(e.tcgdex_set, new Set<string>());
    acc.get(e.tcgdex_set)!.add(e.local_id);
    return acc;
  }, new Map<string, Set<string>>());

  useEffect(() => {
    const uniqueSets = Array.from(grouped.keys());
    if (uniqueSets.length === 0) return;
    void Promise.all(uniqueSets.map(async (setId) => {
      try {
        const res = await fetch(`https://api.tcgdex.net/v2/en/sets/${setId}`);
        if (!res.ok) return;
        const data = await res.json() as Record<string, unknown>;
        const cardCount = data.cardCount as Record<string, number> | undefined;
        const official = cardCount?.official ?? 0;
        const logo = (data.logo as string) || null;
        const name = (data.name as string) || setId;
        setSetMetas(prev => new Map(prev).set(setId, { name, official, logo }));
      } catch {
        // einzelne Fehler ignorieren
      }
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  if (grouped.size === 0) return null;

  return (
    <div className="mb-4 rounded-lg border border-white/5 bg-white/5 p-3">
      <p className="mb-3 font-mono text-[10px] tracking-wider text-white/40">SET-FORTSCHRITT</p>
      <div className="flex flex-col gap-3">
        {Array.from(grouped.entries()).map(([setId, ownedIds]) => {
          const meta = setMetas.get(setId);
          const owned = ownedIds.size;
          const total = meta?.official ?? 0;
          const pct = total > 0 ? Math.min(100, Math.round((owned / total) * 100)) : 0;
          const complete = total > 0 && owned >= total;

          return (
            <div key={setId} className="flex items-center gap-3">
              {meta?.logo && (
                <img
                  src={`${meta.logo}.webp`}
                  alt={meta.name}
                  className="h-5 w-auto max-w-[60px] object-contain opacity-80"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] text-white/60 truncate">
                    {meta?.name ?? setId}
                  </span>
                  <span className={`shrink-0 font-mono text-[9px] ${complete ? "text-poke-yellow font-bold" : "text-white/40"}`}>
                    {total > 0
                      ? `${owned} / ${total}${complete ? " ✓" : ""}`
                      : `${owned} Karte${owned !== 1 ? "n" : ""}`}
                  </span>
                </div>
                {total > 0 && (
                  <div className="h-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${complete ? "bg-poke-yellow" : "bg-poke-cyan"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
