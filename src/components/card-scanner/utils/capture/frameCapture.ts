
import { CardScanningErrorType, ScannerError } from "../../types/scannerTypes";
import { toast } from "@/hooks/use-toast";

/**
 * Captures a frame from the video stream and returns it as a data URL
 * Now with proper cropping to match the yellow scanning frame
 * 
 * @param videoRef Reference to the video element
 * @param canvasRef Reference to the canvas element
 * @param setError Function to set error state
 * @returns Data URL of the captured image
 */
export const captureFrameUtil = async (
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  setError: (type: string, error: ScannerError | null) => void
): Promise<string | null> => {
  if (!videoRef.current || !canvasRef.current) {
    const error: ScannerError = {
      message: "Kamera oder Canvas nicht verfügbar",
      type: CardScanningErrorType.CAPTURE_FAILED
    };
    
    setError('scanning', error);
    return null;
  }
  
  try {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas Kontext nicht verfügbar');
    }
    
    // Set canvas dimensions to match video dimensions
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    
    // Calculate frame dimensions based on the yellow frame in ScannerOverlay
    // The yellow frame is 75% of height with a 2.5:3.5 ratio
    const frameHeight = Math.round(videoHeight * 0.75);
    const frameWidth = Math.round((frameHeight * 2.5) / 3.5);
    
    // Calculate frame position (centered in video)
    const frameX = Math.round((videoWidth - frameWidth) / 2);
    const frameY = Math.round((videoHeight - frameHeight) / 2);
    
    // Draw full video frame first (for debugging/reference)
    ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
    
    // Extract only the card area matching the yellow frame (with slight padding)
    const padding = 10; // 10px padding inside the yellow frame
    const cropX = frameX + padding;
    const cropY = frameY + padding;
    const cropWidth = frameWidth - (padding * 2);
    const cropHeight = frameHeight - (padding * 2);
    
    console.log('Crop dimensions:', {
      cropX, cropY, cropWidth, cropHeight,
      videoWidth, videoHeight,
      frameWidth, frameHeight
    });
    
    // Create a new canvas for the cropped image
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropWidth;
    croppedCanvas.height = cropHeight;
    const croppedCtx = croppedCanvas.getContext('2d');
    
    if (!croppedCtx) {
      throw new Error('Could not get context for cropped canvas');
    }
    
    // Draw only the card area to the cropped canvas
    croppedCtx.drawImage(
      video,
      cropX, cropY, cropWidth, cropHeight,
      0, 0, cropWidth, cropHeight
    );
    
    // Check if the cropped area is valid
    const imageData = croppedCtx.getImageData(0, 0, cropWidth, cropHeight);
    const hasContent = checkImageHasContent(imageData.data);
    
    if (!hasContent) {
      toast({
        title: "Kein Inhalt erkannt",
        description: "Bitte stelle sicher, dass sich die Karte vollständig im gelben Rahmen befindet.",
        variant: "destructive",
      });
      
      throw new Error('No card content detected in frame');
    }
    
    // Use the cropped image for analysis
    return croppedCanvas.toDataURL('image/png');
    
  } catch (error) {
    console.error('Error capturing frame:', error);
    
    const scanError: ScannerError = {
      message: error instanceof Error 
        ? error.message 
        : 'Ein Fehler ist beim Erfassen des Bildes aufgetreten',
      type: CardScanningErrorType.CAPTURE_FAILED
    };
    
    setError('scanning', scanError);
    return null;
  }
};

/**
 * Checks if the image data contains actual content and is not just empty/background
 */
function checkImageHasContent(data: Uint8ClampedArray): boolean {
  // Sample pixels to determine if there's content
  const totalPixels = data.length / 4;
  const samples = Math.min(totalPixels, 1000);
  const sampleStep = Math.floor(totalPixels / samples);
  
  let contentPixels = 0;
  let totalSampled = 0;
  
  // Check for non-white/non-background pixels
  for (let i = 0; i < data.length; i += 4 * sampleStep) {
    totalSampled++;
    
    // Non-white/grey pixel detection (has color or is dark)
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Check for non-white pixels (either colored or dark)
    const isNonWhite = r < 230 || g < 230 || b < 230;
    
    // Check for color variation (not just grayscale)
    const maxChannel = Math.max(r, g, b);
    const minChannel = Math.min(r, g, b);
    const hasColorVariation = (maxChannel - minChannel) > 20;
    
    if (isNonWhite || hasColorVariation) {
      contentPixels++;
    }
  }
  
  // If at least 10% of sampled pixels have content, consider it valid
  return (contentPixels / totalSampled) > 0.1;
}
