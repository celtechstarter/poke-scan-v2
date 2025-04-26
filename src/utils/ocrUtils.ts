
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
  // Top region - Card name - Refined and narrowed down for better precision
  {
    name: 'cardName',
    top: 4.5, // Slightly lower to avoid card border
    left: 18, // More centered on actual name position
    width: 64, // Narrower to focus on just the name
    height: 8.5 // Smaller height to avoid capturing unwanted elements
  },
  // Bottom region - Card number and set - Adjusted for better set code capture
  {
    name: 'cardNumber',
    top: 88.5, // Slightly higher to ensure we get the complete set info
    left: 6.5, // Better positioned for left-aligned set codes
    width: 30, // Narrower to focus on the set code area
    height: 8 // Optimized height for set code text
  }
];

// Additional region for energy type (can help identify and confirm certain cards)
const ADDITIONAL_REGIONS: OcrRegion[] = [
  // Energy type region - top right
  {
    name: 'energyType',
    top: 5,
    left: 85,
    width: 10,
    height: 10
  }
];

/**
 * Creates and initializes a Tesseract worker optimized for Pokémon card text
 * Now using both German and English languages for better mixed text recognition
 * @returns Initialized Tesseract worker
 */
export const initOcrWorker = async () => {
  // Initialize with German + English languages for better mixed text recognition
  const worker = await createWorker('deu+eng', 1, {
    logger: import.meta.env.DEV 
      ? m => console.log(m) 
      : undefined
  });
  
  // Optimized OCR parameters for Pokémon card fonts and mixed language text
  await worker.setParameters({
    preserve_interword_spaces: '1',
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-/. äöüÄÖÜß',
    tessedit_pageseg_mode: PSM.SPARSE_TEXT, // Changed to SPARSE_TEXT for better handling of separated text blocks
    tessjs_create_hocr: '0',
    tessjs_create_tsv: '0',
    tessjs_create_box: '0',
    tessjs_create_unlv: '0',
    tessjs_create_osd: '0',
  });
  
  return worker;
};

