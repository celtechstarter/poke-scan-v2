
import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getCardPriceFromCardMarket } from '@/utils/cardMarketService';
import { useToast } from '@/components/ui/use-toast';

const CardScannerWebcam = () => {
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

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-pokered" />
            <span>Pokemon Karten Scanner</span>
          </CardTitle>
          <CardDescription>
            Scanne deine Pokemon-Karten, um ihren aktuellen Wert zu erfahren
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-0 relative">
          {/* Video-Container für Webcam */}
          <div className="relative aspect-video bg-black">
            <video 
              ref={videoRef}
              className="w-full h-full object-cover" 
              autoPlay 
              playsInline
              aria-label="Kamera-Vorschau"
            ></video>
            
            {/* Overlay während des Scannens */}
            {isScanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
                <RefreshCw className="animate-spin h-12 w-12 text-white mb-4" />
                <p className="text-white text-xl font-bold">Scanne Karte...</p>
                <div className="w-64 mt-4">
                  <Progress value={scanProgress} className="h-2" aria-label="Scan-Fortschritt" />
                </div>
              </div>
            )}
            
            {/* Hilfsrahmen beim Scannen */}
            {isCameraActive && !isScanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-4 border-dashed border-pokeyellow/70 w-4/5 h-4/5 rounded-lg flex items-center justify-center">
                  <p className="bg-black/60 text-white px-4 py-2 rounded-lg text-center">
                    Platziere die Pokemon-Karte innerhalb des Rahmens
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Versteckter Canvas für Bilderfassung */}
          <canvas ref={canvasRef} className="hidden"></canvas>
        </CardContent>
        
        <CardFooter className="flex flex-col p-4">
          <div className="flex gap-4 w-full justify-center">
            <Button 
              variant="outline" 
              className="flex items-center gap-2" 
              onClick={isCameraActive ? stopCamera : startCamera}
            >
              <Camera className="h-4 w-4" />
              {isCameraActive ? "Kamera stoppen" : "Kamera starten"}
            </Button>
            
            <Button 
              className="bg-pokered hover:bg-pokered-dark flex items-center gap-2" 
              onClick={scanCard}
              disabled={isScanning}
            >
              <Search className="h-4 w-4" />
              Karte scannen
            </Button>
          </div>
          
          {/* Ergebnisbereich */}
          {scanResult && (
            <div className="mt-6 w-full">
              <hr className="my-4" />
              <div className="flex flex-col md:flex-row gap-6">
                {scanResult.imageDataUrl && (
                  <div className="w-full md:w-1/2">
                    <img 
                      src={scanResult.imageDataUrl} 
                      alt="Gescannte Karte" 
                      className="w-full h-auto max-h-64 object-contain border rounded-lg" 
                    />
                  </div>
                )}
                
                <div className="w-full md:w-1/2 flex flex-col justify-center">
                  <h3 className="text-xl font-bold">{scanResult.cardName}</h3>
                  <p className="text-muted-foreground mb-2">Erkannte Pokemon-Karte</p>
                  
                  {scanResult.price ? (
                    <div className="mt-2">
                      <p className="text-2xl font-bold text-pokeyellow-dark">
                        {scanResult.price.toFixed(2)} €
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Aktueller Preis bei CardMarket.com
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      Kein Preis verfügbar
                    </p>
                  )}
                  
                  <p className="mt-4 text-sm text-muted-foreground">
                    * Dies ist eine Simulation. In der fertigen Version würde die Kartentext-Erkennung 
                    mit KI und eine Integration mit CardMarket implementiert.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default CardScannerWebcam;
