
import { ImageQualityResult } from '../../types';
import { applyContrast } from './contrastProcessor';
import { applyUnsharpMask } from './unsharpMask';
import { applyBinaryThreshold } from './binaryThreshold';
import { createCanvasWithContext2D } from '@/utils/canvas/safeCanvasContext';

/**
 * Optimizes an image for OCR by applying a series of preprocessing steps
 * @param imageDataUrl Base64 encoded image URL
 * @returns Promise<string> Optimized Base64 image URL
 */
export const optimizeImageForOcr = async (imageDataUrl: string): Promise<string> => {
  console.log('Starting OCR image optimization...');
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      try {
        // Create canvas with safe context
        const { canvas, ctx } = createCanvasWithContext2D(img.width, img.height, { willReadFrequently: true });
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Step 1: Apply unsharp mask for text sharpening (increased from 1.5 to 2.0 for better edge definition)
        imageData = applyUnsharpMask(imageData, 1.5, 2.5);
        ctx.putImageData(imageData, 0, 0);
        console.log('Applied unsharp mask');
        
        // Step 2: Enhance contrast by 40% (increased from 30%)
        const quality: ImageQualityResult = {
          isBlurry: false,
          poorLighting: true, // Force higher contrast enhancement
          message: null
        };
        imageData = applyContrast(imageData, quality, 1.4);
        ctx.putImageData(imageData, 0, 0);
        console.log('Applied contrast enhancement');
        
        // Step 3: Apply binary thresholding with optimized threshold (130 instead of 140 for better text separation)
        imageData = applyBinaryThreshold(ctx.getImageData(0, 0, canvas.width, canvas.height), 130);
        ctx.putImageData(imageData, 0, 0);
        console.log('Applied binary thresholding');
        
        // Convert to Base64
        const optimizedImageUrl = canvas.toDataURL('image/png');
        console.log('Image optimization completed');
        resolve(optimizedImageUrl);
        
      } catch (error) {
        console.error('Image optimization failed:', error);
        reject(new Error(`Failed to optimize image: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    img.onerror = () => {
      console.error('Failed to load image for optimization');
      reject(new Error('Failed to load image for optimization'));
    };
    
    img.src = imageDataUrl;
  });
};
