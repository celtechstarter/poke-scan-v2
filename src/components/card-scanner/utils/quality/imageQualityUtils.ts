
import { toast } from '@/hooks/use-toast';
import { Point } from '@/lib/types';
import { detectCardShape } from './modules/cardDetection';
import { checkImageQuality } from './modules/qualityCheck';
import { createSafeCanvasContext2D } from '@/utils/canvas/safeCanvasContext';

// Enhanced card detection and quality assessment
export const assessImageQuality = async (imageDataUrl: string): Promise<{
  isBlurry: boolean;
  poorLighting: boolean;
  message: string | null;
  isCardVisible: boolean;
  cardEdges?: { topLeft: Point; topRight: Point; bottomRight: Point; bottomLeft: Point } | null;
}> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      try {
        const ctx = createSafeCanvasContext2D(canvas, { willReadFrequently: true });
        
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Step 1: Detect if a card is properly visible in the image
        const { hasCardShape, cardEdges } = detectCardShape(canvas, ctx, data);
        
        // Step 2: Check image quality (blur and lighting)
        const { isBlurry, poorLighting, message } = checkImageQuality(canvas, data);
        
        resolve({ 
          isBlurry, 
          poorLighting, 
          message: hasCardShape ? message : "Keine Karte im Bild erkannt. Bitte zentriere die Karte im Rahmen", 
          isCardVisible: hasCardShape,
          cardEdges: hasCardShape ? cardEdges : null
        });
      } catch (error) {
        console.error('Error assessing image quality:', error);
        resolve({
          isBlurry: false,
          poorLighting: false,
          message: "Fehler bei der Bildanalyse",
          isCardVisible: false
        });
      }
    };
    
    img.onerror = () => {
      resolve({ isBlurry: false, poorLighting: false, message: null, isCardVisible: false });
    };
    
    img.src = imageDataUrl;
  });
};
