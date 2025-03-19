
import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { 
  startCamera as startCameraUtil, 
  stopMediaStream, 
  CameraError, 
  CameraErrorType, 
  isCameraSupported as isCameraSupportedUtil
} from '@/utils/cameraUtils';

/**
 * Custom hook for camera controls in the scanner application
 * Manages camera activation, deactivation, and related state
 * 
 * @returns {Object} Camera control functions and state
 */
export function useCameraControls() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraSupported, setIsCameraSupported] = useState(true);
  const [error, setError] = useState<{ message: string; type: CameraErrorType } | null>(null);
  
  /**
   * Starts the camera feed
   * Attempts to access user's camera and displays it in the video element
   */
  const startCamera = useCallback(async () => {
    // Reset previous errors
    setError(null);
    
    // Check if camera is supported by the browser
    if (!isCameraSupportedUtil()) {
      const errorMessage = "Dein Browser unterstützt keine Kamerafunktionen";
      setError({ message: errorMessage, type: CameraErrorType.NOT_SUPPORTED });
      setIsCameraSupported(false);
      
      toast({
        title: "Kamerazugriff nicht verfügbar",
        description: errorMessage,
        variant: "destructive",
      });
      
      return;
    }
    
    try {
      const stream = await startCameraUtil(videoRef);
      
      // Store the stream reference for cleanup
      streamRef.current = stream;
      setIsCameraActive(true);
      
      toast({
        title: "Kamera aktiv",
        description: "Halte eine Pokemon-Karte vor die Kamera, um sie zu scannen",
      });
    } catch (error) {
      console.error('Fehler beim Zugriff auf die Kamera:', error);
      
      let errorMessage = "Ein unbekannter Fehler ist aufgetreten";
      let errorType = CameraErrorType.GENERAL_ERROR;
      
      if (error instanceof CameraError) {
        errorMessage = error.message;
        errorType = error.type;
        
        // Update the support state if this is a support issue
        if (error.type === CameraErrorType.NOT_SUPPORTED) {
          setIsCameraSupported(false);
        }
      }
      
      setError({ message: errorMessage, type: errorType });
      
      toast({
        title: "Kamerazugriff fehlgeschlagen",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [toast]);

  /**
   * Stops the camera feed and releases resources
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      stopMediaStream(streamRef.current);
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsCameraActive(false);
  }, []);

  /**
   * Toggles the camera on/off
   */
  const toggleCamera = useCallback(() => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  }, [isCameraActive, startCamera, stopCamera]);

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Check for camera support on initial mount
  useEffect(() => {
    setIsCameraSupported(isCameraSupportedUtil());
  }, []);

  return {
    videoRef,
    isCameraActive,
    isCameraSupported,
    error,
    startCamera,
    stopCamera,
    toggleCamera
  };
}
