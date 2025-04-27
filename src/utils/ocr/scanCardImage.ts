
import { toast } from '@/hooks/use-toast';
import { optimizeImageForOcr } from './processing/preprocessingSteps/optimizeForOcr';
import { cropRegions } from './cropRegions';
import { extractCardName, extractCardNumber } from './text/extractors';
import { postprocessOcrResult } from './text/postprocessOcrResult';
import { EasyOcrProvider } from './services/easyOcrProvider';
import { lookupCardInfo } from './services/cardDatabaseSearch';
import { VisionOcrResult } from './types';

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
    
    // Step 2: Crop the image into regions
    const regions = await cropRegions(optimizedImage);
    console.log('Image regions cropped');
    
    // Create OCR provider
    const ocrProvider = new EasyOcrProvider(['de', 'en']);
    console.log(`Using OCR provider: ${ocrProvider.getProviderName()}`);
    
    // Remove the data:image/... prefix from base64 string
    const getBase64Content = (dataUrl: string) => dataUrl.split(',')[1];
    
    // Step 3: First attempt - scan full card
    console.log('Scanning full card image...');
    const fullCardResult = await ocrProvider.recognizeText(regions.full);
    
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
    
    // Track missing information
    let needsCardName = !initialOcrResult.cardName;
    let needsCardNumber = !initialOcrResult.cardNumber;
    
    // Step 4: If needed, scan card name region
    if (needsCardName) {
      console.log('Card name not found in full scan, trying card name region...');
      try {
        const nameRegionResult = await ocrProvider.recognizeText(regions.titleArea);
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
    
    // Step 5: If needed, scan card number region
    if (needsCardNumber) {
      console.log('Card number not found in full scan, trying set number region...');
      try {
        const numberRegionResult = await ocrProvider.recognizeText(regions.setNumberArea);
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
    
    // Step 6: Apply Pokemon-specific post-processing
    const processedResult = postprocessOcrResult(initialOcrResult);
    console.log('OCR post-processing completed');
    
    // Step 7: Try database lookup for partial matches
    if ((!processedResult.cardName || !processedResult.cardNumber) && processedResult.fullText) {
      console.log('Using database lookup for partial OCR match');
      const databaseMatch = await lookupCardInfo(processedResult.fullText);
      
      if (databaseMatch) {
        console.log('Database match found:', databaseMatch);
        
        // Fill in missing information from database
        if (!processedResult.cardName) {
          processedResult.cardName = databaseMatch.name;
          console.log('Set card name from database:', databaseMatch.name);
        }
        
        if (!processedResult.cardNumber) {
          processedResult.cardNumber = databaseMatch.cardNumber;
          console.log('Set card number from database:', databaseMatch.cardNumber);
        }
        
        // Improve confidence since we have a database match
        processedResult.confidence = Math.max(0.7, processedResult.confidence);
        processedResult.databaseMatch = true;
      }
    }
    
    // Log OCR confidence for debugging
    console.log(`OCR Confidence: ${Math.round(processedResult.confidence * 100)}%`);
    
    // Check final result quality and provide user feedback
    if (!processedResult.cardName && !processedResult.cardNumber) {
      toast({
        title: "Scan-Qualität zu niedrig",
        description: "Keine Karteninformationen erkannt. Bitte bei besserer Beleuchtung neu scannen.",
        variant: "destructive",
      });
    } else if (!processedResult.cardName || !processedResult.cardNumber) {
      toast({
        title: "Teilweise Erkennung",
        description: `${processedResult.cardName ? 'Kartenname gefunden' : 'Kartenname fehlt'}. ${processedResult.cardNumber ? 'Kartennummer gefunden' : 'Kartennummer fehlt'}.`,
        variant: "default",
      });
    }
    
    return processedResult;
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
