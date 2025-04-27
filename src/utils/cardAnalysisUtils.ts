
import { CardOcrResult } from './ocr/types';
import { scanCardWithGoogleVision } from './ocr';
import { toast } from '@/hooks/use-toast';
// import { lookupCardPrice } from './cardMarketService';

interface CardAnalysisResult {
  cardName: string;
  cardNumber: string | null;
  price: number | null;
  ocrResult: CardOcrResult;
}

interface CardEdges {
  topLeft: { x: number, y: number };
  topRight: { x: number, y: number };
  bottomRight: { x: number, y: number };
  bottomLeft: { x: number, y: number };
}

export const processCardWithOcr = async (
  imageDataUrl: string,
  cardEdges?: CardEdges | null,
  useStrictCrop: boolean = false
): Promise<CardOcrResult> => {
  try {
    // Process the image with OCR
    console.log('Processing card image with OCR, strict crop =', useStrictCrop);
    
    // Scan the card image with Google Vision OCR
    const ocrResult = await scanCardWithGoogleVision(imageDataUrl);
    
    return {
      cardName: ocrResult.cardName,
      cardNumber: ocrResult.cardNumber,
      rawText: ocrResult.fullText,
      confidence: ocrResult.confidence
    };
  } catch (error) {
    console.error('Error processing card with OCR:', error);
    return {
      cardName: null,
      cardNumber: null,
      rawText: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      confidence: 0
    };
  }
};

export const analyzeCardImage = async (
  imageDataUrl: string,
  cardEdges?: CardEdges | null,
  useStrictCrop: boolean = false
): Promise<CardAnalysisResult> => {
  try {
    // Process the image with OCR
    console.log('Processing card image with OCR, strict crop =', useStrictCrop);
    const ocrResult = await processCardWithOcr(imageDataUrl, cardEdges, useStrictCrop);
    
    // Log the OCR confidence
    console.log(`OCR Confidence: ${ocrResult.confidence}%`);
    
    // Extract card name and number
    const cardName = ocrResult.cardName || "Text nicht erkannt";
    const cardNumber = ocrResult.cardNumber;
    
    // If OCR confidence is too low, provide specific feedback
    if (ocrResult.confidence < 40) {
      toast({
        title: "Niedrige OCR-Konfidenz",
        description: `Konfidenzwert: ${Math.round(ocrResult.confidence)}% - Bitte versuchen Sie erneut mit besserer Beleuchtung.`,
        variant: "destructive",
      });
    }
    
    // Lookup the card price
    let price: number | null = null;
    
    // Commented out as mentioned in the error
    // if (cardName !== "Text nicht erkannt" && cardName !== "Fehler beim Scannen") {
    //   try {
    //     price = await lookupCardPrice(cardName, cardNumber);
    //   } catch (error) {
    //     console.error('Error looking up card price:', error);
    //     toast({
    //       title: "Preisabfrage fehlgeschlagen",
    //       description: "Der Preis konnte nicht ermittelt werden.",
    //     });
    //   }
    // }
    
    // Return the combined result
    return {
      cardName,
      cardNumber,
      price,
      ocrResult
    };
  } catch (error) {
    console.error('Error analyzing card image:', error);
    return {
      cardName: "Fehler beim Scannen",
      cardNumber: null,
      price: null,
      ocrResult: {
        cardName: null,
        cardNumber: null,
        rawText: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0
      }
    };
  }
};
