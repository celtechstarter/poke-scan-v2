const API = "https://api.pokemontcg.io/v2/cards";

export interface CardPrices {
  min: number | null;
  trend: number | null;
  url: string | null;
  found: boolean;
}

function extractPrices(card: Record<string, unknown>): CardPrices | null {
  const cm = card.cardmarket as Record<string, unknown> | undefined;
  if (!cm) return null;
  const prices = cm.prices as Record<string, number> | undefined;
  if (!prices) return null;
  const min = prices.lowPrice ?? null;
  const trend = prices.trendPrice ?? null;
  if (min === null && trend === null) return null;
  return { min, trend, url: (cm.url as string) ?? null, found: true };
}

// Korrekte URL für Pokemon TCG API:
// Doppelpunkte NICHT encoden (Lucene-Syntax), nur Werte encoden
function buildUrl(name: string, num?: string): string {
  // Anführungszeichen um mehrteilige Namen (z.B. "Charizard ex")
  const namePart = name.includes(' ')
    ? `name:%22${encodeURIComponent(name)}%22`
    : `name:${encodeURIComponent(name)}`;
  const numPart = num ? `%20number:${num}` : '';
  return `${API}?q=${namePart}${numPart}&pageSize=10`;
}

export async function fetchCardPrices(
  cardName: string,
  _set: string,
  number: string
): Promise<CardPrices> {
  const notFound: CardPrices = { min: null, trend: null, url: null, found: true };
  const firstName = cardName.split(' ')[0];
  // Nummer normalisieren: "006/165" → "6"
  const num = number.split('/')[0].replace(/^0+/, '') || number.split('/')[0];

  const urls = [
    buildUrl(cardName, num),   // "Charizard ex" + Nummer
    buildUrl(cardName),        // "Charizard ex" ohne Nummer
    buildUrl(firstName, num),  // "Charizard" + Nummer
    buildUrl(firstName),       // "Charizard" (breiteste Suche)
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`[TCG] ${res.status} for: ${url}`);
        continue;
      }
      const data = await res.json();
      const cards = data.data ?? [];
      console.error(`[TCG] ${cards.length} Ergebnisse für: ${url}`);
      for (const card of cards) {
        const prices = extractPrices(card as Record<string, unknown>);
        if (prices) {
          console.error(`[TCG] Preis gefunden: min=${prices.min} trend=${prices.trend}`);
          return prices;
        }
      }
    } catch (e) {
      console.error(`[TCG] Fehler für: ${url}`, e);
      continue;
    }
  }

  return notFound;
}
