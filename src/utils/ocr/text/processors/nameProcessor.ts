
import { findClosestMatch } from '../utils/stringSimilarity';

// Common OCR error corrections for Pokemon names
const NAME_CORRECTIONS: Record<string, string> = {
  'P1kachu': 'Pikachu',
  'Charizara': 'Charizard',
  'Bulbasaur': 'Bulbasaur',
  'lvy5aur': 'Ivysaur',
  '5quirtle': 'Squirtle',
};

// Common Pokemon names for matching
export const COMMON_POKEMON_NAMES = [
  'Pikachu', 'Charizard', 'Bulbasaur', 'Ivysaur', 'Squirtle', 'Wartortle', 'Blastoise',
  'Charmander', 'Charmeleon', 'Venusaur', 'Eevee', 'Mewtwo', 'Mew', 'Gengar',
  'Gyarados', 'Snorlax', 'Dragonite', 'Zapdos', 'Articuno', 'Moltres', 'Lugia',
  'Ho-Oh', 'Rayquaza', 'Groudon', 'Kyogre', 'Dialga', 'Palkia', 'Giratina',
  'Arceus', 'Zekrom', 'Reshiram', 'Kyurem', 'Xerneas', 'Yveltal', 'Zygarde',
  'Solgaleo', 'Lunala', 'Necrozma', 'Zacian', 'Zamazenta', 'Eternatus'
];

export function processCardName(cardName: string | null): string | null {
  if (!cardName) return null;
  
  let processedName = cardName;
  
  // Apply name-specific corrections
  for (const [incorrect, correct] of Object.entries(NAME_CORRECTIONS)) {
    processedName = processedName.replace(new RegExp(incorrect, 'g'), correct);
  }
  
  // Fix case issues
  if (processedName.length > 0) {
    processedName = processedName.charAt(0).toUpperCase() + 
                   processedName.slice(1).toLowerCase();
  }
  
  // Try to match against known Pokemon names
  const closestMatch = findClosestMatch(processedName, COMMON_POKEMON_NAMES);
  if (closestMatch && calculateStringSimilarity(processedName, closestMatch) > 0.7) {
    processedName = closestMatch;
  }
  
  return processedName;
}
