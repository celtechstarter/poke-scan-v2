
import { ImageQualityResult } from '../../types';
import { applyContrast } from './contrastProcessor';
import { applyUnsharpMask } from './unsharpMask';
import { applyBinaryThreshold } from './binaryThreshold';
import { createCanvasWithContext2D } from '@/utils/canvas/safeCanvasContext';

/**
 * Optimizes an image for OCR by applying a series of aggressive preprocessing steps
 * @param imageDataUrl Base64 encoded image URL
 * @returns Promise<string> Optimized Base64 image URL
 */
export const optimizeImageForOcr = async (imageDataUrl: string): Promise<string> => {
  console.log('Starting aggressive OCR image optimization...');
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = async () => {
      try {
        // Create canvas with safe context
        const { canvas, ctx } = createCanvasWithContext2D(img.width, img.height, { willReadFrequently: true });
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Step 1: Apply stronger unsharp mask for text sharpening (factor 2.0)
        imageData = applyUnsharpMask(imageData, 2.0, 2.5);
        ctx.putImageData(imageData, 0, 0);
        
        // Step 2: Enhance contrast by 50%
        const quality: ImageQualityResult = {
          isBlurry: false,
          poorLighting: true, // Force higher contrast enhancement
          message: null
        };
        imageData = applyContrast(imageData, quality, 1.5);
        ctx.putImageData(imageData, 0, 0);
        
        // Step 3: Apply binary thresholding with lower threshold (130) for better text extraction
        imageData = applyBinaryThreshold(ctx.getImageData(0, 0, canvas.width, canvas.height), 130);
        ctx.putImageData(imageData, 0, 0);
        
        // Convert to Base64 with slight compression (80% quality)
        const optimizedImageUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(optimizedImageUrl);
        
      } catch (error) {
        console.error('Image optimization failed:', error);
        reject(new Error(`Failed to optimize image: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for optimization'));
    };
    
    img.src = imageDataUrl;
  });
};
