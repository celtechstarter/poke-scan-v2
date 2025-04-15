
import { useScanCoordinator } from './hooks/useScanCoordinator';
import { ScannerError } from './types/scannerTypes';

/**
 * Main hook for Pokemon card scanner logic
 * This is now a thin wrapper around our coordinator hook
 * for backwards compatibility
 * 
 * @returns {Object} Combined scanner state and functions
 */
export function useScannerLogic() {
  const {
    videoRef,
    canvasRef,
    isScanning,
    isCameraActive,
    isCameraSupported,
    scanProgress,
    scanResult,
    autoDetectEnabled,
    focusMode,
    focusCapabilities,
    errors,
    scanCard,
    toggleCamera,
    toggleAutoDetection,
    toggleFocusMode,
    cancelScan
  } = useScanCoordinator();
  
  return {
    videoRef,
    canvasRef,
    isScanning,
    isCameraActive,
    isCameraSupported,
    scanProgress,
    scanResult,
    autoDetectEnabled,
    focusMode,
    focusCapabilities,
    errors,
    scanCard,
    toggleCamera,
    toggleAutoDetection,
    toggleFocusMode,
    cancelScan
  };
}
