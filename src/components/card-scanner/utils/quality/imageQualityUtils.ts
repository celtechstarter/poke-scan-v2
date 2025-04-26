import { toast } from '@/components/ui/use-toast';
import { CardScanningErrorType, ScannerError } from '../../types/scannerTypes';

export const assessImageQuality = async (imageDataUrl: string): Promise<{
  isBlurry: boolean;
  poorLighting: boolean;
  message: string | null;
  isCardVisible: boolean;
}> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      if (!ctx) {
        resolve({ isBlurry: false, poorLighting: false, message: null, isCardVisible: false });
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      
      // Detect if a card is properly visible in the image
      let hasCardShape = false;
      let cardEdgeCount = 0;
      const edgeThreshold = 50; // Threshold for edge detection
      
      // Check horizontal edges (sample rows)
      for (let y = Math.floor(canvas.height * 0.2); y < canvas.height * 0.8; y += 20) {
        let lastBrightness = -1;
        let edgeCount = 0;
        
        for (let x = 0; x < canvas.width; x += 4) {
          const pixel = (y * canvas.width + x) * 4;
          const brightness = (imageData[pixel] + imageData[pixel + 1] + imageData[pixel + 2]) / 3;
          
          if (lastBrightness >= 0) {
            const diff = Math.abs(brightness - lastBrightness);
            if (diff > edgeThreshold) {
              edgeCount++;
            }
          }
          
          lastBrightness = brightness;
        }
        
        // If we detect edges in expected card shape (usually 2 main edges)
        if (edgeCount >= 2 && edgeCount <= 8) {
          cardEdgeCount++;
        }
      }
      
      // Card is likely present if we detect edges in multiple rows
      hasCardShape = cardEdgeCount >= 3;
      
      // Define specific regions to check for quality issues
      const regions = [
        { name: 'cardName', top: 5, left: 20, width: 60, height: 10 },
        { name: 'cardNumber', top: 88, left: 5, width: 30, height: 10 }
      ];
      
      let totalEdgeStrength = 0;
      let totalBrightness = 0;
      let totalPixels = 0;
      
      // Check each critical region specifically
      for (const region of regions) {
        const startX = Math.floor(img.width * (region.left / 100));
        const startY = Math.floor(img.height * (region.top / 100));
        const endX = startX + Math.floor(img.width * (region.width / 100));
        const endY = startY + Math.floor(img.height * (region.height / 100));
        const regionPixels = (endX - startX) * (endY - startY);
        
        let regionEdgeStrength = 0;
        let regionBrightness = 0;
        
        // Analyze edge strength and brightness in the region
        for (let y = startY + 1; y < endY - 1; y++) {
          for (let x = startX + 1; x < endX - 1; x++) {
            const pixel = (y * img.width + x) * 4;
            const pixelLeft = (y * img.width + (x - 1)) * 4;
            const pixelRight = (y * img.width + (x + 1)) * 4;
            const pixelUp = ((y - 1) * img.width + x) * 4;
            const pixelDown = ((y + 1) * img.width + x) * 4;
            
            // Enhanced edge detection (both horizontal and vertical)
            const edgeH = Math.abs(imageData[pixelLeft] - imageData[pixelRight]);
            const edgeV = Math.abs(imageData[pixelUp] - imageData[pixelDown]);
            const edgeStrength = Math.max(edgeH, edgeV);
            
            // Calculate brightness 
            const brightness = (imageData[pixel] + imageData[pixel + 1] + imageData[pixel + 2]) / 3;
            
            regionEdgeStrength += edgeStrength;
            regionBrightness += brightness;
          }
        }
        
        // Normalize by region size
        if (regionPixels > 0) {
          regionEdgeStrength /= regionPixels;
          regionBrightness /= regionPixels;
          
          // Add to total values
          totalEdgeStrength += regionEdgeStrength;
          totalBrightness += regionBrightness;
          totalPixels += regionPixels;
        }
      }
      
      // Calculate averages
      const avgEdgeStrength = regions.length > 0 ? totalEdgeStrength / regions.length : 0;
      const avgBrightness = totalPixels > 0 ? totalBrightness / totalPixels : 0;
      
      // Determine quality issues with refined thresholds
      const isBlurry = avgEdgeStrength < 12; // Adjusted threshold based on testing
      const poorLighting = avgBrightness < 50 || avgBrightness > 210; // Refined lighting thresholds
      
      let message = null;
      if (!hasCardShape) {
        message = "Keine Karte im Bild erkannt. Bitte zentriere die Karte im Rahmen";
      } else if (isBlurry && poorLighting) {
        message = "Bild ist unscharf und hat schlechte Lichtverhältnisse";
      } else if (isBlurry) {
        message = "Bild ist unscharf, bitte halte die Kamera still";
      } else if (poorLighting) {
        message = "Schlechte Lichtverhältnisse, bitte für bessere Beleuchtung sorgen";
      }
      
      resolve({ isBlurry, poorLighting, message, isCardVisible: hasCardShape });
    };
    
    img.onerror = () => {
      resolve({ isBlurry: false, poorLighting: false, message: null, isCardVisible: false });
    };
    
    img.src = imageDataUrl;
  });
};
