
import { OcrRegion } from '../types';

/**
 * Extracts and enhances a specific region from a card image
 * Enhanced with tighter cropping and background removal
 */
export const extractRegion = async (
  imageDataUrl: string, 
  region: OcrRegion
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not create canvas context'));
          return;
        }
        
        // Calculate region dimensions with a small inward padding to avoid capturing frame edges
        const padding = 2; // Base padding in pixels
        const inwardPaddingFactor = 0.95; // Take 95% of the region to avoid edge artifacts
        
        // Calculate the region with adjusted inward padding
        const regionWidth = Math.floor(img.width * (region.width / 100) * inwardPaddingFactor);
        const regionHeight = Math.floor(img.height * (region.height / 100) * inwardPaddingFactor);
        
        // Center the smaller region within the original coordinates
        const widthDifference = Math.floor(img.width * (region.width / 100)) - regionWidth;
        const heightDifference = Math.floor(img.height * (region.height / 100)) - regionHeight;
        
        const x = Math.floor(img.width * (region.left / 100)) + Math.floor(widthDifference / 2);
        const y = Math.floor(img.height * (region.top / 100)) + Math.floor(heightDifference / 2);
        
        // Set canvas size with padding for clean edges
        canvas.width = regionWidth + (padding * 2);
        canvas.height = regionHeight + (padding * 2);
        
        // Fill with white background first to ensure clean edges
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw only the precise region
        ctx.drawImage(
          img,
          Math.max(0, x - padding), 
          Math.max(0, y - padding), 
          regionWidth + (padding * 2), 
          regionHeight + (padding * 2),
          0, 0, canvas.width, canvas.height
        );
        
        // Apply region-specific enhancements
        if (region.name === 'cardNumber') {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Enhanced contrast and binarization specifically for card numbers
          for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            const contrast = 2.8; // Higher contrast for better number recognition
            const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
            const newValue = Math.min(255, Math.max(0, factor * (gray - 128) + 128));
            
            // Adaptive threshold based on the region type
            const threshold = 170; // Slightly higher threshold for numbers
            const finalValue = newValue > threshold ? 255 : 0;
            
            data[i] = finalValue;
            data[i + 1] = finalValue;
            data[i + 2] = finalValue;
          }
          
          ctx.putImageData(imageData, 0, 0);
        } else if (region.name === 'cardName') {
          // Special processing for card name region
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Different contrast settings for card names
          for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            const contrast = 2.2; // Lower contrast for card names (often larger text)
            const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
            const newValue = Math.min(255, Math.max(0, factor * (gray - 128) + 128));
            
            // Different threshold for card names
            const threshold = 160;
            const finalValue = newValue > threshold ? 255 : 0;
            
            data[i] = finalValue;
            data[i + 1] = finalValue;
            data[i + 2] = finalValue;
          }
          
          ctx.putImageData(imageData, 0, 0);
        }
        
        // Verify the quality of the cropped region
        const isValidRegion = verifyRegionQuality(canvas, ctx);
        
        if (!isValidRegion && (region.name === 'cardName' || region.name === 'cardNumber')) {
          // For critical regions, reject if quality check fails
          reject(new Error('Poor quality region detected. Please ensure the card is centered and well-lit.'));
          return;
        }
        
        resolve(canvas.toDataURL('image/png', 1.0));
      } catch (error) {
        console.error('Error during region extraction:', error);
        reject(new Error(`Failed to extract region: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for region extraction'));
    };
    
    img.src = imageDataUrl;
  });
};

/**
 * Verifies if the extracted region meets quality standards
 * Checks for empty space and noise
 */
function verifyRegionQuality(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): boolean {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Calculate white space percentage
  let whitePixels = 0;
  let totalPixels = canvas.width * canvas.height;
  
  // Sample pixels for efficiency
  for (let i = 0; i < data.length; i += 16) { // Check every 4th pixel
    // If pixel is very bright (close to white)
    if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
      whitePixels++;
    }
  }
  
  const whitePercentage = (whitePixels / (totalPixels / 4)) * 100;
  
  // Check edge contrast (cards should have some contrast on edges)
  let edgeContrast = 0;
  let edgeSamples = 0;
  
  // Sample from edges only
  for (let x = 0; x < canvas.width; x += 10) {
    for (let y of [0, canvas.height - 1]) {
      const i = (y * canvas.width + x) * 4;
      if (i >= 0 && i < data.length - 4) {
        const currentPixel = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const nextPixel = (data[i + 4] + data[i + 5] + data[i + 6]) / 3;
        edgeContrast += Math.abs(currentPixel - nextPixel);
        edgeSamples++;
      }
    }
  }
  
  for (let y = 0; y < canvas.height; y += 10) {
    for (let x of [0, canvas.width - 1]) {
      const i = (y * canvas.width + x) * 4;
      if (i >= 0 && i < data.length - 4) {
        const currentPixel = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const nextRow = ((y + 1) * canvas.width + x) * 4;
        if (nextRow < data.length) {
          const nextPixel = (data[nextRow] + data[nextRow + 1] + data[nextRow + 2]) / 3;
          edgeContrast += Math.abs(currentPixel - nextPixel);
          edgeSamples++;
        }
      }
    }
  }
  
  const avgEdgeContrast = edgeSamples > 0 ? edgeContrast / edgeSamples : 0;
  
  // A good card region shouldn't be too white (> 95%) and should have some edge contrast
  return whitePercentage < 95 && avgEdgeContrast > 5;
}

