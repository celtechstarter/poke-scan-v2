
import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  startCamera as startCameraUtil, 
  stopMediaStream, 
  getCameraCapabilities,
  CameraOptions
} from '@/utils/camera';
import { useCameraError } from './useCameraError';
import { useCameraFocus } from './useCameraFocus';

/**
 * Custom hook for camera activation controls
 * 
 * @returns {Object} Camera activation state and functions
 */
export function useCameraActivation() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const { 
    error, 
    isCameraSupported, 
    handleCameraError, 
    resetError 
  } = useCameraError();

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

  // Create focus hook with required dependencies
  const { 
    focusMode, 
    focusCapabilities, 
    updateFocusCapabilities,
    changeFocusMode, 
    toggleFocusMode 
  } = useCameraFocus({
    isCameraActive,
    stopCamera,
    startCamera: async () => {} // Placeholder to be replaced with actual startCamera
  });

  /**
   * Starts the camera feed with specified focus mode
   * Attempts to access user's camera and displays it in the video element
   */
  const startCamera = useCallback(async (options?: Partial<CameraOptions>) => {
    // Reset previous errors
    resetError();
    
    // Check if camera is supported by the browser
    if (!isCameraSupported) {
      const errorMessage = "Dein Browser unterstützt keine Kamerafunktionen";
      handleCameraError(new Error(errorMessage));
      
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
      updateFocusCapabilities(capabilities);
      
      toast({
        title: "Kamera aktiv",
        description: "Halte eine Pokemon-Karte vor die Kamera, um sie zu scannen",
      });
    } catch (error) {
      handleCameraError(error);
    }
  }, [toast, focusMode, isCameraSupported, handleCameraError, resetError, updateFocusCapabilities]);

  // Fix circular dependency by updating the startCamera reference in focusControl
  useCameraFocus({
    isCameraActive,
    stopCamera,
    startCamera
  });

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

  // Wrapper for toggleFocusMode that passes the current stream
  const handleToggleFocusMode = useCallback(() => {
    toggleFocusMode(streamRef.current);
  }, [toggleFocusMode]);

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    streamRef,
    isCameraActive,
    isCameraSupported,
    error,
    focusMode,
    focusCapabilities,
    startCamera,
    stopCamera,
    toggleCamera,
    changeFocusMode: (newFocusMode: any, focusDistance?: number) => 
      changeFocusMode(newFocusMode, focusDistance, streamRef.current),
    toggleFocusMode: handleToggleFocusMode
  };
}
