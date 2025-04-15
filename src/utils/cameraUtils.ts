
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
 * Focus modes for camera
 */
export enum CameraFocusMode {
  AUTO = 'auto',
  CONTINUOUS = 'continuous',
  MANUAL = 'manual',
  FIXED = 'fixed'
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
 * Camera configuration options
 */
export interface CameraOptions {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
  focusMode?: CameraFocusMode;
  focusDistance?: number; // 0.0 to 1.0, only used for manual focus
}

/**
 * Default camera configuration
 */
const DEFAULT_CAMERA_OPTIONS: CameraOptions = {
  facingMode: 'environment',
  width: 1280,
  height: 720,
  focusMode: CameraFocusMode.AUTO
};

/**
 * Starts the camera with the specified configuration options
 * 
 * @param {React.RefObject<HTMLVideoElement>} videoRef - Reference to the video element where the stream will be displayed
 * @param {CameraOptions} options - Camera configuration options
 * @returns {Promise<MediaStream | null>} The media stream if successful, null otherwise
 * @throws {CameraError} When camera access is denied or unavailable
 */
export const startCamera = async (
  videoRef: React.RefObject<HTMLVideoElement>,
  options: CameraOptions = DEFAULT_CAMERA_OPTIONS
): Promise<MediaStream> => {
  try {
    // Check if mediaDevices API is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new CameraError(
        'Kamera wird auf diesem Gerät nicht unterstützt',
        CameraErrorType.NOT_SUPPORTED
      );
    }
    
    // Build constraints based on options
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: options.facingMode || 'environment' },
        width: { ideal: options.width || 1280 },
        height: { ideal: options.height || 720 }
      }
    };
    
    // Add advanced focus constraints if supported
    // @ts-ignore - focusMode is not in standard type definitions but works in modern browsers
    if ((constraints.video as MediaTrackConstraints).advanced === undefined) {
      (constraints.video as MediaTrackConstraints).advanced = [];
    }
    
    if (options.focusMode) {
      // @ts-ignore - focusMode property
      (constraints.video as MediaTrackConstraints).advanced?.push({
        focusMode: options.focusMode
      });
    }
    
    // Attempt to get the camera stream
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    if (!stream) {
      throw new CameraError(
        'Kamera konnte nicht aktiviert werden',
        CameraErrorType.GENERAL_ERROR
      );
    }
    
    // Apply manual focus if needed and supported
    if (options.focusMode === CameraFocusMode.MANUAL && options.focusDistance !== undefined) {
      try {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack && typeof videoTrack.applyConstraints === 'function') {
          // @ts-ignore - focusDistance property
          await videoTrack.applyConstraints({
            advanced: [{ focusDistance: options.focusDistance }]
          });
        }
      } catch (focusError) {
        console.warn('Manual focus not supported:', focusError);
      }
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
 * Updates camera focus settings on an active stream
 * 
 * @param {MediaStream} stream - The active media stream
 * @param {CameraFocusMode} focusMode - Focus mode to apply
 * @param {number} focusDistance - Distance for manual focus (0.0 to 1.0)
 * @returns {Promise<boolean>} Whether the update was successful
 */
export const updateCameraFocus = async (
  stream: MediaStream,
  focusMode: CameraFocusMode,
  focusDistance?: number
): Promise<boolean> => {
  try {
    const videoTrack = stream.getVideoTracks()[0];
    
    if (!videoTrack || typeof videoTrack.applyConstraints !== 'function') {
      console.warn('Cannot update focus: No video track or applyConstraints not supported');
      return false;
    }
    
    const constraints: any = {
      advanced: [{ focusMode }]
    };
    
    // Add focus distance for manual mode
    if (focusMode === CameraFocusMode.MANUAL && focusDistance !== undefined) {
      constraints.advanced[0].focusDistance = focusDistance;
    }
    
    await videoTrack.applyConstraints(constraints);
    return true;
  } catch (error) {
    console.error('Error updating camera focus:', error);
    return false;
  }
};

/**
 * Gets camera capabilities including available focus modes
 * 
 * @param {MediaStream} stream - The active media stream
 * @returns {Object} Object containing camera capabilities
 */
export const getCameraCapabilities = (stream: MediaStream): {
  supportsFocusMode: boolean;
  supportedFocusModes: string[];
} => {
  try {
    const videoTrack = stream.getVideoTracks()[0];
    
    if (!videoTrack || !videoTrack.getCapabilities) {
      return { supportsFocusMode: false, supportedFocusModes: [] };
    }
    
    const capabilities = videoTrack.getCapabilities();
    
    // @ts-ignore - focusMode property
    const supportedFocusModes = capabilities.focusMode || [];
    
    return {
      // @ts-ignore - focusMode property
      supportsFocusMode: Array.isArray(capabilities.focusMode) && capabilities.focusMode.length > 0,
      supportedFocusModes: Array.isArray(supportedFocusModes) ? supportedFocusModes : []
    };
  } catch (error) {
    console.error('Error getting camera capabilities:', error);
    return { supportsFocusMode: false, supportedFocusModes: [] };
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
