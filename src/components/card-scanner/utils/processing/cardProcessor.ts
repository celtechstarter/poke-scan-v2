import { toast } from '@/components/ui/use-toast';
import { analyzeCardImage } from '@/utils/cardAnalysisUtils';
import { CardScanningErrorType, ScanResult, ScannerError } from '../../types/scannerTypes';
import { assessImageQuality } from '../quality/imageQualityUtils';

export const processCardImage = async (
  imageDataUrl: string,
  signal?: AbortSignal
): Promise<ScanResult> => {
  toast({
    title: "Bild aufgenommen",
    description: "Überprüfe Bildqualität und analysiere Karte...",
  });
  
  try {
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
    }
    
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
