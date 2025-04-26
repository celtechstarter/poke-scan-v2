
import { RefreshCw, Scan } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ScannerOverlayProps {
  isScanning: boolean;
  scanProgress: number;
  isCameraActive: boolean;
}

export function ScannerOverlay({ isScanning, scanProgress, isCameraActive }: ScannerOverlayProps) {
  return (
    <>
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
      
      {/* Enhanced guidance frame for card positioning */}
      {isCameraActive && !isScanning && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Improved scan frame with card aspect ratio */}
          <div 
            className="border-4 border-dashed border-pokeyellow/70 w-4/5 h-4/5 rounded-lg flex items-center justify-center" 
            style={{ aspectRatio: '2/3' }}
          >
            <div className="bg-black/60 text-white px-4 py-2 rounded-lg text-center flex items-center gap-2">
              <Scan className="h-4 w-4" />
              <p>Karte hier platzieren</p>
            </div>
            
            {/* Corner guides to help with positioning */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-pokeyellow rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-pokeyellow rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-pokeyellow rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-pokeyellow rounded-br-lg"></div>
          </div>
        </div>
      )}
    </>
  );
}

