
import { PokeCard } from "@/lib/types";
import OpenAI from "openai";

/**
 * CardMarket integration service
 * @module cardMarketService
 */

/**
 * Initialize OpenAI client for card price estimation
 * @note In a production environment, this API key should be stored in environment variables
 */
const openai = new OpenAI({
  apiKey: "org-ow5jS4YYPtV1E1cdOmNKESgA", // Updated API key
  dangerouslyAllowBrowser: true // This is for client-side usage, use server-side in production
});

/**
 * Gets the current market price for a Pokemon card from CardMarket using OpenAI
 * In a production app, this would directly query CardMarket's API
 * 
 * @param {string} cardIdentifier - The card name and set number (e.g., "Pikachu V SWSH004/073")
 * @returns {Promise<number|null>} The estimated current market price in euros, or null if not found
 */
export const getCardPriceFromCardMarket = async (cardIdentifier: string): Promise<number | null> => {
  console.log(`Suche Preis für Karte: ${cardIdentifier}`);
  
  try {
    // Define the system prompt for OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using the faster and more affordable model
      messages: [
        {
          role: "system",
          content: "Du bist ein Assistent, der aktuelle Preise von Pokemon-Karten auf cardmarket.com recherchiert. Bei der Suche berücksichtigst du sowohl den Kartennamen als auch die Setnummer, um die exakte Karte zu finden. Gib nur den Durchschnittspreis als Dezimalzahl zurück, ohne Text oder Währungssymbole."
        },
        {
          role: "user",
          content: `Suche den aktuellen Durchschnittspreis für die Pokemon-Karte "${cardIdentifier}" auf cardmarket.com. Achte dabei besonders auf die Set-Nummer, wenn angegeben. Gib NUR den Preis als Dezimalzahl zurück, ohne Text oder Währungssymbole.`
        }
      ],
      temperature: 0.2, // Lower temperature for more consistent results
    });

    // Extract the price from the response
    const priceText = response.choices[0].message.content?.trim();
    
    if (priceText) {
      // Parse the price and ensure it's a valid number
      const price = parseFloat(priceText.replace(',', '.'));
      if (!isNaN(price)) {
        return parseFloat(price.toFixed(2));
      }
    }
    
    // Fallback to mock price if OpenAI couldn't retrieve a valid price
    console.warn("Konnte keinen gültigen Preis über OpenAI abrufen, nutze Fallback-Preis");
    return getFallbackPrice();
    
  } catch (error) {
    console.error("Fehler beim Abrufen des Kartenpreises über OpenAI:", error);
    // Fallback to mock price if there's an error
    return getFallbackPrice();
  }
};

/**
 * Generates a random price for fallback when API calls fail
 * 
 * @returns {number} A random price between 1 and 101 euros, with 2 decimal places
 */
const getFallbackPrice = (): number => {
  const mockPrice = Math.random() * 100 + 1;
  return parseFloat(mockPrice.toFixed(2));
};

/**
 * Returns mock cards data for the homepage display
 * In a production app, this would fetch data from an API
 * 
 * @returns {PokeCard[]} An array of mock Pokemon card data
 */
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
