
import { getCardPriceFromCardMarket } from './cardMarketService';

/**
 * Sample mock cards data for demonstration purposes
 * In a production environment, this would be replaced with a database or API call
 */
const mockCards = [
  { name: "Pikachu V", number: "SWSH004/073" },
  { name: "Charizard VMAX", number: "SWSH3 020/189" },
  { name: "Mew EX", number: "SV2 039/149" },
  { name: "Blastoise GX", number: "SM9 026/095" },
  { name: "Gengar VMAX", number: "SWSH8 057/198" }
];

/**
 * Analyzes a card image and returns the recognized card information
 * In a real application, this would use OCR/ML for text recognition
 * 
 * @param {string} imageDataUrl - The data URL of the captured card image
 * @returns {Promise<Object>} Information about the recognized card including name, number, price and image
 * @property {string} cardName - The name of the recognized card
 * @property {string} cardNumber - The card's set and number identifier
 * @property {number|null} price - The current market price in euros, or null if not available
 * @property {string} imageDataUrl - The original image data URL
 */
export const analyzeCardImage = async (imageDataUrl: string): Promise<{
  cardName: string;
  cardNumber: string;
  price: number | null;
  imageDataUrl: string;
}> => {
  console.log('Analyzing card image...');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // For demo, we use simulated data
  // In a real app, this would be an OCR service API call
  const randomIndex = Math.floor(Math.random() * mockCards.length);
  const recognizedCard = mockCards[randomIndex];
  
  console.log('Recognized card:', recognizedCard);
  
  // Look up the price on CardMarket
  const price = await getCardPriceFromCardMarket(`${recognizedCard.name} ${recognizedCard.number}`);
  
  return {
    cardName: recognizedCard.name,
    cardNumber: recognizedCard.number,
    price: price,
    imageDataUrl: imageDataUrl
  };
};
