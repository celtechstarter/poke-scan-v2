
import { CardOcrResult } from './types';
import { scanCardWithGoogleVision } from '../googleVisionOcr';
import { toast } from '@/hooks/use-toast';

export * from './types';

/**
 * Process a card image with Google Cloud Vision OCR
 * 
 * @param imageDataUrl Base64 encoded image data
 * @param cardEdges Optional card edges for region cropping
 * @param useStrictCrop Whether to strictly crop to card edges
 * @returns OCR result with card information
 */
export const processCardWithOcr = async (
  imageDataUrl: string,
  cardEdges?: { topLeft: {x: number, y: number}, topRight: {x: number, y: number}, bottomRight: {x: number, y: number}, bottomLeft: {x: number, y: number} } | null,
  useStrictCrop: boolean = false
): Promise<CardOcrResult> => {
  try {
    console.log('Starting OCR processing with Google Vision...');
    
    // Extract region of interest if card edges are provided
    let processedImage = imageDataUrl;
    if (cardEdges && useStrictCrop) {
      try {
        const { extractRegion } = await import('./imagePreprocessing');
        processedImage = await extractRegion(imageDataUrl, cardEdges);
        console.log('Card region extracted');
      } catch (extractError) {
        console.error('Region extraction failed, using full image:', extractError);
      }
    }
    
    // Check image size before sending to API
    const imageSizeKB = calculateImageSize(processedImage);
    if (imageSizeKB > 1024) { // Over 1MB
      console.warn(`Large image (${imageSizeKB.toFixed(0)}KB) may increase API costs`);
      try {
        // Reduce image quality to save API costs
        processedImage = await compressImage(processedImage, 0.8); 
        console.log('Image compressed to reduce API costs');
      } catch (compressError) {
        console.error('Image compression failed:', compressError);
      }
    }

    console.log('Sending image to Google Vision API...');
    const visionResult = await scanCardWithGoogleVision(processedImage);
    console.log('OCR processing completed successfully');

    return {
      cardName: visionResult.cardName,
      cardNumber: visionResult.cardNumber,
      rawText: visionResult.fullText,
      confidence: visionResult.confidence * 100  // Convert to percentage
    };

  } catch (error) {
    console.error('OCR processing error:', error);
    
    toast({
      title: "OCR Verarbeitung fehlgeschlagen",
      description: "Kartentext konnte nicht analysiert werden. Bitte versuchen Sie es erneut mit besserer Beleuchtung.",
      variant: "destructive"
    });

    return {
      cardName: null,
      cardNumber: null,
      rawText: '',
      confidence: 0
    };
  }
};

/**
 * Calculate approximate size of base64 image in kilobytes
 */
function calculateImageSize(base64Image: string): number {
  // Remove the data:image/... prefix
  const base64String = base64Image.split(',')[1] || '';
  // Each base64 character represents 6 bits, so 4 characters = 3 bytes
  const sizeInBytes = (base64String.length * 3) / 4;
  return sizeInBytes / 1024; // Convert to KB
}

/**
 * Compress image to reduce size for API transmission
 */
async function compressImage(base64Image: string, quality: number = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };
    
    img.src = base64Image;
  });
}
