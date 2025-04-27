
/**
 * Calculate string similarity score using Levenshtein distance
 * @returns Value between 0 (completely different) and 1 (identical)
 */
export function calculateStringSimilarity(a: string, b: string): number {
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
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  const maxLength = Math.max(a.length, b.length);
  return maxLength > 0 ? 1 - (matrix[a.length][b.length] / maxLength) : 1;
}

/**
 * Find the closest matching string from an array of candidates
 */
export function findClosestMatch(input: string, candidates: string[]): string | null {
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
  
  return bestScore >= 0.5 ? bestMatch : null;
}
