
import { toast } from '@/hooks/use-toast';
import { scanCardWithAdaptiveStrategy } from './scanCardImage';

export interface VisionOcrResult {
  cardName: string | null;
  cardNumber: string | null;
  fullText: string;
  confidence: number;
}

/**
 * Main entry point for OCR scanning with advanced preprocessing and card-focused strategies
 */
export async function scanCardWithGoogleVision(base64Image: string): Promise<VisionOcrResult> {
  try {
    console.log('Starting card scanning with advanced OCR strategy...');
    
    // Use the new adaptive scanning strategy
    const result = await scanCardWithAdaptiveStrategy(base64Image);
    
    // Check for meaningful results
    if (!result.cardName && !result.cardNumber) {
      toast({
        title: "OCR Ergebnis",
        description: "Kartentext konnte nicht zuverlässig erkannt werden. Versuche es mit besserer Beleuchtung.",
        variant: "destructive"
      });
    } else if (result.confidence < 0.6) {
      toast({
        title: "Niedrige Erkennungsqualität",
        description: "Text wurde mit geringer Zuverlässigkeit erkannt. Versuche es mit besserer Beleuchtung.",
        variant: "default"
      });
    }

    return result;
  } catch (error) {
    console.error('Card OCR Error:', error);
    
    toast({
      title: "OCR Fehler",
      description: "Kartentext konnte nicht erkannt werden. Bitte versuchen Sie es erneut.",
      variant: "destructive"
    });

    return {
      cardName: null,
      cardNumber: null,
      fullText: '',
      confidence: 0
    };
  }
}
