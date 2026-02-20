interface CardRecognitionResult {
  cardName: string;
  set: string;
  number: string;
  rarity: string;
  language: string;
}

export const recognizeCard = async (base64Image: string): Promise<CardRecognitionResult | null> => {
  try {
    const response = await fetch('/api/recognize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64Image })
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return null;
    }

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