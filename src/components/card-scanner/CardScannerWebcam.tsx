
import { Camera } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useScannerLogic } from './useScannerLogic';
import { VideoPreview } from './VideoPreview';
import { ScannerControls } from './ScannerControls';
import { ScanResultDisplay } from './ScanResultDisplay';

const CardScannerWebcam = () => {
  const {
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
  } = useScannerLogic();

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
          <VideoPreview 
            videoRef={videoRef}
            isScanning={isScanning}
            scanProgress={scanProgress}
            isCameraActive={isCameraActive}
          />
          
          {/* Versteckter Canvas für Bilderfassung und Analyse */}
          <canvas ref={canvasRef} className="hidden"></canvas>
        </CardContent>
        
        <CardFooter className="flex flex-col p-4">
          <ScannerControls 
            isCameraActive={isCameraActive}
            isScanning={isScanning}
            autoDetectEnabled={autoDetectEnabled}
            onCameraToggle={toggleCamera}
            onScanStart={scanCard}
            onAutoDetectToggle={toggleAutoDetection}
          />
          
          <ScanResultDisplay scanResult={scanResult} />
        </CardFooter>
      </Card>
    </div>
  );
};

export default CardScannerWebcam;
