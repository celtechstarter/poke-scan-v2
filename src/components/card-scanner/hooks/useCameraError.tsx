
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  CameraError, 
  CameraErrorType, 
  isCameraSupported as isCameraSupportedUtil
} from '@/utils/camera';

/**
 * Custom hook for handling camera-related errors
 * 
 * @returns {Object} Error handling state and functions
 */
export function useCameraError() {
  const { toast } = useToast();
  const [isCameraSupported, setIsCameraSupported] = useState(true);
  const [error, setError] = useState<{ message: string; type: CameraErrorType } | null>(null);

  // Check for camera support on initial mount
  useEffect(() => {
    setIsCameraSupported(isCameraSupportedUtil());
  }, []);

  /**
   * Handles and categorizes camera errors
   * 
   * @param {unknown} error - The error to handle
   */
  const handleCameraError = (error: unknown) => {
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
  };

  /**
   * Resets the current error state
   */
  const resetError = () => {
    setError(null);
  };

  return {
    error,
    isCameraSupported,
    handleCameraError,
    resetError
  };
}
