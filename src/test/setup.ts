
import '@testing-library/jest-dom';

// Mock canvas if needed
global.HTMLCanvasElement.prototype.getContext = () => {
  return {
    willReadFrequently: true,
    getImageData: () => ({
      data: new Uint8ClampedArray(100 * 100 * 4),
    }),
    putImageData: () => {},
    drawImage: () => {},
    fillRect: () => {},
    fillStyle: '',
  } as CanvasRenderingContext2D;
};
