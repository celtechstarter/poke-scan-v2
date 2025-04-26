
import { CardOcrResult } from './types';
import { CARD_REGIONS, ADDITIONAL_REGIONS } from './regions';
import { preprocessImage, extractRegion, assessImageQuality } from './imagePreprocessing';
import { initOcrWorker } from './worker';
import { cleanupOcrResults } from './textCleanup';
import { PSM } from 'tesseract.js';
import { toast } from '@/components/ui/use-toast';

export * from './types';

/**
 * Process a card image using OCR with enhanced region processing and
 * specialized handling for Pokémon card text format
 */
export const processCardWithOcr = async (
  imageDataUrl: string,
  cardEdges?: { topLeft: {x: number, y: number}, topRight: {x: number, y: number}, bottomRight: {x: number, y: number}, bottomLeft: {x: number, y: number} } | null
): Promise<CardOcrResult> => {
  const result: CardOcrResult = {
    cardName: null,
    cardNumber: null,
    rawText: '',
    confidence: 0
  };
  
  try {
    const worker = await initOcrWorker();
    console.log('OCR worker initialized with German + English language support');
    
    // Set initial PSM mode for general text recognition
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SPARSE_TEXT
    });
    
    let totalConfidence = 0;
    let regionsProcessed = 0;
    
    for (const region of CARD_REGIONS) {
      console.log(`Processing region: ${region.name}`);
      
      try {
        // Pass cardEdges to region extraction for more precise cropping
        const regionImage = await extractRegion(imageDataUrl, region, cardEdges);
        const processedImage = await preprocessImage(regionImage);
        
        // Initial recognition attempt with SPARSE_TEXT
        let recognitionResult = await worker.recognize(processedImage);
        let bestResult = recognitionResult;
        
        // If confidence is low, try alternative PSM modes
        if (recognitionResult.data.confidence < 60) {
          console.log(`Low confidence (${recognitionResult.data.confidence}) for ${region.name}, trying alternative PSM mode`);
          
          await worker.setParameters({
            tessedit_pageseg_mode: region.name === 'cardName' ? PSM.SINGLE_BLOCK : PSM.SINGLE_LINE
          });
          
          const retryResult = await worker.recognize(processedImage);
          
          // Keep the result with higher confidence
          if (retryResult.data.confidence > recognitionResult.data.confidence) {
            bestResult = retryResult;
            console.log(`Improved confidence to ${retryResult.data.confidence} using alternative PSM mode`);
          }
          
          // Reset to SPARSE_TEXT for next region
          await worker.setParameters({
            tessedit_pageseg_mode: PSM.SPARSE_TEXT
          });
        }
        
        const { data } = bestResult;
        const cleanText = data.text.trim();
        
        console.log(`OCR result for ${region.name}:`, {
          text: cleanText,
          confidence: data.confidence
        });
        
        // Show user warning if confidence is very low
        if (data.confidence < 40) {
          toast({
            title: "Niedrige Erkennungsqualität",
            description: "Bitte scannen Sie die Karte erneut mit besserer Beleuchtung und ruhiger Kamera",
            variant: "destructive",
          });
        }
        
        if (cleanText) {
          if (region.name === 'cardName') {
            result.cardName = cleanText;
          } else if (region.name === 'cardNumber') {
            result.cardNumber = cleanText;
          }
          
          result.rawText += `${cleanText}\n`;
          totalConfidence += data.confidence;
          regionsProcessed++;
        }
        
      } catch (regionError) {
        console.error(`Error processing region ${region.name}:`, regionError);
      }
    }
    
    // Process additional regions with default PSM
    for (const region of ADDITIONAL_REGIONS) {
      try {
        const regionImage = await extractRegion(imageDataUrl, region, cardEdges);
        const { data } = await worker.recognize(regionImage);
        
        if (data.text.trim()) {
          result.rawText += `${region.name}: ${data.text.trim()}\n`;
        }
      } catch (error) {
        // Silently ignore errors in additional regions
      }
    }
    
    // Calculate average confidence only for successful regions
    result.confidence = regionsProcessed > 0 ? totalConfidence / regionsProcessed : 0;
    
    const cleanedResult = cleanupOcrResults(result);
    
    await worker.terminate();
    
    return cleanedResult;
  } catch (error) {
    console.error('OCR processing error:', error);
    throw new Error(`OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
