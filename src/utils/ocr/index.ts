
import { CardOcrResult } from './types';
import { scanCardWithGoogleVision } from '../googleVisionOcr';
import { PSM } from 'tesseract.js';
import { toast } from '@/hooks/use-toast';

export * from './types';

export const processCardWithOcr = async (
  imageDataUrl: string,
  cardEdges?: { topLeft: {x: number, y: number}, topRight: {x: number, y: number}, bottomRight: {x: number, y: number}, bottomLeft: {x: number, y: number} } | null,
  useStrictCrop: boolean = false
): Promise<CardOcrResult> => {
  try {
    // Use Google Vision OCR instead of Tesseract
    const visionResult = await scanCardWithGoogleVision(imageDataUrl);

    return {
      cardName: visionResult.cardName,
      cardNumber: visionResult.cardNumber,
      rawText: visionResult.fullText,
      confidence: visionResult.confidence * 100  // Convert to percentage
    };

  } catch (error) {
    console.error('OCR processing error:', error);
    
    toast({
      title: "OCR Verarbeitung fehlgeschlagen",
      description: "Kartentext konnte nicht analysiert werden.",
      variant: "destructive"
    });

    return {
      cardName: null,
      cardNumber: null,
      rawText: '',
      confidence: 0
    };
  }
};
