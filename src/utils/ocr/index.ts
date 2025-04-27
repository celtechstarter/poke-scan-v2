
// Main exports
export { scanCardWithGoogleVision } from './visionOcr';
export { ocrWithEasyOCR } from './services/easyOcrService';
export * from './types';

// For debugging and direct access
export { EasyOcrProvider } from './services/easyOcrProvider';
export { optimizeImageForOcr } from './processing/preprocessingSteps/optimizeImageForOcr';
export { postprocessOcrResult } from './text/postprocessOcrResult';
