
import { ImageQualityResult } from '../../types';

export const adaptivePreprocess = (imageData: ImageData, quality: ImageQualityResult): ImageData => {
  console.log('Starting adaptive preprocessing...');
  
  try {
    const data = new Uint8ClampedArray(imageData.data);
    const threshold = quality.poorLighting ? 140 : 150;
    
    console.log('Using threshold value:', threshold);
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const finalValue = gray > threshold ? 255 : 0;
      
      data[i] = finalValue;
      data[i + 1] = finalValue;
      data[i + 2] = finalValue;
    }
    
    console.log('Adaptive preprocessing completed');
    return new ImageData(data, imageData.width, imageData.height);
    
  } catch (error) {
    console.error('Error in adaptive preprocessing:', error);
    throw new Error('Failed to apply adaptive preprocessing');
  }
};
