import { createConfig, http } from 'wagmi'
import { defineChain } from 'viem'
import { injected } from 'wagmi/connectors'

export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  // USDC is the gas token on Arc — 6 decimals for ERC-20 but native uses 18
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
  blockExplorers: { default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' } },
  testnet: true,
})

export const wagmiConfig = createConfig({
  chains: [arcTestnet],
  connectors: [injected()],
  transports: { [arcTestnet.id]: http('https://rpc.testnet.arc.network') },
})

// Tokens supported by Circle Swap Kit on Arc Testnet
export const TOKENS = [
  { symbol: 'USDC',   name: 'USD Coin',   decimals: 6, color: '#2775CA', icon: '💲', address: '0x3600000000000000000000000000000000000000' },
  { symbol: 'EURC',   name: 'EUR Coin',   decimals: 6, color: '#0052B4', icon: '€',  address: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a' },
]

// Mock data for Lending markets (no live protocol on Arc testnet yet)
export const LENDING_MARKETS = [
  { token: 'USDC',   supplyApy: 5.2, borrowApy: 8.1, totalSupply: '12,450,000', totalBorrow: '8,320,000', utilization: 67, color: '#2775CA', icon: '💲' },
  { token: 'EURC',   supplyApy: 4.8, borrowApy: 7.6, totalSupply: '6,230,000',  totalBorrow: '3,910,000', utilization: 63, color: '#0052B4', icon: '€'  },
]

// Mock data for Staking pools
export const STAKING_POOLS = [
  { name: 'USDC Stable Pool', token: 'USDC',   apy: 6.5, tvl: '24,500,000', lockup: 'Flexible', reward: 'USDC',   color: '#2775CA', icon: '💲', risk: 'Low'    },
  { name: 'EURC Yield Pool',  token: 'EURC',   apy: 5.9, tvl: '11,200,000', lockup: '7 days',   reward: 'EURC',   color: '#0052B4', icon: '€',  risk: 'Low'    },
]

// Required for Circle Swap Kit — get free key at https://console.circle.com
export const KIT_KEY = import.meta.env.VITE_KIT_KEY ?? ''
