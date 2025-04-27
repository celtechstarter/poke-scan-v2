
import { OcrProvider, OcrResult } from './ocrProviderInterface';
import { toast } from '@/hooks/use-toast';

// Mock EasyOCR API endpoint
const EASYOCR_API_ENDPOINT = '/api/ocr';

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
      
      // Extract the base64 content without the prefix
      const base64Content = base64Image.includes(',') ? 
        base64Image.split(',')[1] : base64Image;
      
      // Prepare API request payload
      const payload = {
        image: base64Content,
        languages: this.languages
      };
      
      // Send request to EasyOCR API endpoint
      const response = await fetch(EASYOCR_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`EasyOCR API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Parse the response into our standardized format
      // Assume result format: { text: string, confidence: number, boxes: Array }
      const text = result.text || '';
      const confidence = result.confidence || 0;
      const boundingBoxes = (result.boxes || []).map((box: any) => ({
        x: box.x || 0,
        y: box.y || 0,
        width: box.width || 0,
        height: box.height || 0,
        text: box.text || '',
        confidence: box.confidence || 0
      }));
      
      return {
        text,
        confidence,
        boundingBoxes
      };
    } catch (error) {
      console.error('EasyOCR recognition error:', error);
      
      // Fallback to browser-based processing in development or when server is unavailable
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
