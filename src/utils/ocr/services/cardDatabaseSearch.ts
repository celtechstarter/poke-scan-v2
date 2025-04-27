
import cardDatabase from '@/data/cardDatabase.json';

interface CardInfo {
  name: string;
  setCode: string;
  cardNumber: string;
}

/**
 * Find the best matching card based on partial OCR results
 * 
 * @param ocrText Raw text from OCR
 * @returns Promise resolving to card info or null if no match
 */
export async function lookupCardInfo(ocrText: string): Promise<CardInfo | null> {
  if (!ocrText || ocrText.trim() === '') {
    console.log('No OCR text provided for card lookup');
    return null;
  }
  
  console.log('Looking up card info from OCR text:', ocrText);
  
  const cards = cardDatabase.cards;
  const lines = ocrText.split('\n').map(line => line.trim());
  
  // Try to match by card number first (more unique)
  const setNumberRegex = /(\d+)\/(\d+)/;
  
  for (const line of lines) {
    const match = line.match(setNumberRegex);
    if (match) {
      const cardNumberPattern = `${match[1]}/${match[2]}`;
      console.log('Searching for card number pattern:', cardNumberPattern);
      
      const cardMatch = cards.find(card => 
        card.cardNumber.includes(match[1]) && card.cardNumber.includes(match[2])
      );
      
      if (cardMatch) {
        console.log('Found card by number:', cardMatch);
        return {
          name: cardMatch.name,
          setCode: cardMatch.setCode,
          cardNumber: cardMatch.cardNumber
        };
      }
    }
  }
  
  // Try to match by name
  for (const card of cards) {
    // Convert card name to lowercase for case-insensitive matching
    const cardNameLower = card.name.toLowerCase();
    
    for (const line of lines) {
      const lineLower = line.toLowerCase();
      
      // Check for direct name match or partial match (at least 70% of name)
      if (lineLower.includes(cardNameLower) || 
         (cardNameLower.length >= 5 && 
          calculateSimilarity(lineLower, cardNameLower) > 0.7)) {
        
        console.log('Found card by name similarity:', card);
        return {
          name: card.name,
          setCode: card.setCode,
          cardNumber: card.cardNumber
        };
      }
    }
  }
  
  console.log('No matching card found in database');
  return null;
}

/**
 * Calculate text similarity using Levenshtein distance
 * Returns a value between 0 (completely different) and 1 (identical)
 */
function calculateSimilarity(a: string, b: string): number {
  if (a.length === 0) return b.length === 0 ? 1 : 0;
  if (b.length === 0) return 0;
  
  const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));
  
  for (let i = 0; i <= a.length; i++) {
    matrix[i][0] = i;
  }
  
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost  // substitution
      );
    }
  }
  
  // Convert distance to similarity score (1 - normalized distance)
  const maxLength = Math.max(a.length, b.length);
  return maxLength > 0 ? 1 - (matrix[a.length][b.length] / maxLength) : 1;
}
