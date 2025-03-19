
import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { captureVideoFrame, CardDetectionError, CardDetectionErrorType } from '@/utils/cardDetectionUtils';
import { analyzeCardImage } from '@/utils/cardAnalysisUtils';

/**
 * Error types specific to card scanning
 */
export enum CardScanningErrorType {
  CAPTURE_FAILED = 'capture_failed',
  ANALYSIS_FAILED = 'analysis_failed',
  PRICE_LOOKUP_FAILED = 'price_lookup_failed'
}

/**
 * Custom hook for card scanning functionality
 * Handles the process of capturing and analyzing card images
 * 
 * @param {Object} params - Parameters object
 * @param {React.RefObject<HTMLVideoElement>} params.videoRef - Reference to video element
 * @param {React.RefObject<HTMLCanvasElement>} params.canvasRef - Reference to canvas element
 * @returns {Object} Scanning state and functions
 */
export function useCardScanning({
  videoRef,
  canvasRef
}: {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}) {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanError, setScanError] = useState<{
    message: string;
    type: CardScanningErrorType | CardDetectionErrorType;
  } | null>(null);
  const [scanResult, setScanResult] = useState<{
    cardName: string;
    cardNumber?: string;
    price: number | null;
    imageDataUrl: string | null;
  } | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const scanAbortControllerRef = useRef<AbortController | null>(null);

  /**
   * Process the captured card image through analysis
   * @param {string} imageDataUrl - The captured image as a data URL
   */
  const processCardImage = useCallback(async (imageDataUrl: string) => {
    toast({
      title: "Bild aufgenommen",
      description: "Analysiere Pokemon-Karte...",
    });
    
    setScanError(null);
    
    try {
      // Create abort controller for this analysis
      scanAbortControllerRef.current = new AbortController();
      const signal = scanAbortControllerRef.current.signal;
      
      // Set up abort handling
      signal.addEventListener('abort', () => {
        console.log('Card analysis aborted');
      });
      
      const result = await analyzeCardImage(imageDataUrl, signal);
      
      setScanResult({
        cardName: result.cardName,
        cardNumber: result.cardNumber,
        price: result.price,
        imageDataUrl: imageDataUrl
      });
      
      toast({
        title: "Karte erkannt!",
        description: `${result.cardName} (${result.cardNumber || 'Keine Nummer'}) - Preis: ${result.price ? `${result.price.toFixed(2)} €` : 'Nicht verfügbar'}`,
        variant: "default",
      });
    } catch (error) {
      console.error('Fehler bei der Kartenanalyse:', error);
      
      let errorType = CardScanningErrorType.ANALYSIS_FAILED;
      let errorMessage = "Die Karte konnte nicht erkannt werden. Bitte versuche es erneut.";
      
      // Check if the error is due to abort - in which case we don't show an error toast
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('Analyse abgebrochen');
        return;
      }
      
      // Check for more specific error types
      if (error instanceof Error) {
        if (error.message.includes('price') || error.message.includes('Preis')) {
          errorType = CardScanningErrorType.PRICE_LOOKUP_FAILED;
          errorMessage = "Karte erkannt, aber der Preis konnte nicht ermittelt werden.";
        }
      }
      
      setScanError({
        message: errorMessage,
        type: errorType
      });
      
      toast({
        title: "Fehler bei der Analyse",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      scanAbortControllerRef.current = null;
    }
  }, [toast]);

  /**
   * Captures a frame from the video and processes it
   */
  const captureFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) {
      setScanError({
        message: "Video oder Canvas nicht verfügbar",
        type: CardDetectionErrorType.INVALID_INPUT
      });
      setIsScanning(false);
      return;
    }
    
    try {
      const imageDataUrl = captureVideoFrame(videoRef.current, canvasRef.current);
      
      if (imageDataUrl) {
        await processCardImage(imageDataUrl);
      } else {
        setScanError({
          message: "Bild konnte nicht aufgenommen werden",
          type: CardScanningErrorType.CAPTURE_FAILED
        });
        
        toast({
          title: "Scanfehler",
          description: "Bild konnte nicht aufgenommen werden. Bitte versuche es erneut.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Fehler beim Erfassen des Bildes:', error);
      
      let errorMessage = "Fehler beim Erfassen des Bildes";
      let errorType = CardScanningErrorType.CAPTURE_FAILED;
      
      if (error instanceof CardDetectionError) {
        errorMessage = error.message;
        errorType = error.type;
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
    } finally {
      setIsScanning(false);
    }
  }, [videoRef, canvasRef, processCardImage, toast]);

  /**
   * Initiates the card scanning process
   * Shows a progress indicator while scanning
   */
  const scanCard = useCallback(() => {
    // First cancel any ongoing scan
    cancelScan();
    
    setIsScanning(true);
    setScanProgress(0);
    setScanError(null);
    
    // Simulate scan progress
    let progress = 0;
    scanIntervalRef.current = window.setInterval(() => {
      progress += 5;
      setScanProgress(progress);
      
      if (progress >= 100) {
        clearInterval(scanIntervalRef.current!);
        captureFrame();
      }
    }, 100);
    
    toast({
      title: "Scan gestartet",
      description: "Halte die Karte ruhig, während wir sie analysieren...",
    });
  }, [captureFrame, toast]);

  /**
   * Cancels an ongoing scan
   */
  const cancelScan = useCallback(() => {
    // Clear progress interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    // Abort any ongoing analysis
    if (scanAbortControllerRef.current) {
      scanAbortControllerRef.current.abort();
      scanAbortControllerRef.current = null;
    }
    
    setIsScanning(false);
  }, []);

  return {
    isScanning,
    scanProgress,
    scanResult,
    scanError,
    scanCard,
    cancelScan
  };
}
