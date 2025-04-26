
import { CameraError, CameraErrorType, CameraOptions, DEFAULT_CAMERA_OPTIONS, CameraFocusMode } from './cameraTypes';

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
    
    // Build constraints based on options - now enforcing 4:3 aspect ratio for better card scanning
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: options.facingMode || 'environment' },
        width: { min: 1280, ideal: 1920 },
        height: { min: 960, ideal: 1440 },
        aspectRatio: { ideal: 4/3 }
      }
    };
    
    // Add advanced focus constraints if supported
    const advancedConstraints: any[] = [];
    
    // Use continuous focus by default for card scanning
    if (options.focusMode) {
      advancedConstraints.push({
        // Use any type to bypass TypeScript's type checking
        focusMode: options.focusMode
      });
      
      // If no specific focus mode is set, prioritize continuous focus for cards
      if (!options.focusMode && !advancedConstraints.some(c => c.focusMode)) {
        advancedConstraints.push({
          focusMode: CameraFocusMode.CONTINUOUS
        });
      }
    }
    
    // Apply advanced constraints if any exist
    if (advancedConstraints.length > 0) {
      (constraints.video as any).advanced = advancedConstraints;
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
          // Use any type because focusDistance isn't in standard type definitions
          await videoTrack.applyConstraints({
            advanced: [{
              focusDistance: options.focusDistance
            } as any]
          });
        }
      } catch (focusError) {
        console.warn('Manual focus not supported:', focusError);
      }
    }
    
    // Apply additional camera settings for better card recognition
    try {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && videoTrack.getCapabilities && videoTrack.applyConstraints) {
        const capabilities = videoTrack.getCapabilities();
        
        // Set optimal camera settings for card reading if available
        const optimalSettings: any = {};
        
        // Set higher sharpness if available
        if (capabilities.hasOwnProperty('sharpness')) {
          const max = (capabilities as any).sharpness.max;
          if (max) optimalSettings.sharpness = max * 0.8; // 80% of max sharpness
        }
        
        // Enable noise reduction if available (medium setting)
        if (capabilities.hasOwnProperty('noiseReduction')) {
          optimalSettings.noiseReduction = 'medium';
        }
        
        // Apply optimal settings if we found any
        if (Object.keys(optimalSettings).length > 0) {
          await videoTrack.applyConstraints({ advanced: [optimalSettings] });
        }
      }
    } catch (settingsError) {
      console.warn('Could not apply optimal camera settings:', settingsError);
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
