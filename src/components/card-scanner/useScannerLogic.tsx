
import { useState, useRef, useCallback, useEffect } from 'react';
import { getCardPriceFromCardMarket } from '@/utils/cardMarketService';
import { useToast } from '@/components/ui/use-toast';

export function useScannerLogic() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState<{
    cardName: string;
    price: number | null;
    imageDataUrl: string | null;
  } | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  // Starte die Webcam
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
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

  // Stoppe die Webcam
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  }, []);

  // Scanne nach Pokemon-Karten
  const scanCard = useCallback(() => {
    if (!isCameraActive) {
      startCamera();
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    
    // Simuliere den Scan-Fortschritt
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
  }, [isCameraActive, startCamera, toast]);

  // Toggle camera function
  const toggleCamera = useCallback(() => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  }, [isCameraActive, startCamera, stopCamera]);

  // Nehme ein Bild auf
  const captureFrame = useCallback(async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        // Setze Canvas-Dimensionen auf Video-Dimensionen
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Zeichne das Video-Frame auf den Canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Speichere das Bild als Data URL
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        
        // Hier würden wir normalerweise die Texterkennung durchführen
        // Für dieses Beispiel simulieren wir die Erkennung
        simulateCardRecognition(imageDataUrl);
      }
    }
    
    setIsScanning(false);
  }, []);

  // Simuliere die Kartenerkennung (hier würde später KI eingesetzt)
  const simulateCardRecognition = useCallback(async (imageDataUrl: string) => {
    toast({
      title: "Bild aufgenommen",
      description: "Analysiere Pokemon-Karte...",
    });
    
    // Simuliere Verzögerung für API-Aufruf
    setTimeout(async () => {
      // Mock-Kartenerkennung (später durch KI/ML ersetzen)
      const mockCards = [
        "Pikachu V",
        "Charizard VMAX",
        "Mew EX",
        "Blastoise GX",
        "Gengar VMAX"
      ];
      
      const randomIndex = Math.floor(Math.random() * mockCards.length);
      const recognizedCardName = mockCards[randomIndex];
      
      // Simuliere API-Aufruf zu CardMarket
      const price = await getCardPriceFromCardMarket(recognizedCardName);
      
      setScanResult({
        cardName: recognizedCardName,
        price: price,
        imageDataUrl: imageDataUrl
      });
      
      toast({
        title: "Karte erkannt!",
        description: `${recognizedCardName} - Preis: ${price ? `${price.toFixed(2)} €` : 'Nicht verfügbar'}`,
        variant: "default",
      });
    }, 2000);
  }, [toast]);

  // Bereinige beim Unmounten
  useEffect(() => {
    return () => {
      stopCamera();
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [stopCamera]);

  return {
    videoRef,
    canvasRef,
    isScanning,
    isCameraActive,
    scanProgress,
    scanResult,
    scanCard,
    toggleCamera
  };
}
