
/**
 * OCR Provider Interface - Abstraction layer for different OCR services
 * Allows for easy switching between different OCR implementations
 */

export interface OcrResult {
  text: string;
  confidence: number;
  boundingBoxes?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    confidence: number;
  }>;
}

export interface OcrProvider {
  /**
   * Performs OCR on the given base64 image
   * @param base64Image Base64-encoded image without data:image/... prefix
   * @returns Promise resolving to OCR result
   */
  recognizeText(base64Image: string): Promise<OcrResult>;
  
  /**
   * Gets the name of the OCR provider
   * @returns Provider name
   */
  getProviderName(): string;
}
