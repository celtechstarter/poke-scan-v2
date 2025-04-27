
import { toast } from '@/hooks/use-toast';

/**
 * Base URL for the EasyOCR service
 * Uses environment variable if available, otherwise defaults to a deployed OCR service
 */
const EASY_OCR_ENDPOINT = import.meta.env.VITE_EASY_OCR_ENDPOINT || 'https://poke-ocr-service.onrender.com/api/ocr';

/**
 * Interface for the EasyOCR API response
 */
interface EasyOcrResponse {
  text: string;
  confidence: number;
  boxes?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    confidence: number;
  }>;
  error?: string;
}

/**
 * Sends an image to the EasyOCR service for text recognition
 * @param base64Image - The base64-encoded image to process
 * @param languages - Optional array of language codes to use for OCR (defaults to ['en', 'de'])
 * @returns Promise resolving to the OCR result
 */
export async function ocrWithEasyOCR(
  base64Image: string, 
  languages: string[] = ['en', 'de']
): Promise<EasyOcrResponse> {
  try {
    console.log('Sending image to external EasyOCR service...');
    
    // Extract the base64 content without the prefix
    const base64Content = base64Image.includes(',') ? 
      base64Image.split(',')[1] : base64Image;
    
    // Prepare request payload
    const payload = {
      image: base64Content,
      languages: languages
    };
    
    // Send request to EasyOCR API endpoint with increased timeout (30s)
    const response = await fetch(EASY_OCR_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000) // 30 second timeout for OCR processing
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`EasyOCR API error (${response.status}): ${errorText}`);
    }
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(`EasyOCR processing error: ${result.error}`);
    }
    
    return {
      text: result.text || '',
      confidence: result.confidence || 0,
      boxes: result.boxes || []
    };
  } catch (error) {
    console.error('EasyOCR service error:', error);
    
    // Show error toast only if it's not an abort error
    if (error instanceof Error && !error.message.includes('abort')) {
      toast({
        title: "OCR Fehler",
        description: "Texterkennung fehlgeschlagen. Bitte versuchen Sie es erneut.",
        variant: "destructive"
      });
    }
    
    // Return an empty result
    return {
      text: '',
      confidence: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
