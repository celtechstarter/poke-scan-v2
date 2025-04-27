
/**
 * Extract card name from OCR text using improved heuristics
 */
export function extractCardName(text: string): string | null {
  if (!text) return null;
  
  // Split text into lines
  const lines = text.split('\n');
  
  // Pokemon card names are typically in the first few lines
  // Skip empty lines and filter out common non-name text
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const line = lines[i]?.trim();
    
    if (!line || line.length < 2) continue;
    
    // Filter out common non-name patterns
    if (line.match(/^\d+\/\d+$/) || // Set numbers like 123/345
        line.match(/^(HP|KP)\s*\d+$/) || // HP values
        line.match(/^(V|GX|EX)$/) || // Card type indicators
        line.toLowerCase().includes('pokemon') || // "Pokemon" text
        line.toLowerCase().includes('trainer') || // "Trainer" text
        line.match(/^[0-9♢★]+$/) // Symbol-only or number-only lines
    ) {
      continue;
    }
    
    // Valid card name found
    return line;
  }
  
  // No valid name found in first few lines, default to first non-empty line
  return lines.find(line => line.trim().length > 0) || null;
}

/**
 * Extract card number from OCR text using improved pattern matching
 */
export function extractCardNumber(text: string): string | null {
  if (!text) return null;
  
  const lines = text.split('\n').reverse();
  
  // First try to match the most specific pattern (set code + number)
  const setNumberRegex = /([A-Z]{2,5})\s*([A-Z]{2})?\s*(\d{1,3})\s*\/\s*(\d{1,3})/i;
  
  for (const line of lines) {
    const match = line.match(setNumberRegex);
    if (match) {
      // Format consistently as "SET XX 123/456"
      const setCode = match[1].toUpperCase();
      const langCode = match[2] ? match[2].toUpperCase() : '';
      const cardNum = match[3];
      const setTotal = match[4];
      
      return langCode 
        ? `${setCode} ${langCode} ${cardNum}/${setTotal}` 
        : `${setCode} ${cardNum}/${setTotal}`;
    }
  }
  
  // Try simpler pattern (just numbers)
  const simpleNumberRegex = /(\d{1,3})\s*\/\s*(\d{1,3})/;
  
  for (const line of lines) {
    const match = line.match(simpleNumberRegex);
    if (match) {
      return `${match[1]}/${match[2]}`;
    }
  }
  
  return null;
}
