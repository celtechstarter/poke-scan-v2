
import { OcrRegion } from '../types';

/**
 * Extracts and enhances a specific region from a card image
 */
export const extractRegion = async (
  imageDataUrl: string, 
  region: OcrRegion
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not create canvas context'));
        return;
      }
      
      const x = Math.floor(img.width * (region.left / 100));
      const y = Math.floor(img.height * (region.top / 100));
      const width = Math.floor(img.width * (region.width / 100));
      const height = Math.floor(img.height * (region.height / 100));
      
      const padding = 2;
      canvas.width = width + (padding * 2);
      canvas.height = height + (padding * 2);
      
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.drawImage(
        img,
        Math.max(0, x - padding), 
        Math.max(0, y - padding), 
        width + (padding * 2), 
        height + (padding * 2),
        0, 0, canvas.width, canvas.height
      );
      
      if (region.name === 'cardNumber') {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          const contrast = 2.5;
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
          const newValue = Math.min(255, Math.max(0, factor * (gray - 128) + 128));
          
          const threshold = 165;
          const finalValue = newValue > threshold ? 255 : 0;
          
          data[i] = finalValue;
          data[i + 1] = finalValue;
          data[i + 2] = finalValue;
        }
        
        ctx.putImageData(imageData, 0, 0);
      }
      
      resolve(canvas.toDataURL('image/png', 1.0));
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for region extraction'));
    };
    
    img.src = imageDataUrl;
  });
};
