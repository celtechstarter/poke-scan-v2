
import { useRef } from 'react';
import { useCameraControls } from './hooks/useCameraControls';
import { useCardDetection } from './hooks/useCardDetection';
import { useCardScanning } from './hooks/useCardScanning';

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
    startCamera,
    toggleCamera
  } = useCameraControls();
  
  // Card scanning functionality
  const {
    isScanning,
    scanProgress,
    scanResult,
    scanCard,
    cancelScan
  } = useCardScanning({
    videoRef,
    canvasRef
  });
  
  // Automatic card detection functionality
  const {
    autoDetectEnabled,
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

  return {
    videoRef,
    canvasRef,
    isScanning,
    isCameraActive,
    scanProgress,
    scanResult,
    autoDetectEnabled,
    scanCard: handleScanStart,
    toggleCamera,
    toggleAutoDetection
  };
}
