
import { OcrRegion } from './types';

// Refined regions of interest for a Pokemon card
// Values are percentages of the image dimensions
export const CARD_REGIONS: OcrRegion[] = [
  // Top region - Card name - Refined and narrowed down for better precision
  {
    name: 'cardName',
    top: 4.5, // Slightly lower to avoid card border
    left: 18, // More centered on actual name position
    width: 64, // Narrower to focus on just the name
    height: 8.5 // Smaller height to avoid capturing unwanted elements
  },
  // Bottom region - Card number and set - Adjusted for better set code capture
  {
    name: 'cardNumber',
    top: 88.5, // Slightly higher to ensure we get the complete set info
    left: 6.5, // Better positioned for left-aligned set codes
    width: 30, // Narrower to focus on the set code area
    height: 8 // Optimized height for set code text
  }
];

// Additional region for energy type (can help identify and confirm certain cards)
export const ADDITIONAL_REGIONS: OcrRegion[] = [
  // Energy type region - top right
  {
    name: 'energyType',
    top: 5,
    left: 85,
    width: 10,
    height: 10
  }
];
