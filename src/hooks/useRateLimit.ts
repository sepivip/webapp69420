/**
 * Rate Limiting Hook
 *
 * Prevents excessive RPC calls by limiting spins per minute.
 * Provides a friendly cooldown UI experience.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { RateLimitState } from '../types';

const MAX_SPINS_PER_MINUTE = 10;
const COOLDOWN_MS = 3000; // 3 seconds between spins
const WINDOW_MS = 60000; // 1 minute window

interface SpinRecord {
  timestamp: number;
}

export function useRateLimit() {
  const [state, setState] = useState<RateLimitState>({
    canSpin: true,
    cooldownRemaining: 0,
    spinsRemaining: MAX_SPINS_PER_MINUTE,
    maxSpinsPerMinute: MAX_SPINS_PER_MINUTE,
  });

  const spinHistory = useRef<SpinRecord[]>([]);
  const lastSpinTime = useRef<number>(0);
  const cooldownInterval = useRef<number | null>(null);

  // Clean up old spin records outside the window
  const cleanupHistory = useCallback(() => {
    const now = Date.now();
    spinHistory.current = spinHistory.current.filter(
      (record) => now - record.timestamp < WINDOW_MS
    );
  }, []);

  // Calculate current state
  const updateState = useCallback(() => {
    cleanupHistory();

    const now = Date.now();
    const timeSinceLastSpin = now - lastSpinTime.current;
    const cooldownRemaining = Math.max(0, COOLDOWN_MS - timeSinceLastSpin);
    const spinsRemaining = MAX_SPINS_PER_MINUTE - spinHistory.current.length;
    const canSpin = cooldownRemaining === 0 && spinsRemaining > 0;

    setState({
      canSpin,
      cooldownRemaining,
      spinsRemaining,
      maxSpinsPerMinute: MAX_SPINS_PER_MINUTE,
    });

    return canSpin;
  }, [cleanupHistory]);

  // Record a spin
  const recordSpin = useCallback(() => {
    const now = Date.now();
    spinHistory.current.push({ timestamp: now });
    lastSpinTime.current = now;
    updateState();

    // Start cooldown timer
    if (cooldownInterval.current) {
      clearInterval(cooldownInterval.current);
    }

    cooldownInterval.current = window.setInterval(() => {
      const remaining = COOLDOWN_MS - (Date.now() - lastSpinTime.current);
      if (remaining <= 0) {
        if (cooldownInterval.current) {
          clearInterval(cooldownInterval.current);
          cooldownInterval.current = null;
        }
      }
      updateState();
    }, 100);
  }, [updateState]);

  // Try to spin - returns true if allowed
  const trySppin = useCallback((): boolean => {
    if (updateState()) {
      recordSpin();
      return true;
    }
    return false;
  }, [updateState, recordSpin]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cooldownInterval.current) {
        clearInterval(cooldownInterval.current);
      }
    };
  }, []);

  // Initial state update
  useEffect(() => {
    updateState();
  }, [updateState]);

  return {
    ...state,
    trySpin: trySppin,
    recordSpin,
    updateState,
  };
}
