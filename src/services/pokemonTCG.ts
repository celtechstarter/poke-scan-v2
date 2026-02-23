const POKEMON_TCG_API = "https://api.pokemontcg.io/v2";

export interface CardPrices {
  cardmarketMin: number | null;    // Cardmarket lowPrice (EUR)
  cardmarketTrend: number | null;  // Cardmarket trendPrice (EUR)
  cardmarketUrl: string | null;
}

function extractCardmarketPrices(cm: Record<string, unknown> | undefined): Omit<CardPrices, "cardmarketUrl"> {
  if (!cm) return { cardmarketMin: null, cardmarketTrend: null };
  const prices = cm.prices as Record<string, number> | undefined;
  return {
    cardmarketMin: prices?.lowPrice ?? null,
    cardmarketTrend: prices?.trendPrice ?? null,
  };
}

async function searchCards(query: string): Promise<Record<string, unknown>[]> {
  try {
    const res = await fetch(`${POKEMON_TCG_API}/cards?q=${encodeURIComponent(query)}&pageSize=8`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.data ?? [];
  } catch {
    return [];
  }
}

export async function fetchCardPrices(
  cardName: string,
  _set: string,
  number: string
): Promise<CardPrices> {
  const empty: CardPrices = { cardmarketMin: null, cardmarketTrend: null, cardmarketUrl: null };

  // Versuch 1: Name + Nummer
  const cards = await searchCards(`name:"${cardName}" number:${number}`);
  for (const card of cards) {
    const { cardmarketMin, cardmarketTrend } = extractCardmarketPrices(card.cardmarket as Record<string, unknown>);
    const cm = card.cardmarket as Record<string, unknown> | undefined;
    if (cardmarketMin !== null || cardmarketTrend !== null) {
      return { cardmarketMin, cardmarketTrend, cardmarketUrl: (cm?.url as string) ?? null };
    }
  }

  // Versuch 2: Nur Name
  const fallback = await searchCards(`name:"${cardName}"`);
  for (const card of fallback) {
    const { cardmarketMin, cardmarketTrend } = extractCardmarketPrices(card.cardmarket as Record<string, unknown>);
    const cm = card.cardmarket as Record<string, unknown> | undefined;
    if (cardmarketMin !== null || cardmarketTrend !== null) {
      return { cardmarketMin, cardmarketTrend, cardmarketUrl: (cm?.url as string) ?? null };
    }
  }

  return empty;
}
