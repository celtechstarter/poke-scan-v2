// api/snapshot.ts
// Täglicher Cron-Job: Preise aller Sammlungs-Karten in price_snapshots speichern.
// Geschützt via Authorization: Bearer CRON_SECRET (Vercel setzt das automatisch).
// Benötigte Env-Vars: SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_URL, CRON_SECRET
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export const config = { maxDuration: 60 };

const TCGDEX_API = 'https://api.tcgdex.net/v2/en/sets';

async function fetchPrice(
  tcgdexSet: string,
  localId: string,
): Promise<{ min: number | null; trend: number | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${TCGDEX_API}/${tcgdexSet}/${localId}`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return { min: null, trend: null };
    const card = await res.json() as Record<string, unknown>;
    const pricing = card?.pricing as Record<string, unknown> | undefined;
    const cm = pricing?.cardmarket as Record<string, number> | null | undefined;
    if (!cm) return { min: null, trend: null };
    return {
      min: cm.low ?? cm['low-holo'] ?? null,
      trend: cm.trend ?? cm['trend-holo'] ?? null,
    };
  } catch {
    clearTimeout(timer);
    return { min: null, trend: null };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Auth-Check: Vercel Cron setzt Authorization: Bearer ${CRON_SECRET} automatisch
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.authorization;
    if (auth !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY oder VITE_SUPABASE_URL fehlt' });
  }

  // Service-Role-Client umgeht RLS (notwendig für Schreiben ohne User-Kontext)
  const db = createClient(supabaseUrl, serviceRoleKey);

  // Alle Karten aus collection holen
  const { data: cards, error: cardsError } = await db
    .from('collection')
    .select('tcgdex_set, local_id');

  if (cardsError) {
    console.error('[snapshot] collection select Fehler:', cardsError.message);
    return res.status(500).json({ error: cardsError.message });
  }

  // Deduplizieren
  const unique = new Map<string, { tcgdex_set: string; local_id: string }>();
  for (const card of (cards ?? [])) {
    const key = `${card.tcgdex_set}/${card.local_id}`;
    if (!unique.has(key)) {
      unique.set(key, card as { tcgdex_set: string; local_id: string });
    }
  }

  const today = new Date().toISOString().split('T')[0];
  let saved = 0;
  let skipped = 0;

  for (const { tcgdex_set, local_id } of unique.values()) {
    const { min, trend } = await fetchPrice(tcgdex_set, local_id);
    if (min === null && trend === null) { skipped++; continue; }

    const { error: upsertError } = await db
      .from('price_snapshots')
      .upsert(
        { tcgdex_set, local_id, snapshot_date: today, price_min: min, price_trend: trend },
        { onConflict: 'tcgdex_set,local_id,snapshot_date' },
      );

    if (upsertError) {
      console.error(`[snapshot] upsert Fehler ${tcgdex_set}/${local_id}:`, upsertError.message);
    } else {
      saved++;
    }

    await sleep(100); // Rate-Limit respektieren
  }

  console.error(`[snapshot] ${saved} Snapshots gespeichert, ${skipped} übersprungen (${today})`);
  return res.status(200).json({ saved, skipped, date: today, total: unique.size });
}
