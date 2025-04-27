
/**
 * Loads an image from a data URL and returns a promise that resolves with the loaded image
 */
export function loadImage(imageDataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for region extraction'));
    
    img.src = imageDataUrl;
  });
}
