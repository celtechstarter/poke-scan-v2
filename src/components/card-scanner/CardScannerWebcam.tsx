import { Camera } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { useScannerLogic } from './useScannerLogic';
import { VideoPreview } from './VideoPreview';
import { ScannerControls } from './ScannerControls';
import { ScanResultDisplay } from './ScanResultDisplay';
import { ManualAdjustment } from './ManualAdjustment';
import { CardRegionAdjustment } from './types/adjustmentTypes';
import { toast } from '@/hooks/use-toast';

const CardScannerWebcam = () => {
  const [showManualAdjust, setShowManualAdjust] = useState(false);
  const [manualAdjustment, setManualAdjustment] = useState<CardRegionAdjustment | null>(null);
  const [lastCapturedImage, setLastCapturedImage] = useState<string | null>(null);
  
  const {
    videoRef,
    canvasRef,
    isScanning,
    isCameraActive,
    scanProgress,
    scanResult,
    autoDetectEnabled,
    focusMode,
    focusCapabilities,
    scanCard,
    toggleCamera,
    toggleAutoDetection,
    toggleFocusMode,
    errors
  } = useScannerLogic();

  const handleManualAdjust = () => {
    if (!isCameraActive) {
      toast({
        title: "Kamera erforderlich",
        description: "Bitte aktivieren Sie zuerst die Kamera.",
        variant: "destructive",
      });
      return;
    }
    
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageUrl = canvas.toDataURL('image/png');
        setLastCapturedImage(imageUrl);
        setShowManualAdjust(true);
      }
    }
  };

  const handleApplyAdjustment = (adjustment: CardRegionAdjustment) => {
    setManualAdjustment(adjustment);
    toast({
      title: "Anpassung gespeichert",
      description: "Die manuelle Anpassung wird beim nächsten Scan verwendet.",
    });
  };

  return (
    <div className="container max-w-md mx-auto p-4">
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
        
        <CardContent className="p-4 relative">
          <VideoPreview 
            videoRef={videoRef}
            isScanning={isScanning}
            scanProgress={scanProgress}
            isCameraActive={isCameraActive}
          />
          
          <canvas ref={canvasRef} className="hidden"></canvas>
        </CardContent>
        
        <CardFooter className="flex flex-col p-4">
          <ScannerControls 
            isCameraActive={isCameraActive}
            isScanning={isScanning}
            autoDetectEnabled={autoDetectEnabled}
            focusMode={focusMode}
            focusCapabilities={focusCapabilities}
            onCameraToggle={toggleCamera}
            onScanStart={scanCard}
            onAutoDetectToggle={toggleAutoDetection}
            onFocusModeToggle={toggleFocusMode}
            onManualAdjust={handleManualAdjust}
          />
          
          <ScanResultDisplay scanResult={scanResult} />
        </CardFooter>
      </Card>

      {showManualAdjust && lastCapturedImage && (
        <ManualAdjustment
          isOpen={showManualAdjust}
          onClose={() => setShowManualAdjust(false)}
          onApply={handleApplyAdjustment}
          imageUrl={lastCapturedImage}
        />
      )}
    </div>
  );
};

export default CardScannerWebcam;
