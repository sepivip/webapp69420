/**
 * Solana RPC Utilities - READ-ONLY
 *
 * This module provides read-only access to the Solana blockchain.
 * - Only queries public data (balances)
 * - NO transaction signing
 * - NO wallet operations
 * - NO private key handling
 */

import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Public RPC endpoints (read-only access)
const RPC_ENDPOINTS = [
  'https://api.mainnet-beta.solana.com',
  'https://solana-mainnet.g.alchemy.com/v2/demo',
];

let currentEndpointIndex = 0;
let connection: Connection | null = null;

/**
 * Gets or creates a Solana connection.
 * Automatically rotates endpoints on failure.
 */
function getConnection(): Connection {
  if (!connection) {
    connection = new Connection(RPC_ENDPOINTS[currentEndpointIndex], {
      commitment: 'confirmed',
    });
  }
  return connection;
}

/**
 * Rotates to the next RPC endpoint.
 */
function rotateEndpoint(): void {
  currentEndpointIndex = (currentEndpointIndex + 1) % RPC_ENDPOINTS.length;
  connection = new Connection(RPC_ENDPOINTS[currentEndpointIndex], {
    commitment: 'confirmed',
  });
}

/**
 * Fetches the SOL balance for a given address.
 * Returns balance in SOL (not lamports).
 *
 * This is a READ-ONLY operation - no signing or transactions.
 */
export async function getBalance(address: string): Promise<number> {
  const conn = getConnection();

  try {
    const pubkey = new PublicKey(address);
    const lamports = await conn.getBalance(pubkey);
    return lamports / LAMPORTS_PER_SOL;
  } catch (error) {
    // Try rotating endpoint on failure
    rotateEndpoint();

    try {
      const pubkey = new PublicKey(address);
      const lamports = await getConnection().getBalance(pubkey);
      return lamports / LAMPORTS_PER_SOL;
    } catch {
      // Return 0 on failure - address likely doesn't exist or RPC is down
      console.warn('Failed to fetch balance for:', address);
      return 0;
    }
  }
}

/**
 * Formats a SOL balance for display.
 */
export function formatBalance(balance: number): string {
  if (balance === 0) {
    return '0 SOL';
  }
  if (balance < 0.0001) {
    return `${balance.toExponential(2)} SOL`;
  }
  if (balance < 1) {
    return `${balance.toFixed(6)} SOL`;
  }
  if (balance < 1000) {
    return `${balance.toFixed(4)} SOL`;
  }
  return `${balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} SOL`;
}

/**
 * Checks if the RPC connection is healthy.
 */
export async function checkConnection(): Promise<boolean> {
  try {
    const conn = getConnection();
    await conn.getSlot();
    return true;
  } catch {
    return false;
  }
}
