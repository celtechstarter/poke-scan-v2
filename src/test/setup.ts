
import '@testing-library/jest-dom';

// Mock canvas for testing
const originalGetContext = HTMLCanvasElement.prototype.getContext;

// Create a type-safe mock for 2D context
HTMLCanvasElement.prototype.getContext = function(
  contextId: "2d" | "bitmaprenderer" | "webgl" | "webgl2",
  options?: CanvasRenderingContext2DSettings | ImageBitmapRenderingContextSettings | WebGLContextAttributes
): CanvasRenderingContext2D | ImageBitmapRenderingContext | WebGLRenderingContext | WebGL2RenderingContext | null {
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
      // Add missing properties required by TypeScript
      strokeStyle: '',
      createConicGradient: () => ({ addColorStop: () => {} }),
      filter: 'none',
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'low',
      lineCap: 'butt',
      lineDashOffset: 0,
      lineJoin: 'miter',
      lineWidth: 1,
      miterLimit: 10,
      shadowBlur: 0,
      shadowColor: 'rgba(0,0,0,0)',
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      textAlign: 'start',
      textBaseline: 'alphabetic',
      direction: 'ltr',
      fontKerning: 'auto',
      fontStretch: 'normal',
      fontVariantCaps: 'normal',
      letterSpacing: '0px',
      textRendering: 'auto',
      wordSpacing: '0px',
      font: '10px sans-serif'
    } as unknown as CanvasRenderingContext2D;
  }
  
  // For all other context types, return null
  return null;
};
