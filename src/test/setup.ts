
import '@testing-library/jest-dom';

// Mock canvas if needed
global.HTMLCanvasElement.prototype.getContext = function() {
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
};
