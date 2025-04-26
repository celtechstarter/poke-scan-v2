
import { ImageQualityResult } from '../../types';

export const applyContrast = (imageData: ImageData, quality: ImageQualityResult): ImageData => {
  const data = new Uint8ClampedArray(imageData.data);
  const contrastFactor = quality.poorLighting ? 2.5 : 2.0;
  const factor = (259 * (contrastFactor + 255)) / (255 * (259 - contrastFactor));
  
  for (let i = 0; i < data.length; i += 4) {
    for (let j = 0; j < 3; j++) {
      const newValue = factor * (data[i + j] - 128) + 128;
      data[i + j] = Math.min(255, Math.max(0, newValue));
    }
  }
  
  return new ImageData(data, imageData.width, imageData.height);
};
