
import { CardEdges, Point } from '../types';
import { createCanvasWithContext2D } from '@/utils/canvas/safeCanvasContext';
import { computePerspectiveTransform, applyTransform } from '../perspectiveUtils';
import { getPixel } from '../extractionUtils';

export function correctPerspective(
  img: HTMLImageElement,
  outputCanvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  cardEdges: CardEdges
): void {
  const srcPoints = [
    cardEdges.topLeft,
    cardEdges.topRight,
    cardEdges.bottomRight,
    cardEdges.bottomLeft
  ];
  
  const width = outputCanvas.width;
  const height = outputCanvas.height;
  
  const dstPoints = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height }
  ];
  
  const transform = computePerspectiveTransform(srcPoints, dstPoints);
  
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);
  
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
  
  if (!tempCtx) {
    throw new Error('Could not create temporary canvas context');
  }
  
  tempCanvas.width = img.width;
  tempCanvas.height = img.height;
  tempCtx.drawImage(img, 0, 0);
  
  const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
  const outputImgData = ctx.createImageData(width, height);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const src = applyTransform(transform, x, y);
      
      if (
        src.x >= 0 && src.x < img.width - 1 &&
        src.y >= 0 && src.y < img.height - 1
      ) {
        const x1 = Math.floor(src.x);
        const y1 = Math.floor(src.y);
        const x2 = Math.ceil(src.x);
        const y2 = Math.ceil(src.y);
        
        const dx = src.x - x1;
        const dy = src.y - y1;
        
        const idx = (y * width + x) * 4;
        
        const c11 = getPixel(imgData, x1, y1);
        const c21 = getPixel(imgData, x2, y1);
        const c12 = getPixel(imgData, x1, y2);
        const c22 = getPixel(imgData, x2, y2);
        
        for (let i = 0; i < 3; i++) {
          const top = c11[i] * (1 - dx) + c21[i] * dx;
          const bottom = c12[i] * (1 - dx) + c22[i] * dx;
          outputImgData.data[idx + i] = Math.round(top * (1 - dy) + bottom * dy);
        }
        
        outputImgData.data[idx + 3] = 255;
      } else {
        const idx = (y * width + x) * 4;
        outputImgData.data[idx] = 255;
        outputImgData.data[idx + 1] = 255;
        outputImgData.data[idx + 2] = 255;
        outputImgData.data[idx + 3] = 255;
      }
    }
  }
  
  ctx.putImageData(outputImgData, 0, 0);
}
