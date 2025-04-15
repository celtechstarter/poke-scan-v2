
import { toast } from '@/components/ui/use-toast';
import { analyzeCardImage } from '@/utils/cardAnalysisUtils';
import { CardScanningErrorType, ScanResult, ScannerError } from '../types/scannerTypes';

/**
 * Advanced image quality assessment for Pokémon cards
 * Checks for blurry text and lighting issues in critical areas
 * @param imageDataUrl - The captured image as a data URL
 * @returns {Promise<{isBlurry: boolean, poorLighting: boolean, message: string|null}>} - Assessment result
 */
export const assessImageQuality = async (imageDataUrl: string): Promise<{
  isBlurry: boolean;
  poorLighting: boolean;
  message: string | null;
}> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve({ isBlurry: false, poorLighting: false, message: null });
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      
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
        regionEdgeStrength /= regionPixels;
        regionBrightness /= regionPixels;
        
        // Add to total values
        totalEdgeStrength += regionEdgeStrength;
        totalBrightness += regionBrightness;
        totalPixels += regionPixels;
      }
      
      // Calculate averages
      const avgEdgeStrength = totalEdgeStrength / regions.length;
      const avgBrightness = totalBrightness / totalPixels;
      
      // Determine quality issues with refined thresholds
      const isBlurry = avgEdgeStrength < 12; // Adjusted threshold based on testing
      const poorLighting = avgBrightness < 50 || avgBrightness > 210; // Refined lighting thresholds
      
      let message = null;
      if (isBlurry && poorLighting) {
        message = "Bild ist unscharf und hat schlechte Lichtverhältnisse";
      } else if (isBlurry) {
        message = "Bild ist unscharf, bitte halte die Kamera still";
      } else if (poorLighting) {
        message = "Schlechte Lichtverhältnisse, bitte für bessere Beleuchtung sorgen";
      }
      
      resolve({ isBlurry, poorLighting, message });
    };
    
    img.onerror = () => {
      resolve({ isBlurry: false, poorLighting: false, message: null });
    };
    
    img.src = imageDataUrl;
  });
};

/**
 * Process the captured card image through analysis
 * Enhanced with image quality assessment
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
    
    // First assess image quality
    const { isBlurry, poorLighting, message } = await assessImageQuality(imageDataUrl);
    
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
      if (error.message.includes('price') || error.message.includes('Preis')) {
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
