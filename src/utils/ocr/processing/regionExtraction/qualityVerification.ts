
import { RegionQualityOptions } from './types';

export function verifyRegionQuality(
  canvas: HTMLCanvasElement, 
  ctx: CanvasRenderingContext2D,
  options: RegionQualityOptions = {}
): boolean {
  const {
    minWhitePercentage = 95,
    minEdgeContrast = 5
  } = options;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  let whitePixels = 0;
  let totalPixels = canvas.width * canvas.height;
  
  for (let i = 0; i < data.length; i += 16) {
    if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
      whitePixels++;
    }
  }
  
  const whitePercentage = (whitePixels / (totalPixels / 4)) * 100;
  
  let edgeContrast = 0;
  let edgeSamples = 0;
  
  for (let x = 0; x < canvas.width; x += 10) {
    for (let y of [0, canvas.height - 1]) {
      const i = (y * canvas.width + x) * 4;
      if (i >= 0 && i < data.length - 4) {
        const currentPixel = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const nextPixel = (data[i + 4] + data[i + 5] + data[i + 6]) / 3;
        edgeContrast += Math.abs(currentPixel - nextPixel);
        edgeSamples++;
      }
    }
  }
  
  for (let y = 0; y < canvas.height; y += 10) {
    for (let x of [0, canvas.width - 1]) {
      const i = (y * canvas.width + x) * 4;
      if (i >= 0 && i < data.length - 4) {
        const currentPixel = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const nextRow = ((y + 1) * canvas.width + x) * 4;
        if (nextRow < data.length) {
          const nextPixel = (data[nextRow] + data[nextRow + 1] + data[nextRow + 2]) / 3;
          edgeContrast += Math.abs(currentPixel - nextPixel);
          edgeSamples++;
        }
      }
    }
  }
  
  const avgEdgeContrast = edgeSamples > 0 ? edgeContrast / edgeSamples : 0;
  
  return whitePercentage < minWhitePercentage && avgEdgeContrast > minEdgeContrast;
}
