
import { toast } from '@/components/ui/use-toast';
import { analyzeCardImage } from '@/utils/cardAnalysisUtils';
import { CardScanningErrorType, ScanResult, ScannerError } from '../types/scannerTypes';

/**
 * Process the captured card image through analysis
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
    description: "Analysiere Pokemon-Karte...",
  });
  
  try {
    // Set up abort handling
    if (signal) {
      signal.addEventListener('abort', () => {
        console.log('Card analysis aborted');
      });
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
