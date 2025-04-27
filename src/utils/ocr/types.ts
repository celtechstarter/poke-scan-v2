
export interface ImageQualityResult {
  isBlurry: boolean;
  poorLighting: boolean;
  message: string | null;
}

export interface OcrRegion {
  name: string;
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface VisionOcrResult {
  cardName: string | null;
  cardNumber: string | null;
  fullText: string;
  confidence: number;
  databaseMatch?: boolean;
}

export interface CardInfoResult {
  cardName: string;
  setCode: string;
  cardNumber: string;
  confidence?: number;
  rawText?: string;
}

