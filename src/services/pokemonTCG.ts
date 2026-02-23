const POKEMON_TCG_API = "https://api.pokemontcg.io/v2";

export interface CardPrices {
  cardmarketMin: number | null;
  cardmarketTrend: number | null;
  cardmarketUrl: string | null;
  found: boolean; // true = API hat geantwortet (auch wenn kein Preis)
}

function extractCardmarketPrices(cm: Record<string, unknown> | undefined): Pick<CardPrices, "cardmarketMin" | "cardmarketTrend" | "cardmarketUrl"> {
  if (!cm) return { cardmarketMin: null, cardmarketTrend: null, cardmarketUrl: null };
  const prices = cm.prices as Record<string, number> | undefined;
  return {
    cardmarketMin: prices?.lowPrice ?? null,
    cardmarketTrend: prices?.trendPrice ?? null,
    cardmarketUrl: (cm.url as string) ?? null,
  };
}

async function searchCards(query: string): Promise<Record<string, unknown>[]> {
  try {
    const res = await fetch(`${POKEMON_TCG_API}/cards?q=${encodeURIComponent(query)}&pageSize=8`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.data) ? data.data : [];
  } catch {
    return [];
  }
}

export async function fetchCardPrices(
  cardName: string,
  _set: string,
  number: string
): Promise<CardPrices> {
  // Erstes Wort des Kartennamens (z.B. "Charizard" aus "Charizard VMAX")
  const firstName = cardName.split(" ")[0];

  // Versuch 1: Exakter Name + Nummer
  const cards1 = await searchCards(`name:"${cardName}" number:${number}`);
  for (const card of cards1) {
    const prices = extractCardmarketPrices(card.cardmarket as Record<string, unknown>);
    if (prices.cardmarketMin !== null || prices.cardmarketTrend !== null) {
      return { ...prices, found: true };
    }
  }

  // Versuch 2: Erster Namensteil + Nummer
  const cards2 = await searchCards(`name:${firstName} number:${number}`);
  for (const card of cards2) {
    const prices = extractCardmarketPrices(card.cardmarket as Record<string, unknown>);
    if (prices.cardmarketMin !== null || prices.cardmarketTrend !== null) {
      return { ...prices, found: true };
    }
  }

  // Versuch 3: Nur erster Namensteil
  const cards3 = await searchCards(`name:${firstName}`);
  for (const card of cards3) {
    const prices = extractCardmarketPrices(card.cardmarket as Record<string, unknown>);
    if (prices.cardmarketMin !== null || prices.cardmarketTrend !== null) {
      return { ...prices, found: true };
    }
  }

  return { cardmarketMin: null, cardmarketTrend: null, cardmarketUrl: null, found: true };
}