/**
 * Enhanced preprocessing for Pokémon card images with improved noise reduction
 * and text preservation techniques
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
      
      // Apply simple blur before thresholding to reduce noise
      const blurredData = new Uint8ClampedArray(data.length);
      const kernelSize = 3; // 3x3 blur kernel
      const offset = Math.floor(kernelSize / 2);
      
      for (let y = offset; y < canvas.height - offset; y++) {
        for (let x = offset; x < canvas.width - offset; x++) {
          let rSum = 0, gSum = 0, bSum = 0;
          let count = 0;
          
          // Average surrounding pixels
          for (let ky = -offset; ky <= offset; ky++) {
            for (let kx = -offset; kx <= offset; kx++) {
              const idx = ((y + ky) * canvas.width + (x + kx)) * 4;
              rSum += data[idx];
              gSum += data[idx + 1];
              bSum += data[idx + 2];
              count++;
            }
          }
          
          const outIdx = (y * canvas.width + x) * 4;
          blurredData[outIdx] = rSum / count;
          blurredData[outIdx + 1] = gSum / count;
          blurredData[outIdx + 2] = bSum / count;
          blurredData[outIdx + 3] = data[outIdx + 3];
        }
      }
      
      // Process blurred image with enhanced thresholding
      for (let i = 0; i < blurredData.length; i += 4) {
        // Convert to grayscale using luminance formula
        const gray = 0.299 * blurredData[i] + 0.587 * blurredData[i + 1] + 0.114 * blurredData[i + 2];
        
        // Apply contrast enhancement
        const contrast = 2.0;
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        let newValue = Math.min(255, Math.max(0, factor * (gray - 128) + 128));
        
        // Apply lower threshold for better text preservation
        const threshold = 150; // Lowered from 180 to 150
        const finalValue = newValue > threshold ? 255 : 0;
        
        // Set RGB channels to the processed value
        data[i] = finalValue;
        data[i + 1] = finalValue;
        data[i + 2] = finalValue;
        // Alpha channel remains unchanged
      }
      
      // Put the processed image data back to canvas
      ctx.putImageData(imageData, 0, 0);
      
      // Convert canvas to data URL with high quality
      resolve(canvas.toDataURL('image/png', 1.0));
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for preprocessing'));
    };
    
    img.src = imageDataUrl;
  });
};

/**
 * Extracts and enhances a specific region from a card image
 * @param imageDataUrl Data URL of the full image
 * @param region Region definition (percentages of image dimensions)
 * @returns Data URL of the enhanced cropped region
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
      
      // Set canvas dimensions to match region with slight padding for better recognition
      const padding = 2; // Extra pixels around the region
      canvas.width = width + (padding * 2);
      canvas.height = height + (padding * 2);
      
      // Fill with white background to improve contrast
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw only the region of interest with padding
      ctx.drawImage(
        img,
        Math.max(0, x - padding), 
        Math.max(0, y - padding), 
        width + (padding * 2), 
        height + (padding * 2),
        0, 0, canvas.width, canvas.height
      );
      
      // Apply region-specific processing
      // For example, extra contrast for set numbers
      if (region.name === 'cardNumber') {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Higher contrast for set numbers which are usually smaller text
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          const contrast = 2.5; // Higher contrast for set numbers
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
          const newValue = Math.min(255, Math.max(0, factor * (gray - 128) + 128));
          
          // Lower threshold for set numbers to capture more detail
          const threshold = 165;
          const finalValue = newValue > threshold ? 255 : 0;
          
          data[i] = finalValue;
          data[i + 1] = finalValue;
          data[i + 2] = finalValue;
        }
        
        ctx.putImageData(imageData, 0, 0);
      }
      
      // Convert canvas to data URL with high quality
      resolve(canvas.toDataURL('image/png', 1.0));
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for region extraction'));
    };
    
    img.src = imageDataUrl;
  });
};

/**
 * Process a card image using OCR with enhanced region processing and
 * specialized handling for Pokémon card text format
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
    console.log('OCR worker initialized with optimized German language support');
    
    // Process each primary region of interest with multiple recognition attempts
    for (const region of CARD_REGIONS) {
      console.log(`Processing region: ${region.name}`);
      
      try {
        // Extract and preprocess just the region of interest
        const regionImage = await extractRegion(imageDataUrl, region);
        const processedImage = await preprocessImage(regionImage);
        
        // First recognition attempt with default settings
        let recognitionResult = await worker.recognize(processedImage);
        
        // If confidence is low, try with different PSM mode
        if (recognitionResult.data.confidence < 60) {
          await worker.setParameters({
            tessedit_pageseg_mode: region.name === 'cardName' ? PSM.SINGLE_BLOCK : PSM.SINGLE_LINE
          });
          
          // Second recognition attempt
          recognitionResult = await worker.recognize(processedImage);
          
          // Reset PSM mode for next region
          await worker.setParameters({
            tessedit_pageseg_mode: PSM.SINGLE_LINE
          });
        }
        
        const { data } = recognitionResult;
        
        console.log(`OCR result for ${region.name}:`, {
          text: data.text.trim(),
          confidence: data.confidence
        });
        
        // Store recognized text based on region
        if (region.name === 'cardName' && data.text.trim()) {
          result.cardName = data.text.trim();
        } else if (region.name === 'cardNumber' && data.text.trim()) {
          result.cardNumber = data.text.trim();
        }
        
        // Add to raw text
        result.rawText += data.text.trim() + '\n';
        
        // Update confidence (average of all regions)
        result.confidence = (result.confidence + data.confidence) / 2;
      } catch (regionError) {
        console.error(`Error processing region ${region.name}:`, regionError);
      }
    }
    
    // Process additional regions if desired
    // This is optional but can help with card identification
    for (const region of ADDITIONAL_REGIONS) {
      try {
        const regionImage = await extractRegion(imageDataUrl, region);
        const { data } = await worker.recognize(regionImage);
        
        // Add to raw text but don't affect main result
        result.rawText += `${region.name}: ${data.text.trim()}\n`;
      } catch (error) {
        // Silently ignore errors in additional regions
      }
    }
    
    // Perform final cleanup of recognized text
    const cleanedResult = cleanupOcrResults(result);
    
    // Cleanup worker
    await worker.terminate();
    
    return cleanedResult;
  } catch (error) {
    console.error('OCR processing error:', error);
    throw new Error(`OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Enhanced cleanup of OCR results specifically tailored for Pokémon cards
 * Utilizes knowledge of common card formats and text patterns
 * @param ocrResult Raw OCR result
 * @returns Cleaned OCR result
 */
