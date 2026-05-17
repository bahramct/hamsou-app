'use client';

import { useEffect, useCallback } from 'react';

/**
 * Hook for synchronizing with DevToolsPanel test data changes
 * This allows any component to react instantly when test data is generated or cleared
 *
 * @param onDataChange - Callback function to execute when test data changes
 * @returns Cleanup function to remove event listeners
 */
export function useTestDataSync(onDataChange: (event: CustomEvent) => void) {
  const handleTestDataGenerated = useCallback((event: CustomEvent) => {
    console.log('Test data generated event:', event.detail);
    onDataChange(event);
  }, [onDataChange]);

  const handleTestDataCleared = useCallback((event: CustomEvent) => {
    console.log('Test data cleared event:', event.detail);
    onDataChange(event);
  }, [onDataChange]);

  useEffect(() => {
    window.addEventListener('testDataGenerated', handleTestDataGenerated as EventListener);
    window.addEventListener('testDataCleared', handleTestDataCleared as EventListener);

    return () => {
      window.removeEventListener('testDataGenerated', handleTestDataGenerated as EventListener);
      window.removeEventListener('testDataCleared', handleTestDataCleared as EventListener);
    };
  }, [handleTestDataGenerated, handleTestDataCleared]);
}

/**
 * Simplified hook that just triggers a callback when test data changes
 * without passing event details
 *
 * @param callback - Function to call when test data changes
 */
export function useTestDataChange(callback: () => void) {
  return useTestDataSync(() => callback());
}
