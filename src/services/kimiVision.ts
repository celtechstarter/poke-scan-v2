import axios from "axios";

interface CardRecognitionResult {
  cardName: string;
  set: string;
  number: string;
  rarity: string;
  language: string;
  confidence: number;
}

const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const MODEL_NAME = "moonshotai/kimi-k2-5";

export const recognizeCard = async (base64Image: string): Promise<CardRecognitionResult | null> => {
  const apiKey = import.meta.env.VITE_NVIDIA_API_KEY;
  if (!apiKey) {
    console.error("NVIDIA API Key nicht konfiguriert");
    return null;
  }

  try {
    const response = await axios.post(
      NVIDIA_API_URL,
      {
        model: MODEL_NAME,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analysiere diese Pokémon-Karte und gib mir folgende Informationen im JSON-Format zurück: { "cardName": "Name des Pokémon", "set": "Name des Sets", "number": "Kartennummer (z.B. 012/025)", "rarity": "Seltenheit (Common, Uncommon, Rare, Holo Rare, Ultra Rare, etc.)", "language": "Sprache der Karte (Deutsch, Englisch, Japanisch, etc.)", "confidence": 0.95 } Antworte NUR mit dem JSON, kein anderer Text.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: base64Image.startsWith("data:") ? base64Image : `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    const content = response.data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as CardRecognitionResult;
    }
    return null;
  } catch (error) {
    console.error("Fehler bei Kartenerkennung:", error);
    return null;
  }
};