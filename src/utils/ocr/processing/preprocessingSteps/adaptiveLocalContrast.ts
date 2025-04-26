
/**
 * Apply adaptive local contrast enhancement specifically for text regions
 * This helps with small printed text on Pokémon cards
 */
export function adaptiveLocalContrast(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas.toDataURL('image/png');
  
  const width = canvas.width;
  const height = canvas.height;
  
  // Process the top 20% (card name area) and bottom 15% (set number area) with enhanced contrast
  const topRegionHeight = Math.round(height * 0.2);
  const bottomRegionHeight = Math.round(height * 0.15);
  
  // Process top region (card name)
  const topData = ctx.getImageData(0, 0, width, topRegionHeight);
  const enhancedTop = enhanceTextRegion(topData);
  ctx.putImageData(enhancedTop, 0, 0);
  
  // Process bottom region (set number)
  const bottomData = ctx.getImageData(0, height - bottomRegionHeight, width, bottomRegionHeight);
  const enhancedBottom = enhanceTextRegion(bottomData);
  ctx.putImageData(enhancedBottom, 0, height - bottomRegionHeight);
  
  return canvas.toDataURL('image/png', 1.0);
}

/**
 * Enhance text regions with specialized processing for card text
 */
function enhanceTextRegion(imageData: ImageData): ImageData {
  const data = imageData.data;
  
  // Apply specialized text enhancement
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Calculate grayscale value
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    
    // Apply more aggressive thresholding for text
    const threshold = 150; // Optimal for card text
    const newVal = gray < threshold ? 0 : 255;
    
    // Apply to all channels
    data[i] = data[i + 1] = data[i + 2] = newVal;
  }
  
  return imageData;
}
