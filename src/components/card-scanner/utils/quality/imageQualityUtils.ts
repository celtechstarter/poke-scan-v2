
import { toast } from '@/components/ui/use-toast';
import { CardScanningErrorType, ScannerError } from '../../types/scannerTypes';

// Enhanced card detection and quality assessment
export const assessImageQuality = async (imageDataUrl: string): Promise<{
  isBlurry: boolean;
  poorLighting: boolean;
  message: string | null;
  isCardVisible: boolean;
  cardEdges?: { topLeft: Point; topRight: Point; bottomRight: Point; bottomLeft: Point } | null;
}> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      if (!ctx) {
        resolve({ isBlurry: false, poorLighting: false, message: null, isCardVisible: false });
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Step 1: Detect if a card is properly visible in the image
      const { hasCardShape, cardEdges } = detectCardShape(canvas, ctx, data);
      
      // Step 2: Check image quality (blur and lighting)
      const { isBlurry, poorLighting, message } = checkImageQuality(canvas, data);
      
      resolve({ 
        isBlurry, 
        poorLighting, 
        message: hasCardShape ? message : "Keine Karte im Bild erkannt. Bitte zentriere die Karte im Rahmen", 
        isCardVisible: hasCardShape,
        cardEdges: hasCardShape ? cardEdges : null
      });
    };
    
    img.onerror = () => {
      resolve({ isBlurry: false, poorLighting: false, message: null, isCardVisible: false });
    };
    
    img.src = imageDataUrl;
  });
};

// Interface for points
interface Point {
  x: number;
  y: number;
}

/**
 * Detect edges and shape of a card in the image
 */
function detectCardShape(
  canvas: HTMLCanvasElement, 
  ctx: CanvasRenderingContext2D, 
  data: Uint8ClampedArray
): { hasCardShape: boolean; cardEdges: { topLeft: Point; topRight: Point; bottomRight: Point; bottomLeft: Point } | null } {
  const width = canvas.width;
  const height = canvas.height;
  
  // Find strong edges in the image
  const edges: Point[] = [];
  const edgeThreshold = 40; // Threshold for edge detection
  
  // Sample the image at regular intervals for efficiency
  const sampleStep = Math.max(1, Math.floor(width * height / 10000));
  
  for (let y = 1; y < height - 1; y += sampleStep) {
    for (let x = 1; x < width - 1; x += sampleStep) {
      const center = (y * width + x) * 4;
      const right = (y * width + (x + 1)) * 4;
      const below = ((y + 1) * width + x) * 4;
      
      // Calculate horizontal and vertical gradient
      const dx = Math.abs(data[right] - data[center]) + 
                 Math.abs(data[right + 1] - data[center + 1]) + 
                 Math.abs(data[right + 2] - data[center + 2]);
      
      const dy = Math.abs(data[below] - data[center]) + 
                 Math.abs(data[below + 1] - data[center + 1]) + 
                 Math.abs(data[below + 2] - data[center + 2]);
      
      const gradient = Math.sqrt(dx * dx + dy * dy);
      
      if (gradient > edgeThreshold) {
        edges.push({ x, y });
      }
    }
  }
  
  // Early check: If very few edges detected, there's likely no card
  if (edges.length < 10) {
    return { hasCardShape: false, cardEdges: null };
  }
  
  // Attempt to find the card rectangle based on the edge distribution
  let cardEdges = approximateCardRectangle(width, height, edges);
  
  // Check if the found edges form a plausible card shape
  const hasCardShape = validateCardShape(cardEdges, width, height);
  
  return { hasCardShape, cardEdges: hasCardShape ? cardEdges : null };
}

/**
 * Approximate a rectangle from detected edges
 */
function approximateCardRectangle(
  width: number, 
  height: number, 
  edges: Point[]
): { topLeft: Point; topRight: Point; bottomRight: Point; bottomLeft: Point } {
  // Simple approximation: find extremes
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  
  // Find the bounding box of all edge points
  for (const point of edges) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  
  // Add padding to avoid cutting the card too tightly
  // This creates a slightly smaller rectangle inside the actual card edges
  const paddingX = (maxX - minX) * 0.03;
  const paddingY = (maxY - minY) * 0.03;
  
  return {
    topLeft: { x: minX + paddingX, y: minY + paddingY },
    topRight: { x: maxX - paddingX, y: minY + paddingY },
    bottomRight: { x: maxX - paddingX, y: maxY - paddingY },
    bottomLeft: { x: minX + paddingX, y: maxY - paddingY }
  };
}

/**
 * Validate if the detected shape could plausibly be a card
 */
