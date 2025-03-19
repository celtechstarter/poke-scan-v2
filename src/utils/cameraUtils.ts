
/**
 * Starts the camera with the environment-facing camera if available
 */
export const startCamera = async (
  videoRef: React.RefObject<HTMLVideoElement>
): Promise<MediaStream | null> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      } 
    });
    
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      return stream;
    }
  } catch (error) {
    console.error('Error accessing camera:', error);
  }
  
  return null;
};

/**
 * Stops all tracks in the media stream
 */
export const stopMediaStream = (stream: MediaStream): void => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
};

