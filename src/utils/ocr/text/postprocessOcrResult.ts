
import { VisionOcrResult } from '../types';
import { processCardName } from './processors/nameProcessor';
import { processCardNumber } from './processors/numberProcessor';

/**
 * Post-processes OCR results from EasyOCR with Pokemon-specific knowledge
 */
export function postprocessOcrResult(ocrResult: VisionOcrResult): VisionOcrResult {
  if (!ocrResult.fullText) {
    return ocrResult;
  }
  
  const improvedCardName = processCardName(ocrResult.cardName);
  const improvedCardNumber = processCardNumber(ocrResult.cardNumber);
  
  return {
    ...ocrResult,
    cardName: improvedCardName || ocrResult.cardName,
    cardNumber: improvedCardNumber || ocrResult.cardNumber,
  };
}

/**
 * Legacy function to match the requested interface
 */
export function postprocessOcrText(text: string): { title: string | null; setNumber: string | null } {
  if (!text) {
    return { title: null, setNumber: null };
  }
  
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  // Extract title
  let title: string | null = null;
  if (lines.length > 0) {
    title = processCardName(lines[0]);
  }
  
  // Extract set number
  let setNumber: string | null = null;
  for (const line of lines) {
    const processedNumber = processCardNumber(line);
    if (processedNumber) {
      setNumber = processedNumber;
      break;
    }
  }
  
  return { title, setNumber };
}
