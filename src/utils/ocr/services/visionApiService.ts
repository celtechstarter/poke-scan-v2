
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
    confidence?: number;
  }>;
}

export async function callGoogleVisionApi(base64Content: string): Promise<VisionApiResponse> {
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
        languageHints: ['de', 'en']
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
