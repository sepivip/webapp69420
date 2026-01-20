/**
 * SlotMachine Component
 *
 * Displays a slot-machine style animation for Solana address generation.
 * READ-ONLY: Only generates random addresses and checks public balances.
 * NO private keys, NO wallet creation, NO seed phrases.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { generateMnemonic, derivePublicAddress } from '../utils/addressGenerator';
import { getBalance, formatBalance } from '../utils/solana';
import { useRateLimit } from '../hooks/useRateLimit';
import { useTelegram } from '../hooks/useTelegram';
import type { SpinState, SpinResult, GameStats } from '../types';

// Base58 characters for slot animation
const BASE58_CHARS = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const STATS_STORAGE_KEY = 'solanaspin.stats';
const shortenAddress = (address: string, chars: number = 4) => {
  if (address.length <= chars * 2 + 3) {
    return address;
  }
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

interface SlotMachineProps {
  onStatsUpdate?: (stats: GameStats) => void;
}

function loadStoredStats(): GameStats {
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) return { totalSpins: 0, addressesWithBalance: 0 };
    const parsed = JSON.parse(raw) as Partial<GameStats>;
    if (typeof parsed.totalSpins === 'number' && typeof parsed.addressesWithBalance === 'number') {
      return {
        totalSpins: parsed.totalSpins,
        addressesWithBalance: parsed.addressesWithBalance,
      };
    }
  } catch {
    // Ignore storage errors.
  }
  return { totalSpins: 0, addressesWithBalance: 0 };
}

export function SlotMachine({ onStatsUpdate }: SlotMachineProps) {
  const [spinState, setSpinState] = useState<SpinState>('idle');
  const [displayAddress, setDisplayAddress] = useState<string>('');
  const [result, setResult] = useState<SpinResult | null>(null);
  const [stats, setStats] = useState<GameStats>(() => loadStoredStats());
  const [currentMnemonic, setCurrentMnemonic] = useState<string[]>([]);

  const { canSpin, cooldownRemaining, spinsRemaining, maxSpinsPerMinute, trySpin } = useRateLimit();
  const { haptic } = useTelegram();

  const animationRef = useRef<number | null>(null);
  const revealTimeoutRef = useRef<number | null>(null);

  // Generate random characters for slot animation
  const getRandomChar = () => BASE58_CHARS[Math.floor(Math.random() * BASE58_CHARS.length)];

  // Animate the slot machine spinning
  const animateSlots = useCallback((targetAddress: string, duration: number) => {
    const startTime = Date.now();
    const addressLength = 44; // Standard Solana address length

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Gradually reveal characters from left to right
      const revealedChars = Math.floor(progress * addressLength);
      let display = '';

      for (let i = 0; i < addressLength; i++) {
        if (i < revealedChars) {
          display += targetAddress[i] || getRandomChar();
        } else {
          display += getRandomChar();
        }
      }

      setDisplayAddress(display);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayAddress(targetAddress);
      }
    };

    animate();
  }, []);

  // Fire confetti for wins
  const fireConfetti = useCallback(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ['#9945FF', '#14F195', '#FFD700', '#FF6B6B'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  // Main spin function
  const handleSpin = useCallback(async () => {
    if (!canSpin || spinState !== 'idle') return;

    if (!trySpin()) {
      return; // Rate limited
    }

    setSpinState('spinning');
    setResult(null);
    setCurrentMnemonic([]);

    // Haptic feedback on spin start (Telegram only)
    haptic('impact', 'medium');

    // Generate a derived public address (NO private key!)
    const mnemonic = generateMnemonic();
    setCurrentMnemonic(mnemonic);
    const address = derivePublicAddress(mnemonic);

    // Start animation
    animateSlots(address, 2000);

    // Wait for animation then check balance
    revealTimeoutRef.current = window.setTimeout(async () => {
      setSpinState('checking');

      try {
        const balance = await getBalance(address);
        const hasBalance = balance > 0;

        const spinResult: SpinResult = {
          address,
          shortAddress: shortenAddress(address),
          balance,
          balanceFormatted: formatBalance(balance),
          hasBalance,
          timestamp: Date.now(),
        };

        setResult(spinResult);
        setSpinState('complete');

        // Update stats
        setStats((prev) => {
          const newStats = {
            totalSpins: prev.totalSpins + 1,
            addressesWithBalance: prev.addressesWithBalance + (hasBalance ? 1 : 0),
          };
          onStatsUpdate?.(newStats);
          return newStats;
        });

        // Fire confetti and haptic on win!
        if (hasBalance) {
          fireConfetti();
          haptic('notification'); // Success vibration
        }
      } catch (error) {
        console.error('Error checking balance:', error);
        setSpinState('idle');
      }
    }, 2200);
  }, [canSpin, spinState, trySpin, animateSlots, fireConfetti, haptic, onStatsUpdate]);

  // Reset to idle state
  const handleReset = useCallback(() => {
    setSpinState('idle');
    setResult(null);
    setDisplayAddress('');
    setCurrentMnemonic([]);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    } catch {
      // Ignore storage errors.
    }
  }, [stats]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (revealTimeoutRef.current) {
        clearTimeout(revealTimeoutRef.current);
      }
    };
  }, []);

  const cooldownSeconds = Math.ceil(cooldownRemaining / 1000);
  const isSpinning = spinState === 'spinning' || spinState === 'checking';
  const displayedWords =
    spinState === 'complete' && currentMnemonic.length === 12
      ? currentMnemonic
      : Array.from({ length: 12 }, () => '****');

  return (
    <div className="slot-machine">
      <div className="slot-header">
        <h2>🎰 Address Roulette 🎰</h2>
        <p className="tagline">Spin to discover random Solana addresses!</p>
      </div>

      {/* Address Display */}
      <div className={`address-display ${spinState}`}>
        <div className="address-window">
          <div className="address-text">
            {displayAddress || '????????????????????????????????????????????????????'}
          </div>
        </div>
        {spinState === 'checking' && (
          <div className="checking-indicator">
            <span className="pulse">Checking balance...</span>
          </div>
        )}
      </div>

      {/* Mnemonic Slots */}
      <div className={`mnemonic-grid ${isSpinning ? 'spinning' : ''}`}>
        {displayedWords.map((word, idx) => (
          <div
            key={`${word}-${idx}`}
            className="mnemonic-slot"
          >
            {word}
          </div>
        ))}
      </div>

      {/* Result Display */}
      {result && spinState === 'complete' && (
        <div className={`result-panel ${result.hasBalance ? 'winner' : 'no-balance'}`}>
          {result.hasBalance ? (
            <>
              <div className="result-icon">🎉</div>
              <div className="result-title">FOUND BALANCE!</div>
              <div className="result-balance">{result.balanceFormatted}</div>
              <div className="result-address">{result.shortAddress}</div>
              <p className="result-note">
                This address exists on-chain with SOL!
                <br />
                <small>(You cannot access it - this is read-only)</small>
              </p>
            </>
          ) : (
            <>
              <div className="result-icon">🔍</div>
              <div className="result-title">No Balance</div>
              <div className="result-address">{result.shortAddress}</div>
              <p className="result-note">This random address has no SOL. Try again!</p>
            </>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="controls">
        {spinState === 'complete' ? (
          <button className="spin-button reset" onClick={handleReset}>
            🔄 Spin Again
          </button>
        ) : (
          <button
            className={`spin-button ${isSpinning ? 'spinning' : ''}`}
            onClick={handleSpin}
            disabled={!canSpin || isSpinning}
          >
            {isSpinning ? (
              <span className="spinner-text">🎲 Spinning...</span>
            ) : cooldownRemaining > 0 ? (
              `⏳ Wait ${cooldownSeconds}s`
            ) : (
              '🎰 SPIN!'
            )}
          </button>
        )}

        {/* Rate limit info */}
        <div className="rate-limit-info">
          <span className="spins-remaining">
            {spinsRemaining}/{maxSpinsPerMinute} spins available
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat">
          <span className="stat-value">{stats.totalSpins}</span>
          <span className="stat-label">Spins</span>
        </div>
        <div className="stat">
          <span className="stat-value">{stats.addressesWithBalance}</span>
          <span className="stat-label">With Balance</span>
        </div>
        <div className="stat">
          <span className="stat-value">
            {stats.totalSpins > 0
              ? ((stats.addressesWithBalance / stats.totalSpins) * 100).toFixed(1)
              : '0'}
            %
          </span>
          <span className="stat-label">Hit Rate</span>
        </div>
      </div>
    </div>
  );
}
