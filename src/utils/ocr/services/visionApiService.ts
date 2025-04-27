
import { toast } from '@/hooks/use-toast';

interface VisionApiRequest {
  image: { content: string };
  features: Array<{ type: string }>;
  imageContext?: {
    languageHints?: string[];
  };
}

interface VisionApiResponse {
  fullTextAnnotation?: {
    text: string;
  };
  textAnnotations?: Array<{
    description?: string;
    boundingPoly?: {
      vertices?: Array<{
        x?: number;
        y?: number;
      }>;
    };
    confidence?: number;
  }>;
}

/**
 * Performs OCR on an image using Google Vision API
 * 
 * @param base64Content Base64-encoded image content (without data:image/... prefix)
 * @param languageHints Array of language codes to help OCR (default: German and English)
 * @returns Promise resolving to the extracted text
 */
export async function ocrWithGoogleVision(
  base64Content: string, 
  languageHints: string[] = ['de', 'en']
): Promise<string> {
  const apiKey = import.meta.env.VITE_GOOGLE_VISION_API_KEY;
  
  if (!apiKey) {
    console.error('Missing Google Vision API key');
    toast({
      title: "Konfigurationsfehler",
      description: "Google Vision API-Schlüssel fehlt. Bitte informieren Sie den Administrator.",
      variant: "destructive"
    });
    throw new Error('Missing Google Vision API key');
  }

  const requestPayload = {
    requests: [{
      image: { content: base64Content },
      features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
      imageContext: {
        languageHints
      }
    }]
  };

  const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
    method: 'POST',
    body: JSON.stringify(requestPayload),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Google Vision API error:', errorData);
    throw new Error(`API error: ${response.status} ${errorData?.error?.message || 'Unknown error'}`);
  }

  const result = await response.json();
  const fullText = result.responses[0]?.fullTextAnnotation?.text || '';
  
  return fullText.trim();
}

/**
 * Extended version that returns the full API response for more detailed processing
 */
export async function callGoogleVisionApi(
  base64Content: string, 
  languageHints: string[] = ['de', 'en']
): Promise<VisionApiResponse> {
  const apiKey = import.meta.env.VITE_GOOGLE_VISION_API_KEY;
  
  if (!apiKey) {
    console.error('Missing Google Vision API key');
    toast({
      title: "Konfigurationsfehler",
      description: "Google Vision API-Schlüssel fehlt. Bitte informieren Sie den Administrator.",
      variant: "destructive"
    });
    throw new Error('Missing Google Vision API key');
  }

  const requestPayload = {
    requests: [{
      image: { content: base64Content },
      features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
      imageContext: {
        languageHints
      }
    }]
  };

  const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
    method: 'POST',
    body: JSON.stringify(requestPayload),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Google Vision API error:', errorData);
    throw new Error(`API error: ${response.status} ${errorData?.error?.message || 'Unknown error'}`);
  }

  const result = await response.json();
  return result.responses[0];
}
