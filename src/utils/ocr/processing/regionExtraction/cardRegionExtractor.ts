
import { OcrRegion } from '../../types';
import { CardEdges } from './types';
import { createCanvasWithContext2D } from '@/utils/canvas/safeCanvasContext';
import { extractCardRegion } from './modules/regionExtractor';
import { extractUsingCardEdges } from './modules/edgeBasedExtractor';
import { loadImage } from './utils/imageLoader';

export async function extractRegion(
  imageDataUrl: string,
  regionOrEdges: OcrRegion | CardEdges
): Promise<string> {
  try {
    const img = await loadImage(imageDataUrl);
    const { canvas, ctx } = createCanvasWithContext2D(1, 1, { willReadFrequently: true });
    
    if ('topLeft' in regionOrEdges) {
      return extractUsingCardEdges(img, regionOrEdges, ctx);
    }
    
    return extractCardRegion(img, regionOrEdges as OcrRegion);
  } catch (error) {
    console.error('Error during region extraction:', error);
    throw new Error(`Failed to extract region: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
