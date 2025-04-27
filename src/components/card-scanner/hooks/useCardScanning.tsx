
import { useState, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { CardDetectionError } from '@/utils/cardDetectionUtils';
import { ScanResult, ScannerError, CardScanningErrorType } from '../types/scannerTypes';
import { processCardImage, captureFrameUtil } from '../utils/scanProcessingUtils';
import { CardRegionAdjustment } from '../types/adjustmentTypes';

/**
 * Custom hook for card scanning functionality
 * Handles the process of capturing and analyzing card images
 * 
 * @param {Object} params - Parameters object
 * @param {React.RefObject<HTMLVideoElement>} params.videoRef - Reference to video element
 * @param {React.RefObject<HTMLCanvasElement>} params.canvasRef - Reference to canvas element
 * @param {CardRegionAdjustment|null} params.manualAdjustment - Manual adjustment for card region
 * @returns {Object} Scanning state and functions
 */
export function useCardScanning({
  videoRef,
  canvasRef,
  manualAdjustment = null
}: {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  manualAdjustment?: CardRegionAdjustment | null;
}) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanError, setScanError] = useState<ScannerError | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const scanAbortControllerRef = useRef<AbortController | null>(null);

  /**
   * Processes the captured frame and handles the scanning workflow
   * Enhanced to provide better user feedback and error handling
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
      // Validate video dimensions for optimal OCR
      const video = videoRef.current;
      const minDimension = Math.min(video.videoWidth, video.videoHeight);
      
      if (minDimension < 480) {
        toast({
          title: "Bildqualität",
          description: "Kameraauflösung niedrig. Bessere Ergebnisse mit höherer Auflösung möglich.",
          variant: "default"
        });
      }
      
      // Create an error handler that matches the expected signature
      const handleScanError = (_type: string, error: ScannerError) => {
        setScanError(error);
      };
      
      // Capture frame using utility with the compatible error handler
      const imageDataUrl = await captureFrameUtil(videoRef, canvasRef, handleScanError);
      
      if (!imageDataUrl) {
        setIsScanning(false);
        return;
      }
      
      // Create abort controller for this analysis
      scanAbortControllerRef.current = new AbortController();
      const signal = scanAbortControllerRef.current.signal;
      
      // Process the image with manual adjustment if available
      const result = await processCardImage(imageDataUrl, signal, manualAdjustment);
      
      // Clear any previous results to ensure we don't see stale data
      setScanResult(null);
      
      // Check for low quality OCR results
      if (result.ocrResult.confidence < 50) {
        toast({
          title: "Niedrige OCR-Qualität",
          description: "Text wurde mit niedriger Zuverlässigkeit erkannt. Versuche es mit besserer Beleuchtung.",
          variant: "default"
        });
      }
      
      // Check if card is too small in frame
      if (manualAdjustment) {
        const width = Math.max(
          manualAdjustment.topRight.x - manualAdjustment.topLeft.x,
          manualAdjustment.bottomRight.x - manualAdjustment.bottomLeft.x
        );
        const height = Math.max(
          manualAdjustment.bottomLeft.y - manualAdjustment.topLeft.y,
          manualAdjustment.bottomRight.y - manualAdjustment.topRight.y
        );
        
        const canvas = canvasRef.current;
        if (width < canvas.width * 0.5 || height < canvas.height * 0.5) {
          toast({
            title: "Karte zu klein",
            description: "Bitte bring die Karte näher an die Kamera für ein besseres Ergebnis.",
            variant: "default"
          });
        }
      }
      
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
          variant: "destructive"
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
  }, [videoRef, canvasRef, manualAdjustment]);

  /**
   * Initiates the card scanning process with enhanced user feedback
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
    
    // Progress animation for better user feedback
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 5;
      setScanProgress(Math.min(progress, 95)); // Max 95% until complete
      
      if (progress >= 95) {
        clearInterval(progressInterval);
      }
    }, 50);
    
    // Give a very short delay to allow the UI to update
    setTimeout(() => {
      setScanProgress(100);
      captureFrame().finally(() => {
        clearInterval(progressInterval);
      });
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
