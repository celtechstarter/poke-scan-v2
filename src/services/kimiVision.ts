import axios from "axios";

const openAiApi = "https://integrate.api.nvidia.com/v1";
const modelName = "moonshotai/kimi-k2-instruct";
const apiKey = process.env.VITE_NVIDIA_API_KEY;

const recognizeCard = async (base64Image: string) => {
  try {
    const response = await axios.post(
      `${openAiApi}/chat/completions`,
      {
        model: modelName,
        messages: [
          {
            role: "user",
            content: {
              image_url: base64Image,
            },
          },
        ],
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const cardData = response.data.choices[0].message.content;
    const cardName = cardData.split("\n")[0];
    const set = cardData.split("\n")[1];
    const number = cardData.split("\n")[2];
    const rarity = cardData.split("\n")[3];

    return {
      cardName,
      set,
      number,
      rarity,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
};

export { recognizeCard };