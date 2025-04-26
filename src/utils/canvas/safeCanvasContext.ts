
/**
 * Validates that a canvas context is a 2D context
 * @param ctx The context to validate
 * @returns True if the context is a valid 2D context
 */
function isValid2DContext(ctx: CanvasRenderingContext2D | null): ctx is CanvasRenderingContext2D {
  return ctx !== null && ctx instanceof CanvasRenderingContext2D;
}

/**
 * Gets a 2D context from a canvas element
 * @param canvas The canvas element
 * @param options Optional context settings
 * @returns The 2D context or null if creation fails
 */
function get2DContext(
  canvas: HTMLCanvasElement,
  options?: CanvasRenderingContext2DSettings
): CanvasRenderingContext2D | null {
  return canvas.getContext('2d', options);
}

/**
 * Creates a safe, type-checked 2D canvas context
 * @param canvas The canvas element to get the context from
 * @param options Optional context settings
 * @returns A guaranteed 2D canvas context or throws an error
 */
export function createSafeCanvasContext2D(
  canvas: HTMLCanvasElement,
  options?: CanvasRenderingContext2DSettings
): CanvasRenderingContext2D {
  const ctx = get2DContext(canvas, options);
  
  if (!isValid2DContext(ctx)) {
    throw new Error('Failed to create a 2D canvas context');
  }
  
  return ctx;
}

/**
 * Creates a canvas element with specified dimensions
 * @param width Canvas width (default: 300)
 * @param height Canvas height (default: 150)
 * @returns A new canvas element
 */
function createCanvas(width: number = 300, height: number = 150): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Helper function to safely create a canvas and its 2D context
 * @param width Optional canvas width (default: 300)
 * @param height Optional canvas height (default: 150)
 * @param options Optional context settings
 * @returns Object containing both the canvas and its guaranteed 2D context
 */
export function createCanvasWithContext2D(
  width: number = 300, 
  height: number = 150,
  options?: CanvasRenderingContext2DSettings
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = createCanvas(width, height);
  const ctx = createSafeCanvasContext2D(canvas, options);
  
  return { canvas, ctx };
}
