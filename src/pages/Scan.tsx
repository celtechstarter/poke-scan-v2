
import CardScannerWebcam from '@/components/card-scanner/CardScannerWebcam';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Info } from 'lucide-react';

const Scan = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Pokemon Karten Scanner</h1>
      <p className="text-center text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
        Nutze deine Webcam, um Pokemon-Karten zu scannen und ihren aktuellen Marktwert zu ermitteln.
        Der Scanner erkennt automatisch den Namen und die Set-Nummer der Karte mit EasyOCR Technologie.
      </p>
      
      <Alert className="mb-6 max-w-2xl mx-auto">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Wichtig für genaue Ergebnisse</AlertTitle>
        <AlertDescription>
          Positioniere die Karte vollständig und gerade innerhalb des gelben Rahmens.
          Achte auf gute Beleuchtung ohne Reflexionen auf der Karte.
        </AlertDescription>
      </Alert>
      
      <CardScannerWebcam />
      
      <div className="mt-12 max-w-2xl mx-auto bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">So funktioniert's:</h2>
        <ol className="list-decimal pl-5 space-y-2 text-gray-800 dark:text-gray-300">
          <li>Starte die Kamera mit einem Klick auf "Kamera starten"</li>
          <li>Halte deine Pokemon-Karte <strong>aufrecht</strong> vor die Kamera im markierten Bereich</li>
          <li>Klicke auf "Karte scannen" und halte die Karte ruhig</li>
          <li>Warte, bis der Scan und die Texterkennung abgeschlossen sind</li>
          <li>Erhalte den aktuellen Preis und Details zu deiner Karte</li>
        </ol>
        
        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-pokeyellow p-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong className="text-gray-900 dark:text-gray-100">Hinweis:</strong> Sorge für gute Lichtverhältnisse und halte die Karte <strong>senkrecht</strong>, damit 
            Text und Bild klar erkennbar sind. Die Texterkennung fokussiert sich auf:
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 dark:text-gray-300">
            <li>Den Namen des Pokemons (oben auf der Karte)</li>
            <li>Die Set-Nummer (unten links auf der Karte)</li>
          </ul>
        </div>
        
        <div className="mt-4 bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong className="text-gray-900 dark:text-gray-100">Fokus-Modus:</strong> Wenn deine Kamera dies unterstützt, kannst du den Fokus-Modus ändern:
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 dark:text-gray-300">
            <li><strong>Autofokus:</strong> Die Kamera fokussiert automatisch (Standard)</li>
            <li><strong>Fester Fokus:</strong> Hilfreich wenn die Set-Nummer nicht scharf ist</li>
            <li><strong>Kontinuierlicher Fokus:</strong> Passt den Fokus ständig an</li>
            <li><strong>Manueller Fokus:</strong> Erweiterte Einstellung (falls unterstützt)</li>
          </ul>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Probiere bei unscharfen Scans den "Festen Fokus" und halte die Karte in optimaler Entfernung.
          </p>
        </div>
        
        <div className="mt-4 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 p-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong className="text-gray-900 dark:text-gray-100">Optimale Positionierung:</strong>
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 dark:text-gray-300">
            <li>Die Karte sollte <strong>vollständig im gelben Rahmen</strong> sichtbar sein</li>
            <li>Vermeide Reflexionen auf der Karte durch Anpassung des Winkels</li>
            <li>Halte die Kamera etwa 15-20cm von der Karte entfernt</li>
          </ul>
        </div>
        
        <div className="mt-4 bg-purple-50 dark:bg-purple-900/30 border-l-4 border-purple-500 p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-purple-700 dark:text-purple-300 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Über die EasyOCR Technologie
            </p>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
              Diese App nutzt die leistungsstarke EasyOCR Technologie zur Texterkennung. 
              Dies ermöglicht eine präzise Erkennung von Kartennamen und Set-Nummern 
              auch bei schwierigen Lichtverhältnissen. Ein integrierter Kartenkatalog 
              hilft bei der Vervollständigung von teilweisen Erkennungen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scan;
