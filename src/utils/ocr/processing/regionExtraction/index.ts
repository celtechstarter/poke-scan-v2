
import { OcrRegion } from '../../types';
import { CardEdges, Point } from './types';
import { createCanvasWithContext2D } from '@/utils/canvas/safeCanvasContext';
import { computePerspectiveTransform, applyTransform } from './perspectiveTransform';
import { enhanceCardName, enhanceCardNumber } from './imageEnhancement';
import { verifyRegionQuality } from './qualityVerification';

function extractUsingCardEdges(
  img: HTMLImageElement,
  cardEdges: CardEdges,
  ctx: CanvasRenderingContext2D
): string {
  const cardWidth = Math.max(
    distance(cardEdges.topLeft, cardEdges.topRight),
    distance(cardEdges.bottomLeft, cardEdges.bottomRight)
  );
  
  const cardHeight = Math.max(
    distance(cardEdges.topLeft, cardEdges.bottomLeft),
    distance(cardEdges.topRight, cardEdges.bottomRight)
  );
  
  const { canvas: correctedCardCanvas, ctx: correctedCardCtx } = createCanvasWithContext2D(1, 1, { willReadFrequently: true });
  
  const standardWidth = 350;
  const standardHeight = 500;
  
  correctedCardCanvas.width = standardWidth;
  correctedCardCanvas.height = standardHeight;
  
  correctPerspective(img, correctedCardCanvas, correctedCardCtx, cardEdges);
  
  const nameRegion = {
    x: standardWidth * 0.1,
    y: standardHeight * 0.05,
    width: standardWidth * 0.8,
    height: standardHeight * 0.15
  };
  
  const numberRegion = {
    x: standardWidth * 0.05,
    y: standardHeight * 0.85,
    width: standardWidth * 0.6,
    height: standardHeight * 0.1
  };
  
  const { canvas: resultCanvas, ctx: resultCtx } = createCanvasWithContext2D(1, 1, { willReadFrequently: true });
  resultCanvas.width = 400;
  resultCanvas.height = 150;
  
  resultCtx.fillStyle = 'white';
  resultCtx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);
  
  resultCtx.drawImage(
    correctedCardCanvas,
    nameRegion.x, nameRegion.y, nameRegion.width, nameRegion.height,
    20, 10, 360, 60
  );
  
  resultCtx.drawImage(
    correctedCardCanvas,
    numberRegion.x, numberRegion.y, numberRegion.width, numberRegion.height,
    20, 80, 240, 50
  );
  
  enhanceCardName(resultCanvas, resultCtx, 0, 0, 380, 70);
  enhanceCardNumber(resultCanvas, resultCtx, 0, 80, 260, 50);
  
  return resultCanvas.toDataURL('image/png', 1.0);
}

function correctPerspective(
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

function getPixel(imgData: ImageData, x: number, y: number): [number, number, number, number] {
  const idx = (y * imgData.width + x) * 4;
  return [
    imgData.data[idx],
    imgData.data[idx + 1],
    imgData.data[idx + 2],
    imgData.data[idx + 3]
  ];
}

function distance(point1: Point, point2: Point): number {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) + 
    Math.pow(point2.y - point1.y, 2)
  );
}

export async function extractRegion(
  imageDataUrl: string, 
  regionOrEdges: OcrRegion | CardEdges
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const { canvas, ctx } = createCanvasWithContext2D(1, 1, { willReadFrequently: true });
        
        if ('topLeft' in regionOrEdges) {
          const extractedImage = extractUsingCardEdges(img, regionOrEdges, ctx);
          resolve(extractedImage);
          return;
        }
        
        const region = regionOrEdges as OcrRegion;
        const padding = 2;
        const inwardPaddingFactor = 0.95;
        
        const regionWidth = Math.floor(img.width * (region.width / 100) * inwardPaddingFactor);
        const regionHeight = Math.floor(img.height * (region.height / 100) * inwardPaddingFactor);
        
        const widthDifference = Math.floor(img.width * (region.width / 100)) - regionWidth;
        const heightDifference = Math.floor(img.height * (region.height / 100)) - regionHeight;
        
        const x = Math.floor(img.width * (region.left / 100)) + Math.floor(widthDifference / 2);
        const y = Math.floor(img.height * (region.top / 100)) + Math.floor(heightDifference / 2);
        
        canvas.width = regionWidth + (padding * 2);
        canvas.height = regionHeight + (padding * 2);
        
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.drawImage(
          img,
          Math.max(0, x - padding), 
          Math.max(0, y - padding), 
          regionWidth + (padding * 2), 
          regionHeight + (padding * 2),
          0, 0, canvas.width, canvas.height
        );
        
        if (region.name === 'cardNumber') {
          enhanceCardNumber(canvas, ctx);
        } else if (region.name === 'cardName') {
          enhanceCardName(canvas, ctx);
        }
        
        if (!verifyRegionQuality(canvas, ctx) && (region.name === 'cardName' || region.name === 'cardNumber')) {
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
}
