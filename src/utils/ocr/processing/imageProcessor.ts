
import { optimizeImageForOcr } from './preprocessingSteps/optimizeForOcr';
import { createCanvasWithContext2D } from '@/utils/canvas/safeCanvasContext';
import { ImageQualityResult } from '../types';
import { assessImageQuality } from '../quality/imageQualityAssessor';
import { toast } from '@/hooks/use-toast';
import { adaptiveLocalContrast } from './preprocessingSteps/adaptiveLocalContrast';

/**
 * Enhanced preprocessing for Pokémon card images with improved noise reduction
 * and text preservation techniques
 */
export const preprocessImage = async (imageDataUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    console.log('Starting image preprocessing...');
    
    const img = new Image();
    img.onload = async () => {
      try {
        console.log('Image loaded, dimensions:', img.width, 'x', img.height);
        
        // Create image context using our safe helper
        const { canvas, ctx } = createCanvasWithContext2D(img.width, img.height, { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        console.log('Created image context');
        
        const quality = assessImageQuality(imageData);
        console.log('Image quality assessment:', quality);
        
        if (quality.message) {
          toast({
            title: "Bildqualität",
            description: quality.message,
            variant: "default"
          });
        }
        
        // Apply optimized OCR preprocessing
        const optimizedImage = await optimizeImageForOcr(imageDataUrl);
        console.log('Applied OCR optimization');
        
        // Final adaptive local contrast enhancement
        try {
          const enhancedImage = await adaptiveLocalContrast(optimizedImage);
          console.log('Preprocessing completed successfully');
          resolve(enhancedImage);
        } catch (contrastError) {
          console.error('Contrast enhancement failed, using optimized image:', contrastError);
          resolve(optimizedImage);
        }
        
      } catch (error) {
        console.error('Preprocessing failed:', error);
        reject(new Error(`Image preprocessing failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    img.onerror = () => {
      console.error('Failed to load image');
      reject(new Error('Failed to load image for preprocessing'));
    };
    
    img.src = imageDataUrl;
  });
};
