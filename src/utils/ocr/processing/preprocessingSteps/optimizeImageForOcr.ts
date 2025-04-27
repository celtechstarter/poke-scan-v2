import { createCanvasWithContext2D } from '@/utils/canvas/safeCanvasContext';
import { applyUnsharpMask } from './unsharpMask';
import { applyContrast } from './contrastProcessor';
import { applyBinaryThreshold } from './binaryThreshold';
import { assessImageQuality } from '../../quality/imageQualityAssessor';

/**
 * Optimizes an image for OCR by applying aggressive sharpening, contrast enhancement,
 * and adaptive thresholding specifically optimized for Pokémon card text
 * 
 * @param base64Image Base64-encoded image
 * @returns Promise resolving to optimized Base64 image
 */
export async function optimizeImageForOcr(base64Image: string): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log('Starting image optimization for OCR...');
    
    const img = new Image();
    img.onload = async () => {
      try {
        console.log('Image loaded, dimensions:', img.width, 'x', img.height);
        
        // Create canvas for image manipulation
        const { canvas, ctx } = createCanvasWithContext2D(img.width, img.height, { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Assess image quality to determine optimal processing parameters
        const quality = assessImageQuality(imageData);
        console.log('Image quality assessment:', quality);
        
        // 1. Apply unsharp mask with strong factor (2.0-2.5)
        const unsharpFactor = quality.isBlurry ? 2.5 : 2.0; // Use stronger sharpening for blurry images
        imageData = applyUnsharpMask(imageData, unsharpFactor, 1.0);
        console.log(`Applied unsharp mask with factor ${unsharpFactor}`);
        
        // 2. Boost contrast by 50% (1.5 boost factor)
        imageData = applyContrast(imageData, quality, 1.5);
        console.log('Applied contrast enhancement');
        
        // 3. Apply adaptive thresholding
        imageData = applyBinaryThreshold(imageData, 128);
        console.log('Applied binary thresholding');
        
        // 4. Check if we need to invert colors (text should be dark on light background)
        // Count dark vs light pixels to determine if inversion is needed
        let darkPixels = 0;
        let totalPixels = imageData.width * imageData.height;
        
        for (let i = 0; i < imageData.data.length; i += 4) {
          const gray = 0.299 * imageData.data[i] + 0.587 * imageData.data[i + 1] + 0.114 * imageData.data[i + 2];
          if (gray < 128) darkPixels++;
        }
        
        const darkRatio = darkPixels / totalPixels;
        if (darkRatio > 0.7) {
          // Invert the image if it's predominantly dark
          for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] = 255 - imageData.data[i];         // R
            imageData.data[i + 1] = 255 - imageData.data[i + 1]; // G
            imageData.data[i + 2] = 255 - imageData.data[i + 2]; // B
            // Alpha remains unchanged
          }
          console.log('Applied color inversion');
        }
        
        // Put processed image data back to canvas
        ctx.putImageData(imageData, 0, 0);
        
        // Convert to JPEG with 80% quality
        const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        console.log('Image optimization completed');
        
        resolve(optimizedBase64);
      } catch (error) {
        console.error('Image optimization failed:', error);
        reject(error);
      }
    };
    
    img.onerror = (error) => {
      console.error('Failed to load image for optimization:', error);
      reject(new Error('Failed to load image for optimization'));
    };
    
    img.src = base64Image;
  });
}
