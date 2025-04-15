
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
  { name: "Gengar VMAX", number: "SWSH8 057/198" },
  // Removed static reference to Prof. Antiquas Vitalität as a default card
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
    
    // If OCR failed to find both fields but found at least one, try to match with known cards
    if (cleanedOcrResult.cardName || cleanedOcrResult.cardNumber) {
      console.log('Partial OCR success, attempting to match with known cards...');
      
      // Check if we can match with any of the mock cards using partial information
      const matchingCard = mockCards.find(card => {
        // Match by name if we have it - use more accurate fuzzy matching
        if (cleanedOcrResult.cardName) {
          const cardNameLower = card.name.toLowerCase();
          const ocrNameLower = cleanedOcrResult.cardName.toLowerCase();
          
          // Check for direct substring match or significant word overlap
          if (cardNameLower.includes(ocrNameLower) || 
              ocrNameLower.includes(cardNameLower) ||
              // Check for key words match (e.g., "Antiquas" in "Prof. Antiquas Vitalität")
              cardNameLower.split(' ').some(word => 
                word.length > 3 && ocrNameLower.includes(word)) ||
              ocrNameLower.split(' ').some(word => 
                word.length > 3 && cardNameLower.includes(word))) {
            return true;
          }
        }
        
        // Match by number if we have it - more exact matching for set codes
        if (cleanedOcrResult.cardNumber) {
          // Normalize strings for comparison
          const normalizedCardNumber = card.number.replace(/\s+/g, '').toUpperCase();
          const normalizedOcrNumber = cleanedOcrResult.cardNumber.replace(/\s+/g, '').toUpperCase();
          
          // Check if either contains the other
          if (normalizedCardNumber.includes(normalizedOcrNumber) || 
              normalizedOcrNumber.includes(normalizedCardNumber)) {
            return true;
          }
          
          // Check for set code match (e.g., "PAR" in "PAR 256/182")
          const cardSetCode = normalizedCardNumber.match(/^([A-Z]{2,5})/)?.[1];
          const ocrSetCode = normalizedOcrNumber.match(/^([A-Z]{2,5})/)?.[1];
          
          if (cardSetCode && ocrSetCode && cardSetCode === ocrSetCode) {
            return true;
          }
        }
        
        return false;
      });
      
      if (matchingCard) {
        console.log('Found matching card in database:', matchingCard);
        // Use matched card for price lookup
        const price = await getCardPriceFromCardMarket(`${matchingCard.name} ${matchingCard.number}`);
        
        return {
          cardName: matchingCard.name,
          cardNumber: matchingCard.number,
          price: price,
          imageDataUrl: imageDataUrl,
          ocrResult: cleanedOcrResult
        };
      }
    }
    
    // For partial detection, use exactly what was detected - don't use fixed fallback
    let cardName = cleanedOcrResult.cardName || "Text nicht erkannt";
    let cardNumber = cleanedOcrResult.cardNumber || "Nummer nicht erkannt";
    
    // Don't use "Karte nicht erkannt" as a default - use exactly what was detected
    if (cleanedOcrResult.rawText && !cleanedOcrResult.cardName) {
      // Try to extract something useful from the raw text if card name wasn't properly identified
      const rawLines = cleanedOcrResult.rawText.split('\n').filter(line => line.trim().length > 3);
      if (rawLines.length > 0) {
        cardName = `Erkannter Text: ${rawLines[0].trim()}`;
      }
    }
    
    console.log('OCR results without matching:', { cardName, cardNumber });
    
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
    
    // Return a clear error message instead of random card
    return {
      cardName: "Fehler beim Scannen",
      cardNumber: "Bitte erneut versuchen",
      price: null,
      imageDataUrl: imageDataUrl
    };
  }
};
