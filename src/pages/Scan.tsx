
import CardScannerWebcam from '@/components/card-scanner/CardScannerWebcam';

const Scan = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Pokemon Karten Scanner</h1>
      <p className="text-center text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
        Nutze deine Webcam, um Pokemon-Karten zu scannen und ihren aktuellen Marktwert zu ermitteln.
      </p>
      
      <CardScannerWebcam />
      
      <div className="mt-12 max-w-2xl mx-auto bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">So funktioniert's:</h2>
        <ol className="list-decimal pl-5 space-y-2 text-gray-800 dark:text-gray-300">
          <li>Starte die Kamera mit einem Klick auf "Kamera starten"</li>
          <li>Halte deine Pokemon-Karte <strong>aufrecht</strong> vor die Kamera im markierten Bereich</li>
          <li>Klicke auf "Karte scannen" und halte die Karte ruhig</li>
          <li>Warte, bis der Scan abgeschlossen ist</li>
          <li>Erhalte den aktuellen Preis und Details zu deiner Karte</li>
        </ol>
        
        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-pokeyellow p-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong className="text-gray-900 dark:text-gray-100">Hinweis:</strong> Sorge für gute Lichtverhältnisse und halte die Karte <strong>senkrecht</strong>, damit 
            Text und Bild klar erkennbar sind. Je besser die Aufnahmequalität, desto genauer das Ergebnis.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Scan;
