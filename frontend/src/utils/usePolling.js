import { useEffect, useRef, useCallback } from 'react';

/**
 * usePolling - polls a callback at a given interval, but ONLY when the browser
 * tab is visible. Saves server load and avoids stale updates in background tabs.
 *
 * @param {Function} callback - async function to call on each poll (and on mount)
 * @param {number}   intervalMs - poll interval in milliseconds (default 20 000)
 * @param {boolean}  enabled - set to false to disable polling (default true)
 * @returns {{ refresh: Function }} - call refresh() to force an immediate re-fetch
 */
function usePolling(callback, intervalMs = 20000, enabled = true) {
    const savedCallback = useRef(callback);
    const timerRef = useRef(null);

    // Always keep the ref pointing at the latest callback so the interval
    // doesn't capture a stale closure.
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    const startTimer = useCallback(() => {
        timerRef.current = setInterval(() => {
            if (document.visibilityState === 'visible') {
                savedCallback.current();
            }
        }, intervalMs);
    }, [intervalMs]);

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (!enabled) return;

        // Restart the timer whenever visibility changes
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                // Tab became active again — fetch immediately then resume polling
                savedCallback.current();
                startTimer();
            } else {
                stopTimer();
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);
        startTimer();

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            stopTimer();
        };
    }, [enabled, startTimer, stopTimer]);

    // Expose a manual refresh trigger
    const refresh = useCallback(() => {
        savedCallback.current();
    }, []);

    return { refresh };
}

export default usePolling;
