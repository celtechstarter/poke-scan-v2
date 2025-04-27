
import { OcrRegion } from '../../types';
import { createCanvasWithContext2D } from '@/utils/canvas/safeCanvasContext';

export function enhanceCardNumber(
  canvas: HTMLCanvasElement, 
  ctx: CanvasRenderingContext2D, 
  x: number = 0, 
  y: number = 0, 
  width: number = canvas.width, 
  height: number = canvas.height
): void {
  const imageData = ctx.getImageData(x, y, width, height);
  const data = imageData.data;
  
  let totalBrightness = 0;
  const grayValues = new Array(data.length / 4);
  
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    grayValues[j] = gray;
    totalBrightness += gray;
  }
  
  const avgBrightness = totalBrightness / grayValues.length;
  const adaptiveThreshold = avgBrightness * 0.75;
  const contrast = 3.5;
  
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    const newValue = Math.min(255, Math.max(0, factor * (grayValues[j] - 128) + 128));
    const binarizedValue = newValue < adaptiveThreshold ? 0 : 255;
    
    data[i] = binarizedValue;
    data[i + 1] = binarizedValue;
    data[i + 2] = binarizedValue;
  }
  
  ctx.putImageData(imageData, x, y);
  
  // Create a new ImageData object and apply unsharp mask
  const imageDataForSharpening = ctx.getImageData(x, y, width, height);
  
  // Import the unsharpMask function
  const { applyUnsharpMask } = require('../preprocessingSteps/unsharpMask');
  
  // Apply unsharp mask with the correct parameter signature (ImageData, radius, strength)
  const enhancedImageData = applyUnsharpMask(imageDataForSharpening, 0.5, 0.5);
  
  // Put the enhanced image data back to the canvas
  ctx.putImageData(enhancedImageData, x, y);
}

export function enhanceCardName(
  canvas: HTMLCanvasElement, 
  ctx: CanvasRenderingContext2D, 
  x: number = 0, 
  y: number = 0, 
  width: number = canvas.width, 
  height: number = canvas.height
): void {
  const imageData = ctx.getImageData(x, y, width, height);
  const data = imageData.data;
  
  let totalBrightness = 0;
  const grayValues = new Array(data.length / 4);
  
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    grayValues[j] = gray;
    totalBrightness += gray;
  }
  
  const avgBrightness = totalBrightness / grayValues.length;
  const adaptiveThreshold = avgBrightness * 0.65;
  const contrast = 3.0;
  
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    const newValue = Math.min(255, Math.max(0, factor * (grayValues[j] - 128) + 128));
    const binarizedValue = newValue < adaptiveThreshold ? 0 : 255;
    
    data[i] = binarizedValue;
    data[i + 1] = binarizedValue;
    data[i + 2] = binarizedValue;
  }
  
  ctx.putImageData(imageData, x, y);
  
  // Create a new ImageData object and apply unsharp mask
  const imageDataForSharpening = ctx.getImageData(x, y, width, height);
  
  // Import the unsharpMask function
  const { applyUnsharpMask } = require('../preprocessingSteps/unsharpMask');
  
  // Apply unsharp mask with the correct parameter signature (ImageData, radius, strength)
  const enhancedImageData = applyUnsharpMask(imageDataForSharpening, 0.5, 0.7);
  
  // Put the enhanced image data back to the canvas
  ctx.putImageData(enhancedImageData, x, y);
}
