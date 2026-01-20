# CLAUDE.md

This file provides guidance for Claude Code when working with the SolanaSpin codebase.

## Project Overview

SolanaSpin is a read-only slot machine-style Solana address explorer for education and entertainment. It generates random Solana addresses and queries their public balances on the blockchain. **It does NOT create wallets, handle private keys, or perform transactions.**

**Live site:** GitHub Pages deployment

## Tech Stack

- **React 18** + **TypeScript 5** + **Vite 5**
- **@solana/web3.js** - Solana RPC client (read-only balance queries)
- **@twa-dev/sdk** - Telegram Mini App SDK
- **bip39** - BIP39 mnemonic generation
- **bs58** - Base58 encoding for Solana addresses
- **canvas-confetti** - Celebration animations

## Commands

```bash
npm run dev      # Start dev server (localhost:5173)
npm run build    # TypeScript check + Vite production build
npm run preview  # Preview production build locally
```

## Project Structure

```
src/
├── main.tsx                  # Entry point, Buffer polyfill
├── App.tsx                   # Main layout, platform detection
├── components/
│   ├── SlotMachine.tsx       # Core slot machine UI and logic
│   └── Disclaimer.tsx        # Read-only disclaimer notice
├── hooks/
│   ├── useRateLimit.ts       # Rate limiting (10 spins/min, 3s cooldown)
│   └── useTelegram.ts        # Telegram Mini App React hook
├── utils/
│   ├── addressGenerator.ts   # Address generation (BIP39/ED25519)
│   ├── solana.ts             # Read-only RPC utilities
│   └── telegram.ts           # Telegram SDK wrapper
├── types/
│   └── index.ts              # TypeScript interfaces
└── styles/
    └── App.css               # Cyberpunk neon styling + Telegram styles
```

## Key Architecture Decisions

### Address Generation (`addressGenerator.ts`)
- Generates random 12-word BIP39 mnemonics (no duplicates)
- Derives Solana public addresses using ED25519 path `m/44'/501'/0'/0'`
- **CRITICAL:** Only generates public addresses, never exposes private keys

### Blockchain Integration (`solana.ts`)
- Dual RPC endpoints with failover (Solana mainnet + Alchemy)
- Read-only balance fetching only
- Smart balance formatting (exponential for tiny amounts)

### Rate Limiting (`useRateLimit.ts`)
- Max 10 spins per minute
- 3-second cooldown between spins
- Prevents excessive RPC calls

## Styling

- Cyberpunk/neon theme with dark background
- Colors: cyan (#33f2ff), pink (#ff2bd6), yellow (#ffd34a), green (#40ff9f)
- Fonts: Orbitron (display), Rajdhani (body), Share Tech Mono (mono)

## Security Constraints

**This app must NEVER:**
- Create actual wallets or accounts
- Handle, store, or expose private keys
- Perform blockchain transactions or signing
- Store sensitive user data

**This app ONLY:**
- Generates addresses mathematically
- Queries public blockchain data (read-only)
- Displays on-chain information

## TypeScript

- Strict mode enabled in `tsconfig.json`
- All types in `src/types/index.ts`
- No `any` types - maintain type safety

## Deployment

- GitHub Actions workflow in `.github/workflows/deploy.yml`
- Auto-deploys to GitHub Pages on push to `main`
- Build output: `dist/`

## Telegram Mini App

The app supports Telegram Mini App (TWA) via runtime detection:

- **Detection**: `useTelegram()` hook detects Telegram environment
- **UI Changes**: Header/footer hidden in Telegram (Telegram provides chrome)
- **Haptic Feedback**: Vibration on spin start and win
- **Same Build**: Single codebase, no separate builds needed

### Telegram-specific files
- `src/utils/telegram.ts` - SDK wrapper functions
- `src/hooks/useTelegram.ts` - React hook for Telegram features

### To set up Telegram bot
1. Create bot via @BotFather
2. Use `/newapp` to create Mini App
3. Set Web App URL to deployed site (e.g., https://solanaspin.yachts)
