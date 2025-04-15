
import { getCardPriceFromCardMarket } from './cardMarketService';
import { processCardWithOcr, cleanupOcrResults, CardOcrResult } from './ocrUtils';

/**
 * Analyzes a card image and returns the recognized card information
 * Enhanced with improved OCR and image processing
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
  console.log('Analyzing card image with enhanced OCR...');
  
  try {
    // Process image with OCR - now with preprocessing and focused regions
    const ocrResult = await processCardWithOcr(imageDataUrl);
    const cleanedOcrResult = cleanupOcrResults(ocrResult);
    
    console.log('OCR Recognition results (after cleanup):', cleanedOcrResult);
    
    // If OCR detected both name and number, use them directly
    if (cleanedOcrResult.cardName && cleanedOcrResult.cardNumber) {
      console.log('OCR successfully detected card name and number');
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
    
    // Use whatever we detected - partial information is better than none
    const cardName = cleanedOcrResult.cardName || "Text nicht erkannt";
    const cardNumber = cleanedOcrResult.cardNumber || "Nummer nicht erkannt";
    
    // Try to get price using whatever text we detected
    let price = null;
    try {
      if (cardName !== "Text nicht erkannt") {
        price = await getCardPriceFromCardMarket(cardName);
      }
    } catch (e) {
      console.error('Price lookup failed:', e);
    }

    return {
      cardName: cardName,
      cardNumber: cardNumber,
      price: price,
      imageDataUrl: imageDataUrl,
      ocrResult: cleanedOcrResult
    };
  } catch (error) {
    console.error('Error during card analysis:', error);
    
    // Return a clear error message
    return {
      cardName: "Fehler beim Scannen",
      cardNumber: "Bitte erneut versuchen",
      price: null,
      imageDataUrl: imageDataUrl
    };
  }
};
