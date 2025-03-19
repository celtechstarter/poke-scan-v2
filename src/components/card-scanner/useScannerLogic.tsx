
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
    cardNumber?: string;
    price: number | null;
    imageDataUrl: string | null;
  } | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const autoDetectIntervalRef = useRef<number | null>(null);
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(true);

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
        analyzeCardImage(imageDataUrl);
      }
    }
    
    setIsScanning(false);
  }, []);

  // Analysiere das Kartenbild mit KI-Texterkennung
  const analyzeCardImage = useCallback(async (imageDataUrl: string) => {
    toast({
      title: "Bild aufgenommen",
      description: "Analysiere Pokemon-Karte...",
    });
    
    // Simuliere Verzögerung für API-Aufruf
    setTimeout(async () => {
      // Im echten Szenario würde hier die OCR-Texterkennung stattfinden
      // Für die Demo verwenden wir simulierte Daten
      const mockCards = [
        { name: "Pikachu V", number: "SWSH004/073" },
        { name: "Charizard VMAX", number: "SWSH3 020/189" },
        { name: "Mew EX", number: "SV2 039/149" },
        { name: "Blastoise GX", number: "SM9 026/095" },
        { name: "Gengar VMAX", number: "SWSH8 057/198" }
      ];
      
      const randomIndex = Math.floor(Math.random() * mockCards.length);
      const recognizedCard = mockCards[randomIndex];
      
      console.log('Erkannte Karte:', recognizedCard);
      
      // Suche nach dem Preis bei CardMarket
      const price = await getCardPriceFromCardMarket(`${recognizedCard.name} ${recognizedCard.number}`);
      
      setScanResult({
        cardName: recognizedCard.name,
        cardNumber: recognizedCard.number,
        price: price,
        imageDataUrl: imageDataUrl
      });
      
      toast({
        title: "Karte erkannt!",
        description: `${recognizedCard.name} (${recognizedCard.number}) - Preis: ${price ? `${price.toFixed(2)} €` : 'Nicht verfügbar'}`,
        variant: "default",
      });
    }, 2000);
  }, [toast]);

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
  }, [isCameraActive, startCamera, captureFrame, toast]);

  // Detect if a card is present in the frame
  const detectCard = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || isScanning) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    
    if (!context) return;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Simple detection: check if there's a significant object in frame
    // This is a simplified approach - in a real app, you'd use ML for this
    try {
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Calculate average brightness in center area
      const centerWidth = canvas.width * 0.6;
      const centerHeight = canvas.height * 0.6;
      const startX = (canvas.width - centerWidth) / 2;
      const startY = (canvas.height - centerHeight) / 2;
      
      let totalBrightness = 0;
      let pixelCount = 0;
      
      for (let y = startY; y < startY + centerHeight; y += 10) {
        for (let x = startX; x < startX + centerWidth; x += 10) {
          const i = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
          const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
          totalBrightness += brightness;
          pixelCount++;
        }
      }
      
      const avgBrightness = totalBrightness / pixelCount;
      
      // Check edge contrast (cards typically have high edge contrast)
      let edgeContrast = 0;
      for (let y = startY; y < startY + centerHeight; y += 20) {
        for (let x = startX; x < startX + centerWidth - 10; x += 20) {
          const i1 = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
          const i2 = (Math.floor(y) * canvas.width + Math.floor(x + 10)) * 4;
          
          const b1 = (data[i1] + data[i1+1] + data[i1+2]) / 3;
          const b2 = (data[i2] + data[i2+1] + data[i2+2]) / 3;
          
          edgeContrast += Math.abs(b1 - b2);
        }
      }
      
      edgeContrast /= (centerHeight * centerWidth / 400);
      
      console.log('Detection metrics:', { avgBrightness, edgeContrast });
      
      // Detect card based on brightness and edge contrast
      // Values determined through testing - would need to be calibrated
      if (avgBrightness > 50 && edgeContrast > 15) {
        console.log('Karte erkannt - starte Scan');
        scanCard();
      }
    } catch (e) {
      console.error('Fehler bei der Kartenerkennung:', e);
    }
  }, [isScanning, scanCard]);
  
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

        // Start auto-detection if enabled
        if (autoDetectEnabled) {
          startAutoDetection();
        }
      }
    } catch (error) {
      console.error('Fehler beim Zugriff auf die Kamera:', error);
      toast({
        title: "Kamerazugriff fehlgeschlagen",
        description: "Bitte erlaube den Zugriff auf deine Kamera und versuche es erneut",
        variant: "destructive",
      });
    }
  }, [toast, autoDetectEnabled, startAutoDetection]);

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

  // Stoppe die Webcam
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
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

  // Bereinige beim Unmounten
  useEffect(() => {
    return () => {
      stopCamera();
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
      if (autoDetectIntervalRef.current) {
        clearInterval(autoDetectIntervalRef.current);
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
    autoDetectEnabled,
    scanCard,
    toggleCamera,
    toggleAutoDetection
  };
}
