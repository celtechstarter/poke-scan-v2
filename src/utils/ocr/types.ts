
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

/**
 * OCR region definition for specific card areas
 */
export interface OcrRegion {
  name: string;
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Result of image quality assessment
 */
export interface ImageQualityResult {
  isBlurry: boolean;
  poorLighting: boolean;
  message: string | null;
}
