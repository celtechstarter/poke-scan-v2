
import { OcrRegion } from '../types';

/**
 * Interface for card edge points
 */
interface Point {
  x: number;
  y: number;
}

interface CardEdges {
  topLeft: Point;
  topRight: Point;
  bottomRight: Point;
  bottomLeft: Point;
}

/**
 * Extracts and enhances a specific region from a card image
 * Enhanced with tighter cropping and perspective correction
 */
export const extractRegion = async (
  imageDataUrl: string, 
  region: OcrRegion,
  cardEdges?: CardEdges | null
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not create canvas context'));
          return;
        }
        
        if (cardEdges) {
          // Use the detected card edges for precise cropping
          const extractedImage = extractUsingCardEdges(img, region, cardEdges, ctx);
          resolve(extractedImage);
          return;
        }
        
        // Fallback to the original method if no card edges detected
        // Calculate region dimensions with a small inward padding to avoid capturing frame edges
        const padding = 2; // Base padding in pixels
        const inwardPaddingFactor = 0.95; // Take 95% of the region to avoid edge artifacts
        
        // Calculate the region with adjusted inward padding
        const regionWidth = Math.floor(img.width * (region.width / 100) * inwardPaddingFactor);
        const regionHeight = Math.floor(img.height * (region.height / 100) * inwardPaddingFactor);
        
        // Center the smaller region within the original coordinates
        const widthDifference = Math.floor(img.width * (region.width / 100)) - regionWidth;
        const heightDifference = Math.floor(img.height * (region.height / 100)) - regionHeight;
        
        const x = Math.floor(img.width * (region.left / 100)) + Math.floor(widthDifference / 2);
        const y = Math.floor(img.height * (region.top / 100)) + Math.floor(heightDifference / 2);
        
        // Set canvas size with padding for clean edges
        canvas.width = regionWidth + (padding * 2);
        canvas.height = regionHeight + (padding * 2);
        
        // Fill with white background first to ensure clean edges
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw only the precise region
        ctx.drawImage(
          img,
          Math.max(0, x - padding), 
          Math.max(0, y - padding), 
          regionWidth + (padding * 2), 
          regionHeight + (padding * 2),
          0, 0, canvas.width, canvas.height
        );
        
        // Apply region-specific enhancements
        if (region.name === 'cardNumber') {
          enhanceCardNumber(canvas, ctx);
        } else if (region.name === 'cardName') {
          enhanceCardName(canvas, ctx);
        }
        
        // Verify the quality of the cropped region
        const isValidRegion = verifyRegionQuality(canvas, ctx);
        
        if (!isValidRegion && (region.name === 'cardName' || region.name === 'cardNumber')) {
          // For critical regions, reject if quality check fails
          reject(new Error('Poor quality region detected. Please ensure the card is centered and well-lit.'));
          return;
        }
        
        resolve(canvas.toDataURL('image/png', 1.0));
      } catch (error) {
        console.error('Error during region extraction:', error);
        reject(new Error(`Failed to extract region: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for region extraction'));
    };
    
    img.src = imageDataUrl;
  });
};

/**
 * Extract region using detected card edges with perspective correction
 */
function extractUsingCardEdges(
  img: HTMLImageElement,
  region: OcrRegion,
  cardEdges: CardEdges,
  ctx: CanvasRenderingContext2D
): string {
  console.log('Extracting region using detected card edges:', region.name);
  
  // Use card edges to calculate the actual card dimensions
  const cardWidth = Math.max(
    distance(cardEdges.topLeft, cardEdges.topRight),
    distance(cardEdges.bottomLeft, cardEdges.bottomRight)
  );
  
  const cardHeight = Math.max(
    distance(cardEdges.topLeft, cardEdges.bottomLeft),
    distance(cardEdges.topRight, cardEdges.bottomRight)
  );
  
  // Create a new canvas for the perspective-corrected card
  const correctedCardCanvas = document.createElement('canvas');
  const correctedCardCtx = correctedCardCanvas.getContext('2d');
  
  if (!correctedCardCtx) {
    throw new Error('Could not create corrected card canvas context');
  }
  
  // Set standard dimensions for the corrected card
  const standardWidth = 350; // Standard width for a corrected card
  const standardHeight = 500; // Standard height for a corrected card (maintains Pokemon card aspect ratio)
  
  correctedCardCanvas.width = standardWidth;
  correctedCardCanvas.height = standardHeight;
  
  // Fill with white background
  correctedCardCtx.fillStyle = 'white';
  correctedCardCtx.fillRect(0, 0, standardWidth, standardHeight);
  
  // Perspective transformation
  correctPerspective(img, correctedCardCanvas, correctedCardCtx, cardEdges);
  
  // Now extract the specific region from the perspective-corrected card
  const regionCanvas = document.createElement('canvas');
  const regionCtx = regionCanvas.getContext('2d');
  
  if (!regionCtx) {
    throw new Error('Could not create region canvas context');
  }
  
  // Calculate region position on the corrected card
  const regionX = standardWidth * (region.left / 100);
  const regionY = standardHeight * (region.top / 100);
  const regionWidth = standardWidth * (region.width / 100);
  const regionHeight = standardHeight * (region.height / 100);
  
  // Add small padding to avoid edge issues
  const padding = 4;
  regionCanvas.width = regionWidth + (padding * 2);
  regionCanvas.height = regionHeight + (padding * 2);
  
  // Fill with white background
  regionCtx.fillStyle = 'white';
  regionCtx.fillRect(0, 0, regionCanvas.width, regionCanvas.height);
  
  // Draw the region from the corrected card
  regionCtx.drawImage(
    correctedCardCanvas,
    regionX - padding,
    regionY - padding,
    regionWidth + (padding * 2),
    regionHeight + (padding * 2),
    0, 0, regionCanvas.width, regionCanvas.height
  );
  
  // Apply region-specific enhancements
  if (region.name === 'cardNumber') {
    enhanceCardNumber(regionCanvas, regionCtx);
  } else if (region.name === 'cardName') {
    enhanceCardName(regionCanvas, regionCtx);
  }
  
  return regionCanvas.toDataURL('image/png', 1.0);
}

/**
 * Apply perspective correction based on detected card corners
 */
function correctPerspective(
  img: HTMLImageElement,
  outputCanvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  cardEdges: CardEdges
): void {
  // Define source points (detected card corners)
  const srcPoints = [
    cardEdges.topLeft,
    cardEdges.topRight,
    cardEdges.bottomRight,
    cardEdges.bottomLeft
  ];
  
  // Define destination points (rectangle corners)
  const width = outputCanvas.width;
  const height = outputCanvas.height;
  
  const dstPoints = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height }
  ];
  
  // Simple perspective transformation
  // Note: This is a simplified approximation that works for moderate perspective distortion
  // For severe distortion, more complex webgl-based transforms would be needed
  const transform = computePerspectiveTransform(srcPoints, dstPoints);
  
  // Apply transform by manually mapping each pixel
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);
  
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  
  if (!tempCtx) {
    throw new Error('Could not create temporary canvas context');
  }
  
  tempCanvas.width = img.width;
  tempCanvas.height = img.height;
  tempCtx.drawImage(img, 0, 0);
  
  const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
  const outputImgData = ctx.createImageData(width, height);
  
  // For each point in the destination, find the corresponding source point
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Apply inverse transform to get source coordinate
      const src = applyTransform(transform, x, y);
      
      // Check if source point is within bounds
      if (
        src.x >= 0 && src.x < img.width - 1 &&
        src.y >= 0 && src.y < img.height - 1
      ) {
        // Bilinear interpolation for smoother result
        const x1 = Math.floor(src.x);
        const y1 = Math.floor(src.y);
        const x2 = Math.ceil(src.x);
        const y2 = Math.ceil(src.y);
        
        const dx = src.x - x1;
        const dy = src.y - y1;
        
        const idx = (y * width + x) * 4;
        
        // Get colors of the four surrounding pixels
        const c11 = getPixel(imgData, x1, y1);
        const c21 = getPixel(imgData, x2, y1);
        const c12 = getPixel(imgData, x1, y2);
        const c22 = getPixel(imgData, x2, y2);
        
        // Bilinear interpolation for each color channel
        for (let i = 0; i < 3; i++) {
          const top = c11[i] * (1 - dx) + c21[i] * dx;
          const bottom = c12[i] * (1 - dx) + c22[i] * dx;
          outputImgData.data[idx + i] = Math.round(top * (1 - dy) + bottom * dy);
        }
        
        outputImgData.data[idx + 3] = 255; // Alpha channel
      } else {
        // Use white for out-of-bounds pixels
        const idx = (y * width + x) * 4;
        outputImgData.data[idx] = 255;
        outputImgData.data[idx + 1] = 255;
        outputImgData.data[idx + 2] = 255;
        outputImgData.data[idx + 3] = 255;
      }
    }
  }
  
  ctx.putImageData(outputImgData, 0, 0);
}

/**
 * Get a pixel color from ImageData
 */
function getPixel(imgData: ImageData, x: number, y: number): [number, number, number, number] {
  const idx = (y * imgData.width + x) * 4;
  return [
    imgData.data[idx],
    imgData.data[idx + 1],
    imgData.data[idx + 2],
    imgData.data[idx + 3]
  ];
}

/**
 * Compute perspective transformation matrix
 * This is a simplified implementation suitable for moderate distortion
 */
function computePerspectiveTransform(src: Point[], dst: Point[]): number[] {
  // This is a simplified perspective transform calculation
  // It works well for moderate perspective distortion
  
  // Find the coefficients for the transformation
  const a = [
    [src[0].x, src[0].y, 1, 0, 0, 0, -dst[0].x * src[0].x, -dst[0].x * src[0].y],
    [0, 0, 0, src[0].x, src[0].y, 1, -dst[0].y * src[0].x, -dst[0].y * src[0].y],
    [src[1].x, src[1].y, 1, 0, 0, 0, -dst[1].x * src[1].x, -dst[1].x * src[1].y],
    [0, 0, 0, src[1].x, src[1].y, 1, -dst[1].y * src[1].x, -dst[1].y * src[1].y],
    [src[2].x, src[2].y, 1, 0, 0, 0, -dst[2].x * src[2].x, -dst[2].x * src[2].y],
    [0, 0, 0, src[2].x, src[2].y, 1, -dst[2].y * src[2].x, -dst[2].y * src[2].y],
    [src[3].x, src[3].y, 1, 0, 0, 0, -dst[3].x * src[3].x, -dst[3].x * src[3].y],
    [0, 0, 0, src[3].x, src[3].y, 1, -dst[3].y * src[3].x, -dst[3].y * src[3].y]
  ];
  
  const b = [
    dst[0].x,
    dst[0].y,
    dst[1].x,
    dst[1].y,
    dst[2].x,
    dst[2].y,
    dst[3].x,
    dst[3].y
  ];
  
  // Solve the system of equations using Gaussian elimination
  const h = gaussianElimination(a, b);
  h.push(1.0); // Add the last coefficient
  
  return h;
}

/**
 * Apply transformation to a point
 */
function applyTransform(transform: number[], x: number, y: number): Point {
  // Apply perspective transform (inverse mapping)
  const w = transform[6] * x + transform[7] * y + transform[8];
  const srcX = (transform[0] * x + transform[1] * y + transform[2]) / w;
  const srcY = (transform[3] * x + transform[4] * y + transform[5]) / w;
  
  return { x: srcX, y: srcY };
}

/**
 * Simple Gaussian elimination to solve a system of linear equations
 */
function gaussianElimination(a: number[][], b: number[]): number[] {
  const n = a.length;
  
  // Forward elimination
  for (let i = 0; i < n; i++) {
    // Search for maximum in this column
    let maxRow = i;
    let maxVal = Math.abs(a[i][i]);
    
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(a[k][i]) > maxVal) {
        maxVal = Math.abs(a[k][i]);
        maxRow = k;
      }
    }
    
    // Swap maximum row with current row
    if (maxRow !== i) {
      [a[i], a[maxRow]] = [a[maxRow], a[i]];
      [b[i], b[maxRow]] = [b[maxRow], b[i]];
    }
    
    // Make all rows below this one 0 in current column
    for (let k = i + 1; k < n; k++) {
      const c = -a[k][i] / a[i][i];
      for (let j = i; j < n; j++) {
        if (i === j) {
          a[k][j] = 0;
        } else {
          a[k][j] += c * a[i][j];
        }
      }
      b[k] += c * b[i];
    }
  }
  
  // Back substitution
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = b[i] / a[i][i];
    for (let k = i - 1; k >= 0; k--) {
      b[k] -= a[k][i] * x[i];
    }
  }
  
  return x;
}

/**
 * Enhance the card number region for better OCR
 */
function enhanceCardNumber(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Enhanced contrast and binarization specifically for card numbers
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const contrast = 3.0; // Higher contrast for better number recognition
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    const newValue = Math.min(255, Math.max(0, factor * (gray - 128) + 128));
    
    // Adaptive threshold based on the region type
    const threshold = 170; // Slightly higher threshold for numbers
    const finalValue = newValue > threshold ? 255 : 0;
    
    data[i] = finalValue;
    data[i + 1] = finalValue;
    data[i + 2] = finalValue;
  }
  
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Enhance the card name region for better OCR
 */
function enhanceCardName(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Different contrast settings for card names
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const contrast = 2.5; // Improved contrast for card names
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    const newValue = Math.min(255, Math.max(0, factor * (gray - 128) + 128));
    
    // Different threshold for card names
    const threshold = 160;
    const finalValue = newValue > threshold ? 255 : 0;
    
    data[i] = finalValue;
    data[i + 1] = finalValue;
    data[i + 2] = finalValue;
  }
  
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Calculate distance between two points
 */
function distance(point1: Point, point2: Point): number {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) + 
    Math.pow(point2.y - point1.y, 2)
  );
}

/**
 * Verifies if the extracted region meets quality standards
 */
function verifyRegionQuality(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): boolean {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Calculate white space percentage
  let whitePixels = 0;
  let totalPixels = canvas.width * canvas.height;
  
  // Sample pixels for efficiency
  for (let i = 0; i < data.length; i += 16) { // Check every 4th pixel
    // If pixel is very bright (close to white)
    if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
      whitePixels++;
    }
  }
  
  const whitePercentage = (whitePixels / (totalPixels / 4)) * 100;
  
  // Check edge contrast (cards should have some contrast on edges)
  let edgeContrast = 0;
  let edgeSamples = 0;
  
  // Sample from edges only
  for (let x = 0; x < canvas.width; x += 10) {
    for (let y of [0, canvas.height - 1]) {
      const i = (y * canvas.width + x) * 4;
      if (i >= 0 && i < data.length - 4) {
        const currentPixel = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const nextPixel = (data[i + 4] + data[i + 5] + data[i + 6]) / 3;
        edgeContrast += Math.abs(currentPixel - nextPixel);
        edgeSamples++;
      }
    }
  }
  
  for (let y = 0; y < canvas.height; y += 10) {
    for (let x of [0, canvas.width - 1]) {
      const i = (y * canvas.width + x) * 4;
      if (i >= 0 && i < data.length - 4) {
        const currentPixel = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const nextRow = ((y + 1) * canvas.width + x) * 4;
        if (nextRow < data.length) {
          const nextPixel = (data[nextRow] + data[nextRow + 1] + data[nextRow + 2]) / 3;
          edgeContrast += Math.abs(currentPixel - nextPixel);
          edgeSamples++;
        }
      }
    }
  }
  
  const avgEdgeContrast = edgeSamples > 0 ? edgeContrast / edgeSamples : 0;
  
  // A good card region shouldn't be too white (> 95%) and should have some edge contrast
  return whitePercentage < 95 && avgEdgeContrast > 5;
}
