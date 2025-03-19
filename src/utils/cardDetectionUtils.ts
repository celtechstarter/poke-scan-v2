/**
 * Utility functions for detecting Pokemon cards in video frames
 * @module cardDetectionUtils
 */

/**
 * Error types for card detection operations
 */
export enum CardDetectionErrorType {
  CONTEXT_ERROR = 'context_error',
  PROCESSING_ERROR = 'processing_error',
  INVALID_INPUT = 'invalid_input'
}

/**
 * Custom error class for card detection errors
 */
export class CardDetectionError extends Error {
  type: CardDetectionErrorType;
  
  constructor(message: string, type: CardDetectionErrorType) {
    super(message);
    this.name = 'CardDetectionError';
    this.type = type;
  }
}

/**
 * Safely gets the canvas context or throws an appropriate error
 * 
 * @param {HTMLCanvasElement} canvas - Canvas element to get context from
 * @returns {CanvasRenderingContext2D} The 2D canvas context
 * @throws {CardDetectionError} When canvas context cannot be acquired
 */
const getContextSafely = (canvas: HTMLCanvasElement): CanvasRenderingContext2D => {
  if (!canvas) {
    throw new CardDetectionError(
      'Canvas-Element nicht verfügbar für Kartenerkennung',
      CardDetectionErrorType.INVALID_INPUT
    );
  }
  
  const context = canvas.getContext('2d', { willReadFrequently: true });
  
  if (!context) {
    throw new CardDetectionError(
      'Canvas-Kontext konnte nicht erstellt werden',
      CardDetectionErrorType.CONTEXT_ERROR
    );
  }
  
  return context;
};

/**
 * Validates the video input for card detection
 * 
 * @param {HTMLVideoElement} video - Video element to validate
 * @throws {CardDetectionError} When video input is invalid
 */
const validateVideoInput = (video: HTMLVideoElement): void => {
  if (!video) {
    throw new CardDetectionError(
      'Video-Element nicht verfügbar für Kartenerkennung',
      CardDetectionErrorType.INVALID_INPUT
    );
  }
  
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    throw new CardDetectionError(
      'Video-Stream hat keine gültige Größe. Überprüfe, ob die Kamera richtig funktioniert.',
      CardDetectionErrorType.INVALID_INPUT
    );
  }
};

/**
 * Checks if there's a Pokemon card in the current video frame
 * Uses simple brightness and edge contrast detection algorithm
 * 
 * @param {HTMLVideoElement} video - The video element containing the camera feed
 * @param {HTMLCanvasElement} canvas - Canvas element for image processing
 * @returns {boolean} True if a card is detected, false otherwise
 * @throws {CardDetectionError} When detection fails due to invalid input or processing errors
 */
export const detectCardInFrame = (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): boolean => {
  try {
    // Validate inputs
    validateVideoInput(video);
    const context = getContextSafely(canvas);
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Check if there's a significant object in frame
    try {
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Calculate average brightness in center area
      const centerWidth = canvas.width * 0.6;
      const centerHeight = canvas.height * 0.6;
      const startX = (canvas.width - centerWidth) / 2;
      const startY = (canvas.height - centerHeight) / 2;
      
      let totalBrightness = 0;
      let pixelCount = 0;
      
      // Sample pixels at intervals to save processing time
      for (let y = startY; y < startY + centerHeight; y += 10) {
        for (let x = startX; x < startX + centerWidth; x += 10) {
          const i = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
          if (i >= 0 && i < data.length) {
            const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
            totalBrightness += brightness;
            pixelCount++;
          }
        }
      }
      
      if (pixelCount === 0) {
        console.warn('Keine Pixel wurden für die Analyse gesammelt');
        return false;
      }
      
      const avgBrightness = totalBrightness / pixelCount;
      
      // Check edge contrast (cards typically have high edge contrast)
      let edgeContrast = 0;
      let edgeCount = 0;
      
      for (let y = startY; y < startY + centerHeight; y += 20) {
        for (let x = startX; x < startX + centerWidth - 10; x += 20) {
          const i1 = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
          const i2 = (Math.floor(y) * canvas.width + Math.floor(x + 10)) * 4;
          
          if (i1 >= 0 && i1 < data.length && i2 >= 0 && i2 < data.length) {
            const b1 = (data[i1] + data[i1+1] + data[i1+2]) / 3;
            const b2 = (data[i2] + data[i2+1] + data[i2+2]) / 3;
            
            edgeContrast += Math.abs(b1 - b2);
            edgeCount++;
          }
        }
      }
      
      if (edgeCount === 0) {
        console.warn('Keine Kanten wurden für die Analyse gefunden');
        return false;
      }
      
      edgeContrast /= edgeCount;
      
      console.log('Detection metrics:', { avgBrightness, edgeContrast });
      
      // Detect card based on brightness and edge contrast
      // Values determined through testing - would need to be calibrated
      if (avgBrightness > 50 && edgeContrast > 15) {
        console.log('Karte erkannt');
        return true;
      }
    } catch (e) {
      console.error('Fehler bei der Bildverarbeitung für die Kartenerkennung:', e);
      throw new CardDetectionError(
        'Fehler bei der Bildverarbeitung für die Kartenerkennung',
        CardDetectionErrorType.PROCESSING_ERROR
      );
    }
  } catch (error) {
    // If it's already a CardDetectionError, propagate it
    if (error instanceof CardDetectionError) {
      throw error;
    }
    
    // Otherwise, wrap it in a CardDetectionError
    console.error('Fehler bei der Kartenerkennung:', error);
    throw new CardDetectionError(
      'Ein unerwarteter Fehler ist bei der Kartenerkennung aufgetreten',
      CardDetectionErrorType.PROCESSING_ERROR
    );
  }
  
  return false;
};

/**
 * Captures a frame from the video element
 * Used to take a snapshot when a card is detected
 * 
 * @param {HTMLVideoElement} video - The video element containing the camera feed
 * @param {HTMLCanvasElement} canvas - Canvas element for capturing the frame
 * @returns {string|null} The image data URL in JPEG format, or null if capture fails
 * @throws {CardDetectionError} When frame capture fails
 */
export const captureVideoFrame = (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): string => {
  try {
    // Validate inputs
    validateVideoInput(video);
    const context = getContextSafely(canvas);
    
    // Set canvas dimensions to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the video frame on the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Save the image as Data URL
    const dataUrl = canvas.toDataURL('image/jpeg');
    
    if (!dataUrl || dataUrl === 'data:,') {
      throw new CardDetectionError(
        'Bild konnte nicht erfasst werden. Das erfasste Bild ist leer.',
        CardDetectionErrorType.PROCESSING_ERROR
      );
    }
    
    return dataUrl;
  } catch (error) {
    // If it's already a CardDetectionError, propagate it
    if (error instanceof CardDetectionError) {
      throw error;
    }
    
    // Otherwise, wrap it in a CardDetectionError
    console.error('Fehler bei der Bilderfassung:', error);
    throw new CardDetectionError(
      'Ein unerwarteter Fehler ist bei der Bilderfassung aufgetreten',
      CardDetectionErrorType.PROCESSING_ERROR
    );
  }
};
