
import { RefreshCw, Scan, Square } from 'lucide-react';
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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-20">
          <RefreshCw className="animate-spin h-12 w-12 text-white mb-4" />
          <p className="text-white text-xl font-bold">Scanne Karte...</p>
          <div className="w-64 mt-4">
            <Progress value={scanProgress} className="h-2" aria-label="Scan-Fortschritt" />
          </div>
        </div>
      )}
      
      {/* Optimized card positioning frame */}
      {isCameraActive && !isScanning && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Adjusted scan frame - now using 75% height and centered */}
          <div 
            className="relative border-4 border-dashed border-pokeyellow/80 rounded-lg flex items-center justify-center" 
            style={{ 
              aspectRatio: '2.5/3.5', // Standard Pokémon card aspect ratio
              height: '75%',
              maxWidth: '75%'
            }}
          >
            {/* Edge detection visual cue */}
            <div className="absolute inset-0 border-2 border-transparent">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-400"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-400"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-400"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-400"></div>
            </div>
            
            <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-center flex items-center gap-2">
              <Square className="h-4 w-4" />
              <p>Zentriere die Karte im Rahmen</p>
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
