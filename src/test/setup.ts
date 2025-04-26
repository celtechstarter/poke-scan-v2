
import '@testing-library/jest-dom';

// Mock canvas for testing
global.HTMLCanvasElement.prototype.getContext = function(
  contextId: "2d" | "bitmaprenderer" | "webgl" | "webgl2",
  options?: CanvasRenderingContext2DSettings | ImageBitmapRenderingContextSettings | WebGLContextAttributes
): CanvasRenderingContext2D | ImageBitmapRenderingContext | WebGLRenderingContext | WebGL2RenderingContext | null {
  // We only implement the '2d' context for testing, all others return null
  if (contextId === '2d') {
    return {
      // Explicitly type the '2d' context with all required properties
      willReadFrequently: true,
      canvas: this,
      getImageData: () => ({
        data: new Uint8ClampedArray(100 * 100 * 4),
        width: 100,
        height: 100
      }),
      putImageData: () => {},
      drawImage: () => {},
      fillRect: () => {},
      fillStyle: '',
      
      // Add more required CanvasRenderingContext2D properties
      globalAlpha: 1.0,
      globalCompositeOperation: 'source-over',
      
      // Explicitly type to match CanvasRenderingContext2D
      getContextAttributes: () => ({ alpha: true }),
      
    } as CanvasRenderingContext2D;
  }
  
  // For other context types, return null as per the spec
  return null;
};
