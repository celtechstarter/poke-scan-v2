
import { OcrRegion } from './types';

/**
 * OCR regions for different card areas
 * Coordinates are percentages of the card dimensions
 */
export const CARD_REGIONS: Record<string, OcrRegion> = {
  // Full card area
  FULL: {
    name: 'full_card',
    top: 0,
    left: 0,
    width: 100,
    height: 100
  },
  
  // Card name area (top 20%)
  CARD_NAME: {
    name: 'card_name',
    top: 0,
    left: 0,
    width: 100,
    height: 20
  },
  
  // Set number area (bottom 15%)
  SET_NUMBER: {
    name: 'set_number',
    top: 85,
    left: 0,
    width: 100,
    height: 15
  },
  
  // Card type area (middle upper area)
  CARD_TYPE: {
    name: 'card_type',
    top: 20,
    left: 0,
    width: 100,
    height: 10
  },
  
  // HP area (top right)
  HP: {
    name: 'hp',
    top: 5,
    left: 70,
    width: 30,
    height: 15
  },
  
  // Bottom attributes area
  ATTRIBUTES: {
    name: 'attributes',
    top: 75,
    left: 0,
    width: 100,
    height: 10
  }
};
