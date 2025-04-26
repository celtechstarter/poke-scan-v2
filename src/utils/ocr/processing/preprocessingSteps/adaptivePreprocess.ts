
import { ImageQualityResult } from '../../types';

export const adaptivePreprocess = (imageData: ImageData, quality: ImageQualityResult): ImageData => {
  console.log('Starting adaptive preprocessing...');
  
  try {
    const data = new Uint8ClampedArray(imageData.data);
    
    // Dynamically adjust threshold based on image quality
    let threshold = 150; // Default threshold
    
    if (quality.poorLighting) {
      // Lower threshold for poor lighting conditions to preserve details
      threshold = 140;
      console.log('Poor lighting detected, using lower threshold:', threshold);
    } else if (quality.isBlurry) {
      // Adjust for blurry images
      threshold = 155;
      console.log('Blurry image detected, using higher threshold:', threshold);
    }
    
    console.log('Using threshold value:', threshold);
    
    // Enhanced adaptive binarization
    const width = imageData.width;
    const height = imageData.height;
    
    // Analyze local regions for more adaptive thresholding
    const regionSize = Math.max(Math.floor(Math.min(width, height) / 10), 10);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Calculate local region boundaries
        const startX = Math.max(0, x - Math.floor(regionSize / 2));
        const endX = Math.min(width - 1, x + Math.floor(regionSize / 2));
        const startY = Math.max(0, y - Math.floor(regionSize / 2));
        const endY = Math.min(height - 1, y + Math.floor(regionSize / 2));
        
        // For efficiency, only sample a subset of pixels in the local region
        let localSum = 0;
        let sampleCount = 0;
        
        for (let ly = startY; ly <= endY; ly += 3) { // Sample every 3rd pixel
          for (let lx = startX; lx <= endX; lx += 3) {
            const localIdx = (ly * width + lx) * 4;
            const localGray = 0.299 * data[localIdx] + 0.587 * data[localIdx + 1] + 0.114 * data[localIdx + 2];
            localSum += localGray;
            sampleCount++;
          }
        }
        
        // Calculate local average if we have samples
        let localThreshold = threshold;
        if (sampleCount > 0) {
          const localAvg = localSum / sampleCount;
          // Adjust threshold based on local average brightness
          localThreshold = Math.min(Math.max(localAvg * 0.9, threshold - 20), threshold + 20);
        }
        
        // Apply binarization with the local threshold
        const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        const finalValue = gray > localThreshold ? 255 : 0;
        
        data[idx] = finalValue;
        data[idx + 1] = finalValue;
        data[idx + 2] = finalValue;
      }
    }
    
    console.log('Adaptive preprocessing completed');
    return new ImageData(data, imageData.width, imageData.height);
    
  } catch (error) {
    console.error('Error in adaptive preprocessing:', error);
    throw new Error('Failed to apply adaptive preprocessing');
  }
};

