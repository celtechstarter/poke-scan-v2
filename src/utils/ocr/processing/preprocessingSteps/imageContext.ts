
interface ImageContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  imageData: ImageData;
}

export const createImageContext = (img: HTMLImageElement): ImageContext => {
  console.log('Creating image context...');
  
  if (img.width === 0 || img.height === 0) {
    console.error('Invalid image dimensions:', img.width, 'x', img.height);
    throw new Error('Invalid image dimensions');
  }
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    console.error('Failed to get 2D context');
    throw new Error('Could not create canvas context');
  }
  
  canvas.width = img.width;
  canvas.height = img.height;
  
  try {
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    console.log('Image context created successfully');
    
    return {
      canvas,
      ctx,
      imageData
    };
  } catch (error) {
    console.error('Error creating image context:', error);
    throw new Error('Failed to process image in context');
  }
};
