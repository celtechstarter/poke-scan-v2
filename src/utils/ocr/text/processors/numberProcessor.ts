
import { OCR_CORRECTIONS } from '../constants';

export function processCardNumber(cardNumber: string | null): string | null {
  if (!cardNumber) return null;
  
  let processedNumber = cardNumber;
  
  // Remove spaces and unexpected characters
  processedNumber = processedNumber.replace(/[^\d\/A-Za-z]/g, '');
  
  // Check and fix set number pattern
  const setNumberRegex = /([A-Za-z]{2,5})\s*(\d+)\/(\d+)/i;
  if (!setNumberRegex.test(processedNumber)) {
    const alphaMatch = processedNumber.match(/([A-Za-z]{2,5})/i);
    const numbers = processedNumber.replace(/[^\d]/g, '');
    
    if (alphaMatch && numbers.length >= 2) {
      // Reconstruct pattern with set code
      const setCode = alphaMatch[1].toUpperCase();
      const firstPart = numbers.substring(0, Math.ceil(numbers.length / 2));
      const secondPart = numbers.substring(Math.ceil(numbers.length / 2));
      if (firstPart && secondPart) {
        processedNumber = `${setCode} ${firstPart}/${secondPart}`;
      }
    } else if (numbers.length >= 2) {
      // Just use numbers
      const firstPart = numbers.substring(0, Math.ceil(numbers.length / 2));
      const secondPart = numbers.substring(Math.ceil(numbers.length / 2));
      processedNumber = `${firstPart}/${secondPart}`;
    }
  }
  
  // Validate final length
  if (processedNumber.length < 4 || processedNumber.length > 15) {
    return null;
  }
  
  return processedNumber;
}
