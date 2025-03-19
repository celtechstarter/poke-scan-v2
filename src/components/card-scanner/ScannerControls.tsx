
import { Camera, Search, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ScannerControlsProps {
  isCameraActive: boolean;
  isScanning: boolean;
  autoDetectEnabled: boolean;
  onCameraToggle: () => void;
  onScanStart: () => void;
  onAutoDetectToggle: () => void;
}

export function ScannerControls({ 
  isCameraActive, 
  isScanning, 
  autoDetectEnabled,
  onCameraToggle, 
  onScanStart,
  onAutoDetectToggle
}: ScannerControlsProps) {
  return (
    <div className="w-full">
      <div className="flex gap-4 w-full justify-center mb-4">
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

      <div className="flex items-center justify-center space-x-2 mb-2">
        <Switch
          id="auto-detect"
          checked={autoDetectEnabled}
          onCheckedChange={onAutoDetectToggle}
        />
        <Label htmlFor="auto-detect" className="flex items-center gap-2 cursor-pointer">
          {autoDetectEnabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          Automatische Kartenerkennung
        </Label>
      </div>

      {autoDetectEnabled && (
        <p className="text-xs text-center text-muted-foreground">
          Halte einfach deine Karte vor die Kamera, und sie wird automatisch erkannt
        </p>
      )}
    </div>
  );
}
