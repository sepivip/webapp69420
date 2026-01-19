/**
 * Solana Spin - Main App Component
 *
 * A read-only blockchain experiment that generates random Solana addresses
 * and checks their public balances for educational and entertainment purposes.
 *
 * IMPORTANT CONSTRAINTS:
 * - Read-only blockchain access only
 * - NO wallet creation
 * - NO private key logic
 * - NO seed phrases
 * - NO transactions or signing
 */

import { SlotMachine } from './components/SlotMachine';
import { Disclaimer } from './components/Disclaimer';
import './styles/App.css';

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Solana Spin dYZø</h1>
        <p className="subtitle">
          Random Address Explorer ƒ?› Read-Only Blockchain Experiment
        </p>
      </header>

      <main>
        <SlotMachine />
      </main>

      <Disclaimer />

      <footer className="app-footer">
        <p>
          Built for education & entertainment ƒ?› No funds can be accessed
        </p>
        <p>
          Powered by{' '}
          <a
            href="https://solana.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Solana
          </a>{' '}
          public RPC
        </p>
        <div className="footer-counter">
          <span>Visits</span>
          <img
            src="https://solanaspin.goatcounter.com/count?p=/"
            alt="Visit counter"
            loading="lazy"
          />
        </div>
      </footer>
    </div>
  );
}
