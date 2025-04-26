
import { ImageQualityResult } from '../types';

const EDGE_THRESHOLD = 12;
const BRIGHTNESS_MIN = 50;
const BRIGHTNESS_MAX = 210;

/**
 * Analyzes image quality for OCR processing by checking blur and lighting
 */
export const assessImageQuality = (
  imageData: ImageData
): ImageQualityResult => {
  const data = imageData.data;
  let edgeStrength = 0;
  let totalBrightness = 0;
  
  // Calculate edge strength and brightness
  for (let y = 1; y < imageData.height - 1; y++) {
    for (let x = 1; x < imageData.width - 1; x++) {
      const idx = (y * imageData.width + x) * 4;
      const idxLeft = (y * imageData.width + (x - 1)) * 4;
      const idxRight = (y * imageData.width + (x + 1)) * 4;
      const idxUp = ((y - 1) * imageData.width + x) * 4;
      const idxDown = ((y + 1) * imageData.width + x) * 4;
      
      // Enhanced edge detection (both horizontal and vertical)
      const edgeH = Math.abs(data[idxLeft] - data[idxRight]);
      const edgeV = Math.abs(data[idxUp] - data[idxDown]);
      edgeStrength += Math.max(edgeH, edgeV);
      
      // Calculate brightness
      totalBrightness += (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
    }
  }
  
  // Normalize measurements
  const avgEdgeStrength = edgeStrength / (imageData.width * imageData.height);
  const avgBrightness = totalBrightness / (imageData.width * imageData.height);
  
  const isBlurry = avgEdgeStrength < EDGE_THRESHOLD;
  const poorLighting = avgBrightness < BRIGHTNESS_MIN || avgBrightness > BRIGHTNESS_MAX;
  
  let message = null;
  if (isBlurry && poorLighting) {
    message = "Bild ist unscharf und hat schlechte Lichtverhältnisse";
  } else if (isBlurry) {
    message = "Bild ist unscharf, bitte halte die Kamera still";
  } else if (poorLighting) {
    message = "Schlechte Lichtverhältnisse, bitte für bessere Beleuchtung sorgen";
  }
  
  return { isBlurry, poorLighting, message };
};