export const cleanupOcrResults = (ocrResult: CardOcrResult): CardOcrResult => {
  const result = { ...ocrResult };
  
  if (result.cardName) {
    // Comprehensive name cleanup for Pokémon cards
    result.cardName = result.cardName
      .replace(/\n/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/^[^a-zA-ZäöüÄÖÜß]+/, '') // Remove non-alphabetic characters at start
      .replace(/^(V|v)(\s+)/, 'V') // Fix common "V" prefix spacing issues
      .replace(/^(GX|EX|ex|gx)(\s+)/, '') // Remove standalone GX/EX prefixes
      .trim();
      
    // Fix common OCR mistakes for German Pokémon cards
    result.cardName = result.cardName
      .replace(/Vitalitat/g, 'Vitalität')
      .replace(/Prof\.(\S)/g, 'Prof. $1') // Ensure space after "Prof."
      .replace(/(\w)\.(\w)/g, '$1. $2') // Fix missing spaces after periods
      .replace(/Pikachu/i, 'Pikachu') // Correct common Pokémon names
      .replace(/Charizard/i, 'Glurak') // German name for Charizard
      .replace(/ü/g, 'ü')  // Fix potential encoding issues with umlauts
      .replace(/ä/g, 'ä')
      .replace(/ö/g, 'ö')
      .replace(/ß/g, 'ß');
      
    // Handle common naming patterns in Pokémon cards
    if (result.cardName.length < 3) {
      // Too short to be a valid name, likely an error
      result.cardName = null;
    } else if (result.cardName.length > 30) {
      // Too long, probably contains extra text
      // Try to extract just the Pokémon name (usually first 1-2 words)
      const nameParts = result.cardName.split(' ');
      if (nameParts.length > 2) {
        result.cardName = nameParts.slice(0, 2).join(' ');
      }
    }
  }
  
  if (result.cardNumber) {
    // Enhanced set number pattern recognition
    // Match patterns like:
    // - "PAR DE 256/182"
    // - "SV01 123/198" 
    // - "SM10 77/214"
    // - "SWS 065/196"
    const setNumberRegex = /([A-Z]{2,5})[- ]?(?:DE|EN)?[- ]?(\d+)\/(\d+)/i;
    const match = result.cardNumber.match(setNumberRegex);
    
    if (match) {
      // Format consistently as "SET NNN/NNN"
      result.cardNumber = `${match[1].toUpperCase()} ${match[2]}/${match[3]}`;
    } else {
      // Try alternative regex for trickier formats
      const altRegex = /([A-Z]{1,5})[^0-9]*(\d+)[^0-9]*(\d+)/i;
      const altMatch = result.cardNumber.match(altRegex);
      
      if (altMatch) {
        result.cardNumber = `${altMatch[1].toUpperCase()} ${altMatch[2]}/${altMatch[3]}`;
      } else {
        // Just clean up spaces if no pattern match
        result.cardNumber = result.cardNumber
          .replace(/\n/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim();
      }
    }
    
    // Final validation for unreasonable card numbers
    if (result.cardNumber.length < 4 || result.cardNumber.length > 15) {
      // Likely not a valid card number
      result.cardNumber = null;
    }
  }
  
  return result;
};
