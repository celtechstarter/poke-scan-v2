
import { getCardPriceFromCardMarket } from './cardMarketService';
import { processCardWithOcr, cleanupOcrResults, CardOcrResult } from './ocrUtils';

/**
 * Analyzes a card image with enhanced OCR processing specifically 
 * optimized for Pokémon cards in German language
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
  console.log('Analyzing Pokémon card with enhanced German OCR...');
  
  try {
    // Process image with our improved OCR system
    const ocrResult = await processCardWithOcr(imageDataUrl);
    
    console.log('OCR Recognition results:', ocrResult);
    
    // If OCR failed to detect a name, use special error message
    if (!ocrResult.cardName) {
      return {
        cardName: "Kartenname nicht erkannt",
        cardNumber: ocrResult.cardNumber || "Nummer nicht erkannt",
        price: null,
        imageDataUrl: imageDataUrl,
        ocrResult: ocrResult
      };
    }
    
    // If we have a card name and number, this is the best case scenario
    if (ocrResult.cardName && ocrResult.cardNumber) {
      console.log('OCR successfully detected card name and number');
      
      // Create a search query that combines name and number
      const searchQuery = `${ocrResult.cardName} ${ocrResult.cardNumber}`;
      console.log('Searching CardMarket with:', searchQuery);
      
      try {
        const price = await getCardPriceFromCardMarket(searchQuery);
        
        return {
          cardName: ocrResult.cardName,
          cardNumber: ocrResult.cardNumber,
          price: price,
          imageDataUrl: imageDataUrl,
          ocrResult: ocrResult
        };
      } catch (priceError) {
        console.error('Price lookup failed, trying with card name only:', priceError);
        
        // If price lookup fails with the combined query, try with just the name
        try {
          const price = await getCardPriceFromCardMarket(ocrResult.cardName);
          
          return {
            cardName: ocrResult.cardName,
            cardNumber: ocrResult.cardNumber,
            price: price,
            imageDataUrl: imageDataUrl,
            ocrResult: ocrResult
          };
        } catch (nameOnlyError) {
          // Return what we have even without price
          return {
            cardName: ocrResult.cardName,
            cardNumber: ocrResult.cardNumber,
            price: null,
            imageDataUrl: imageDataUrl,
            ocrResult: ocrResult
          };
        }
      }
    }
    
    // We have a card name but no number
    if (ocrResult.cardName && !ocrResult.cardNumber) {
      console.log('OCR detected card name but no card number');
      
      try {
        const price = await getCardPriceFromCardMarket(ocrResult.cardName);
        
        return {
          cardName: ocrResult.cardName,
          cardNumber: "Nummer nicht erkannt",
          price: price,
          imageDataUrl: imageDataUrl,
          ocrResult: ocrResult
        };
      } catch (priceError) {
        console.error('Price lookup failed:', priceError);
        
        return {
          cardName: ocrResult.cardName,
          cardNumber: "Nummer nicht erkannt",
          price: null,
          imageDataUrl: imageDataUrl,
          ocrResult: ocrResult
        };
      }
    }
    
    // In case we somehow have a number but no name
    if (!ocrResult.cardName && ocrResult.cardNumber) {
      return {
        cardName: "Kartenname nicht erkannt",
        cardNumber: ocrResult.cardNumber,
        price: null,
        imageDataUrl: imageDataUrl,
        ocrResult: ocrResult
      };
    }

    // If both name and number are missing
    return {
      cardName: "Text nicht erkannt",
      cardNumber: "Bitte erneut versuchen",
      price: null,
      imageDataUrl: imageDataUrl,
      ocrResult: ocrResult
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
