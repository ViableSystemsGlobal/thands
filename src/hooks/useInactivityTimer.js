
import { useState, useEffect, useCallback } from 'react';

export const useInactivityTimer = (isAuthenticatedUser, onTimeoutCallback, options = {}) => {
  const { timeoutDuration = 30 * 60 * 1000 } = options; // 30 minutes default
  const [timeoutId, setTimeoutId] = useState(null);

  const resetTimer = useCallback(() => {
    clearTimeout(timeoutId);
    if (isAuthenticatedUser) {
      const newTimeoutId = setTimeout(onTimeoutCallback, timeoutDuration);
      setTimeoutId(newTimeoutId);
    }
  }, [timeoutId, isAuthenticatedUser, onTimeoutCallback, timeoutDuration]);

  useEffect(() => {
    if (isAuthenticatedUser) {
      const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
      events.forEach(event => window.addEventListener(event, resetTimer, { passive: true }));
      resetTimer(); 

      return () => {
        events.forEach(event => window.removeEventListener(event, resetTimer));
        clearTimeout(timeoutId);
      };
    } else {
      clearTimeout(timeoutId);
    }
  }, [isAuthenticatedUser, resetTimer]); // Removed timeoutId from deps as resetTimer captures it.

  // Expose clearTimer for explicit clearing if needed, though resetTimer handles most cases.
  const clearTimer = useCallback(() => {
    clearTimeout(timeoutId);
  }, [timeoutId]);

  return { resetTimer, clearTimer };
};
