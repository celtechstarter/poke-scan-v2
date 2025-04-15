
import { CameraFocusMode } from './cameraTypes';

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
    
    // Use any type to bypass TypeScript's type checking
    const advancedConstraints: any[] = [{
      focusMode: focusMode
    }];
    
    // Add focus distance for manual mode
    if (focusMode === CameraFocusMode.MANUAL && focusDistance !== undefined) {
      advancedConstraints[0].focusDistance = focusDistance;
    }
    
    await videoTrack.applyConstraints({
      advanced: advancedConstraints
    });
    
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
    
    const capabilities = videoTrack.getCapabilities() as any;
    
    const supportedFocusModes = capabilities.focusMode || [];
    
    return {
      supportsFocusMode: Array.isArray(supportedFocusModes) && supportedFocusModes.length > 0,
      supportedFocusModes: Array.isArray(supportedFocusModes) ? supportedFocusModes : []
    };
  } catch (error) {
    console.error('Error getting camera capabilities:', error);
    return { supportsFocusMode: false, supportedFocusModes: [] };
  }
};
