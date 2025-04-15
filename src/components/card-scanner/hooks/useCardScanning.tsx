
import { useState, useRef, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { CardDetectionError } from '@/utils/cardDetectionUtils';
import { ScanResult, ScannerError, CardScanningErrorType } from '../types/scannerTypes';
import { processCardImage, captureFrameUtil } from '../utils/scanProcessingUtils';

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
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanError, setScanError] = useState<ScannerError | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const scanAbortControllerRef = useRef<AbortController | null>(null);

  /**
   * Processes the captured frame and handles the scanning workflow
   */
  const captureFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) {
      setScanError({
        message: "Video oder Canvas nicht verfügbar",
        type: CardScanningErrorType.CAPTURE_FAILED
      });
      setIsScanning(false);
      return;
    }
    
    try {
      // Capture frame using utility
      const imageDataUrl = await captureFrameUtil(videoRef, canvasRef, setScanError);
      
      if (!imageDataUrl) {
        setIsScanning(false);
        return;
      }
      
      // Create abort controller for this analysis
      scanAbortControllerRef.current = new AbortController();
      const signal = scanAbortControllerRef.current.signal;
      
      // Process the image
      const result = await processCardImage(imageDataUrl, signal);
      
      // Clear any previous results to ensure we don't see stale data
      setScanResult(null);
      
      // Set the new result after a brief delay to ensure UI refresh
      setTimeout(() => {
        setScanResult(result);
      }, 50);
      
    } catch (error) {
      console.error('Fehler beim Scannen:', error);
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('Scan abgebrochen');
        return;
      }
      
      // Check if error is already a ScannerError
      if (error && typeof error === 'object' && 'type' in error && 'message' in error) {
        setScanError(error as ScannerError);
      } else if (error instanceof CardDetectionError) {
        setScanError({
          message: error.message,
          type: CardScanningErrorType.CAPTURE_FAILED
        });
        
        toast({
          title: "Scanfehler",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setScanError({
          message: "Ein unbekannter Fehler ist aufgetreten",
          type: CardScanningErrorType.GENERAL_ERROR as any
        });
      }
    } finally {
      scanAbortControllerRef.current = null;
      setIsScanning(false);
    }
  }, [videoRef, canvasRef]);

  /**
   * Initiates the card scanning process
   */
  const scanCard = useCallback(() => {
    // First cancel any ongoing scan
    cancelScan();
    
    // Clear previous results to ensure fresh scan
    setScanResult(null);
    setIsScanning(true);
    setScanProgress(0);
    setScanError(null);
    
    toast({
      title: "Scan gestartet",
      description: "Karte wird sofort erfasst...",
    });
    
    // Give a very short delay to allow the UI to update
    setTimeout(() => {
      setScanProgress(100);
      captureFrame();
    }, 100);
    
  }, [captureFrame]);

  /**
   * Cancels an ongoing scan
   */
  const cancelScan = useCallback(() => {
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
