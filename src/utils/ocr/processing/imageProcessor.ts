
import { adaptivePreprocess } from './preprocessingSteps/adaptivePreprocess';
import { applyBlur } from './preprocessingSteps/blurProcessor';
import { applyContrast } from './preprocessingSteps/contrastProcessor';
import { createImageContext } from './preprocessingSteps/imageContext';
import { ImageQualityResult } from '../types';
import { assessImageQuality } from '../quality/imageQualityAssessor';

/**
 * Enhanced preprocessing for Pokémon card images with improved noise reduction
 * and text preservation techniques
 */
export const preprocessImage = async (imageDataUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const { canvas, ctx, imageData } = createImageContext(img);
        
        // Get image quality assessment
        const quality = assessImageQuality(imageData);
        
        // Apply preprocessing steps sequentially
        const blurredData = applyBlur(imageData, quality);
        const processedData = adaptivePreprocess(blurredData, quality);
        const finalData = applyContrast(processedData, quality);
        
        ctx.putImageData(finalData, 0, 0);
        resolve(canvas.toDataURL('image/png', 1.0));
      } catch (error) {
        reject(new Error('Image preprocessing failed: ' + error));
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for preprocessing'));
    };
    
    img.src = imageDataUrl;
  });
};
