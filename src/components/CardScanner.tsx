import React, { useState } from 'react';
import { recognizeCard } from '../services/kimiVision';
import { searchCard } from '../services/pokemonTCG';
import { PokemonTCGCard } from '../services/pokemonTCG';

const CardScanner = () => {
  const [image, setImage] = useState(null);
  const [card, setCard] = useState<PokemonTCGCard | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const cardData = await recognizeCard(image);
      if (!cardData) return;
      const card = await searchCard(cardData.name, cardData.set, cardData.number);
      setCard(card);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-4 border border-gray-300 rounded">
      <h2 className="text-lg font-bold mb-4">Karten-Scanner</h2>
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      {image && (
        <img src={image} alt="Karten-Bild" className="w-full h-64 object-cover mt-4" />
      )}
      <button
        onClick={handleScan}
        className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        {loading ? 'Lade...' : 'Scanne Karte'}
      </button>
      {card && (
        <div className="mt-4">
          <h3 className="text-lg font-bold mb-2">Ergebnis</h3>
          <p className="text-sm text-gray-500">Name: {card.name}</p>
          <p className="text-sm text-gray-500">Set: {card.setName}</p>
          <p className="text-sm text-gray-500">Preis: {card.prices.market}</p>
          <img src={card.imageUrl} alt="Karten-Bild" className="w-full h-64 object-cover mt-4" />
        </div>
      )}
    </div>
  );
};

export default CardScanner;