
interface ImageContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  imageData: ImageData;
}

export const createImageContext = (img: HTMLImageElement): ImageContext => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not create canvas context');
  }
  
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  
  return {
    canvas,
    ctx,
    imageData: ctx.getImageData(0, 0, canvas.width, canvas.height)
  };
};
