
import { createCanvasWithContext2D } from '@/utils/canvas/safeCanvasContext';
import { OcrRegion } from '../types';
import { CARD_REGIONS } from '../regions';

/**
 * Extracts specific regions from an image for targeted OCR processing
 * @param imageDataUrl Base64 encoded image URL
 * @param region Region to extract (percentages of image dimensions)
 * @returns Promise<string> Base64 encoded image of extracted region
 */
export const extractRegion = async (imageDataUrl: string, region: OcrRegion): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      try {
        const width = img.width;
        const height = img.height;
        
        // Calculate region dimensions based on percentages
        const regionX = Math.floor(width * (region.left / 100));
        const regionY = Math.floor(height * (region.top / 100));
        const regionWidth = Math.floor(width * (region.width / 100));
        const regionHeight = Math.floor(height * (region.height / 100));
        
        // Create canvas for the region
        const { canvas, ctx } = createCanvasWithContext2D(regionWidth, regionHeight, { willReadFrequently: true });
        
        // Draw only the selected region
        ctx.drawImage(
          img,
          regionX, regionY, regionWidth, regionHeight,  // Source coordinates and dimensions
          0, 0, regionWidth, regionHeight              // Destination coordinates and dimensions
        );
        
        // Convert to Base64
        const regionImageUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve(regionImageUrl);
        
      } catch (error) {
        console.error('Region extraction failed:', error);
        reject(new Error(`Failed to extract region: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for region extraction'));
    };
    
    img.src = imageDataUrl;
  });
};
