
import { PokeCard } from "@/lib/types";

// Diese Funktion würde später mit einer echten API-Integration ersetzt
export const getCardPriceFromCardMarket = async (cardName: string): Promise<number | null> => {
  // In einer realen Implementierung würde hier die CardMarket API genutzt werden
  console.log(`Suche Preis für Karte: ${cardName}`);
  
  // Mock-Funktion zur Simulation der API-Antwort
  return new Promise((resolve) => {
    setTimeout(() => {
      // Zufälliger Preis zwischen 1 und 100
      const mockPrice = Math.random() * 100 + 1;
      resolve(parseFloat(mockPrice.toFixed(2)));
    }, 1500); // Simuliere Netzwerklatenz
  });
};

// Mock-Daten für die Startseite
export const getMockCards = (): PokeCard[] => {
  return [
    {
      id: "pika-1",
      name: "Pikachu V",
      imageUrl: "https://images.pokemontcg.io/swsh4/44.png",
      set: "Vivid Voltage",
      rarity: "Rare Holo",
      price: 15.99
    },
    {
      id: "char-1",
      name: "Charizard VMAX",
      imageUrl: "https://images.pokemontcg.io/swsh3/20.png",
      set: "Darkness Ablaze",
      rarity: "Rare Ultra",
      price: 89.99
    },
    {
      id: "mew-1",
      name: "Mewtwo GX",
      imageUrl: "https://images.pokemontcg.io/sm8/31.png",
      set: "Lost Thunder",
      rarity: "Rare Holo GX",
      price: 25.50
    },
    {
      id: "blas-1",
      name: "Blastoise",
      imageUrl: "https://images.pokemontcg.io/base1/2.png",
      set: "Base",
      rarity: "Rare Holo",
      price: 120.00
    }
  ];
};
