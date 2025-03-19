
import { RefObject } from 'react';
import { ScannerOverlay } from './ScannerOverlay';

interface VideoPreviewProps {
  videoRef: RefObject<HTMLVideoElement>;
  isScanning: boolean;
  scanProgress: number;
  isCameraActive: boolean;
}

export function VideoPreview({ 
  videoRef,
  isScanning,
  scanProgress,
  isCameraActive
}: VideoPreviewProps) {
  return (
    <div className="relative aspect-video bg-black">
      <video 
        ref={videoRef}
        className="w-full h-full object-cover" 
        autoPlay 
        playsInline
        aria-label="Kamera-Vorschau"
      ></video>
      
      <ScannerOverlay 
        isScanning={isScanning}
        scanProgress={scanProgress}
        isCameraActive={isCameraActive}
      />

      {isCameraActive && !isScanning && (
        <div className="absolute top-4 left-0 right-0 text-center">
          <div className="inline-block bg-black/40 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm">
            Halte die Karte ins Bild für automatische Erkennung
          </div>
        </div>
      )}
    </div>
  );
}
