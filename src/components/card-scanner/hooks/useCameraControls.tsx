
import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { 
  startCamera as startCameraUtil, 
  stopMediaStream, 
  CameraError, 
  CameraErrorType, 
  isCameraSupported as isCameraSupportedUtil,
  CameraFocusMode,
  updateCameraFocus,
  getCameraCapabilities,
  CameraOptions
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
  const [focusMode, setFocusMode] = useState<CameraFocusMode>(CameraFocusMode.AUTO);
  const [focusCapabilities, setFocusCapabilities] = useState<{
    supportsFocusMode: boolean;
    supportedFocusModes: string[];
  }>({
    supportsFocusMode: false,
    supportedFocusModes: []
  });
  
  /**
   * Starts the camera feed with specified focus mode
   * Attempts to access user's camera and displays it in the video element
   */
  const startCamera = useCallback(async (options?: Partial<CameraOptions>) => {
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
      // Combine default options with user-provided options
      const cameraOptions: CameraOptions = {
        focusMode: focusMode,
        ...options
      };
      
      const stream = await startCameraUtil(videoRef, cameraOptions);
      
      // Store the stream reference for cleanup
      streamRef.current = stream;
      setIsCameraActive(true);
      
      // Get and store camera capabilities
      const capabilities = getCameraCapabilities(stream);
      setFocusCapabilities(capabilities);
      
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
  }, [toast, focusMode]);

  /**
   * Changes camera focus mode
   * 
   * @param {CameraFocusMode} newFocusMode - New focus mode to set
   * @param {number} focusDistance - For manual focus mode, distance value (0.0 to 1.0)
   */
  const changeFocusMode = useCallback(async (newFocusMode: CameraFocusMode, focusDistance?: number) => {
    setFocusMode(newFocusMode);
    
    if (streamRef.current && isCameraActive) {
      const success = await updateCameraFocus(streamRef.current, newFocusMode, focusDistance);
      
      if (success) {
        let focusModeText = "";
        
        switch (newFocusMode) {
          case CameraFocusMode.AUTO:
            focusModeText = "Autofokus";
            break;
          case CameraFocusMode.CONTINUOUS:
            focusModeText = "Kontinuierlicher Fokus";
            break;
          case CameraFocusMode.FIXED:
            focusModeText = "Fester Fokus";
            break;
          case CameraFocusMode.MANUAL:
            focusModeText = "Manueller Fokus";
            break;
        }
        
        toast({
          title: "Fokus geändert",
          description: `Kamerafokus auf "${focusModeText}" umgestellt`,
        });
      } else {
        toast({
          title: "Fokus konnte nicht geändert werden",
          description: "Dieser Fokus-Modus wird von deiner Kamera nicht unterstützt",
          variant: "destructive",
        });
      }
    } else if (isCameraActive) {
      // Restart camera with new focus mode if stream isn't available
      await stopCamera();
      startCamera({ focusMode: newFocusMode, focusDistance });
    }
  }, [isCameraActive, startCamera]);

  /**
   * Toggles between different focus modes
   */
  const toggleFocusMode = useCallback(() => {
    const focusModes = Object.values(CameraFocusMode);
    const currentIndex = focusModes.indexOf(focusMode);
    const nextIndex = (currentIndex + 1) % focusModes.length;
    const nextFocusMode = focusModes[nextIndex] as CameraFocusMode;
    
    changeFocusMode(nextFocusMode);
  }, [focusMode, changeFocusMode]);

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
    focusMode,
    focusCapabilities,
    startCamera,
    stopCamera,
    toggleCamera,
    changeFocusMode,
    toggleFocusMode
  };
}
