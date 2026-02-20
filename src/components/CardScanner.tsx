import React, { useState, useRef } from "react";
import { recognizeCard } from "../services/kimiVision";
import { getCardmarketPrice } from "../services/cardmarketPrice";

interface ScanResult {
  cardName: string;
  set: string;
  number: string;
  rarity: string;
  language: string;
  cardmarketUrl: string;
}

const CardScanner: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    try {
      const cardData = await recognizeCard(image);
      if (!cardData) {
        setError("Karte konnte nicht erkannt werden. Bitte versuche es mit einem besseren Foto.");
        return;
      }
      const priceData = await getCardmarketPrice(cardData.cardName, cardData.set, cardData.number);
      setResult({
        cardName: cardData.cardName,
        set: cardData.set,
        number: cardData.number,
        rarity: cardData.rarity,
        language: cardData.language,
        cardmarketUrl: priceData?.cardmarketUrl || ""
      });
    } catch (err) {
      setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Karten-Scanner
        </h2>
        {!image ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="hidden"
              id="file-upload"
              aria-label="Bild hochladen"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <span className="text-4xl mb-2" role="img" aria-label="Kamera">
                📸
              </span>
              <span className="text-gray-600">Foto aufnehmen oder hochladen</span>
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <img src={image} alt="Hochgeladene Karte" className="w-full rounded-lg shadow" />
            {!result && !loading && (
              <button
                onClick={handleScan}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                aria-label="Karte scannen"
              >
                Karte scannen
              </button>
            )}
            {loading && (
              <div className="text-center py-4" role="status" aria-live="polite">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                <p className="mt-2 text-gray-600">Analysiere Karte...</p>
              </div>
            )}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
                {error}
              </div>
            )}
            {result && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                <h3 className="font-bold text-lg text-gray-800">{result.cardName}</h3>
                <p className="text-gray-600">Set: {result.set}</p>
                <p className="text-gray-600">Nummer: {result.number}</p>
                <p className="text-gray-600">Seltenheit: {result.rarity}</p>
                <p className="text-gray-600">Sprache: {result.language}</p>
                <a
                  href={result.cardmarketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg text-center mt-4 transition-colors"
                >
                  Auf Cardmarket ansehen
                </a>
              </div>
            )}
            <button
              onClick={handleReset}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg transition-colors"
              aria-label="Neue Karte scannen"
            >
              Neue Karte scannen
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardScanner;