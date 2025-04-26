
import { useScanCoordinator } from './hooks/useScanCoordinator';
import { ScannerError } from './types/scannerTypes';
import { CardRegionAdjustment } from './types/adjustmentTypes';
import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

/**
 * Main hook for Pokemon card scanner logic
 * This is now a thin wrapper around our coordinator hook
 * for backwards compatibility
 * 
 * @returns {Object} Combined scanner state and functions
 */
export function useScannerLogic(manualAdjustment: CardRegionAdjustment | null = null) {
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
  } = useScanCoordinator(manualAdjustment);
  
  // Check scan quality and suggest rescan if needed
  useEffect(() => {
    if (scanResult) {
      const { ocrResult } = scanResult;
      const lowConfidenceThreshold = 40;
      const shortTextThreshold = 3; // Less than 3 characters is likely a failed scan
      
      const hasLowConfidence = ocrResult.confidence < lowConfidenceThreshold;
      const hasShortName = ocrResult.cardName && ocrResult.cardName.length < shortTextThreshold;
      
      // Detect if OCR likely failed
      if (hasLowConfidence || hasShortName) {
        toast({
          title: "Scan-Qualität zu niedrig",
          description: "Bitte Karte neu positionieren und erneut scannen. Achte auf gute Beleuchtung.",
          variant: "destructive",
        });
      }
    }
  }, [scanResult]);
  
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
