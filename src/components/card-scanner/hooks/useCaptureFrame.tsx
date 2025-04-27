
import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { CardDetectionError } from '@/utils/cardDetectionUtils';
import { ScannerError, CardScanningErrorType } from '../types/scannerTypes';
import { captureFrameUtil } from '../utils/scanProcessingUtils';
import { CardRegionAdjustment } from '../types/adjustmentTypes';

interface UseCaptureFrameProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  manualAdjustment?: CardRegionAdjustment | null;
  setScanError: (error: ScannerError | null) => void;
}

export function useCaptureFrame({
  videoRef,
  canvasRef,
  manualAdjustment,
  setScanError
}: UseCaptureFrameProps) {
  const captureFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) {
      setScanError({
        message: "Video oder Canvas nicht verfügbar",
        type: CardScanningErrorType.CAPTURE_FAILED
      });
      return null;
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
        return null;
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
      
      return imageDataUrl;
    } catch (error) {
      console.error('Fehler beim Scannen:', error);
      
      if (error instanceof CardDetectionError) {
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
      return null;
    }
  }, [videoRef, canvasRef, manualAdjustment, setScanError]);

  return { captureFrame };
}

