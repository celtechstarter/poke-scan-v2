
import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { 
  CameraFocusMode,
  updateCameraFocus
} from '@/utils/camera';

interface UseCameraFocusProps {
  isCameraActive: boolean;
  stopCamera: () => void;
  startCamera: (options?: any) => Promise<void>;
}

/**
 * Custom hook for camera focus control
 * 
 * @param {UseCameraFocusProps} props - Dependencies for focus control
 * @returns {Object} Focus control state and functions
 */
export function useCameraFocus({ 
  isCameraActive, 
  stopCamera, 
  startCamera 
}: UseCameraFocusProps) {
  const { toast } = useToast();
  const [focusMode, setFocusMode] = useState<CameraFocusMode>(CameraFocusMode.AUTO);
  const [focusCapabilities, setFocusCapabilities] = useState<{
    supportsFocusMode: boolean;
    supportedFocusModes: string[];
  }>({
    supportsFocusMode: false,
    supportedFocusModes: []
  });

  /**
   * Updates focus capabilities information
   */
  const updateFocusCapabilities = useCallback((capabilities: {
    supportsFocusMode: boolean;
    supportedFocusModes: string[];
  }) => {
    setFocusCapabilities(capabilities);
  }, []);

  /**
   * Changes camera focus mode
   * 
   * @param {CameraFocusMode} newFocusMode - New focus mode to set
   * @param {number} focusDistance - For manual focus mode, distance value (0.0 to 1.0)
   * @param {MediaStream | null} stream - The active media stream if available
   */
  const changeFocusMode = useCallback(async (
    newFocusMode: CameraFocusMode, 
    focusDistance?: number,
    stream?: MediaStream | null
  ) => {
    setFocusMode(newFocusMode);
    
    if (stream && isCameraActive) {
      const success = await updateCameraFocus(stream, newFocusMode, focusDistance);
      
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
  }, [isCameraActive, startCamera, stopCamera, toast]);

  /**
   * Toggles between different focus modes
   * 
   * @param {MediaStream | null} stream - The active media stream if available
   */
  const toggleFocusMode = useCallback((stream?: MediaStream | null) => {
    const focusModes = Object.values(CameraFocusMode);
    const currentIndex = focusModes.indexOf(focusMode);
    const nextIndex = (currentIndex + 1) % focusModes.length;
    const nextFocusMode = focusModes[nextIndex] as CameraFocusMode;
    
    changeFocusMode(nextFocusMode, undefined, stream);
  }, [focusMode, changeFocusMode]);

  return {
    focusMode,
    focusCapabilities,
    updateFocusCapabilities,
    changeFocusMode,
    toggleFocusMode
  };
}
