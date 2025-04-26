
import { adaptivePreprocess } from './preprocessingSteps/adaptivePreprocess';
import { applyBlur } from './preprocessingSteps/blurProcessor';
import { applyContrast } from './preprocessingSteps/contrastProcessor';
import { createImageContext } from './preprocessingSteps/imageContext';
import { ImageQualityResult } from '../types';
import { assessImageQuality } from '../quality/imageQualityAssessor';
import { toast } from '@/components/ui/use-toast';

/**
 * Enhanced preprocessing for Pokémon card images with improved noise reduction,
 * text preservation techniques, and error handling
 */
export const preprocessImage = async (imageDataUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    console.log('Starting image preprocessing...');
    
    const img = new Image();
    img.onload = () => {
      try {
        console.log('Image loaded, dimensions:', img.width, 'x', img.height);
        
        const imageContext = createImageContext(img);
        console.log('Created image context');
        
        // Get image quality assessment
        const quality = assessImageQuality(imageContext.imageData);
        console.log('Image quality assessment:', quality);
        
        if (quality.message) {
          toast({
            title: "Bildqualität",
            description: quality.message,
            variant: "default"
          });
        }
        
        // Apply preprocessing steps sequentially with error handling
        console.log('Applying blur processing...');
        const blurredData = applyBlur(imageContext.imageData, quality);
        
        console.log('Applying adaptive preprocessing...');
        const processedData = adaptivePreprocess(blurredData, quality);
        
        console.log('Applying contrast enhancement...');
        const finalData = applyContrast(processedData, quality);
        
        // Put the processed data back on the canvas
        imageContext.ctx.putImageData(finalData, 0, 0);
        
        console.log('Preprocessing completed successfully');
        resolve(imageContext.canvas.toDataURL('image/png', 1.0));
        
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
