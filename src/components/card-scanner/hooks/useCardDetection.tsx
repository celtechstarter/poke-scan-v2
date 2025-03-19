
import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { detectCardInFrame } from '@/utils/cardDetectionUtils';

/**
 * Custom hook for automatic card detection functionality
 * Handles the periodic checking for cards in video frames
 * 
 * @param {Object} params - Parameters object
 * @param {React.RefObject<HTMLVideoElement>} params.videoRef - Reference to video element
 * @param {React.RefObject<HTMLCanvasElement>} params.canvasRef - Reference to canvas element
 * @param {boolean} params.isCameraActive - Whether camera is currently active
 * @param {boolean} params.isScanning - Whether card scanning is in progress
 * @param {Function} params.onCardDetected - Callback when card is detected
 * @returns {Object} Card detection state and controls
 */
export function useCardDetection({
  videoRef,
  canvasRef,
  isCameraActive,
  isScanning,
  onCardDetected
}: {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isCameraActive: boolean;
  isScanning: boolean;
  onCardDetected: () => void;
}) {
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(true);
  const autoDetectIntervalRef = useRef<number | null>(null);
  const { toast } = useToast();

  /**
   * Checks if a card is present in the current video frame
   */
  const detectCard = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || isScanning) return;
    
    const isCardDetected = detectCardInFrame(videoRef.current, canvasRef.current);
    
    if (isCardDetected) {
      onCardDetected();
    }
  }, [isScanning, canvasRef, videoRef, onCardDetected]);
  
  /**
   * Starts automatic card detection at regular intervals
   */
  const startAutoDetection = useCallback(() => {
    if (autoDetectIntervalRef.current) {
      clearInterval(autoDetectIntervalRef.current);
    }
    
    // Check for card every 1 second
    autoDetectIntervalRef.current = window.setInterval(() => {
      if (!isScanning && isCameraActive) {
        detectCard();
      }
    }, 1000);
    
    console.log('Automatische Kartenerkennung aktiviert');
  }, [isScanning, isCameraActive, detectCard]);

  /**
   * Stops the automatic card detection
   */
  const stopAutoDetection = useCallback(() => {
    if (autoDetectIntervalRef.current) {
      clearInterval(autoDetectIntervalRef.current);
      autoDetectIntervalRef.current = null;
    }
    console.log('Automatische Kartenerkennung deaktiviert');
  }, []);

  /**
   * Toggles automatic card detection on/off
   */
  const toggleAutoDetection = useCallback(() => {
    setAutoDetectEnabled(prev => {
      const newState = !prev;
      if (newState && isCameraActive) {
        startAutoDetection();
      } else {
        stopAutoDetection();
      }
      return newState;
    });
  }, [isCameraActive, startAutoDetection, stopAutoDetection]);

  // Start/stop auto detection based on camera state and auto-detect setting
  useEffect(() => {
    if (isCameraActive && autoDetectEnabled) {
      startAutoDetection();
    } else {
      stopAutoDetection();
    }
    
    return () => {
      stopAutoDetection();
    };
  }, [isCameraActive, autoDetectEnabled, startAutoDetection, stopAutoDetection]);

  return {
    autoDetectEnabled,
    toggleAutoDetection
  };
}
