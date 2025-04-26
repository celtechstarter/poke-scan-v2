
/**
 * OCR configuration for Pokemon card recognition
 */
export interface OcrRegion {
  name: string;
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * OCR result from processing a card image
 */
export interface CardOcrResult {
  cardName: string | null;
  cardNumber: string | null;
  rawText: string;
  confidence: number;
}

/**
 * Result of image quality assessment
 */
export interface ImageQualityResult {
  isBlurry: boolean;
  poorLighting: boolean;
  message: string | null;
}
