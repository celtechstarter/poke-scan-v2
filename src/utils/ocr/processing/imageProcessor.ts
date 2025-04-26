
import { assessImageQuality } from '../quality/imageQualityAssessor';

/**
 * Enhanced preprocessing for Pokémon card images with improved noise reduction
 * and text preservation techniques
 */
export const preprocessImage = async (imageDataUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not create canvas context'));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Get image quality assessment
      const quality = assessImageQuality(imageData);
      
      // Apply adaptive pre-processing based on image quality
      const blurKernelSize = quality.isBlurry ? 3 : 5; // Less blur for already blurry images
      const contrastFactor = quality.poorLighting ? 2.5 : 2.0; // More contrast for poor lighting
      
      // Apply selective blur before thresholding to reduce noise
      const blurredData = new Uint8ClampedArray(data.length);
      const offset = Math.floor(blurKernelSize / 2);
      
      for (let y = offset; y < canvas.height - offset; y++) {
        for (let x = offset; x < canvas.width - offset; x++) {
          let rSum = 0, gSum = 0, bSum = 0;
          let count = 0;
          
          // Selective blur - only blur similar pixels
          const centerIdx = (y * canvas.width + x) * 4;
          const centerValue = (data[centerIdx] + data[centerIdx + 1] + data[centerIdx + 2]) / 3;
          
          for (let ky = -offset; ky <= offset; ky++) {
            for (let kx = -offset; kx <= offset; kx++) {
              const idx = ((y + ky) * canvas.width + (x + kx)) * 4;
              const pixelValue = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
              
              // Only include pixels with similar intensity
              if (Math.abs(pixelValue - centerValue) < 50) {
                rSum += data[idx];
                gSum += data[idx + 1];
                bSum += data[idx + 2];
                count++;
              }
            }
          }
          
          const outIdx = (y * canvas.width + x) * 4;
          blurredData[outIdx] = rSum / count;
          blurredData[outIdx + 1] = gSum / count;
          blurredData[outIdx + 2] = bSum / count;
          blurredData[outIdx + 3] = data[outIdx + 3];
        }
      }
      
      // Process with adaptive contrast and thresholding
      for (let i = 0; i < blurredData.length; i += 4) {
        const gray = 0.299 * blurredData[i] + 0.587 * blurredData[i + 1] + 0.114 * blurredData[i + 2];
        
        // Apply adaptive contrast
        const factor = (259 * (contrastFactor + 255)) / (255 * (259 - contrastFactor));
        let newValue = factor * (gray - 128) + 128;
        
        // Ensure values stay in range
        newValue = Math.min(255, Math.max(0, newValue));
        
        // Dynamic thresholding based on image quality
        const threshold = quality.poorLighting ? 140 : 150;
        const finalValue = newValue > threshold ? 255 : 0;
        
        data[i] = finalValue;
        data[i + 1] = finalValue;
        data[i + 2] = finalValue;
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png', 1.0));
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for preprocessing'));
    };
    
    img.src = imageDataUrl;
  });
};
