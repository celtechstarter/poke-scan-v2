
import { toast } from '@/hooks/use-toast';
import { extractRegion } from './imagePreprocessing';
import { preprocessImage } from './processing/imageProcessor';
import { extractCardName, extractCardNumber } from './text/extractors';
import { callGoogleVisionApi } from './services/visionApiService';

export interface VisionOcrResult {
  cardName: string | null;
  cardNumber: string | null;
  fullText: string;
  confidence: number;
}

export async function scanCardWithGoogleVision(base64Image: string): Promise<VisionOcrResult> {
  try {
    // Preprocess the image to improve OCR quality
    console.log('Preprocessing image for OCR...');
    const optimizedImage = await preprocessImage(base64Image);
    console.log('Image preprocessing complete');
    
    // Remove the data:image/... prefix from base64 string
    const base64Content = optimizedImage.split(',')[1];
    
    console.log('Sending request to Google Vision API...');
    const apiResponse = await callGoogleVisionApi(base64Content);
    console.log('Received Vision API response');
    
    // Extract the full text annotation
    const fullText = apiResponse.fullTextAnnotation?.text || '';
    
    // Calculate confidence from text annotations
    let confidence = 0;
    const textAnnotations = apiResponse.textAnnotations || [];
    
    if (textAnnotations.length > 0) {
      // Average confidence from all detections
      const confidenceSum = textAnnotations.reduce((sum: number, annotation: any) => {
        return sum + (annotation.confidence || 0);
      }, 0);
      confidence = confidenceSum / textAnnotations.length;
    }

    // Extract card name and number using specialized functions
    const cardName = extractCardName(fullText);
    const cardNumber = extractCardNumber(fullText);

    return {
      cardName,
      cardNumber,
      fullText,
      confidence: confidence || 0.7 // Default confidence if not provided by API
    };

  } catch (error) {
    console.error('Google Vision OCR Error:', error);
    
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
