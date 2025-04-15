
import { Camera, Search, Eye, EyeOff, Focus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CameraFocusMode } from '@/utils/cameraUtils';

interface ScannerControlsProps {
  isCameraActive: boolean;
  isScanning: boolean;
  autoDetectEnabled: boolean;
  focusMode?: CameraFocusMode;
  focusCapabilities?: {
    supportsFocusMode: boolean;
    supportedFocusModes: string[];
  };
  onCameraToggle: () => void;
  onScanStart: () => void;
  onAutoDetectToggle: () => void;
  onFocusModeToggle?: () => void;
}

export function ScannerControls({ 
  isCameraActive, 
  isScanning, 
  autoDetectEnabled,
  focusMode,
  focusCapabilities,
  onCameraToggle, 
  onScanStart,
  onAutoDetectToggle,
  onFocusModeToggle
}: ScannerControlsProps) {
  // Get friendly focus mode name
  const getFocusModeName = (mode?: CameraFocusMode): string => {
    switch (mode) {
      case CameraFocusMode.AUTO:
        return "Autofokus";
      case CameraFocusMode.CONTINUOUS:
        return "Kontinuierlicher Fokus";
      case CameraFocusMode.FIXED:
        return "Fester Fokus";
      case CameraFocusMode.MANUAL:
        return "Manueller Fokus";
      default:
        return "Autofokus";
    }
  };

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
      
      {/* Focus mode toggle button - only show if camera supports focus modes */}
      {isCameraActive && focusCapabilities?.supportsFocusMode && onFocusModeToggle && (
        <div className="flex justify-center mb-4">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 text-xs"
            onClick={onFocusModeToggle}
          >
            <Focus className="h-3 w-3" />
            Fokus: {getFocusModeName(focusMode)}
          </Button>
        </div>
      )}

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

      {/* Show info about current focus mode */}
      {isCameraActive && focusMode === CameraFocusMode.FIXED && (
        <p className="text-xs text-center mt-2 text-amber-600 dark:text-amber-400">
          Fester Fokus: Kamera fokussiert nicht automatisch. Halte die Karte im optimalen Abstand.
        </p>
      )}
    </div>
  );
}
