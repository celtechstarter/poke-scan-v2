import axios from "axios";

interface PokemonTCGCard {
  id: string;
  name: string;
  setName: string;
  number: string;
  imageUrl: string;
  rarity: string;
  prices: {
    market: string;
    retail: string;
  };
}

const pokemonTCGApi = "https://api.pokemontcg.io/v2";
const apiKey = process.env.VITE_POKEMON_TCG_API_KEY;

const searchCard = async (name: string, set: string, number: string) => {
  try {
    const response = await axios.get(
      `${pokemonTCGApi}/cards?q=name:${name}+set:${set}+number:${number}`,
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const cardData = response.data.data[0];
    return {
      id: cardData.id,
      name: cardData.name,
      setName: cardData.set.name,
      number: cardData.number,
      imageUrl: cardData.images.large,
      rarity: cardData.rarity,
      prices: {
        market: cardData.tcgplayer.prices.market,
        retail: cardData.tcgplayer.prices.retail,
      },
    };
  } catch (error) {
    console.error(error);
    return null;
  }
};

export { searchCard };