
import { CardScanningErrorType, ScannerError } from '../../types/scannerTypes';
import { toast } from '@/components/ui/use-toast';

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
