
import { CardEdges } from '../types';
import { createCanvasWithContext2D } from '@/utils/canvas/safeCanvasContext';
import { distance } from '../extractionUtils';
import { correctPerspective } from './perspectiveCorrection';
import { enhanceCardName, enhanceCardNumber } from '../imageEnhancement';

export function extractUsingCardEdges(
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
  
  const { canvas: resultCanvas, ctx: resultCtx } = createCanvasWithContext2D(400, 150, { willReadFrequently: true });
  
  resultCtx.fillStyle = 'white';
  resultCtx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);
  
  // Extract name region
  resultCtx.drawImage(
    correctedCardCanvas,
    standardWidth * 0.1, standardHeight * 0.05, standardWidth * 0.8, standardHeight * 0.15,
    20, 10, 360, 60
  );
  
  // Extract number region
  resultCtx.drawImage(
    correctedCardCanvas,
    standardWidth * 0.05, standardHeight * 0.85, standardWidth * 0.6, standardHeight * 0.1,
    20, 80, 240, 50
  );
  
  enhanceCardName(resultCanvas, resultCtx, 0, 0, 380, 70);
  enhanceCardNumber(resultCanvas, resultCtx, 0, 80, 260, 50);
  
  return resultCanvas.toDataURL('image/png', 1.0);
}
