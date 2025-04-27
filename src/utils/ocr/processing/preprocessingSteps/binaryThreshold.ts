
/**
 * Apply binary thresholding to image for improved text readability
 * Converts pixels to either black or white based on threshold value
 * 
 * @param imageData Original image data
 * @param threshold Threshold value (0-255), defaults to 130
 * @returns Processed image data with binary thresholding applied
 */
export function applyBinaryThreshold(imageData: ImageData, threshold: number = 130): ImageData {
  console.log(`Applying binary threshold with value: ${threshold}`);
  
  const width = imageData.width;
  const height = imageData.height;
  const data = new Uint8ClampedArray(imageData.data);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      // Calculate grayscale value using luminance method
      const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      
      // Apply binary threshold
      const value = gray > threshold ? 255 : 0;
      
      // Set RGB channels to the same value (keep alpha unchanged)
      data[idx] = value;
      data[idx + 1] = value;
      data[idx + 2] = value;
      // Alpha channel remains unchanged: data[idx + 3]
    }
  }
  
  return new ImageData(data, width, height);
}
