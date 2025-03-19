
import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { 
  detectCardInFrame, 
  CardDetectionError,
  CardDetectionErrorType
} from '@/utils/cardDetectionUtils';

/**
 * Custom hook for automatic card detection functionality
 * Handles the periodic checking for cards in video frames
 * 
 * @param {Object} params - Parameters object
 * @param {React.RefObject<HTMLVideoElement>} params.videoRef - Reference to video element
 * @param {React.RefObject<HTMLCanvasElement>} params.canvasRef - Reference to canvas element
 * @param {boolean} params.isCameraActive - Whether camera is currently active
 * @param {boolean} params.isScanning - Whether card scanning is in progress
 * @param {Function} params.onCardDetected - Callback when card is detected
 * @returns {Object} Card detection state and controls
 */
export function useCardDetection({
  videoRef,
  canvasRef,
  isCameraActive,
  isScanning,
  onCardDetected
}: {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isCameraActive: boolean;
  isScanning: boolean;
  onCardDetected: () => void;
}) {
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(true);
  const [detectError, setDetectError] = useState<{message: string; type: CardDetectionErrorType} | null>(null);
  const autoDetectIntervalRef = useRef<number | null>(null);
  const { toast } = useToast();
  
  // Error counter to avoid spamming users with error toasts
  const errorCountRef = useRef(0);
  const MAX_ERRORS_BEFORE_DISABLE = 5;

  /**
   * Checks if a card is present in the current video frame
   */
  const detectCard = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || isScanning) return;
    
    // Reset error state on each detection attempt
    setDetectError(null);
    
    try {
      const isCardDetected = detectCardInFrame(videoRef.current, canvasRef.current);
      
      // Reset error counter on successful detection
      errorCountRef.current = 0;
      
      if (isCardDetected) {
        onCardDetected();
      }
    } catch (error) {
      // Increment error counter
      errorCountRef.current++;
      
      console.error('Fehler bei der Kartenerkennung:', error);
      
      let errorMessage = 'Ein unbekannter Fehler ist bei der Kartenerkennung aufgetreten';
      let errorType = CardDetectionErrorType.PROCESSING_ERROR;
      
      if (error instanceof CardDetectionError) {
        errorMessage = error.message;
        errorType = error.type;
      }
      
      setDetectError({ message: errorMessage, type: errorType });
      
      // Show toast only for the first error to avoid spamming
      if (errorCountRef.current === 1) {
        toast({
          title: "Problem bei der Kartenerkennung",
          description: errorMessage,
          variant: "destructive",
        });
      }
      
      // If we've reached the error threshold, disable auto detection
      if (errorCountRef.current >= MAX_ERRORS_BEFORE_DISABLE && autoDetectEnabled) {
        setAutoDetectEnabled(false);
        stopAutoDetection();
        
        toast({
          title: "Automatische Erkennung deaktiviert",
          description: "Zu viele Fehler bei der Kartenerkennung. Bitte versuche es manuell.",
          variant: "destructive",
        });
      }
    }
  }, [isScanning, canvasRef, videoRef, onCardDetected, autoDetectEnabled, toast]);
  
  /**
   * Starts automatic card detection at regular intervals
   */
  const startAutoDetection = useCallback(() => {
    if (autoDetectIntervalRef.current) {
      clearInterval(autoDetectIntervalRef.current);
    }
    
    // Check for card every 1 second
    autoDetectIntervalRef.current = window.setInterval(() => {
      if (!isScanning && isCameraActive) {
        detectCard();
      }
    }, 1000);
    
    console.log('Automatische Kartenerkennung aktiviert');
  }, [isScanning, isCameraActive, detectCard]);

  /**
   * Stops the automatic card detection
   */
  const stopAutoDetection = useCallback(() => {
    if (autoDetectIntervalRef.current) {
      clearInterval(autoDetectIntervalRef.current);
      autoDetectIntervalRef.current = null;
    }
    console.log('Automatische Kartenerkennung deaktiviert');
  }, []);

  /**
   * Toggles automatic card detection on/off
   */
  const toggleAutoDetection = useCallback(() => {
    setAutoDetectEnabled(prev => {
      const newState = !prev;
      if (newState && isCameraActive) {
        // Reset error counter when enabling
        errorCountRef.current = 0;
        startAutoDetection();
      } else {
        stopAutoDetection();
      }
      return newState;
    });
  }, [isCameraActive, startAutoDetection, stopAutoDetection]);

  // Start/stop auto detection based on camera state and auto-detect setting
  useEffect(() => {
    if (isCameraActive && autoDetectEnabled) {
      startAutoDetection();
    } else {
      stopAutoDetection();
    }
    
    return () => {
      stopAutoDetection();
    };
  }, [isCameraActive, autoDetectEnabled, startAutoDetection, stopAutoDetection]);

  // Reset error state when camera is toggled
  useEffect(() => {
    if (!isCameraActive) {
      setDetectError(null);
      errorCountRef.current = 0;
    }
  }, [isCameraActive]);

  return {
    autoDetectEnabled,
    detectError,
    toggleAutoDetection
  };
}
