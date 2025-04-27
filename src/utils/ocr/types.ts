
export interface CardOcrResult {
  cardName: string | null;
  cardNumber: string | null;
  rawText: string;
  confidence: number;
}

export interface VisionOcrResult {
  cardName: string | null;
  cardNumber: string | null;
  fullText: string;
  confidence: number;
}
