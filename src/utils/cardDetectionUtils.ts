
// Utility functions for detecting cards in video frames

/**
 * Checks if there's a Pokemon card in the current video frame
 * Uses simple brightness and edge contrast detection
 */
export const detectCardInFrame = (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): boolean => {
  if (!video || !canvas) return false;
  
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return false;
  
  // Set canvas dimensions to match video
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  // Draw video frame to canvas
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // Simple detection: check if there's a significant object in frame
  try {
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Calculate average brightness in center area
    const centerWidth = canvas.width * 0.6;
    const centerHeight = canvas.height * 0.6;
    const startX = (canvas.width - centerWidth) / 2;
    const startY = (canvas.height - centerHeight) / 2;
    
    let totalBrightness = 0;
    let pixelCount = 0;
    
    for (let y = startY; y < startY + centerHeight; y += 10) {
      for (let x = startX; x < startX + centerWidth; x += 10) {
        const i = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
        const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
        totalBrightness += brightness;
        pixelCount++;
      }
    }
    
    const avgBrightness = totalBrightness / pixelCount;
    
    // Check edge contrast (cards typically have high edge contrast)
    let edgeContrast = 0;
    for (let y = startY; y < startY + centerHeight; y += 20) {
      for (let x = startX; x < startX + centerWidth - 10; x += 20) {
        const i1 = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
        const i2 = (Math.floor(y) * canvas.width + Math.floor(x + 10)) * 4;
        
        const b1 = (data[i1] + data[i1+1] + data[i1+2]) / 3;
        const b2 = (data[i2] + data[i2+1] + data[i2+2]) / 3;
        
        edgeContrast += Math.abs(b1 - b2);
      }
    }
    
    edgeContrast /= (centerHeight * centerWidth / 400);
    
    console.log('Detection metrics:', { avgBrightness, edgeContrast });
    
    // Detect card based on brightness and edge contrast
    // Values determined through testing - would need to be calibrated
    if (avgBrightness > 50 && edgeContrast > 15) {
      console.log('Karte erkannt');
      return true;
    }
  } catch (e) {
    console.error('Fehler bei der Kartenerkennung:', e);
  }
  
  return false;
};

/**
 * Captures a frame from the video element
 * Returns the image data URL
 */
export const captureVideoFrame = (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): string | null => {
  if (!video || !canvas) return null;
  
  const context = canvas.getContext('2d');
  if (!context) return null;
  
  // Set canvas dimensions to video dimensions
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  // Draw the video frame on the canvas
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // Save the image as Data URL
  return canvas.toDataURL('image/jpeg');
};

