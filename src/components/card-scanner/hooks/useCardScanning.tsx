
import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { captureVideoFrame } from '@/utils/cardDetectionUtils';
import { analyzeCardImage } from '@/utils/cardAnalysisUtils';

/**
 * Custom hook for card scanning functionality
 * Handles the process of capturing and analyzing card images
 * 
 * @param {Object} params - Parameters object
 * @param {React.RefObject<HTMLVideoElement>} params.videoRef - Reference to video element
 * @param {React.RefObject<HTMLCanvasElement>} params.canvasRef - Reference to canvas element
 * @returns {Object} Scanning state and functions
 */
export function useCardScanning({
  videoRef,
  canvasRef
}: {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}) {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState<{
    cardName: string;
    cardNumber?: string;
    price: number | null;
    imageDataUrl: string | null;
  } | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  /**
   * Process the captured card image through analysis
   * @param {string} imageDataUrl - The captured image as a data URL
   */
  const processCardImage = useCallback(async (imageDataUrl: string) => {
    toast({
      title: "Bild aufgenommen",
      description: "Analysiere Pokemon-Karte...",
    });
    
    try {
      const result = await analyzeCardImage(imageDataUrl);
      
      setScanResult({
        cardName: result.cardName,
        cardNumber: result.cardNumber,
        price: result.price,
        imageDataUrl: imageDataUrl
      });
      
      toast({
        title: "Karte erkannt!",
        description: `${result.cardName} (${result.cardNumber}) - Preis: ${result.price ? `${result.price.toFixed(2)} €` : 'Nicht verfügbar'}`,
        variant: "default",
      });
    } catch (error) {
      console.error('Fehler bei der Kartenanalyse:', error);
      toast({
        title: "Fehler bei der Analyse",
        description: "Die Karte konnte nicht erkannt werden. Bitte versuche es erneut.",
        variant: "destructive",
      });
    }
  }, [toast]);

  /**
   * Captures a frame from the video and processes it
   */
  const captureFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const imageDataUrl = captureVideoFrame(videoRef.current, canvasRef.current);
    
    if (imageDataUrl) {
      await processCardImage(imageDataUrl);
    }
    
    setIsScanning(false);
  }, [videoRef, canvasRef, processCardImage]);

  /**
   * Initiates the card scanning process
   * Shows a progress indicator while scanning
   */
  const scanCard = useCallback(() => {
    setIsScanning(true);
    setScanProgress(0);
    
    // Simulate scan progress
    let progress = 0;
    scanIntervalRef.current = window.setInterval(() => {
      progress += 5;
      setScanProgress(progress);
      
      if (progress >= 100) {
        clearInterval(scanIntervalRef.current!);
        captureFrame();
      }
    }, 100);
    
    toast({
      title: "Scan gestartet",
      description: "Halte die Karte ruhig, während wir sie analysieren...",
    });
  }, [captureFrame, toast]);

  // Clean up scan interval if component unmounts during scan
  const cancelScan = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanning(false);
  }, []);

  return {
    isScanning,
    scanProgress,
    scanResult,
    scanCard,
    cancelScan
  };
}
