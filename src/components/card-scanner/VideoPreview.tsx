
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
    </div>
  );
}
