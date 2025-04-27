
import { VisionOcrResult } from '../types';

// Common OCR error corrections for Pokemon cards
const OCR_CORRECTIONS: Record<string, string> = {
  // Digits and letters often confused
  '0': 'O',
  'O': '0',
  'l': '1',
  'I': '1',
  '1': 'I',
  '5': 'S',
  'S': '5',
  'Z': '2',
  '2': 'Z',
  'G': '6',
  '6': 'G',
  'B': '8',
  '8': 'B',
  // Common Pokemon name corrections
  'P1kachu': 'Pikachu',
  'Charizara': 'Charizard',
  'Bulbasaur': 'Bulbasaur',
  'lvy5aur': 'Ivysaur',
  '5quirtle': 'Squirtle',
};

/**
 * Post-processes OCR results with Pokemon-specific knowledge
 * @param ocrResult The raw OCR result
 * @returns Enhanced OCR result with corrections
 */
export function postprocessOcrResult(ocrResult: VisionOcrResult): VisionOcrResult {
  if (!ocrResult.fullText) {
    return ocrResult;
  }
  
  let improvedCardName = ocrResult.cardName || '';
  let improvedCardNumber = ocrResult.cardNumber || '';
  
  // Apply character-level corrections to card name
  if (improvedCardName) {
    // Apply common OCR error corrections
    for (const [incorrect, correct] of Object.entries(OCR_CORRECTIONS)) {
      improvedCardName = improvedCardName.replace(new RegExp(incorrect, 'g'), correct);
    }
    
    // Fix common case issues (first letter capital, rest lowercase unless there's a pattern)
    if (improvedCardName.length > 0) {
      improvedCardName = improvedCardName.charAt(0).toUpperCase() + 
                         improvedCardName.slice(1).toLowerCase();
    }
  }
  
  // Process card number to match expected format (e.g., "032/182")
  if (improvedCardNumber) {
    // Remove any spaces or unexpected characters
    improvedCardNumber = improvedCardNumber.replace(/[^\d\/]/g, '');
    
    // Check if it matches the expected pattern NNN/NNN
    if (!/^\d+\/\d+$/.test(improvedCardNumber)) {
      // Try to fix common issues with card numbers
      const numbers = improvedCardNumber.replace(/[^\d]/g, '');
      if (numbers.length >= 3) {
        // Try to reconstruct the pattern
        const firstPart = numbers.substring(0, Math.ceil(numbers.length / 2));
        const secondPart = numbers.substring(Math.ceil(numbers.length / 2));
        if (firstPart && secondPart) {
          improvedCardNumber = `${firstPart}/${secondPart}`;
        }
      }
    }
  }
  
  return {
    ...ocrResult,
    cardName: improvedCardName || ocrResult.cardName,
    cardNumber: improvedCardNumber || ocrResult.cardNumber,
  };
}
