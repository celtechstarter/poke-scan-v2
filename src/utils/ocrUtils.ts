
import { createWorker, PSM } from 'tesseract.js';

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

// Refined regions of interest for a Pokemon card
// Values are percentages of the image dimensions
const CARD_REGIONS: OcrRegion[] = [
  // Top region - Card name - Adjusted for better name capture
  {
    name: 'cardName',
    top: 3,
    left: 15,
    width: 70,
    height: 12
  },
  // Bottom region - Card number and set - Adjusted for better set code capture
  {
    name: 'cardNumber',
    top: 88,
    left: 5,
    width: 35,
    height: 10
  }
];

/**
 * Creates and initializes a Tesseract worker
 * @returns Initialized Tesseract worker
 */
export const initOcrWorker = async () => {
  // We explicitly set 'deu' (German) as the ONLY primary language to ensure German cards are processed correctly
  const worker = await createWorker('deu', 1, {
    logger: process.env.NODE_ENV === 'development' 
      ? m => console.log(m) 
      : undefined
  });
  
  // Enhanced OCR parameters for Pokemon cards - especially for German text
  await worker.setParameters({
    preserve_interword_spaces: '1',
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-/. äöüÄÖÜß',
    tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
    tessjs_create_hocr: '0',
    tessjs_create_tsv: '0',
    tessjs_create_box: '0',
    tessjs_create_unlv: '0',
    tessjs_create_osd: '0',
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
    // Improve name cleanup for German/special characters
    result.cardName = result.cardName
      .replace(/\n/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/^[^a-zA-ZäöüÄÖÜß]+/, '') // Remove non-alphabetic characters at the start
      .trim();
      
    // Fix common OCR mistakes for German cards
    result.cardName = result.cardName
      .replace(/Vitalitat/g, 'Vitalität')
      .replace(/Prof\.(\S)/g, 'Prof. $1'); // Ensure space after "Prof."
  }
  
  if (result.cardNumber) {
    // Improved cleanup for set numbers
    // Match common patterns like "PAR DE 256/182" or similar formats
    const setNumberRegex = /([A-Z]{2,5})\s?(?:DE|EN)?\s?(\d+)\/(\d+)/i;
    const match = result.cardNumber.match(setNumberRegex);
    
    if (match) {
      // Format consistently: e.g., "PAR 256/182"
      result.cardNumber = `${match[1].toUpperCase()} ${match[2]}/${match[3]}`;
    } else {
      // If no match, just clean up spaces
      result.cardNumber = result.cardNumber
        .replace(/\n/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
    }
  }
  
  return result;
};
