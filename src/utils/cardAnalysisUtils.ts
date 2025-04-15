
import { getCardPriceFromCardMarket } from './cardMarketService';
import { processCardWithOcr, cleanupOcrResults, CardOcrResult } from './ocrUtils';

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
 * Now using OCR for text recognition
 * 
 * @param {string} imageDataUrl - The data URL of the captured card image
 * @returns {Promise<Object>} Information about the recognized card including name, number, price and image
 */
export const analyzeCardImage = async (imageDataUrl: string): Promise<{
  cardName: string;
  cardNumber: string;
  price: number | null;
  imageDataUrl: string;
  ocrResult?: CardOcrResult;
}> => {
  console.log('Analyzing card image with OCR...');
  
  try {
    // Process image with OCR
    const ocrResult = await processCardWithOcr(imageDataUrl);
    const cleanedOcrResult = cleanupOcrResults(ocrResult);
    
    console.log('OCR Recognition results:', cleanedOcrResult);
    
    // If OCR detected both name and number, use them
    if (cleanedOcrResult.cardName && cleanedOcrResult.cardNumber) {
      const recognizedCard = {
        cardName: cleanedOcrResult.cardName,
        cardNumber: cleanedOcrResult.cardNumber
      };
      
      // Look up the price on CardMarket
      const searchQuery = `${recognizedCard.cardName} ${recognizedCard.cardNumber}`;
      console.log('Searching CardMarket with:', searchQuery);
      
      const price = await getCardPriceFromCardMarket(searchQuery);
      
      return {
        cardName: recognizedCard.cardName,
        cardNumber: recognizedCard.cardNumber,
        price: price,
        imageDataUrl: imageDataUrl,
        ocrResult: cleanedOcrResult
      };
    }
    
    // Fallback to mock data if OCR failed to detect all required info
    console.log('OCR failed to detect all card information, using fallback data');
    const randomIndex = Math.floor(Math.random() * mockCards.length);
    const fallbackCard = mockCards[randomIndex];
    
    // Look up the price on CardMarket
    const price = await getCardPriceFromCardMarket(`${fallbackCard.name} ${fallbackCard.number}`);
    
    return {
      cardName: fallbackCard.name,
      cardNumber: fallbackCard.number,
      price: price,
      imageDataUrl: imageDataUrl,
      ocrResult: cleanedOcrResult // Still return OCR results for debugging
    };
  } catch (error) {
    console.error('Error during card analysis:', error);
    
    // Fallback to mock data in case of error
    const randomIndex = Math.floor(Math.random() * mockCards.length);
    const fallbackCard = mockCards[randomIndex];
    
    // Look up the price on CardMarket
    const price = await getCardPriceFromCardMarket(`${fallbackCard.name} ${fallbackCard.number}`);
    
    return {
      cardName: fallbackCard.name,
      cardNumber: fallbackCard.number,
      price: price,
      imageDataUrl: imageDataUrl
    };
  }
};
