
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
        
        // Check if the image is mostly empty/white - which could indicate improper framing
        const checkEmptyImage = (img: HTMLImageElement): boolean => {
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
          
          if (!tempCtx) return false;
          
          tempCanvas.width = img.width;
          tempCanvas.height = img.height;
          
          tempCtx.drawImage(img, 0, 0);
          const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
          const data = imageData.data;
          
          let whitePixels = 0;
          let totalSamples = 0;
          
          // Sample pixels (every 10th pixel for efficiency)
          for (let i = 0; i < data.length; i += 40) {
            totalSamples++;
            if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
              whitePixels++;
            }
          }
          
          const whiteRatio = whitePixels / totalSamples;
          return whiteRatio > 0.9; // If more than 90% is white, likely empty
        };
        
        // Check for empty image
        if (checkEmptyImage(img)) {
          toast({
            title: "Scan fehlgeschlagen",
            description: "Karte wurde nicht korrekt erkannt. Bitte neu positionieren und versuchen.",
            variant: "destructive"
          });
          reject(new Error("Card not properly positioned in frame"));
          return;
        }
        
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

