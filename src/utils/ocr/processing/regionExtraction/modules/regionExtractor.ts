
import { OcrRegion } from '../../../types';
import { createCanvasWithContext2D } from '@/utils/canvas/safeCanvasContext';
import { verifyRegionQuality } from '../qualityVerification';
import { enhanceCardName, enhanceCardNumber } from '../imageEnhancement';

export function extractCardRegion(
  img: HTMLImageElement,
  region: OcrRegion
): string {
  const padding = 2;
  const inwardPaddingFactor = 0.95;
  
  const regionWidth = Math.floor(img.width * (region.width / 100) * inwardPaddingFactor);
  const regionHeight = Math.floor(img.height * (region.height / 100) * inwardPaddingFactor);
  
  const widthDifference = Math.floor(img.width * (region.width / 100)) - regionWidth;
  const heightDifference = Math.floor(img.height * (region.height / 100)) - regionHeight;
  
  const x = Math.floor(img.width * (region.left / 100)) + Math.floor(widthDifference / 2);
  const y = Math.floor(img.height * (region.top / 100)) + Math.floor(heightDifference / 2);
  
  const { canvas, ctx } = createCanvasWithContext2D(
    regionWidth + (padding * 2),
    regionHeight + (padding * 2),
    { willReadFrequently: true }
  );
  
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
    throw new Error('Poor quality region detected. Please ensure the card is centered and well-lit.');
  }
  
  return canvas.toDataURL('image/png', 1.0);
}
