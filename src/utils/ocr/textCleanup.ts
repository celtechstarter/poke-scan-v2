
import { CardOcrResult } from './types';

/**
 * Enhanced cleanup of OCR results specifically tailored for Pokémon cards
 */
export const cleanupOcrResults = (ocrResult: CardOcrResult): CardOcrResult => {
  const result = { ...ocrResult };
  
  if (result.cardName) {
    result.cardName = result.cardName
      .replace(/\n/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/^[^a-zA-ZäöüÄÖÜß]+/, '')
      .replace(/^(V|v)(\s+)/, 'V')
      .replace(/^(GX|EX|ex|gx)(\s+)/, '')
      .trim();
      
    result.cardName = result.cardName
      .replace(/Vitalitat/g, 'Vitalität')
      .replace(/Prof\.(\S)/g, 'Prof. $1')
      .replace(/(\w)\.(\w)/g, '$1. $2')
      .replace(/Pikachu/i, 'Pikachu')
      .replace(/Charizard/i, 'Glurak')
      .replace(/ü/g, 'ü')
      .replace(/ä/g, 'ä')
      .replace(/ö/g, 'ö')
      .replace(/ß/g, 'ß');
      
    if (result.cardName.length < 3) {
      result.cardName = null;
    } else if (result.cardName.length > 30) {
      const nameParts = result.cardName.split(' ');
      if (nameParts.length > 2) {
        result.cardName = nameParts.slice(0, 2).join(' ');
      }
    }
  }
  
  if (result.cardNumber) {
    const setNumberRegex = /([A-Z]{2,5})[- ]?(?:DE|EN)?[- ]?(\d+)\/(\d+)/i;
    const match = result.cardNumber.match(setNumberRegex);
    
    if (match) {
      result.cardNumber = `${match[1].toUpperCase()} ${match[2]}/${match[3]}`;
    } else {
      const altRegex = /([A-Z]{1,5})[^0-9]*(\d+)[^0-9]*(\d+)/i;
      const altMatch = result.cardNumber.match(altRegex);
      
      if (altMatch) {
        result.cardNumber = `${altMatch[1].toUpperCase()} ${altMatch[2]}/${altMatch[3]}`;
      } else {
        result.cardNumber = result.cardNumber
          .replace(/\n/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim();
      }
    }
    
    if (result.cardNumber.length < 4 || result.cardNumber.length > 15) {
      result.cardNumber = null;
    }
  }
  
  return result;
};
