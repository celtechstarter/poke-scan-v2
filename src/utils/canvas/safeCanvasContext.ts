
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
  const ctx = canvas.getContext('2d', options);
  
  if (!ctx || !(ctx instanceof CanvasRenderingContext2D)) {
    throw new Error('Failed to create a 2D canvas context');
  }
  
  return ctx;
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
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = createSafeCanvasContext2D(canvas, options);
  
  return { canvas, ctx };
}
