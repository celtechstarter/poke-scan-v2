import axios from "axios";

interface CardPrice {
  cardName: string;
  setName: string;
  number: string;
  priceTrend: number;
  priceFrom: number;
  price7DayAvg: number;
  price30DayAvg: number;
  availableItems: number;
  cardmarketUrl: string;
}

export const getCardmarketPrice = async (
  cardName: string,
  setName: string,
  cardNumber: string
): Promise<CardPrice | null> => {
  try {
    const searchQuery = encodeURIComponent(`${cardName} ${setName} ${cardNumber}`);
    const cardmarketUrl = `https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${searchQuery}`;
    // Da Cardmarket keine offizielle API hat, geben wir erstmal die Such-URL zurück
    // In Zukunft: Scraping über OpenClaw oder Cardmarket Partner API
    return {
      cardName,
      setName,
      number: cardNumber,
      priceTrend: 0,
      priceFrom: 0,
      price7DayAvg: 0,
      price30DayAvg: 0,
      availableItems: 0,
      cardmarketUrl
    };
  } catch (error) {
    console.error("Fehler beim Abrufen des Cardmarket-Preises:", error);
    return null;
  }
};