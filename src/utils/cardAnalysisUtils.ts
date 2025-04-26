
import { processCardWithOcr } from './ocr';
import { lookupCardPrice } from './cardMarketService';

interface CardEdges {
  topLeft: {x: number, y: number};
  topRight: {x: number, y: number};
  bottomRight: {x: number, y: number};
  bottomLeft: {x: number, y: number};
}

/**
 * Analyzes a card image to extract name, number and price information
 * Enhanced with card edge detection support for better region extraction
 */
export const analyzeCardImage = async (
  imageDataUrl: string,
  cardEdges?: CardEdges | null
) => {
  console.log('Analyzing card image...');
  
  try {
    // Process card image with OCR, passing detected edges for better region extraction
    const ocrResult = await processCardWithOcr(imageDataUrl, cardEdges);
    
    // Handle case where OCR couldn't recognize text
    if (!ocrResult.cardName && !ocrResult.cardNumber) {
      console.log('OCR failed to recognize any text in the card');
      return {
        cardName: "Text nicht erkannt",
        cardNumber: null,
        price: null,
        ocrResult: ocrResult
      };
    }
    
    let cardPrice = null;
    
    // Only attempt price lookup if we have a card name
    if (ocrResult.cardName) {
      try {
        // Log detected text before price lookup
        console.log('OCR detected text:', {
          name: ocrResult.cardName,
          number: ocrResult.cardNumber
        });
        
        // Look up card price
        cardPrice = await lookupCardPrice(ocrResult.cardName, ocrResult.cardNumber);
      } catch (priceError) {
        console.error('Error looking up card price:', priceError);
      }
    }
    
    return {
      cardName: ocrResult.cardName || "Fehler beim Scannen",
      cardNumber: ocrResult.cardNumber,
      price: cardPrice,
      ocrResult: ocrResult
    };
  } catch (error) {
    console.error('Card analysis error:', error);
    return {
      cardName: "Fehler beim Scannen",
      cardNumber: null,
      price: null,
      ocrResult: {
        cardName: null,
        cardNumber: null,
        rawText: '',
        confidence: 0
      }
    };
  }
};
