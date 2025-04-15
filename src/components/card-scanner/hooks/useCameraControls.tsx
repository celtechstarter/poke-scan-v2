
import { useCameraActivation } from './useCameraActivation';
import { CameraErrorType } from '@/utils/camera';

/**
 * Custom hook for camera controls in the scanner application
 * Combines camera activation, focus control, and error handling
 * 
 * @returns {Object} Camera control functions and state
 */
export function useCameraControls() {
  // Use our new camera activation hook which also includes focus and error handling
  const {
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
  } = useCameraActivation();

  // Return the same interface as before to maintain compatibility
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
