
import '@testing-library/jest-dom';

// Mock canvas for testing
const originalGetContext = HTMLCanvasElement.prototype.getContext;

// Override the getContext method to properly type and only mock 2D context
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: function(
    contextId: string,
    options?: any
  ): CanvasRenderingContext2D | ImageBitmapRenderingContext | WebGLRenderingContext | WebGL2RenderingContext | null {
    // Only mock the 2D context
    if (contextId === '2d') {
      // Return a mock 2D context with required methods
      return {
        // Required minimum properties for our tests
        willReadFrequently: options?.willReadFrequently || false,
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
        imageSmoothingQuality: 'low' as CanvasImageSmoothingQuality,
        lineCap: 'butt' as CanvasLineCap,
        lineDashOffset: 0,
        lineJoin: 'miter' as CanvasLineJoin,
        lineWidth: 1,
        miterLimit: 10,
        shadowBlur: 0,
        shadowColor: 'rgba(0,0,0,0)',
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        textAlign: 'start' as CanvasTextAlign,
        textBaseline: 'alphabetic' as CanvasTextBaseline,
        direction: 'ltr' as CanvasDirection,
        fontKerning: 'auto' as CanvasFontKerning,
        fontStretch: 'normal' as CanvasFontStretch,
        fontVariantCaps: 'normal' as CanvasFontVariantCaps,
        letterSpacing: '0px',
        textRendering: 'auto',
        wordSpacing: '0px',
        font: '10px sans-serif'
      } as unknown as CanvasRenderingContext2D;
    }
    
    // For all other context types, return null
    return null;
  }
});
