
import { Point } from '../../types/scannerTypes';

/**
 * Detect edges and shape of a card in the image
 */
export function detectCardShape(
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
  const rectWidth = Math.max(
    distance(corners.topLeft, corners.topRight),
    distance(corners.bottomLeft, corners.bottomRight)
  );
  
  const rectHeight = Math.max(
    distance(corners.topLeft, corners.bottomLeft),
    distance(corners.topRight, corners.bottomRight)
  );
  
  const coverage = (rectWidth * rectHeight) / (width * height);
  const aspectRatio = rectWidth / rectHeight;
  const targetAspectRatio = 2.5 / 3.5;
  const aspectRatioTolerance = 0.3;
  
  const validAspectRatio = 
    Math.abs(aspectRatio - targetAspectRatio) < aspectRatioTolerance ||
    Math.abs(1/aspectRatio - targetAspectRatio) < aspectRatioTolerance;
    
  const validCoverage = coverage > 0.2 && coverage < 0.95;
  const validSize = Math.min(rectWidth, rectHeight) > 50;
  
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
