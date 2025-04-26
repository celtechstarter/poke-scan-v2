
import { ImageQualityResult } from '../../types';

export const applyBlur = (imageData: ImageData, quality: ImageQualityResult): ImageData => {
  const blurKernelSize = quality.isBlurry ? 3 : 5; // Less blur for already blurry images
  const data = imageData.data;
  const blurredData = new Uint8ClampedArray(data.length);
  const offset = Math.floor(blurKernelSize / 2);
  
  for (let y = offset; y < imageData.height - offset; y++) {
    for (let x = offset; x < imageData.width - offset; x++) {
      let rSum = 0, gSum = 0, bSum = 0;
      let count = 0;
      
      const centerIdx = (y * imageData.width + x) * 4;
      const centerValue = (data[centerIdx] + data[centerIdx + 1] + data[centerIdx + 2]) / 3;
      
      for (let ky = -offset; ky <= offset; ky++) {
        for (let kx = -offset; kx <= offset; kx++) {
          const idx = ((y + ky) * imageData.width + (x + kx)) * 4;
          const pixelValue = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          
          if (Math.abs(pixelValue - centerValue) < 50) {
            rSum += data[idx];
            gSum += data[idx + 1];
            bSum += data[idx + 2];
            count++;
          }
        }
      }
      
      const outIdx = (y * imageData.width + x) * 4;
      blurredData[outIdx] = rSum / count;
      blurredData[outIdx + 1] = gSum / count;
      blurredData[outIdx + 2] = bSum / count;
      blurredData[outIdx + 3] = data[outIdx + 3];
    }
  }
  
  return new ImageData(blurredData, imageData.width, imageData.height);
};
