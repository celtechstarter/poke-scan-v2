import { adaptivePreprocess } from './preprocessingSteps/adaptivePreprocess';
import { applyBlur } from './preprocessingSteps/blurProcessor';
import { applyContrast } from './preprocessingSteps/contrastProcessor';
import { createImageContext } from './preprocessingSteps/imageContext';
import { ImageQualityResult } from '../types';
import { assessImageQuality } from '../quality/imageQualityAssessor';
import { toast } from '@/hooks/use-toast';

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
        
        console.log('Applying enhanced contrast...');
        // Use stronger contrast for better text recognition (especially for small printed text)
        const contrastFactor = quality.poorLighting ? 3.2 : 2.8;
        
        // Apply more aggressive thresholding specifically for card text
        const ctx = imageContext.ctx;
        const canvas = imageContext.canvas;
        
        // Apply enhanced contrast
        const enhancedData = new Uint8ClampedArray(processedData.data);
        const factor = (259 * (contrastFactor + 255)) / (255 * (259 - contrastFactor));
        
        for (let i = 0; i < enhancedData.length; i += 4) {
          // Enhanced contrast with lower threshold (140-150) for better text extraction
          for (let c = 0; c < 3; c++) {
            // Apply contrast adjustment
            let newValue = Math.min(255, Math.max(0, factor * (enhancedData[i + c] - 128) + 128));
            
            // Apply thresholding for better text extraction
            if (newValue < 150) { // Lower threshold than before (was 170-180)
              newValue = 0; // Make darker pixels pure black
            } else if (newValue > 220) { // Higher threshold at the top end
              newValue = 255; // Make lighter pixels pure white
            }
            
            enhancedData[i + c] = newValue;
          }
        }
        
        // Create ImageData from the enhanced data
        const finalData = new ImageData(enhancedData, processedData.width, processedData.height);
        
        // Put the processed data back on the canvas
        ctx.putImageData(finalData, 0, 0);
        
        // Apply unsharp mask for better text sharpness
        applyUnsharpMask(ctx, canvas.width, canvas.height, 0.7, 1.0);
        
        console.log('Preprocessing completed successfully');
        resolve(canvas.toDataURL('image/png', 1.0));
        
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

/**
 * Apply unsharp mask filter to sharpen image
 * This significantly improves OCR text recognition for small text
 */
function applyUnsharpMask(ctx: CanvasRenderingContext2D, width: number, height: number, radius: number, strength: number): void {
  // Get original image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const origData = new Uint8ClampedArray(imageData.data);
  
  // Create a simple blur function for the unsharp mask
  const blur = (data: Uint8ClampedArray, radius: number): Uint8ClampedArray => {
    const result = new Uint8ClampedArray(data.length);
    const size = radius * 2 + 1;
    
    // Simple box blur
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0;
        let count = 0;
        
        // Average pixels in the kernel
        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const px = x + kx;
            const py = y + ky;
            
            if (px >= 0 && px < width && py >= 0 && py < height) {
              const idx = (py * width + px) * 4;
              r += data[idx];
              g += data[idx + 1];
              b += data[idx + 2];
              count++;
            }
          }
        }
        
        // Write the blurred result
        const idx = (y * width + x) * 4;
        result[idx] = r / count;
        result[idx + 1] = g / count;
        result[idx + 2] = b / count;
        result[idx + 3] = data[idx + 3]; // Keep alpha unchanged
      }
    }
    
    return result;
  };
  
  // Apply a blur to create the mask
  const blurred = blur(origData, radius);
  
  // Apply the unsharp mask
  for (let i = 0; i < imageData.data.length; i += 4) {
    // For each RGB channel
    for (let c = 0; c < 3; c++) {
      // Calculate the sharpened value: original + (original - blurred) * strength
      const sharpened = origData[i + c] + (origData[i + c] - blurred[i + c]) * strength;
      // Clamp to valid RGB range
      imageData.data[i + c] = Math.max(0, Math.min(255, sharpened));
    }
    // Alpha channel remains unchanged
  }
  
  ctx.putImageData(imageData, 0, 0);
}
