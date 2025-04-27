import { toast } from '@/hooks/use-toast';
import { extractRegion } from './ocr/imagePreprocessing';
import { preprocessImage } from './ocr/processing/imageProcessor';

interface VisionOcrResult {
  cardName: string | null;
  cardNumber: string | null;
  fullText: string;
  confidence: number;
}

/**
 * Sends an image to Google Cloud Vision API for OCR processing
 * Uses DOCUMENT_TEXT_DETECTION for better layout understanding
 * 
 * @param base64Image Base64 encoded image data
 * @returns Processed OCR result with extracted card information
 */
export async function scanCardWithGoogleVision(base64Image: string): Promise<VisionOcrResult> {
  try {
    // Get API key from environment variables
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

    // Preprocess the image to improve OCR quality
    console.log('Preprocessing image for OCR...');
    const optimizedImage = await preprocessImage(base64Image);
    console.log('Image preprocessing complete');
    
    // Remove the data:image/... prefix from base64 string
    const base64Content = optimizedImage.split(',')[1];
    
    // Create the request payload
    const requestPayload = {
      requests: [
        {
          image: { content: base64Content },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION' }], // Better than TEXT_DETECTION for structured content
          imageContext: {
            languageHints: ['de', 'en'] // German and English hints for Pokemon cards
          }
        }
      ]
    };
    
    console.log('Sending request to Google Vision API...');
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
    console.log('Received Vision API response');
    
    // Extract the full text annotation
    const fullText = result.responses[0]?.fullTextAnnotation?.text || '';
    
    // Calculate confidence from text annotations
    let confidence = 0;
    const textAnnotations = result.responses[0]?.textAnnotations || [];
    
    if (textAnnotations.length > 0) {
      // Average confidence from all detections
      const confidenceSum = textAnnotations.reduce((sum: number, annotation: any) => {
        return sum + (annotation.confidence || 0);
      }, 0);
      confidence = confidenceSum / textAnnotations.length;
    }

    // Extract card name and number using specialized functions
    const cardName = extractCardName(fullText);
    const cardNumber = extractCardNumber(fullText);

    return {
      cardName,
      cardNumber,
      fullText,
      confidence: confidence || 0.7 // Default confidence if not provided by API
    };

  } catch (error) {
    console.error('Google Vision OCR Error:', error);
    
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

/**
 * Extracts the card name from OCR text using improved heuristics
 * @param text Full OCR text
 * @returns Extracted card name or null
 */
function extractCardName(text: string): string | null {
  if (!text) return null;
  
  // Split text into lines
  const lines = text.split('\n');
  
  // Pokemon card names are typically in the first few lines
  // Skip empty lines and filter out common non-name text
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const line = lines[i]?.trim();
    
    if (!line || line.length < 2) continue;
    
    // Filter out common non-name patterns
    if (line.match(/^\d+\/\d+$/) || // Set numbers like 123/345
        line.match(/^(HP|KP)\s*\d+$/) || // HP values
        line.match(/^(V|GX|EX)$/) || // Card type indicators
        line.toLowerCase().includes('pokemon') || // "Pokemon" text
        line.toLowerCase().includes('trainer') || // "Trainer" text
        line.match(/^[0-9♢★]+$/) // Symbol-only or number-only lines
    ) {
      continue;
    }
    
    // Valid card name found
    return line;
  }
  
  // No valid name found in first few lines, default to first non-empty line
  return lines.find(line => line.trim().length > 0) || null;
}

/**
 * Extracts the card number from OCR text using improved pattern matching
 * @param text Full OCR text
 * @returns Extracted card number or null
 */
function extractCardNumber(text: string): string | null {
  if (!text) return null;
  
  // Common Pokemon card number formats:
  // - SM01 123/145
  // - 123/145
  // - SV01 EN 123/145
  // - PAR DE 256/182
  
  // Look for set number patterns (prioritize bottom of text)
  const lines = text.split('\n').reverse();
  
  // First try to match the most specific pattern (set code + number)
  const setNumberRegex = /([A-Z]{2,5})\s*([A-Z]{2})?\s*(\d{1,3})\s*\/\s*(\d{1,3})/i;
  
  for (const line of lines) {
    const match = line.match(setNumberRegex);
    if (match) {
      // Format consistently as "SET XX 123/456"
      const setCode = match[1].toUpperCase();
      const langCode = match[2] ? match[2].toUpperCase() : '';
      const cardNum = match[3];
      const setTotal = match[4];
      
      return langCode 
        ? `${setCode} ${langCode} ${cardNum}/${setTotal}` 
        : `${setCode} ${cardNum}/${setTotal}`;
    }
  }
  
  // Try simpler pattern (just numbers)
  const simpleNumberRegex = /(\d{1,3})\s*\/\s*(\d{1,3})/;
  
  for (const line of lines) {
    const match = line.match(simpleNumberRegex);
    if (match) {
      return `${match[1]}/${match[2]}`;
    }
  }
  
  return null;
}
