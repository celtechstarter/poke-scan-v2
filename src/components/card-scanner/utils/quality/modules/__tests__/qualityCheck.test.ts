
import { describe, it, expect, beforeEach } from 'vitest';
import { checkImageQuality } from '../qualityCheck';

describe('checkImageQuality', () => {
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let imageData: Uint8ClampedArray;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  });

  it('should detect poor lighting in dark images', () => {
    // Create a dark image
    ctx.fillStyle = 'rgb(20, 20, 20)';
    ctx.fillRect(0, 0, 100, 100);
    imageData = ctx.getImageData(0, 0, 100, 100).data;
    
    const result = checkImageQuality(canvas, imageData);
    
    expect(result.poorLighting).toBe(true);
    expect(result.message).toContain('Lichtverhältnisse');
  });

  it('should detect poor lighting in bright images', () => {
    // Create an overexposed image
    ctx.fillStyle = 'rgb(240, 240, 240)';
    ctx.fillRect(0, 0, 100, 100);
    imageData = ctx.getImageData(0, 0, 100, 100).data;
    
    const result = checkImageQuality(canvas, imageData);
    
    expect(result.poorLighting).toBe(true);
    expect(result.message).toContain('Lichtverhältnisse');
  });

  it('should detect blurry images', () => {
    // Create a low contrast image (simulating blur)
    ctx.fillStyle = 'rgb(128, 128, 128)';
    ctx.fillRect(0, 0, 100, 100);
    // Add some slight variations to simulate a blurry image
    ctx.fillStyle = 'rgb(130, 130, 130)';
    ctx.fillRect(20, 20, 60, 60);
    imageData = ctx.getImageData(0, 0, 100, 100).data;
    
    const result = checkImageQuality(canvas, imageData);
    
    expect(result.isBlurry).toBe(true);
    expect(result.message).toContain('unscharf');
  });

  it('should return null message for good quality images', () => {
    // Create a clear, well-lit image with good contrast
    ctx.fillStyle = 'rgb(255, 255, 255)';
    ctx.fillRect(0, 0, 100, 100);
    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.fillRect(20, 20, 60, 60);
    imageData = ctx.getImageData(0, 0, 100, 100).data;
    
    const result = checkImageQuality(canvas, imageData);
    
    expect(result.isBlurry).toBe(false);
    expect(result.poorLighting).toBe(false);
    expect(result.message).toBeNull();
  });
});
