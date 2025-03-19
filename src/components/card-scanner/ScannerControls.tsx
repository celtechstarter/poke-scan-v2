
import { Camera, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScannerControlsProps {
  isCameraActive: boolean;
  isScanning: boolean;
  onCameraToggle: () => void;
  onScanStart: () => void;
}

export function ScannerControls({ 
  isCameraActive, 
  isScanning, 
  onCameraToggle, 
  onScanStart 
}: ScannerControlsProps) {
  return (
    <div className="flex gap-4 w-full justify-center">
      <Button 
        variant="outline" 
        className="flex items-center gap-2" 
        onClick={onCameraToggle}
      >
        <Camera className="h-4 w-4" />
        {isCameraActive ? "Kamera stoppen" : "Kamera starten"}
      </Button>
      
      <Button 
        className="bg-pokered hover:bg-pokered-dark flex items-center gap-2" 
        onClick={onScanStart}
        disabled={isScanning}
      >
        <Search className="h-4 w-4" />
        Karte scannen
      </Button>
    </div>
  );
}
