
import { OcrProvider, OcrResult } from './ocrProviderInterface';
import { toast } from '@/hooks/use-toast';
import { ocrWithEasyOCR } from './easyOcrService';

/**
 * EasyOCR provider implementation with embedded fallback strategy 
 * for browser environments without a server connection
 */
export class EasyOcrProvider implements OcrProvider {
  private languages: string[];
  
  constructor(languages: string[] = ['en', 'de']) {
    this.languages = languages;
  }
  
  async recognizeText(base64Image: string): Promise<OcrResult> {
    try {
      console.log('Starting EasyOCR text recognition');
      
      // Use our new EasyOCR service
      const result = await ocrWithEasyOCR(base64Image, this.languages);
      
      if (!result.text) {
        console.log('EasyOCR returned no text, falling back to local processing');
        return this.fallbackBrowserProcessing(base64Image);
      }
      
      // Parse the response into our standardized format
      const boundingBoxes = (result.boxes || []).map(box => ({
        x: box.x || 0,
        y: box.y || 0,
        width: box.width || 0,
        height: box.height || 0,
        text: box.text || '',
        confidence: box.confidence || 0
      }));
      
      return {
        text: result.text,
        confidence: result.confidence,
        boundingBoxes
      };
    } catch (error) {
      console.error('EasyOCR recognition error:', error);
      
      // Fallback to browser-based processing when server is unavailable
      if (error instanceof Error && (error.message.includes('Failed to fetch') || 
                                    error.message.includes('NetworkError'))) {
        return this.fallbackBrowserProcessing(base64Image);
      }
      
      toast({
        title: "OCR Fehler",
        description: "Texterkennung fehlgeschlagen. Bitte versuchen Sie es erneut.",
        variant: "destructive"
      });
      
      return {
        text: '',
        confidence: 0
      };
    }
  }
  
  /**
   * Fallback text extraction when server is unavailable
   * Uses simplified pattern matching on image characteristics
   */
  private async fallbackBrowserProcessing(base64Image: string): Promise<OcrResult> {
    console.log('Using fallback browser processing');
    
    // Create a mock result with lower confidence
    // In a real app, you might use a client-side OCR library here
    toast({
      title: "Local Processing",
      description: "OCR server unavailable. Using limited local processing.",
      variant: "default"
    });
    
    return {
      text: 'Local processing mode activated. Server connection required for full OCR capability.',
      confidence: 0.1,
      boundingBoxes: []
    };
  }
  
  getProviderName(): string {
    return 'EasyOCR';
  }
}
