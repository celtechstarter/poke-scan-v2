
import { describe, it, expect, beforeEach } from 'vitest';
import { detectCardShape } from '../cardDetection';

describe('detectCardShape', () => {
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let imageData: Uint8ClampedArray;

  beforeEach(() => {
    // Set up canvas and context for each test
    canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    
    // Create a simple rectangle shape in the canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 100, 100);
    ctx.fillStyle = 'black';
    ctx.fillRect(20, 20, 60, 80); // Card-like rectangle
    
    const imageDataObj = ctx.getImageData(0, 0, 100, 100);
    imageData = imageDataObj.data;
  });

  it('should detect a card shape when present', () => {
    const result = detectCardShape(canvas, ctx, imageData);
    
    expect(result.hasCardShape).toBe(true);
    expect(result.cardEdges).toBeDefined();
  });

  it('should return no card shape when image is empty', () => {
    // Clear the canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 100, 100);
    const emptyImageData = ctx.getImageData(0, 0, 100, 100).data;
    
    const result = detectCardShape(canvas, ctx, emptyImageData);
    
    expect(result.hasCardShape).toBe(false);
    expect(result.cardEdges).toBeNull();
  });

  it('should return valid corner coordinates when card is detected', () => {
    const result = detectCardShape(canvas, ctx, imageData);
    
    if (result.cardEdges) {
      expect(result.cardEdges.topLeft).toHaveProperty('x');
      expect(result.cardEdges.topLeft).toHaveProperty('y');
      expect(result.cardEdges.topRight).toHaveProperty('x');
      expect(result.cardEdges.topRight).toHaveProperty('y');
      expect(result.cardEdges.bottomLeft).toHaveProperty('x');
      expect(result.cardEdges.bottomLeft).toHaveProperty('y');
      expect(result.cardEdges.bottomRight).toHaveProperty('x');
      expect(result.cardEdges.bottomRight).toHaveProperty('y');
    }
  });
});
