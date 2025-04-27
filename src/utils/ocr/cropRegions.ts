
import { createCanvasWithContext2D } from '@/utils/canvas/safeCanvasContext';

interface CroppedRegions {
  full: string;
  titleArea: string;
  setNumberArea: string;
}

/**
 * Crops a Pokémon card image into specific regions for targeted OCR processing
 * 
 * @param base64Image Base64-encoded image
 * @returns Promise resolving to an object with three Base64 images: full, titleArea, setNumberArea
 */
export async function cropRegions(base64Image: string): Promise<CroppedRegions> {
  return new Promise((resolve, reject) => {
    console.log('Starting image region cropping...');
    
    const img = new Image();
    img.onload = () => {
      try {
        console.log('Image loaded for cropping, dimensions:', img.width, 'x', img.height);
        
        // Calculate optimal region dimensions
        const titleHeight = Math.floor(img.height * 0.2);  // Top 20%
        const setNumberHeight = Math.floor(img.height * 0.15);  // Bottom 15%
        const setNumberY = img.height - setNumberHeight;
        
        // Create canvas for full image
        const { canvas: fullCanvas, ctx: fullCtx } = createCanvasWithContext2D(
          img.width, img.height, { willReadFrequently: true }
        );
        fullCtx.drawImage(img, 0, 0);
        const fullImageBase64 = fullCanvas.toDataURL('image/jpeg', 0.9);
        
        // Create canvas for title area
        const { canvas: titleCanvas, ctx: titleCtx } = createCanvasWithContext2D(
          img.width, titleHeight, { willReadFrequently: true }
        );
        titleCtx.drawImage(img, 0, 0, img.width, titleHeight, 0, 0, img.width, titleHeight);
        const titleAreaBase64 = titleCanvas.toDataURL('image/jpeg', 0.9);
        
        // Create canvas for set number area
        const { canvas: setNumberCanvas, ctx: setNumberCtx } = createCanvasWithContext2D(
          img.width, setNumberHeight, { willReadFrequently: true }
        );
        setNumberCtx.drawImage(img, 0, setNumberY, img.width, setNumberHeight, 0, 0, img.width, setNumberHeight);
        const setNumberAreaBase64 = setNumberCanvas.toDataURL('image/jpeg', 0.9);
        
        console.log('Image regions cropped successfully');
        
        resolve({
          full: fullImageBase64,
          titleArea: titleAreaBase64,
          setNumberArea: setNumberAreaBase64
        });
      } catch (error) {
        console.error('Image cropping failed:', error);
        reject(error);
      }
    };
    
    img.onerror = () => {
      console.error('Failed to load image for cropping');
      reject(new Error('Failed to load image for cropping'));
    };
    
    img.src = base64Image;
  });
}
