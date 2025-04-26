
import { adaptivePreprocess } from './preprocessingSteps/adaptivePreprocess';
import { applyBlur } from './preprocessingSteps/blurProcessor';
import { applyContrast } from './preprocessingSteps/contrastProcessor';
import { createImageContext } from './preprocessingSteps/imageContext';
import { ImageQualityResult } from '../types';
import { assessImageQuality } from '../quality/imageQualityAssessor';
import { toast } from '@/hooks/use-toast';
import { applyUnsharpMask } from './preprocessingSteps/unsharpMask';
import { adaptiveLocalContrast } from './preprocessingSteps/adaptiveLocalContrast';
import { applyBinaryThreshold } from './preprocessingSteps/binaryThreshold';

/**
 * Enhanced preprocessing for Pokémon card images with improved noise reduction
 * and text preservation techniques
 */
export const preprocessImage = async (imageDataUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    console.log('Starting image preprocessing...');
    
    const img = new Image();
    img.onload = () => {
      try {
        console.log('Image loaded, dimensions:', img.width, 'x', img.height);
        
        // Create image context and assess quality
        const imageContext = createImageContext(img);
        console.log('Created image context');
        
        const quality = assessImageQuality(imageContext.imageData);
        console.log('Image quality assessment:', quality);
        
        if (quality.message) {
          toast({
            title: "Bildqualität",
            description: quality.message,
            variant: "default"
          });
        }
        
        // Apply processing pipeline
        const canvas = imageContext.canvas;
        const ctx = imageContext.ctx;
        
        // Enhanced preprocessing steps with optimization for OCR
        // Step 1: Apply increased contrast (30% boost)
        ctx.putImageData(applyContrast(imageContext.imageData, quality, 1.3), 0, 0);
        console.log('Applied boosted contrast (30%)');
        
        // Step 2: Apply unsharp mask for text sharpening
        ctx.putImageData(applyUnsharpMask(ctx.getImageData(0, 0, canvas.width, canvas.height), 1.5, 2.0), 0, 0);
        console.log('Applied unsharp mask filter');
        
        // Step 3: Apply binary thresholding with ~140 threshold
        ctx.putImageData(applyBinaryThreshold(ctx.getImageData(0, 0, canvas.width, canvas.height), 140), 0, 0);
        console.log('Applied binary thresholding');
        
        // Step 4: Apply final adaptive local contrast
        const enhancedImage = adaptiveLocalContrast(canvas);
        
        console.log('Preprocessing completed successfully');
        resolve(enhancedImage);
        
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
