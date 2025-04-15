
import { toast } from '@/components/ui/use-toast';
import { analyzeCardImage } from '@/utils/cardAnalysisUtils';
import { CardScanningErrorType, ScanResult, ScannerError } from '../types/scannerTypes';

/**
 * Checks if an image is blurry or has poor lighting
 * @param imageDataUrl - The captured image as a data URL
 * @returns {Promise<{isBlurry: boolean, message: string|null}>} - Assessment result
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
      
      // Calculate basic image stats to detect blur and lighting issues
      let edgeStrength = 0;
      let totalBrightness = 0;
      const pixelCount = img.width * img.height;
      
      // Simple edge detection and brightness analysis
      for (let y = 1; y < img.height - 1; y++) {
        for (let x = 1; x < img.width - 1; x++) {
          const pixel = (y * img.width + x) * 4;
          const pixelLeft = (y * img.width + (x - 1)) * 4;
          const pixelRight = (y * img.width + (x + 1)) * 4;
          
          // Simple horizontal edge detection
          const edgeH = Math.abs(imageData[pixelLeft] - imageData[pixelRight]);
          
          // Calculate brightness 
          const brightness = (imageData[pixel] + imageData[pixel + 1] + imageData[pixel + 2]) / 3;
          totalBrightness += brightness;
          
          edgeStrength += edgeH;
        }
      }
      
      // Normalize values
      edgeStrength /= pixelCount;
      const avgBrightness = totalBrightness / pixelCount;
      
      // Analyze results
      const isBlurry = edgeStrength < 10; // Adjust threshold based on testing
      const poorLighting = avgBrightness < 40 || avgBrightness > 220; // Too dark or too bright
      
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
        variant: "warning",
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
