
import { createWorker } from 'tesseract.js';

/**
 * OCR configuration for Pokemon card recognition
 */
interface OcrRegion {
  name: string;
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * OCR result from processing a card image
 */
export interface CardOcrResult {
  cardName: string | null;
  cardNumber: string | null;
  rawText: string;
  confidence: number;
}

// Define regions of interest for a Pokemon card
// These values are percentages of the image dimensions
const CARD_REGIONS: OcrRegion[] = [
  // Top region - Pokemon name
  {
    name: 'cardName',
    top: 5,
    left: 20,
    width: 60,
    height: 15
  },
  // Bottom region - Card number and set
  {
    name: 'cardNumber',
    top: 80,
    left: 5,
    width: 40,
    height: 15
  }
];

/**
 * Creates and initializes a Tesseract worker
 * @returns Initialized Tesseract worker
 */
export const initOcrWorker = async () => {
  const worker = await createWorker('eng', 1, {
    logger: process.env.NODE_ENV === 'development' 
      ? m => console.log(m) 
      : undefined
  });
  
  // Set additional configurations for better OCR results
  await worker.setParameters({
    preserve_interword_spaces: '1',
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-/.', 
  });
  
  return worker;
};

/**
 * Process a card image using OCR to extract card name and number
 * @param imageDataUrl Data URL of the card image
 * @returns Recognized card text details
 */
export const processCardWithOcr = async (imageDataUrl: string): Promise<CardOcrResult> => {
  // Initialize result with default values
  const result: CardOcrResult = {
    cardName: null,
    cardNumber: null,
    rawText: '',
    confidence: 0
  };
  
  try {
    const worker = await initOcrWorker();
    
    // Create an image element to get dimensions
    const img = new Image();
    img.src = imageDataUrl;
    
    // Wait for the image to load to get its dimensions
    await new Promise((resolve) => {
      img.onload = resolve;
    });
    
    const width = img.width;
    const height = img.height;
    
    // Process each region of interest
    for (const region of CARD_REGIONS) {
      // Calculate pixel coordinates from percentages
      const rectangle = {
        left: Math.floor(width * (region.left / 100)),
        top: Math.floor(height * (region.top / 100)),
        width: Math.floor(width * (region.width / 100)),
        height: Math.floor(height * (region.height / 100))
      };

      // Recognize text in this region
      const { data } = await worker.recognize(imageDataUrl, { rectangle });
      
      console.log(`OCR result for ${region.name}:`, {
        text: data.text.trim(),
        confidence: data.confidence
      });
      
      // Store recognized text based on region
      if (region.name === 'cardName' && data.text.trim()) {
        result.cardName = data.text.trim();
      } else if (region.name === 'cardNumber' && data.text.trim()) {
        result.cardNumber = data.text.trim();
        // Clean up card number format
        result.cardNumber = result.cardNumber.replace(/\s+/g, ' ').trim();
      }
      
      // Add to raw text
      result.rawText += data.text + '\n';
      
      // Update confidence (average of all regions)
      result.confidence = (result.confidence + data.confidence) / 2;
    }
    
    // Cleanup worker
    await worker.terminate();
    
    return result;
  } catch (error) {
    console.error('OCR processing error:', error);
    throw new Error(`OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Clean up OCR results for better matching with card database
 * @param ocrResult Raw OCR result
 * @returns Cleaned OCR result
 */
export const cleanupOcrResults = (ocrResult: CardOcrResult): CardOcrResult => {
  const result = { ...ocrResult };
  
  if (result.cardName) {
    // Remove common OCR errors and clean up card name
    result.cardName = result.cardName
      .replace(/\n/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }
  
  if (result.cardNumber) {
    // Clean up set number format (e.g., "SV2 039/149" or "SWSH004/073")
    result.cardNumber = result.cardNumber
      .replace(/\n/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }
  
  return result;
};
