
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
        
        // IMPROVED PREPROCESSING FOR CARD TEXT
        // Apply much stronger contrast enhancement for small card text
        const contrastFactor = quality.poorLighting ? 3.2 : 2.8;
        const ctx = imageContext.ctx;
        const canvas = imageContext.canvas;
        
        // Step 1: Subtle blur to remove noise (1.5px radius)
        ctx.filter = 'blur(1.5px)';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.filter = 'none';
        
        // Step 2: Apply unsharp mask for text sharpening
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const sharpenedData = applyUnsharpMask(imageData, 0.5, 2.0);
        ctx.putImageData(sharpenedData, 0, 0);
        
        // Step 3: Optimized contrast enhancement specifically for card text
        const enhancedData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = enhancedData.data;
        const factor = (259 * (contrastFactor + 255)) / (255 * (259 - contrastFactor));
        
        // Apply lower thresholding for card text (140 instead of 170)
        for (let i = 0; i < data.length; i += 4) {
          for (let j = 0; j < 3; j++) {
            let newValue = Math.min(255, Math.max(0, factor * (data[i + j] - 128) + 128));
            
            // More aggressive thresholding for card text
            if (newValue < 140) { // Lower threshold specifically for card text
              newValue = 0; // Make dark pixels pure black
            } else if (newValue > 220) {
              newValue = 255; // Make light pixels pure white
            }
            
            data[i + j] = newValue;
          }
        }
        
        ctx.putImageData(enhancedData, 0, 0);
        
        // Step 4: Additional adaptive local contrast enhancement for text areas
        // This is particularly effective for small set numbers
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

/**
 * Apply unsharp mask filter to enhance small text on cards
 * @param imageData Original image data
 * @param radius Radius for the unsharp mask
 * @param strength Strength of the effect (1.0-3.0)
 * @returns Enhanced image data
 */
function applyUnsharpMask(imageData: ImageData, radius: number, strength: number): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  
  // Create a copy for the blurred version
  const blurred = new Uint8ClampedArray(data.length);
  
  // Simple box blur implementation
  const boxSize = Math.floor(radius * 2) + 1;
  const halfBox = Math.floor(boxSize / 2);
  
  // Apply horizontal blur
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;
      let count = 0;
      
      for (let i = -halfBox; i <= halfBox; i++) {
        const curX = Math.min(Math.max(x + i, 0), width - 1);
        const idx = (y * width + curX) * 4;
        r += data[idx];
        g += data[idx + 1];
        b += data[idx + 2];
        count++;
      }
      
      const idx = (y * width + x) * 4;
      blurred[idx] = r / count;
      blurred[idx + 1] = g / count;
      blurred[idx + 2] = b / count;
      blurred[idx + 3] = data[idx + 3]; // Keep alpha
    }
  }
  
  // Apply vertical blur on the horizontal blur result
  const finalBlur = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;
      let count = 0;
      
      for (let j = -halfBox; j <= halfBox; j++) {
        const curY = Math.min(Math.max(y + j, 0), height - 1);
        const idx = (curY * width + x) * 4;
        r += blurred[idx];
        g += blurred[idx + 1];
        b += blurred[idx + 2];
        count++;
      }
      
      const idx = (y * width + x) * 4;
      finalBlur[idx] = r / count;
      finalBlur[idx + 1] = g / count;
      finalBlur[idx + 2] = b / count;
      finalBlur[idx + 3] = data[idx + 3]; // Keep alpha
    }
  }
  
  // Apply unsharp mask: original + (original - blurred) * strength
  const result = new ImageData(new Uint8ClampedArray(data.length), width, height);
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const val = data[i + c] + (data[i + c] - finalBlur[i + c]) * strength;
      result.data[i + c] = Math.max(0, Math.min(255, val));
    }
    result.data[i + 3] = data[i + 3]; // Keep alpha
  }
  
  return result;
}

/**
 * Apply adaptive local contrast enhancement specifically for text regions
 * This helps with small printed text on Pokémon cards
 */
function adaptiveLocalContrast(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas.toDataURL('image/png');
  
  const width = canvas.width;
  const height = canvas.height;
  
  // Process the top 20% (card name area) and bottom 15% (set number area) with enhanced contrast
  const topRegionHeight = Math.round(height * 0.2);
  const bottomRegionHeight = Math.round(height * 0.15);
  
  // Process top region (card name)
  const topData = ctx.getImageData(0, 0, width, topRegionHeight);
  const enhancedTop = enhanceTextRegion(topData);
  ctx.putImageData(enhancedTop, 0, 0);
  
  // Process bottom region (set number)
  const bottomData = ctx.getImageData(0, height - bottomRegionHeight, width, bottomRegionHeight);
  const enhancedBottom = enhanceTextRegion(bottomData);
  ctx.putImageData(enhancedBottom, 0, height - bottomRegionHeight);
  
  return canvas.toDataURL('image/png', 1.0);
}

/**
 * Enhance text regions with specialized processing for card text
 */
function enhanceTextRegion(imageData: ImageData): ImageData {
  const data = imageData.data;
  
  // Apply specialized text enhancement
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Calculate grayscale value
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    
    // Apply more aggressive thresholding for text
    const threshold = 150; // Optimal for card text
    const newVal = gray < threshold ? 0 : 255;
    
    // Apply to all channels
    data[i] = data[i + 1] = data[i + 2] = newVal;
  }
  
  return imageData;
}
