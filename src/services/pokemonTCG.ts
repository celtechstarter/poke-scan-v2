const POKEMON_TCG_API = "https://api.pokemontcg.io/v2";

function extractPrice(tcgplayer: Record<string, unknown> | undefined): number | null {
  if (!tcgplayer) return null;
  const prices = tcgplayer.prices as Record<string, { market?: number }> | undefined;
  if (!prices) return null;
  const price =
    prices.holofoil?.market ??
    prices.normal?.market ??
    prices.reverseHolofoil?.market ??
    prices["1stEditionHolofoil"]?.market ??
    null;
  return price ?? null;
}

export async function fetchTCGPrice(
  cardName: string,
  set: string,
  number: string
): Promise<number | null> {
  try {
    // Erst: Name + Nummer suchen
    const nameEncoded = encodeURIComponent(`name:"${cardName}" number:${number}`);
    const res = await fetch(`${POKEMON_TCG_API}/cards?q=${nameEncoded}&pageSize=5`);
    if (res.ok) {
      const data = await res.json();
      if (data.data?.length > 0) {
        const price = extractPrice(data.data[0].tcgplayer);
        if (price !== null) return price;
      }
    }

    // Fallback: Nur Name suchen
    const fallbackEncoded = encodeURIComponent(`name:"${cardName}"`);
    const fallbackRes = await fetch(`${POKEMON_TCG_API}/cards?q=${fallbackEncoded}&pageSize=5`);
    if (fallbackRes.ok) {
      const fallbackData = await fallbackRes.json();
      for (const card of fallbackData.data ?? []) {
        const price = extractPrice(card.tcgplayer);
        if (price !== null) return price;
      }
    }

    return null;
  } catch {
    return null;
  }
}
