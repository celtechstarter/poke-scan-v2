
import '@testing-library/jest-dom';

// Mock canvas for testing
global.HTMLCanvasElement.prototype.getContext = function(
  contextId: "2d"
): CanvasRenderingContext2D | null {
  // We only implement the '2d' context for testing
  if (contextId === '2d') {
    return {
      // Required minimum properties for our tests
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
      globalAlpha: 1.0,
      globalCompositeOperation: 'source-over',
      getContextAttributes: () => ({ alpha: true }),
      // Additional required methods
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fill: () => {},
      clip: () => {},
      save: () => {},
      restore: () => {},
      scale: () => {},
      rotate: () => {},
      translate: () => {},
      transform: () => {},
      setTransform: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createPattern: () => null,
      clearRect: () => {},
      rect: () => {},
      strokeRect: () => {},
      isPointInPath: () => false,
      isPointInStroke: () => false,
      measureText: () => ({ width: 0 }),
      setLineDash: () => {},
      getLineDash: () => [],
      closePath: () => {},
      bezierCurveTo: () => {},
      quadraticCurveTo: () => {},
      arc: () => {},
      arcTo: () => {},
      ellipse: () => {},
      createImageData: () => ({ data: new Uint8ClampedArray(), width: 0, height: 0 }),
      createRadialGradient: () => ({ addColorStop: () => {} }),
      setLineDashOffset: () => {},
    } as CanvasRenderingContext2D;
  }
  return null;
};
