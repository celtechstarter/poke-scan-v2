
/**
 * Check image for blur and lighting issues
 */
export function checkImageQuality(
  canvas: HTMLCanvasElement,
  data: Uint8ClampedArray
): { isBlurry: boolean; poorLighting: boolean; message: string | null } {
  const width = canvas.width;
  const height = canvas.height;
  
  const regions = [
    { name: 'cardName', top: 5, left: 20, width: 60, height: 10 },
    { name: 'cardNumber', top: 88, left: 5, width: 30, height: 10 }
  ];
  
  let totalEdgeStrength = 0;
  let totalBrightness = 0;
  let totalPixels = 0;
  
  for (const region of regions) {
    const startX = Math.floor(canvas.width * (region.left / 100));
    const startY = Math.floor(canvas.height * (region.top / 100));
    const endX = startX + Math.floor(canvas.width * (region.width / 100));
    const endY = startY + Math.floor(canvas.height * (region.height / 100));
    const regionPixels = (endX - startX) * (endY - startY);
    
    let regionEdgeStrength = 0;
    let regionBrightness = 0;
    
    for (let y = startY + 1; y < endY - 1; y += 2) {
      for (let x = startX + 1; x < endX - 1; x += 2) {
        const pixel = (y * width + x) * 4;
        const pixelLeft = (y * width + (x - 1)) * 4;
        const pixelRight = (y * width + (x + 1)) * 4;
        const pixelUp = ((y - 1) * width + x) * 4;
        const pixelDown = ((y + 1) * width + x) * 4;
        
        const edgeH = Math.abs(data[pixelLeft] - data[pixelRight]);
        const edgeV = Math.abs(data[pixelUp] - data[pixelDown]);
        const edgeStrength = Math.max(edgeH, edgeV);
        
        const brightness = (data[pixel] + data[pixel + 1] + data[pixel + 2]) / 3;
        
        regionEdgeStrength += edgeStrength;
        regionBrightness += brightness;
      }
    }
    
    const samplingFactor = 4;
    if (regionPixels > 0) {
      regionEdgeStrength = (regionEdgeStrength * samplingFactor) / regionPixels;
      regionBrightness = (regionBrightness * samplingFactor) / regionPixels;
      
      totalEdgeStrength += regionEdgeStrength;
      totalBrightness += regionBrightness;
      totalPixels += regionPixels;
    }
  }
  
  const avgEdgeStrength = regions.length > 0 ? totalEdgeStrength / regions.length : 0;
  const avgBrightness = totalPixels > 0 ? totalBrightness / totalPixels : 0;
  
  const isBlurry = avgEdgeStrength < 12;
  const poorLighting = avgBrightness < 50 || avgBrightness > 210;
  
  let message = null;
  if (isBlurry && poorLighting) {
    message = "Bild ist unscharf und hat schlechte Lichtverhältnisse";
  } else if (isBlurry) {
    message = "Bild ist unscharf, bitte halte die Kamera still";
  } else if (poorLighting) {
    message = "Schlechte Lichtverhältnisse, bitte für bessere Beleuchtung sorgen";
  }
  
  return { isBlurry, poorLighting, message };
}
