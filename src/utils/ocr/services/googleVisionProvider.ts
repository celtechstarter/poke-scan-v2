
import { OcrProvider, OcrResult } from './ocrProviderInterface';
import { callGoogleVisionApi } from './visionApiService';
import { toast } from '@/hooks/use-toast';

export class GoogleVisionProvider implements OcrProvider {
  private languageHints: string[];
  
  constructor(languageHints: string[] = ['de', 'en']) {
    this.languageHints = languageHints;
  }

  async recognizeText(base64Image: string): Promise<OcrResult> {
    try {
      // Call the existing Vision API service
      const apiResponse = await callGoogleVisionApi(base64Image, this.languageHints);
      
      // Extract text and confidence
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
      
      // Extract bounding boxes if available
      const boundingBoxes = textAnnotations.slice(1).map(annotation => {
        const vertices = annotation.boundingPoly?.vertices || [];
        if (vertices.length >= 4) {
          const x = Math.min(...vertices.map((v: any) => v.x || 0));
          const y = Math.min(...vertices.map((v: any) => v.y || 0));
          const maxX = Math.max(...vertices.map((v: any) => v.x || 0));
          const maxY = Math.max(...vertices.map((v: any) => v.y || 0));
          
          return {
            x,
            y,
            width: maxX - x,
            height: maxY - y,
            text: annotation.description || '',
            confidence: annotation.confidence || 0
          };
        }
        return null;
      }).filter(box => box !== null) as any[];

      return {
        text: fullText,
        confidence: confidence || 0.7,
        boundingBoxes
      };
    } catch (error) {
      console.error('Google Vision OCR Error:', error);
      
      toast({
        title: "OCR Fehler",
        description: "Kartentext konnte nicht erkannt werden. Bitte versuchen Sie es erneut.",
        variant: "destructive"
      });

      return {
        text: '',
        confidence: 0
      };
    }
  }

  getProviderName(): string {
    return 'Google Vision API';
  }
}
