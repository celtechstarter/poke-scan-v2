
/**
 * Camera utilities for handling video streams
 * @module cameraUtils
 */

/**
 * Error types for camera operations
 */
export enum CameraErrorType {
  PERMISSION_DENIED = 'permission_denied',
  NOT_SUPPORTED = 'not_supported',
  DEVICE_NOT_FOUND = 'device_not_found',
  GENERAL_ERROR = 'general_error'
}

/**
 * Custom error class for camera-related errors
 */
export class CameraError extends Error {
  type: CameraErrorType;
  
  constructor(message: string, type: CameraErrorType) {
    super(message);
    this.name = 'CameraError';
    this.type = type;
  }
}

/**
 * Starts the camera with the environment-facing camera if available
 * 
 * @param {React.RefObject<HTMLVideoElement>} videoRef - Reference to the video element where the stream will be displayed
 * @returns {Promise<MediaStream | null>} The media stream if successful, null otherwise
 * @throws {CameraError} When camera access is denied or unavailable
 */
export const startCamera = async (
  videoRef: React.RefObject<HTMLVideoElement>
): Promise<MediaStream> => {
  try {
    // Check if mediaDevices API is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new CameraError(
        'Kamera wird auf diesem Gerät nicht unterstützt',
        CameraErrorType.NOT_SUPPORTED
      );
    }
    
    // Attempt to get the camera stream
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      } 
    });
    
    if (!stream) {
      throw new CameraError(
        'Kamera konnte nicht aktiviert werden',
        CameraErrorType.GENERAL_ERROR
      );
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      
      // Return a promise that resolves when the video can play
      return new Promise((resolve, reject) => {
        if (!videoRef.current) {
          reject(new CameraError('Video-Element nicht gefunden', CameraErrorType.GENERAL_ERROR));
          return;
        }
        
        // Set up event listeners for success and failure
        const successListener = () => {
          videoRef.current?.removeEventListener('loadedmetadata', successListener);
          resolve(stream);
        };
        
        const errorListener = (error: Event) => {
          videoRef.current?.removeEventListener('error', errorListener as EventListener);
          reject(new CameraError('Fehler beim Laden des Video-Streams', CameraErrorType.GENERAL_ERROR));
        };
        
        videoRef.current.addEventListener('loadedmetadata', successListener);
        videoRef.current.addEventListener('error', errorListener as EventListener);
      });
    }
    
    return stream;
  } catch (error) {
    console.error('Error accessing camera:', error);
    
    // Categorize the error based on the DOMException
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        throw new CameraError(
          'Kamerazugriff wurde verweigert. Bitte erlaube den Zugriff in deinen Browsereinstellungen.',
          CameraErrorType.PERMISSION_DENIED
        );
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        throw new CameraError(
          'Keine Kamera gefunden. Bitte stelle sicher, dass dein Gerät über eine Kamera verfügt.',
          CameraErrorType.DEVICE_NOT_FOUND
        );
      } else if (error.name === 'NotSupportedError') {
        throw new CameraError(
          'Dein Browser unterstützt keine Kameranutzung.',
          CameraErrorType.NOT_SUPPORTED
        );
      }
    }
    
    // Generic error for everything else
    throw new CameraError(
      'Ein unbekannter Fehler ist beim Zugriff auf die Kamera aufgetreten.',
      CameraErrorType.GENERAL_ERROR
    );
  }
};

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
