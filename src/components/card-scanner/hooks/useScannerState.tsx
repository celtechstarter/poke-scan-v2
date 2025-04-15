
import { useState } from 'react';
import { ScannerError } from '../types/scannerTypes';
import { CameraErrorType } from '@/utils/camera';

/**
 * Hook for managing combined scanner state and errors
 * 
 * @returns {Object} Scanner state and error management utilities
 */
export function useScannerState() {
  // Store all errors in one place for easier access
  const [errors, setErrors] = useState<{
    camera: { message: string; type: CameraErrorType } | null;
    detection: { message: string; type: any } | null;
    scanning: ScannerError | null;
  }>({
    camera: null,
    detection: null,
    scanning: null
  });

  /**
   * Set a specific type of error
   * 
   * @param {string} errorType - Type of error (camera, detection, scanning)
   * @param {any} error - Error object to set
   */
  const setError = (errorType: 'camera' | 'detection' | 'scanning', error: any) => {
    setErrors(prev => ({
      ...prev,
      [errorType]: error
    }));
  };

  /**
   * Clear a specific type of error
   * 
   * @param {string} errorType - Type of error to clear
   */
  const clearError = (errorType: 'camera' | 'detection' | 'scanning') => {
    setErrors(prev => ({
      ...prev,
      [errorType]: null
    }));
  };

  /**
   * Clear all errors
   */
  const clearAllErrors = () => {
    setErrors({
      camera: null,
      detection: null,
      scanning: null
    });
  };

  return {
    errors,
    setError,
    clearError,
    clearAllErrors
  };
}
