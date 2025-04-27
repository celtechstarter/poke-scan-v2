
import { useState } from 'react';
import { ScanResult, ScannerError } from '../types/scannerTypes';

export function useScanResults() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState<ScannerError | null>(null);

  const clearResults = () => {
    setScanResult(null);
    setScanError(null);
  };

  return {
    scanResult,
    setScanResult,
    scanError,
    setScanError,
    clearResults
  };
}
