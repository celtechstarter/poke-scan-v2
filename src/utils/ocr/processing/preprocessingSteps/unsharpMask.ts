
/**
 * Apply unsharp mask filter to enhance small text on cards
 * @param imageData Original image data
 * @param radius Radius for the unsharp mask
 * @param strength Strength of the effect (1.0-3.0)
 * @returns Enhanced image data
 */
export function applyUnsharpMask(imageData: ImageData, radius: number, strength: number): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  
  // Create a copy for the blurred version
  const blurred = new Uint8ClampedArray(data.length);
  
  // Simple box blur implementation
  const boxSize = Math.floor(radius * 2) + 1;
  const halfBox = Math.floor(boxSize / 2);
  
  // Apply horizontal blur
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;
      let count = 0;
      
      for (let i = -halfBox; i <= halfBox; i++) {
        const curX = Math.min(Math.max(x + i, 0), width - 1);
        const idx = (y * width + curX) * 4;
        r += data[idx];
        g += data[idx + 1];
        b += data[idx + 2];
        count++;
      }
      
      const idx = (y * width + x) * 4;
      blurred[idx] = r / count;
      blurred[idx + 1] = g / count;
      blurred[idx + 2] = b / count;
      blurred[idx + 3] = data[idx + 3];
    }
  }
  
  // Apply vertical blur
  const finalBlur = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;
      let count = 0;
      
      for (let j = -halfBox; j <= halfBox; j++) {
        const curY = Math.min(Math.max(y + j, 0), height - 1);
        const idx = (curY * width + x) * 4;
        r += blurred[idx];
        g += blurred[idx + 1];
        b += blurred[idx + 2];
        count++;
      }
      
      const idx = (y * width + x) * 4;
      finalBlur[idx] = r / count;
      finalBlur[idx + 1] = g / count;
      finalBlur[idx + 2] = b / count;
      finalBlur[idx + 3] = data[idx + 3];
    }
  }
  
  // Apply unsharp mask: original + (original - blurred) * strength
  const result = new ImageData(new Uint8ClampedArray(data.length), width, height);
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const val = data[i + c] + (data[i + c] - finalBlur[i + c]) * strength;
      result.data[i + c] = Math.max(0, Math.min(255, val));
    }
    result.data[i + 3] = data[i + 3];
  }
  
  return result;
}
