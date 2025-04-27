
import { toast } from '@/hooks/use-toast';
import { optimizeImageForOcr } from './processing/preprocessingSteps/optimizeForOcr';
import { cropRegions } from './cropRegions';
import { extractCardName, extractCardNumber } from './text/extractors';
import { postprocessOcrResult } from './text/postprocessOcrResult';
import { GoogleVisionProvider } from './services/googleVisionProvider';
import { CARD_REGIONS } from './regions';
import { VisionOcrResult } from './types';
import { extractRegion } from './imagePreprocessing';

/**
 * Advanced card scanning with adaptive OCR strategy
 * Uses regional scanning and Pokemon-specific optimizations
 */
export async function scanCardWithAdaptiveStrategy(base64Image: string): Promise<VisionOcrResult> {
  try {
    console.log('Starting adaptive card scanning...');
    
    // Step 1: Preprocess the full image
    const optimizedImage = await optimizeImageForOcr(base64Image);
    console.log('Full image preprocessing completed');
    
    // Create OCR provider
    const ocrProvider = new GoogleVisionProvider(['de', 'en']);
    console.log(`Using OCR provider: ${ocrProvider.getProviderName()}`);
    
    // Remove the data:image/... prefix from base64 string
    const getBase64Content = (dataUrl: string) => dataUrl.split(',')[1];
    const fullImageContent = getBase64Content(optimizedImage);
    
    // Step 2: First attempt - scan full card
    console.log('Scanning full card image...');
    const fullCardResult = await ocrProvider.recognizeText(fullImageContent);
    
    // Initialize the OCR result
    let initialOcrResult: VisionOcrResult = {
      cardName: null,
      cardNumber: null,
      fullText: fullCardResult.text,
      confidence: fullCardResult.confidence
    };
    
    // Extract card name and number from full text
    initialOcrResult.cardName = extractCardName(fullCardResult.text);
    initialOcrResult.cardNumber = extractCardNumber(fullCardResult.text);
    
    // Early success check - if we got both name and number with good confidence
    const hasGoodResults = initialOcrResult.cardName && 
                          initialOcrResult.cardNumber && 
                          initialOcrResult.confidence > 0.7;
                          
    if (hasGoodResults) {
      console.log('Full card scan successful, applying post-processing');
      return postprocessOcrResult(initialOcrResult);
    }
    
    // Track missing information
    let needsCardName = !initialOcrResult.cardName;
    let needsCardNumber = !initialOcrResult.cardNumber;
    
    // Step 3: If needed, scan card name region
    if (needsCardName) {
      console.log('Card name not found in full scan, trying card name region...');
      try {
        // Extract and process the card name region
        const nameRegionImage = await extractRegion(optimizedImage, CARD_REGIONS.CARD_NAME);
        const nameRegionContent = getBase64Content(nameRegionImage);
        
        const nameRegionResult = await ocrProvider.recognizeText(nameRegionContent);
        if (nameRegionResult.text && nameRegionResult.confidence > 0.5) {
          initialOcrResult.cardName = extractCardName(nameRegionResult.text);
          // If this region gave us good results, increase overall confidence
          if (initialOcrResult.cardName) {
            console.log('Card name found in name region');
            initialOcrResult.confidence = Math.max(
              initialOcrResult.confidence,
              nameRegionResult.confidence
            );
          }
        }
      } catch (error) {
        console.error('Card name region scan failed:', error);
      }
    }
    
    // Step 4: If needed, scan card number region
    if (needsCardNumber) {
      console.log('Card number not found in full scan, trying set number region...');
      try {
        // Extract and process the set number region
        const numberRegionImage = await extractRegion(optimizedImage, CARD_REGIONS.SET_NUMBER);
        const numberRegionContent = getBase64Content(numberRegionImage);
        
        const numberRegionResult = await ocrProvider.recognizeText(numberRegionContent);
        if (numberRegionResult.text && numberRegionResult.confidence > 0.5) {
          initialOcrResult.cardNumber = extractCardNumber(numberRegionResult.text);
          // If this region gave us good results, increase overall confidence
          if (initialOcrResult.cardNumber) {
            console.log('Card number found in set number region');
            initialOcrResult.confidence = Math.max(
              initialOcrResult.confidence,
              numberRegionResult.confidence
            );
          }
        }
      } catch (error) {
        console.error('Card number region scan failed:', error);
      }
    }
    
    // Step 5: Apply Pokemon-specific post-processing
    const finalResult = postprocessOcrResult(initialOcrResult);
    console.log('OCR post-processing completed');
    
    // Check final result quality and provide user feedback
    if (!finalResult.cardName && !finalResult.cardNumber) {
      toast({
        title: "Scan-Qualität zu niedrig",
        description: "Keine Karteninformationen erkannt. Bitte bei besserer Beleuchtung neu scannen.",
        variant: "destructive",
      });
    } else if (!finalResult.cardName || !finalResult.cardNumber) {
      toast({
        title: "Teilweise Erkennung",
        description: `${finalResult.cardName ? 'Kartenname gefunden' : 'Kartenname fehlt'}. ${finalResult.cardNumber ? 'Kartennummer gefunden' : 'Kartennummer fehlt'}.`,
        variant: "default",
      });
    }
    
    return finalResult;
  } catch (error) {
    console.error('Adaptive card scanning failed:', error);
    
    toast({
      title: "OCR Fehler",
      description: "Kartentext konnte nicht erkannt werden. Bitte versuchen Sie es erneut.",
      variant: "destructive"
    });

    return {
      cardName: null,
      cardNumber: null,
      fullText: '',
      confidence: 0
    };
  }
}

/**
 * Legacy function to match the requested interface
 */
export async function scanCardImage(base64Image: string): Promise<{ title: string | null; setNumber: string | null; rawText: string }> {
  const result = await scanCardWithAdaptiveStrategy(base64Image);
  
  return {
    title: result.cardName,
    setNumber: result.cardNumber,
    rawText: result.fullText
  };
}
