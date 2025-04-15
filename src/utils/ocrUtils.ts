import { createWorker, PSM, createScheduler } from 'tesseract.js';

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
 * Creates and initializes a Tesseract worker with German language support
 * @returns Initialized Tesseract worker
 */
export const initOcrWorker = async () => {
  // We explicitly set 'deu' (German) as the ONLY primary language to ensure German cards are processed correctly
  const worker = await createWorker('deu', 1, {
    logger: import.meta.env.DEV 
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
 * Preprocesses an image for better OCR text recognition
 * @param imageDataUrl Data URL of the original image
 * @returns Processed image as Data URL
 */
export const preprocessImage = async (imageDataUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not create canvas context'));
        return;
      }
      
      // Set canvas dimensions to match image
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw original image
      ctx.drawImage(img, 0, 0);
      
      // Get image data for processing
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Convert to grayscale and increase contrast
      for (let i = 0; i < data.length; i += 4) {
        // Convert to grayscale using luminance formula
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        
        // Apply contrast enhancement
        // This formula maps values to increase difference between light and dark
        const contrast = 1.5; // Contrast factor
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        const newValue = factor * (gray - 128) + 128;
        
        // Threshold to improve text clarity
        const threshold = 170; // Adjust based on testing
        const finalValue = newValue > threshold ? 255 : 0;
        
        // Set RGB channels to the processed value
        data[i] = finalValue;
        data[i + 1] = finalValue;
        data[i + 2] = finalValue;
        // Alpha channel remains unchanged
      }
      
      // Put the processed image data back to canvas
      ctx.putImageData(imageData, 0, 0);
      
      // Convert canvas to data URL
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for preprocessing'));
    };
    
    img.src = imageDataUrl;
  });
};

/**
 * Extracts a specific region from an image
 * @param imageDataUrl Data URL of the full image
 * @param region Region definition (percentages of image dimensions)
 * @returns Data URL of the cropped region
 */
export const extractRegion = async (
  imageDataUrl: string, 
  region: OcrRegion
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not create canvas context'));
        return;
      }
      
      // Calculate region dimensions in pixels
      const x = Math.floor(img.width * (region.left / 100));
      const y = Math.floor(img.height * (region.top / 100));
      const width = Math.floor(img.width * (region.width / 100));
      const height = Math.floor(img.height * (region.height / 100));
      
      // Set canvas dimensions to match region
      canvas.width = width;
      canvas.height = height;
      
      // Draw only the region of interest
      ctx.drawImage(
        img,
        x, y, width, height,  // Source rectangle
        0, 0, width, height   // Destination rectangle
      );
      
      // Convert canvas to data URL
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for region extraction'));
    };
    
    img.src = imageDataUrl;
  });
};

/**
 * Process a card image using OCR to extract card name and number
 * Enhanced with image preprocessing and region-specific scanning
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
    console.log('OCR worker initialized with German language support');
    
    // Process each region of interest
    for (const region of CARD_REGIONS) {
      console.log(`Processing region: ${region.name}`);
      
      try {
        // Extract and preprocess just the region of interest
        const regionImage = await extractRegion(imageDataUrl, region);
        const processedImage = await preprocessImage(regionImage);
        
        // Recognize text in this region
        const { data } = await worker.recognize(processedImage);
        
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
        result.rawText += data.text.trim() + '\n';
        
        // Update confidence (average of all regions)
        result.confidence = (result.confidence + data.confidence) / 2;
      } catch (regionError) {
        console.error(`Error processing region ${region.name}:`, regionError);
      }
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
 * Improved for German language cards
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
      .replace(/Prof\.(\S)/g, 'Prof. $1') // Ensure space after "Prof."
      .replace(/Antiquus/g, 'Antiquas')   // Fix common misread
      .replace(/ü/g, 'ü')  // Fix potential encoding issues with umlauts
      .replace(/ä/g, 'ä')
      .replace(/ö/g, 'ö')
      .replace(/ß/g, 'ß');
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
