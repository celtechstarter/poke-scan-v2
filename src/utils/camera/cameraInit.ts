
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
    
    // Build constraints based on options
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: options.facingMode || 'environment' },
        width: { ideal: options.width || 1280 },
        height: { ideal: options.height || 720 }
      }
    };
    
    // Add advanced focus constraints if supported
    // We need to use any type here because these focus properties
    // are not part of the standard MediaTrackConstraints
    const advancedConstraints: any[] = [];
    
    if (options.focusMode) {
      advancedConstraints.push({
        // Use any type to bypass TypeScript's type checking
        focusMode: options.focusMode
      });
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
