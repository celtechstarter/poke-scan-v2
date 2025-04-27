
import { toast } from '@/hooks/use-toast';

/**
 * Base URL for the EasyOCR service
 * Uses environment variable if available, otherwise defaults to the deployed OCR service
 */
const EASY_OCR_ENDPOINT = import.meta.env.VITE_EASY_OCR_ENDPOINT || 'https://poke-scan-v2.onrender.com/ocr';

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
    
    // Show loading toast for cold starts
    const loadingToast = toast({
      title: "OCR Service wird gestartet",
      description: "Der erste Scan kann bis zu 30 Sekunden dauern...",
      variant: "default",
    });
    
    // Extract the base64 content without the prefix
    const base64Content = base64Image.includes(',') ? 
      base64Image.split(',')[1] : base64Image;
    
    // Prepare request payload
    const payload = {
      base64Image: base64Image,  // Send full base64 string with data URL prefix
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
    
    // Dismiss the loading toast
    loadingToast.dismiss();
    
    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 503 || response.status === 504) {
        toast({
          title: "OCR Service startet",
          description: "Server wird aufgeweckt. Bitte in 30 Sekunden erneut versuchen.",
          variant: "default"
        });
      }
      throw new Error(`EasyOCR API error (${response.status}): ${errorText}`);
    }
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(`EasyOCR processing error: ${result.error}`);
    }
    
    // If we get here, OCR was successful
    toast({
      title: "Text erkannt",
      description: result.text ? "OCR erfolgreich abgeschlossen" : "Kein Text gefunden",
      variant: result.text ? "default" : "destructive"
    });
    
    return {
      text: result.text || '',
      confidence: result.confidence || 0,
      boxes: result.boxes || []
    };
  } catch (error) {
    console.error('EasyOCR service error:', error);
    
    // Show error toast only if it's not an abort error
    if (error instanceof Error && !error.message.includes('abort')) {
      if (error.message.includes('timeout')) {
        toast({
          title: "Zeitüberschreitung",
          description: "OCR Server antwortet nicht. Bitte später erneut versuchen.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "OCR Fehler",
          description: "Texterkennung fehlgeschlagen. Bitte versuchen Sie es erneut.",
          variant: "destructive"
        });
      }
    }
    
    // Return an empty result
    return {
      text: '',
      confidence: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
