
import { useState, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { ScannerError } from '../types/scannerTypes';
import { processCardImage } from '../utils/scanProcessingUtils';
import { CardRegionAdjustment } from '../types/adjustmentTypes';
import { useScanProgress } from './useScanProgress';
import { useScanResults } from './useScanResults';
import { useCaptureFrame } from './useCaptureFrame';

export function useCardScanning({
  videoRef,
  canvasRef,
  manualAdjustment = null
}: {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  manualAdjustment?: CardRegionAdjustment | null;
}) {
  const [isScanning, setIsScanning] = useState(false);
  const scanAbortControllerRef = useRef<AbortController | null>(null);
  const { scanProgress, startScanProgress, setScanProgress } = useScanProgress();
  const { scanResult, setScanResult, scanError, setScanError, clearResults } = useScanResults();
  const { captureFrame } = useCaptureFrame({ videoRef, canvasRef, manualAdjustment, setScanError });

  const handleCapture = useCallback(async () => {
    try {
      const imageDataUrl = await captureFrame();
      
      if (!imageDataUrl) {
        setIsScanning(false);
        return;
      }
      
      scanAbortControllerRef.current = new AbortController();
      const signal = scanAbortControllerRef.current.signal;
      
      const result = await processCardImage(imageDataUrl, signal, manualAdjustment);
      
      clearResults();
      
      if (result.ocrResult.confidence < 50) {
        toast({
          title: "Niedrige OCR-Qualität",
          description: "Text wurde mit niedriger Zuverlässigkeit erkannt. Versuche es mit besserer Beleuchtung.",
          variant: "default"
        });
      }
      
      setTimeout(() => {
        setScanResult(result);
      }, 50);
      
    } catch (error) {
      console.error('Fehler beim Scannen:', error);
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('Scan abgebrochen');
        return;
      }
      
      if (error && typeof error === 'object' && 'type' in error && 'message' in error) {
        setScanError(error as ScannerError);
      }
    } finally {
      scanAbortControllerRef.current = null;
      setIsScanning(false);
    }
  }, [captureFrame, clearResults, setScanResult, setScanError, manualAdjustment]);

  const scanCard = useCallback(() => {
    cancelScan();
    clearResults();
    setIsScanning(true);
    
    toast({
      title: "Scan gestartet",
      description: "Karte wird sofort erfasst...",
    });
    
    const finishProgress = startScanProgress();
    
    setTimeout(() => {
      finishProgress();
      handleCapture();
    }, 100);
  }, [handleCapture, clearResults, startScanProgress]);

  const cancelScan = useCallback(() => {
    if (scanAbortControllerRef.current) {
      scanAbortControllerRef.current.abort();
      scanAbortControllerRef.current = null;
    }
    
    setIsScanning(false);
  }, []);

  return {
    isScanning,
    scanProgress,
    scanResult,
    scanError,
    scanCard,
    cancelScan
  };
}

