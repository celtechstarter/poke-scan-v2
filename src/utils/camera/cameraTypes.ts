
/**
 * Camera types and interfaces
 * @module cameraTypes
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
export const DEFAULT_CAMERA_OPTIONS: CameraOptions = {
  facingMode: 'environment',
  width: 1280,
  height: 720,
  focusMode: CameraFocusMode.AUTO
};
