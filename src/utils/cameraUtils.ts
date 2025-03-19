
/**
 * Camera utilities for handling video streams
 * @module cameraUtils
 */

/**
 * Starts the camera with the environment-facing camera if available
 * 
 * @param {React.RefObject<HTMLVideoElement>} videoRef - Reference to the video element where the stream will be displayed
 * @returns {Promise<MediaStream | null>} The media stream if successful, null otherwise
 * @throws {Error} When camera access is denied or unavailable
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
 * Stops all tracks in the media stream to release camera resources
 * 
 * @param {MediaStream} stream - The media stream to stop
 */
export const stopMediaStream = (stream: MediaStream): void => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
};
