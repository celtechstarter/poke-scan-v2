
import { CardDetectionErrorType } from '@/utils/cardDetectionUtils';
import { CardOcrResult } from '@/utils/ocrUtils';

/**
 * Error types specific to card scanning
 */
export enum CardScanningErrorType {
  CAPTURE_FAILED = 'capture_failed',
  ANALYSIS_FAILED = 'analysis_failed',
  PRICE_LOOKUP_FAILED = 'price_lookup_failed'
}

/**
 * Combined error type for scanner operations
 */
export type ScannerErrorType = CardScanningErrorType | CardDetectionErrorType;

/**
 * Scan result interface for card scanning operations
 */
export interface ScanResult {
  cardName: string;
  cardNumber?: string;
  price: number | null;
  imageDataUrl: string | null;
  ocrResult?: CardOcrResult;
}

/**
 * Error interface for scanner operations
 */
export interface ScannerError {
  message: string;
  type: ScannerErrorType;
}
