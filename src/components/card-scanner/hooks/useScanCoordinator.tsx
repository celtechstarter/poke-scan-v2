
import { useRef, useCallback } from 'react';
import { useCameraControls } from './useCameraControls';
import { useCardDetection } from './useCardDetection';
import { useCardScanning } from './useCardScanning';
import { useScannerState } from './useScannerState';
import { CameraFocusMode, CameraOptions } from '@/utils/camera';
import { CardRegionAdjustment } from '../types/adjustmentTypes';

/**
 * Coordinator hook for the card scanner
 * Combines camera controls, card detection, scanning functionality, and error handling
 * 
 * @returns {Object} Combined scanner state and functions
 */
export function useScanCoordinator(manualAdjustment: CardRegionAdjustment | null = null) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { errors, setError } = useScannerState();
  
  // Optimal camera settings for card scanning
  const optimalCameraOptions: CameraOptions = {
    facingMode: 'environment',
    width: 1920,
    height: 1440,
    focusMode: CameraFocusMode.CONTINUOUS
  };
  
  // Camera control functionality with optimal settings
  const {
    videoRef,
    isCameraActive,
    isCameraSupported,
    error: cameraError,
    focusMode,
    focusCapabilities,
    startCamera,
    toggleCamera,
    toggleFocusMode
  } = useCameraControls();
  
  // Update error state when camera error changes
  if (cameraError !== errors.camera) {
    setError('camera', cameraError);
  }
  
  // Card scanning functionality
  const {
    isScanning,
    scanProgress,
    scanResult,
    scanError,
    scanCard: originalScanCard,
    cancelScan
  } = useCardScanning({
    videoRef,
    canvasRef,
    manualAdjustment
  });
  
  // Update error state when scan error changes
  if (scanError !== errors.scanning) {
    setError('scanning', scanError);
  }
  
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
    onCardDetected: originalScanCard
  });
  
  // Update error state when detection error changes
  if (detectError !== errors.detection) {
    setError('detection', detectError);
  }
  
  // Handle scan initiation, checking camera status first
  const scanCard = useCallback(() => {
    if (!isCameraActive) {
      // Start camera with optimal settings for card scanning
      startCamera(optimalCameraOptions);
      return;
    }
    
    originalScanCard();
  }, [isCameraActive, startCamera, originalScanCard, optimalCameraOptions]);

  // Enhanced camera toggle to use optimal settings
  const enhancedToggleCamera = useCallback(() => {
    if (isCameraActive) {
      toggleCamera();
    } else {
      // When turning camera on, use optimal settings
      startCamera(optimalCameraOptions);
    }
  }, [isCameraActive, toggleCamera, startCamera, optimalCameraOptions]);

  return {
    // Refs
    videoRef,
    canvasRef,
    
    // State
    isScanning,
    isCameraActive,
    isCameraSupported,
    scanProgress,
    scanResult,
    autoDetectEnabled,
    focusMode,
    focusCapabilities,
    errors,
    
    // Actions
    scanCard,
    toggleCamera: enhancedToggleCamera,
    toggleAutoDetection,
    toggleFocusMode,
    cancelScan
  };
}
