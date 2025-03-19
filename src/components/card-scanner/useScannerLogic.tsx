
import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { detectCardInFrame, captureVideoFrame } from '@/utils/cardDetectionUtils';
import { analyzeCardImage } from '@/utils/cardAnalysisUtils';
import { startCamera as startCameraUtil, stopMediaStream } from '@/utils/cameraUtils';

export function useScannerLogic() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState<{
    cardName: string;
    cardNumber?: string;
    price: number | null;
    imageDataUrl: string | null;
  } | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const autoDetectIntervalRef = useRef<number | null>(null);
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(true);
  
  // Start the camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await startCameraUtil(videoRef);
      
      if (stream) {
        setIsCameraActive(true);
        toast({
          title: "Kamera aktiv",
          description: "Halte eine Pokemon-Karte vor die Kamera, um sie zu scannen",
        });
      }
    } catch (error) {
      console.error('Fehler beim Zugriff auf die Kamera:', error);
      toast({
        title: "Kamerazugriff fehlgeschlagen",
        description: "Bitte erlaube den Zugriff auf deine Kamera und versuche es erneut",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Capture a frame and analyze the card
  const captureFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const imageDataUrl = captureVideoFrame(videoRef.current, canvasRef.current);
    
    if (imageDataUrl) {
      await processCardImage(imageDataUrl);
    }
    
    setIsScanning(false);
  }, []);

  // Process the captured card image
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

  // Scan for Pokemon cards
  const scanCard = useCallback(() => {
    if (!isCameraActive) {
      startCamera();
      return;
    }

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
  }, [isCameraActive, startCamera, captureFrame, toast]);

  // Check if a card is in the frame
  const detectCard = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || isScanning) return;
    
    const isCardDetected = detectCardInFrame(videoRef.current, canvasRef.current);
    
    if (isCardDetected) {
      scanCard();
    }
  }, [isScanning, scanCard]);
  
  // Start automatic card detection
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

  // Stop automatic card detection
  const stopAutoDetection = useCallback(() => {
    if (autoDetectIntervalRef.current) {
      clearInterval(autoDetectIntervalRef.current);
      autoDetectIntervalRef.current = null;
    }
    console.log('Automatische Kartenerkennung deaktiviert');
  }, []);

  // Stop the camera
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stopMediaStream(stream);
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
    
    // Stop auto-detection if running
    stopAutoDetection();
  }, [stopAutoDetection]);

  // Toggle automatic detection
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

  // Toggle camera function
  const toggleCamera = useCallback(() => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  }, [isCameraActive, startCamera, stopCamera]);

  // Initialize and clean up
  useEffect(() => {
    // Start auto-detection if enabled when camera becomes active
    if (isCameraActive && autoDetectEnabled) {
      startAutoDetection();
    }
    
    // Clean up when unmounting
    return () => {
      stopCamera();
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
      if (autoDetectIntervalRef.current) {
        clearInterval(autoDetectIntervalRef.current);
      }
    };
  }, [isCameraActive, autoDetectEnabled, startAutoDetection, stopCamera]);

  return {
    videoRef,
    canvasRef,
    isScanning,
    isCameraActive,
    scanProgress,
    scanResult,
    autoDetectEnabled,
    scanCard,
    toggleCamera,
    toggleAutoDetection
  };
}
