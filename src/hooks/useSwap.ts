import { useState } from 'react'
import { useWalletClient, useAccount } from 'wagmi'
import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2'
import { AppKit } from '@circle-fin/app-kit'
import { KIT_KEY } from '../lib/config'
import { addHistory } from '../lib/history'

export type SwapStatus = 'idle' | 'estimating' | 'ready' | 'swapping' | 'done' | 'error'
export interface SwapEstimate { estimatedOutput: string }

// Proxy patch: route Circle API through local proxy to fix CORS
// Dev: Vite proxy at /circle-api
// Production: Cloudflare Pages Function at /circle-proxy
function patchFetchForProxy() {
  if (typeof window === 'undefined') return
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  const proxyBase = isDev ? '/circle-api' : '/circle-proxy'
  const orig = window.fetch.bind(window)
  window.fetch = async (input: any, init?: any) => {
    const url = typeof input === 'string' ? input : input?.url ?? ''
    if (url.startsWith('https://api.circle.com')) {
      // Strip x-user-agent header that causes CORS preflight failure
      const newInit = { ...init }
      if (newInit.headers) {
        const h = new Headers(newInit.headers as any)
        h.delete('x-user-agent')
        newInit.headers = h
      }
      return orig(url.replace('https://api.circle.com', proxyBase), newInit)
    }
    return orig(input, init)
  }
}
patchFetchForProxy()

// Get provider — fallback chain: walletClient transport → window.ethereum
function getProvider(walletClient: any) {
  return (
    walletClient?.transport?.value?.provider ??
    walletClient?.transport?.provider ??
    (window as any).ethereum ??
    null
  )
}

function safeOutput(val: any): string {
  if (val == null) return '—'
  const n = parseFloat(String(val))
  return isNaN(n) ? '—' : n.toFixed(6)
}

export function useSwap() {
  const { isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()

  const [status,    setStatus]    = useState<SwapStatus>('idle')
  const [estimate,  setEstimate]  = useState<SwapEstimate | null>(null)
  const [error,     setError]     = useState<string | null>(null)
  const [txHash,    setTxHash]    = useState<string | null>(null)
  const [amountOut, setAmountOut] = useState<string>('—')

  async function getAdapter() {
    // walletClient may be null if chain not switched — always fallback to window.ethereum
    const provider = getProvider(walletClient)
    if (!provider) throw new Error('No wallet provider found. Install MetaMask or Rabby.')
    return await createViemAdapterFromProvider({ provider })
  }

  async function estimateSwap(tokenIn: string, tokenOut: string, amountIn: string) {
    if (!isConnected) { setError('connectFirst'); return }
    if (!KIT_KEY)     { setError('noKitKey'); return }
    try {
      setStatus('estimating'); setError(null)
      const adapter = await getAdapter()
      const kit     = new AppKit()
      const result  = await kit.estimateSwap({
        from: { adapter, chain: 'Arc_Testnet' },
        tokenIn, tokenOut, amountIn,
        config: { kitKey: KIT_KEY },
      })
      // estimatedOutput is {amount, token} per SDK docs, not a plain string
      const rawOut = (result.estimatedOutput as any)?.amount ?? result.estimatedOutput
      const out = safeOutput(rawOut)
      setEstimate({ estimatedOutput: out })
      setAmountOut(out)
      setStatus('ready')
    } catch (e: any) {
      setError(e?.message ?? 'Estimation failed')
      setStatus('error')
    }
  }

  async function swap(tokenIn: string, tokenOut: string, amountIn: string, slippageBps = 100) {
    if (!isConnected) { setError('connectFirst'); return }
    if (!KIT_KEY)     { setError('noKitKey'); return }
    try {
      setStatus('swapping'); setError(null)
      const adapter = await getAdapter()
      const kit     = new AppKit()
      const result  = await kit.swap({
        from: { adapter, chain: 'Arc_Testnet' },
        tokenIn, tokenOut, amountIn,
        config: { kitKey: KIT_KEY, slippageBps },
      })
      const hash = (result as any)?.txHash ?? null
      const rawAmountOut = (result as any)?.estimatedOutput?.amount
        ?? (result as any)?.amountOut?.amount
        ?? (result as any)?.amountOut
        ?? estimate?.estimatedOutput
      const out = safeOutput(rawAmountOut)
      setTxHash(hash)
      setAmountOut(out)
      setStatus('done')
      addHistory({
        type: 'swap', status: 'success',
        tokenIn, tokenOut, amountIn, amountOut: out,
        txHash: hash ?? undefined,
        explorerUrl: hash ? `https://testnet.arcscan.app/tx/${hash}` : undefined,
      })
    } catch (e: any) {
      setError(e?.message ?? 'Swap failed')
      setStatus('error')
      addHistory({ type: 'swap', status: 'error', tokenIn, tokenOut, amountIn })
    }
  }

  function reset() {
    setStatus('idle'); setEstimate(null); setError(null)
    setTxHash(null); setAmountOut('—')
  }

  return { status, estimate, error, txHash, amountOut, estimateSwap, swap, reset }
}
