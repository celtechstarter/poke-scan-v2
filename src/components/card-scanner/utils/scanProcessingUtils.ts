
import { toast } from '@/components/ui/use-toast';
import { analyzeCardImage } from '@/utils/cardAnalysisUtils';
import { CardScanningErrorType, ScanResult, ScannerError } from '../types/scannerTypes';

/**
 * Advanced image quality assessment for Pokémon cards
 * Enhanced with card detection and positioning check
 * @param imageDataUrl - The captured image as a data URL
 * @returns {Promise<{isBlurry: boolean, poorLighting: boolean, message: string|null, isCardVisible: boolean}>} - Assessment result
 */
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

/**
 * Process the captured card image through analysis
 * Enhanced with image quality assessment and card detection
 * @param {string} imageDataUrl - The captured image as a data URL
 * @param {AbortSignal} signal - Signal for aborting the operation
 * @returns {Promise<ScanResult>} - The scan result
 * @throws {Error} - When analysis fails
 */
export const processCardImage = async (
  imageDataUrl: string,
  signal?: AbortSignal
): Promise<ScanResult> => {
  toast({
    title: "Bild aufgenommen",
    description: "Überprüfe Bildqualität und analysiere Karte...",
  });
  
  try {
    // Set up abort handling
    if (signal) {
      signal.addEventListener('abort', () => {
        console.log('Card analysis aborted');
      });
    }
    
    // First assess image quality with enhanced card detection
    const { isBlurry, poorLighting, message, isCardVisible } = await assessImageQuality(imageDataUrl);
    
    // If no card is detected in the frame, stop processing
    if (!isCardVisible) {
      toast({
        title: "Scan fehlgeschlagen",
        description: "Keine Karte im Bild erkannt. Bitte zentriere die Karte im Rahmen",
        variant: "destructive",
      });
      throw new Error("No card detected in the frame");
    }
    
    if (isBlurry || poorLighting) {
      console.warn('Image quality issues detected:', message);
      toast({
        title: "Bildqualitätsprobleme",
        description: message || "Bildqualität könnte besser sein",
        variant: "default",
      });
      // We continue with the analysis despite quality issues, but warn the user
    }
    
    // Clear any previous console logs to avoid confusion
    console.clear();
    
    const result = await analyzeCardImage(imageDataUrl);
    
    const toastMessage = result.cardName === "Fehler beim Scannen" || result.cardName === "Text nicht erkannt" 
      ? "Text konnte nicht gelesen werden"
      : `${result.cardName} (${result.cardNumber || 'Keine Nummer'})${result.price ? ` - Preis: ${result.price.toFixed(2)} €` : ''}`;
    
    toast({
      title: "Karte gescannt",
      description: toastMessage,
      variant: result.cardName === "Fehler beim Scannen" ? "destructive" : "default",
    });
    
    return {
      cardName: result.cardName,
      cardNumber: result.cardNumber,
      price: result.price,
      imageDataUrl: imageDataUrl,
      ocrResult: result.ocrResult
    };
  } catch (error) {
    console.error('Fehler bei der Kartenanalyse:', error);
    
    let errorType = CardScanningErrorType.ANALYSIS_FAILED;
    let errorMessage = "Die Karte konnte nicht erkannt werden. Bitte versuche es erneut.";
    
    // Check if the error is due to abort - in which case we don't show an error toast
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.log('Analyse abgebrochen');
      throw error;
    }
    
    // Check for more specific error types
    if (error instanceof Error) {
      if (error.message.includes('No card detected')) {
        errorType = CardScanningErrorType.CAPTURE_FAILED;
        errorMessage = "Keine Karte erkannt. Bitte positioniere die Karte mittig im Rahmen.";
      } else if (error.message.includes('price') || error.message.includes('Preis')) {
        errorType = CardScanningErrorType.PRICE_LOOKUP_FAILED;
        errorMessage = "Karte erkannt, aber der Preis konnte nicht ermittelt werden.";
      }
    }
    
    const scannerError: ScannerError = {
      message: errorMessage,
      type: errorType
    };
    
    toast({
      title: "Fehler bei der Analyse",
      description: errorMessage,
      variant: "destructive",
    });
    
    throw scannerError;
  }
};

/**
 * Utility to capture a frame from video
 * @param videoRef - Reference to video element
 * @param canvasRef - Reference to canvas element
 * @param setScanError - Function to set scan error
 * @returns {Promise<string | null>} - Image data URL or null
 */
export const captureFrameUtil = async (
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>, 
  setScanError: (error: ScannerError | null) => void
): Promise<string | null> => {
  if (!videoRef.current || !canvasRef.current) {
    setScanError({
      message: "Video oder Canvas nicht verfügbar",
      type: CardScanningErrorType.CAPTURE_FAILED
    });
    return null;
  }
  
  try {
    const { captureVideoFrame } = await import('@/utils/cardDetectionUtils');
    return captureVideoFrame(videoRef.current, canvasRef.current);
  } catch (error) {
    console.error('Fehler beim Erfassen des Bildes:', error);
    
    let errorMessage = "Fehler beim Erfassen des Bildes";
    let errorType = CardScanningErrorType.CAPTURE_FAILED;
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    setScanError({
      message: errorMessage,
      type: errorType
    });
    
    toast({
      title: "Scanfehler",
      description: errorMessage,
      variant: "destructive",
    });
    
    return null;
  }
};

