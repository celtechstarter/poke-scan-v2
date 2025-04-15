import { ScanResult } from './types/scannerTypes';

interface ScanResultProps {
  scanResult: ScanResult | null;
}

export function ScanResultDisplay({ scanResult }: ScanResultProps) {
  if (!scanResult) return null;
  
  return (
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
          
          {scanResult.cardNumber && (
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {scanResult.cardNumber}
            </p>
          )}
          
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
          
          {/* OCR Debug Information (can be removed in production) */}
          {scanResult.ocrResult && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-xs">
              <p className="font-semibold">OCR Details:</p>
              <p>Erkannter Name: {scanResult.ocrResult.cardName || 'Nicht erkannt'}</p>
              <p>Erkannte Nummer: {scanResult.ocrResult.cardNumber || 'Nicht erkannt'}</p>
              <p>Konfidenz: {Math.round(scanResult.ocrResult.confidence)}%</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
