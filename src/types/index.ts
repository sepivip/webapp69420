// Types for the Solana Spin read-only address explorer
// NO wallet creation, NO private keys, NO seed phrases

export interface SpinResult {
  address: string;
  shortAddress: string;
  balance: number;
  balanceFormatted: string;
  hasBalance: boolean;
  timestamp: number;
}

export interface RateLimitState {
  canSpin: boolean;
  cooldownRemaining: number;
  spinsRemaining: number;
  maxSpinsPerMinute: number;
}

export type SpinState = 'idle' | 'spinning' | 'checking' | 'complete';

export interface GameStats {
  totalSpins: number;
  addressesWithBalance: number;
}

export interface SlotCharacter {
  char: string;
  isRevealed: boolean;
  isFinal: boolean;
}
