
import { useState, useCallback } from 'react';

export function useScanProgress() {
  const [scanProgress, setScanProgress] = useState(0);

  const startScanProgress = useCallback(() => {
    setScanProgress(0);
    let progress = 0;
    
    const progressInterval = setInterval(() => {
      progress += 5;
      setScanProgress(Math.min(progress, 95)); // Max 95% until complete
      
      if (progress >= 95) {
        clearInterval(progressInterval);
      }
    }, 50);

    return () => {
      clearInterval(progressInterval);
      setScanProgress(100);
    };
  }, []);

  return {
    scanProgress,
    startScanProgress,
    setScanProgress
  };
}
