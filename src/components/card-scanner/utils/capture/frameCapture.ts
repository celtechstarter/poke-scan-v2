
import { CardScanningErrorType, ScannerError } from '../../types/scannerTypes';

/**
 * Capture a frame from the video element for processing
 * Enhanced with validation of the frame quality
 * 
 * @param videoRef - Reference to the video element
 * @param canvasRef - Reference to the canvas element for capture
 * @param setError - Function to set error state
 * @returns The captured frame as a data URL, or null if capture fails
 */
export const captureFrameUtil = async (
  videoRef: React.RefObject<HTMLVideoElement>, 
  canvasRef: React.RefObject<HTMLCanvasElement>,
  setError: (error: ScannerError | null) => void
): Promise<string | null> => {
  // Validate refs
  if (!videoRef.current || !canvasRef.current) {
    const error: ScannerError = {
      message: "Kamera oder Canvas nicht verfügbar",
      type: CardScanningErrorType.CAPTURE_FAILED
    };
    setError(error);
    return null;
  }
  
  const video = videoRef.current;
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  if (!ctx) {
    const error: ScannerError = {
      message: "Canvas-Kontext konnte nicht erstellt werden",
      type: CardScanningErrorType.CAPTURE_FAILED
    };
    setError(error);
    return null;
  }
  
  try {
    // Set canvas dimensions to match video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Clear canvas before drawing new frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the current video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Add a timestamp to the canvas (useful for debugging)
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(5, 5, 140, 20);
    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';
    ctx.fillText(`Captured: ${new Date().toLocaleTimeString()}`, 10, 20);
    
    // Convert to data URL with quality settings
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    
    // Validate that the data URL is not empty
    if (!dataUrl || dataUrl === 'data:,') {
      const error: ScannerError = {
        message: "Leeres Bild erfasst. Bitte prüfe die Kameraverbindung.",
        type: CardScanningErrorType.CAPTURE_FAILED
      };
      setError(error);
      return null;
    }
    
    // Check data URL size (if too small, likely an error)
    if (dataUrl.length < 1000) {
      const error: ScannerError = {
        message: "Ungültiges Bild erfasst. Bitte prüfe die Kameraeinstellungen.",
        type: CardScanningErrorType.CAPTURE_FAILED
      };
      setError(error);
      return null;
    }
    
    // Clear any previous errors
    setError(null);
    
    return dataUrl;
  } catch (error) {
    console.error('Fehler beim Erfassen des Bildes:', error);
    
    const scannerError: ScannerError = {
      message: "Fehler beim Erfassen des Kamerabildes",
      type: CardScanningErrorType.CAPTURE_FAILED
    };
    
    setError(scannerError);
    return null;
  }
};
