
import { CardOcrResult } from './types';
import { CARD_REGIONS, ADDITIONAL_REGIONS } from './regions';
import { preprocessImage, extractRegion } from './imagePreprocessing';
import { initOcrWorker } from './worker';
import { cleanupOcrResults } from './textCleanup';
import { PSM } from 'tesseract.js';

export * from './types';

/**
 * Process a card image using OCR with enhanced region processing and
 * specialized handling for Pokémon card text format
 */
export const processCardWithOcr = async (imageDataUrl: string): Promise<CardOcrResult> => {
  const result: CardOcrResult = {
    cardName: null,
    cardNumber: null,
    rawText: '',
    confidence: 0
  };
  
  try {
    const worker = await initOcrWorker();
    console.log('OCR worker initialized with optimized German language support');
    
    for (const region of CARD_REGIONS) {
      console.log(`Processing region: ${region.name}`);
      
      try {
        const regionImage = await extractRegion(imageDataUrl, region);
        const processedImage = await preprocessImage(regionImage);
        
        let recognitionResult = await worker.recognize(processedImage);
        
        if (recognitionResult.data.confidence < 60) {
          await worker.setParameters({
            tessedit_pageseg_mode: region.name === 'cardName' ? PSM.SINGLE_BLOCK : PSM.SINGLE_LINE
          });
          
          recognitionResult = await worker.recognize(processedImage);
          
          await worker.setParameters({
            tessedit_pageseg_mode: PSM.SINGLE_LINE
          });
        }
        
        const { data } = recognitionResult;
        
        console.log(`OCR result for ${region.name}:`, {
          text: data.text.trim(),
          confidence: data.confidence
        });
        
        if (region.name === 'cardName' && data.text.trim()) {
          result.cardName = data.text.trim();
        } else if (region.name === 'cardNumber' && data.text.trim()) {
          result.cardNumber = data.text.trim();
        }
        
        result.rawText += data.text.trim() + '\n';
        result.confidence = (result.confidence + data.confidence) / 2;
        
      } catch (regionError) {
        console.error(`Error processing region ${region.name}:`, regionError);
      }
    }
    
    for (const region of ADDITIONAL_REGIONS) {
      try {
        const regionImage = await extractRegion(imageDataUrl, region);
        const { data } = await worker.recognize(regionImage);
        
        result.rawText += `${region.name}: ${data.text.trim()}\n`;
      } catch (error) {
        // Silently ignore errors in additional regions
      }
    }
    
    const cleanedResult = cleanupOcrResults(result);
    
    await worker.terminate();
    
    return cleanedResult;
  } catch (error) {
    console.error('OCR processing error:', error);
    throw new Error(`OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
