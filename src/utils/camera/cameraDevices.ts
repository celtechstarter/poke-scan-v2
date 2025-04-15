
/**
 * Stops all tracks in the media stream to release camera resources
 * 
 * @param {MediaStream | null} stream - The media stream to stop
 */
export const stopMediaStream = (stream: MediaStream | null): void => {
  if (stream) {
    try {
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Error stopping media stream:', error);
    }
  }
};

/**
 * Checks if the current environment supports camera access
 * 
 * @returns {boolean} True if camera is supported, false otherwise
 */
export const isCameraSupported = (): boolean => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

/**
 * Checks if the device has a camera
 * Useful for determining if camera features should be shown
 * 
 * @returns {Promise<boolean>} Promise resolving to true if device has camera, false otherwise
 */
export const hasCamera = async (): Promise<boolean> => {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return false;
    }
    
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.some(device => device.kind === 'videoinput');
  } catch (error) {
    console.error('Error checking for camera:', error);
    return false;
  }
};
