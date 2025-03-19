
interface ScanResultProps {
  scanResult: {
    cardName: string;
    price: number | null;
    imageDataUrl: string | null;
  } | null;
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
          
          <p className="mt-4 text-sm text-muted-foreground">
            * Dies ist eine Simulation. In der fertigen Version würde die Kartentext-Erkennung 
            mit KI und eine Integration mit CardMarket implementiert.
          </p>
        </div>
      </div>
    </div>
  );
}
