
import '@testing-library/jest-dom';

// Mock canvas for testing
global.HTMLCanvasElement.prototype.getContext = function(
  contextId: "2d" | "bitmaprenderer" | "webgl" | "webgl2",
  _options?: any
): CanvasRenderingContext2D | ImageBitmapRenderingContext | WebGLRenderingContext | WebGL2RenderingContext | null {
  // We only implement the '2d' context for testing, all others return null
  if (contextId === '2d') {
    // First cast to unknown to avoid type errors, then to the expected type
    return {
      willReadFrequently: true,
      getImageData: () => ({
        data: new Uint8ClampedArray(100 * 100 * 4),
      }),
      putImageData: () => {},
      drawImage: () => {},
      fillRect: () => {},
      fillStyle: '',
      // Add other required properties to satisfy CanvasRenderingContext2D interface
      canvas: this,
      getContextAttributes: () => ({ alpha: true }),
      globalAlpha: 1.0,
      globalCompositeOperation: 'source-over',
      // The rest of the context is provided implicitly
    } as unknown as CanvasRenderingContext2D;
  }
  
  // For other context types, return null as per the spec
  return null;
};
