
import { useState, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { CardDetectionError } from '@/utils/cardDetectionUtils';
import { ScanResult, ScannerError, CardScanningErrorType } from '../types/scannerTypes';
import { processCardImage, captureFrameUtil } from '../utils/scanProcessingUtils';
import { CardRegionAdjustment } from '../types/adjustmentTypes';
import { useScanProgress } from './useScanProgress';
import { useScanResults } from './useScanResults';

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
  const scanAbortControllerRef = useRef<AbortController | null>(null);
  const { scanProgress, startScanProgress, setScanProgress } = useScanProgress();
  const { scanResult, setScanResult, scanError, setScanError, clearResults } = useScanResults();

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
      
      const handleScanError = (_type: string, error: ScannerError) => {
        setScanError(error);
      };
      
      const imageDataUrl = await captureFrameUtil(videoRef, canvasRef, handleScanError);
      
      if (!imageDataUrl) {
        setIsScanning(false);
        return;
      }
      
      scanAbortControllerRef.current = new AbortController();
      const signal = scanAbortControllerRef.current.signal;
      
      const result = await processCardImage(imageDataUrl, signal, manualAdjustment);
      
      clearResults();
      
      if (result.ocrResult.confidence < 50) {
        toast({
          title: "Niedrige OCR-Qualität",
          description: "Text wurde mit niedriger Zuverlässigkeit erkannt. Versuche es mit besserer Beleuchtung.",
          variant: "default"
        });
      }
      
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
      
      setTimeout(() => {
        setScanResult(result);
      }, 50);
      
    } catch (error) {
      console.error('Fehler beim Scannen:', error);
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('Scan abgebrochen');
        return;
      }
      
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
  }, [videoRef, canvasRef, manualAdjustment, setScanError, setScanResult, clearResults]);

  const scanCard = useCallback(() => {
    cancelScan();
    clearResults();
    setIsScanning(true);
    
    toast({
      title: "Scan gestartet",
      description: "Karte wird sofort erfasst...",
    });
    
    const finishProgress = startScanProgress();
    
    setTimeout(() => {
      finishProgress();
      captureFrame();
    }, 100);
  }, [captureFrame, clearResults, startScanProgress]);

  const cancelScan = useCallback(() => {
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
