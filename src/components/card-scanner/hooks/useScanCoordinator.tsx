
import { useRef, useCallback } from 'react';
import { useCameraControls } from './useCameraControls';
import { useCardDetection } from './useCardDetection';
import { useCardScanning } from './useCardScanning';
import { useScannerState } from './useScannerState';
import { CameraFocusMode, CameraOptions } from '@/utils/camera';
import { CardRegionAdjustment } from '../types/adjustmentTypes';
import { toast } from '@/hooks/use-toast';

/**
 * Coordinator hook for the card scanner
 * Combines camera controls, card detection, scanning functionality, and error handling
 * 
 * @returns {Object} Combined scanner state and functions
 */
export function useScanCoordinator(manualAdjustment: CardRegionAdjustment | null = null) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { errors, setError } = useScannerState();
  
  // Enhanced camera settings optimized for OCR with Google Vision
  const optimalCameraOptions: CameraOptions = {
    facingMode: 'environment',
    width: 1920,  // Higher resolution for better OCR
    height: 1440, // 4:3 aspect ratio
    focusMode: CameraFocusMode.CONTINUOUS // Start with continuous focus for best results
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
  
  // Enhanced scan initiation with pre-validation
  const scanCard = useCallback(() => {
    if (!isCameraActive) {
      // Start camera with optimal settings for card scanning
      startCamera(optimalCameraOptions);
      return;
    }
    
    // Pre-validate video stream quality before scanning
    if (videoRef.current) {
      const video = videoRef.current;
      
      // Check if video dimensions are too small for good OCR
      if (video.videoWidth < 640 || video.videoHeight < 480) {
        setError('scanning', {
          message: "Kameraauflösung zu niedrig für gute OCR-Ergebnisse",
          type: "QUALITY_WARNING"
        });
        
        toast({
          title: "Niedrige Auflösung",
          description: "Bessere Ergebnisse mit höherer Kameraauflösung möglich.",
          variant: "default"
        });
      }
    }
    
    // Proceed with scan
    originalScanCard();
  }, [isCameraActive, startCamera, originalScanCard, optimalCameraOptions, videoRef, setError]);

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
