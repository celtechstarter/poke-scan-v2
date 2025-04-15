
import { useRef } from 'react';
import { useCameraControls } from './hooks/useCameraControls';
import { useCardDetection } from './hooks/useCardDetection';
import { useCardScanning } from './hooks/useCardScanning';
import { ScannerError } from './types/scannerTypes';

/**
 * Main hook for Pokemon card scanner logic
 * Combines camera controls, card detection, and scanning functionality
 * 
 * @returns {Object} Combined scanner state and functions
 */
export function useScannerLogic() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Camera control functionality
  const {
    videoRef,
    isCameraActive,
    isCameraSupported,
    error: cameraError,
    startCamera,
    toggleCamera
  } = useCameraControls();
  
  // Card scanning functionality
  const {
    isScanning,
    scanProgress,
    scanResult,
    scanError,
    scanCard,
    cancelScan
  } = useCardScanning({
    videoRef,
    canvasRef
  });
  
  // Automatic card detection functionality
  const {
    autoDetectEnabled,
    detectError,
    toggleAutoDetection
  } = useCardDetection({
    videoRef,
    canvasRef,
    isCameraActive,
    isScanning,
    onCardDetected: scanCard
  });
  
  // Handle scan initiation, checking camera status first
  const handleScanStart = () => {
    if (!isCameraActive) {
      startCamera();
      return;
    }
    
    scanCard();
  };

  // Combine errors for easier access
  const errors = {
    camera: cameraError,
    detection: detectError,
    scanning: scanError as ScannerError | null
  };

  return {
    videoRef,
    canvasRef,
    isScanning,
    isCameraActive,
    isCameraSupported,
    scanProgress,
    scanResult,
    autoDetectEnabled,
    errors,
    scanCard: handleScanStart,
    toggleCamera,
    toggleAutoDetection,
    cancelScan
  };
}
