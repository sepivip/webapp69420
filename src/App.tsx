/**
 * Solana Spin - Main App Component
 *
 * A read-only blockchain experiment that generates random Solana addresses
 * and checks their public balances for educational and entertainment purposes.
 *
 * Supports both web and Telegram Mini App platforms.
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
import { useTelegram } from './hooks/useTelegram';
import './styles/App.css';

export default function App() {
  const { isTelegram } = useTelegram();

  return (
    <div className={`app ${isTelegram ? 'telegram-app' : ''}`}>
      {/* Header - hidden in Telegram (Telegram has its own title bar) */}
      {!isTelegram && (
        <header className="app-header">
          <h1>solanaspin.yachts</h1>
          <p className="subtitle">Blockchain Experiment</p>
        </header>
      )}

      <main>
        <SlotMachine />
      </main>

      <Disclaimer />

      {/* Footer - hidden in Telegram for cleaner interface */}
      {!isTelegram && (
        <footer className="app-footer">
          <p>
            Built for education & entertainment. Powered by{' '}
            <a
              href="https://solana.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Solana
            </a>{' '}
            public RPC
          </p>
          <span id="goatcounter-count" className="footer-counter" aria-label="Visit counter"></span>
        </footer>
      )}
    </div>
  );
}
