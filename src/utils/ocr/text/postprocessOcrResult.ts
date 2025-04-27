import { VisionOcrResult } from '../types';

// Common OCR error corrections for Pokemon cards - expanded for EasyOCR
const OCR_CORRECTIONS: Record<string, string> = {
  // Digits and letters often confused by EasyOCR
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
  // EasyOCR specific mistakes
  'rn': 'm',
  'vv': 'w',
  'VV': 'W',
  'cl': 'd',
  'ii': 'u',
  // Common Pokemon name corrections
  'P1kachu': 'Pikachu',
  'Charizara': 'Charizard',
  'Bulbasaur': 'Bulbasaur',
  'lvy5aur': 'Ivysaur',
  '5quirtle': 'Squirtle',
  // Add more Pokemon-specific corrections as needed
};

// A small list of common Pokemon names for matching
const COMMON_POKEMON_NAMES = [
  'Pikachu', 'Charizard', 'Bulbasaur', 'Ivysaur', 'Squirtle', 'Wartortle', 'Blastoise',
  'Charmander', 'Charmeleon', 'Venusaur', 'Eevee', 'Mewtwo', 'Mew', 'Gengar',
  'Gyarados', 'Snorlax', 'Dragonite', 'Zapdos', 'Articuno', 'Moltres', 'Lugia',
  'Ho-Oh', 'Rayquaza', 'Groudon', 'Kyogre', 'Dialga', 'Palkia', 'Giratina',
  'Arceus', 'Zekrom', 'Reshiram', 'Kyurem', 'Xerneas', 'Yveltal', 'Zygarde',
  'Solgaleo', 'Lunala', 'Necrozma', 'Zacian', 'Zamazenta', 'Eternatus'
];

/**
 * Post-processes OCR results from EasyOCR with Pokemon-specific knowledge
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
    
    // Try to match against known Pokemon names using fuzzy matching
    const closestMatch = findClosestMatch(improvedCardName, COMMON_POKEMON_NAMES);
    if (closestMatch && calculateStringSimilarity(improvedCardName, closestMatch) > 0.7) {
      improvedCardName = closestMatch;
    }
  }
  
  // Process card number to match expected format (e.g., "032/182")
  if (improvedCardNumber) {
    // Remove any spaces or unexpected characters
    improvedCardNumber = improvedCardNumber.replace(/[^\d\/A-Za-z]/g, '');
    
    // Check if it matches the expected pattern SET NNN/NNN
    const setNumberRegex = /([A-Za-z]{2,5})\s*(\d+)\/(\d+)/i;
    if (!setNumberRegex.test(improvedCardNumber)) {
      // Try to fix common issues with card numbers
      const alphaMatch = improvedCardNumber.match(/([A-Za-z]{2,5})/i);
      const numbers = improvedCardNumber.replace(/[^\d]/g, '');
      
      if (alphaMatch && numbers.length >= 2) {
        // Try to reconstruct the pattern with set code
        const setCode = alphaMatch[1].toUpperCase();
        const firstPart = numbers.substring(0, Math.ceil(numbers.length / 2));
        const secondPart = numbers.substring(Math.ceil(numbers.length / 2));
        if (firstPart && secondPart) {
          improvedCardNumber = `${setCode} ${firstPart}/${secondPart}`;
        }
      } else if (numbers.length >= 2) {
        // No set code found, just use numbers
        const firstPart = numbers.substring(0, Math.ceil(numbers.length / 2));
        const secondPart = numbers.substring(Math.ceil(numbers.length / 2));
        improvedCardNumber = `${firstPart}/${secondPart}`;
      }
    }
  }
  
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
  // Extract card name and set number from text
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  // Attempt to find card title (usually first line or prominent text)
  let title: string | null = null;
  if (lines.length > 0) {
    // Look for a line that might be a Pokemon name
    for (const line of lines) {
      const possibleName = line.trim();
      if (possibleName.length > 2 && possibleName.length < 20) {
        // Try to match against known Pokemon names
        const closestMatch = findClosestMatch(possibleName, COMMON_POKEMON_NAMES);
        if (closestMatch && calculateStringSimilarity(possibleName, closestMatch) > 0.7) {
          title = closestMatch;
          break;
        }
        
        // If no match but line looks like a title, use it
        if (/^[A-Z][a-zA-Z\s-]+$/.test(possibleName)) {
          title = possibleName;
          break;
        }
      }
    }
    
    // If no title found, just use the first line
    if (!title && lines[0].length < 30) {
      title = lines[0];
    }
  }
  
  // Extract set number using regex pattern
  let setNumber: string | null = null;
  const setNumberRegex = /(\d{1,3})\s*\/\s*(\d{1,3})/;
  for (const line of lines) {
    const match = line.match(setNumberRegex);
    if (match) {
      setNumber = `${match[1]}/${match[2]}`;
      break;
    }
  }
  
  // Apply corrections if title was found
  if (title) {
    // Apply common OCR error corrections
    for (const [incorrect, correct] of Object.entries(OCR_CORRECTIONS)) {
      title = title.replace(new RegExp(incorrect, 'g'), correct);
    }
    
    // Title should start with uppercase
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }
  
  return { title, setNumber };
}

/**
 * Calculate string similarity score using Levenshtein distance
 */
function calculateStringSimilarity(a: string, b: string): number {
  if (a.length === 0) return b.length === 0 ? 1 : 0;
  if (b.length === 0) return 0;
  
  const track = Array(b.length + 1).fill(null).map(() => 
    Array(a.length + 1).fill(null));
  
  for (let i = 0; i <= a.length; i += 1) {
    track[0][i] = i;
  }
  
  for (let j = 0; j <= b.length; j += 1) {
    track[j][0] = j;
  }
  
  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }
  
  const maxLength = Math.max(a.length, b.length);
  const distance = track[b.length][a.length];
  return 1 - distance / maxLength;
}

/**
 * Find the closest matching string from an array of candidates
 */
function findClosestMatch(input: string, candidates: string[]): string | null {
  if (!input || !candidates.length) return null;
  
  let bestMatch = null;
  let bestScore = 0;
  
  for (const candidate of candidates) {
    const score = calculateStringSimilarity(input.toLowerCase(), candidate.toLowerCase());
    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }
  
  // Only return match if it's reasonably close
  return bestScore >= 0.5 ? bestMatch : null;
}
