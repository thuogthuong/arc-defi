# Arc DeFi

A full-featured DeFi dApp on Arc Testnet with Swap, Lending, and Staking.

## Features
- **Swap** — Real swap via Circle Swap Kit (USDC ↔ EURC ↔ cirBTC)
- **Lending** — Supply/Borrow UI with live market stats
- **Staking** — Stake pools with APY calculator and reward tracking

## Setup
```bash
cp .env.example .env
# Add your Circle Kit Key from https://console.circle.com
npm install
npm run dev
```

## Kit Key
Get a free Kit Key at https://console.circle.com (required for Swap)
