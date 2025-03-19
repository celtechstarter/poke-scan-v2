
import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { startCamera as startCameraUtil, stopMediaStream } from '@/utils/cameraUtils';

/**
 * Custom hook for camera controls in the scanner application
 * Manages camera activation, deactivation, and related state
 * 
 * @returns {Object} Camera control functions and state
 */
export function useCameraControls() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  /**
   * Starts the camera feed
   * Attempts to access user's camera and displays it in the video element
   */
  const startCamera = useCallback(async () => {
    try {
      const stream = await startCameraUtil(videoRef);
      
      if (stream) {
        setIsCameraActive(true);
        toast({
          title: "Kamera aktiv",
          description: "Halte eine Pokemon-Karte vor die Kamera, um sie zu scannen",
        });
      }
    } catch (error) {
      console.error('Fehler beim Zugriff auf die Kamera:', error);
      toast({
        title: "Kamerazugriff fehlgeschlagen",
        description: "Bitte erlaube den Zugriff auf deine Kamera und versuche es erneut",
        variant: "destructive",
      });
    }
  }, [toast]);

  /**
   * Stops the camera feed and releases resources
   */
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stopMediaStream(stream);
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
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

  return {
    videoRef,
    isCameraActive,
    startCamera,
    stopCamera,
    toggleCamera
  };
}
