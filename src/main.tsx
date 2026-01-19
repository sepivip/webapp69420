/**
 * Solana Spin - Entry Point
 *
 * A read-only slot machine style Solana address explorer.
 * For education and entertainment purposes only.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Buffer } from 'buffer';
import App from './App';

// Polyfill Buffer for @solana/web3.js
window.Buffer = Buffer;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