function validateCardShape(
  corners: { topLeft: Point; topRight: Point; bottomRight: Point; bottomLeft: Point },
  width: number,
  height: number
): boolean {
  // Calculate width and height of the detected rectangle
  const rectWidth = Math.max(
    distance(corners.topLeft, corners.topRight),
    distance(corners.bottomLeft, corners.bottomRight)
  );
  
  const rectHeight = Math.max(
    distance(corners.topLeft, corners.bottomLeft),
    distance(corners.topRight, corners.bottomRight)
  );
  
  // Cards should cover a significant portion of the frame but not too small
  const coverage = (rectWidth * rectHeight) / (width * height);
  
  // Check aspect ratio (Pokemon cards are roughly 2.5:3.5)
  const aspectRatio = rectWidth / rectHeight;
  const targetAspectRatio = 2.5 / 3.5;
  const aspectRatioTolerance = 0.3;
  
  const validAspectRatio = 
    Math.abs(aspectRatio - targetAspectRatio) < aspectRatioTolerance ||
    Math.abs(1/aspectRatio - targetAspectRatio) < aspectRatioTolerance; // In case the card is sideways
    
  // Minimum coverage for a valid card
  const validCoverage = coverage > 0.2 && coverage < 0.95;
  
  // Minimum size check
  const minDimension = Math.min(rectWidth, rectHeight);
  const validSize = minDimension > 50; // At least 50px
  
  return validAspectRatio && validCoverage && validSize;
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
 * Check image for blur and lighting issues
 */
function checkImageQuality(
  canvas: HTMLCanvasElement,
  data: Uint8ClampedArray
): { isBlurry: boolean; poorLighting: boolean; message: string | null } {
  const width = canvas.width;
  const height = canvas.height;
  
  // Define critical regions to check for image quality
  const regions = [
    { name: 'cardName', top: 5, left: 20, width: 60, height: 10 },
    { name: 'cardNumber', top: 88, left: 5, width: 30, height: 10 }
  ];
  
  let totalEdgeStrength = 0;
  let totalBrightness = 0;
  let totalPixels = 0;
  
  // Check each critical region specifically
  for (const region of regions) {
    const startX = Math.floor(canvas.width * (region.left / 100));
    const startY = Math.floor(canvas.height * (region.top / 100));
    const endX = startX + Math.floor(canvas.width * (region.width / 100));
    const endY = startY + Math.floor(canvas.height * (region.height / 100));
    const regionPixels = (endX - startX) * (endY - startY);
    
    let regionEdgeStrength = 0;
    let regionBrightness = 0;
    
    // Analyze edge strength and brightness in the region
    for (let y = startY + 1; y < endY - 1; y += 2) { // Sample every 2px for efficiency
      for (let x = startX + 1; x < endX - 1; x += 2) {
        const pixel = (y * width + x) * 4;
        const pixelLeft = (y * width + (x - 1)) * 4;
        const pixelRight = (y * width + (x + 1)) * 4;
        const pixelUp = ((y - 1) * width + x) * 4;
        const pixelDown = ((y + 1) * width + x) * 4;
        
        // Enhanced edge detection (both horizontal and vertical)
        const edgeH = Math.abs(data[pixelLeft] - data[pixelRight]);
        const edgeV = Math.abs(data[pixelUp] - data[pixelDown]);
        const edgeStrength = Math.max(edgeH, edgeV);
        
        // Calculate brightness 
        const brightness = (data[pixel] + data[pixel + 1] + data[pixel + 2]) / 3;
        
        regionEdgeStrength += edgeStrength;
        regionBrightness += brightness;
      }
    }
    
    // Normalize by region size and sampling rate
    const samplingFactor = 4; // Because we sample every 2px in both dimensions
    if (regionPixels > 0) {
      regionEdgeStrength = (regionEdgeStrength * samplingFactor) / regionPixels;
      regionBrightness = (regionBrightness * samplingFactor) / regionPixels;
      
      // Add to total values
      totalEdgeStrength += regionEdgeStrength;
      totalBrightness += regionBrightness;
      totalPixels += regionPixels;
    }
  }
  
  // Calculate averages
  const avgEdgeStrength = regions.length > 0 ? totalEdgeStrength / regions.length : 0;
  const avgBrightness = totalPixels > 0 ? totalBrightness / totalPixels : 0;
  
  // Determine quality issues with refined thresholds
  const isBlurry = avgEdgeStrength < 12; // Adjusted threshold based on testing
  const poorLighting = avgBrightness < 50 || avgBrightness > 210; // Refined lighting thresholds
  
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
