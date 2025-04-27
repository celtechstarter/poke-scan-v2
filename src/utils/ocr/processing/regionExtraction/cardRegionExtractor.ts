
import { OcrRegion } from '../../types';
import { CardEdges } from './types';
import { createCanvasWithContext2D } from '@/utils/canvas/safeCanvasContext';
import { extractCardRegion } from './modules/regionExtractor';
import { extractUsingCardEdges } from './modules/edgeBasedExtractor';

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
        
        try {
          const extractedImage = extractCardRegion(img, regionOrEdges as OcrRegion);
          resolve(extractedImage);
        } catch (error) {
          reject(error);
        }
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
