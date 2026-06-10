import { useState, useEffect, useRef } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { TOKENS } from '../lib/config'
import { useSwap } from '../hooks/useSwap'
import { useTokenBalance } from '../hooks/useTokenBalance'
import type { Translations } from '../lib/i18n'

interface Props { t: Translations }

export function SwapPage({ t }: Props) {
  const { isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { status, estimate, error, txHash, amountOut, estimateSwap, swap, reset } = useSwap()

  // State must be declared BEFORE hooks that depend on them
  const [tokenIn,  setTokenIn]  = useState('USDC')
  const [tokenOut, setTokenOut] = useState('EURC')
  const [amount,   setAmount]   = useState('1')
  const [slippage, setSlippage] = useState('100')

  const { balance, formatted: balanceFormatted, maxStr } = useTokenBalance(tokenIn)
  const { formatted: balanceOutFormatted } = useTokenBalance(tokenOut)

  const tokIn  = TOKENS.find(t => t.symbol === tokenIn)!
  const tokOut = TOKENS.find(t => t.symbol === tokenOut)!

  function swapTokens() { const tmp = tokenIn; setTokenIn(tokenOut); setTokenOut(tmp); reset() }

  // Auto-estimate with debounce 600ms when amount/tokens change
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!isConnected || !amount || parseFloat(amount) <= 0) { return }
    reset() // clear old estimate first
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      estimateSwap(tokenIn, tokenOut, amount)
    }, 600)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [amount, tokenIn, tokenOut, isConnected])

  // Rate display — safe
  function rateDisplay() {
    if (!estimate || amountOut === '—') return '—'
    const a = parseFloat(amount)
    const b = parseFloat(amountOut)
    if (!a || !b || isNaN(a) || isNaN(b)) return '—'
    return `1 ${tokenIn} ≈ ${(b/a).toFixed(6)} ${tokenOut}`
  }

  const errMsg = error === 'connectFirst' ? t.connectFirst
               : error === 'noKitKey'     ? t.noKitKey
               : error

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>{t.swapTitle}</h1>
        <p>{t.swapDesc}</p>
      </div>

      <div className="swap-card">
        {/* From */}
        <div className="swap-field">
          <div className="swap-field-label">
            <span>{t.youPay}</span>
            <span className="balance-hint">{t.balance}: {isConnected ? balanceFormatted : '—'} {tokenIn}</span>
          </div>
          <div className="swap-field-inner">
            <input className="swap-amount-input" type="number" min="0.01" step="0.01"
              value={amount} placeholder="0.00"
              onChange={e => { setAmount(e.target.value); reset() }} />
            <select className="token-select" value={tokenIn}
              onChange={e => { setTokenIn(e.target.value); reset() }}
              style={{ borderColor: tokIn.color }}>
              {TOKENS.filter(t => t.symbol !== tokenOut).map(t => (
                <option key={t.symbol} value={t.symbol}>{t.icon} {t.symbol}</option>
              ))}
            </select>
          </div>
          <div className="presets">
            {['1','10','100'].map(v => (
              <button key={v} className="preset" onClick={() => { setAmount(v); reset() }}>{v}</button>
            ))}
            <button className="preset preset-max" onClick={() => { setAmount(maxStr); reset() }} disabled={!isConnected || balance <= 0}>Max</button>
          </div>
        </div>

        <button className="swap-arrow-btn" onClick={swapTokens}>⇅</button>

        {/* To */}
        <div className="swap-field">
          <div className="swap-field-label">
            <span>{t.youReceive}</span>
            <span className="balance-hint">{t.balance}: {isConnected ? balanceOutFormatted : '—'} {tokenOut}</span>
          </div>
          <div className="swap-field-inner">
            <div className="swap-amount-out">
              <span className={amountOut === '—' ? 'estimated-placeholder' : 'estimated-out'}>
                {status === 'estimating' ? '⏳ ...' : amountOut}
              </span>
              {amountOut !== '—' && status !== 'estimating' && (
                <span className="estimated-label">~ estimated</span>
              )}
            </div>
            <select className="token-select" value={tokenOut}
              onChange={e => { setTokenOut(e.target.value); reset() }}
              style={{ borderColor: tokOut.color }}>
              {TOKENS.filter(t => t.symbol !== tokenIn).map(t => (
                <option key={t.symbol} value={t.symbol}>{t.icon} {t.symbol}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Slippage */}
        <div className="slippage-row">
          <span>{t.slippage}</span>
          <div className="slippage-options">
            {['50','100','200','300'].map(v => (
              <button key={v} className={`slippage-btn ${slippage===v?'active':''}`}
                onClick={() => setSlippage(v)}>{parseInt(v)/100}%</button>
            ))}
          </div>
        </div>

        {/* Rate */}
        {estimate && amountOut !== '—' && (
          <div className="rate-box">
            <span>{t.rate}</span>
            <span>{rateDisplay()}</span>
          </div>
        )}

        {errMsg && <div className="error-box">❌ {errMsg}</div>}

        {status === 'done' && (
          <div className="done-box">
            <div className="done-icon">🎉</div>
            <div className="done-text">{t.swapSuccess}</div>
            <div className="done-sub">{amount} {tokenIn} → {amountOut} {tokenOut}</div>
            {txHash && (
              <a href={`https://testnet.arcscan.app/tx/${txHash}`} target="_blank"
                rel="noopener noreferrer" className="tx-link">{t.viewTx}</a>
            )}
            <button className="btn-secondary" onClick={reset}>{t.swapAgain}</button>
          </div>
        )}

        {status !== 'done' && (
          !isConnected ? (
            <div className="connect-list">
              {connectors.map(c => (
                <button key={c.id} className="btn-primary" onClick={() => connect({ connector: c })}>
                  {t.connect} ({c.name})
                </button>
              ))}
            </div>
          ) : status === 'estimating' ? (
            <button className="btn-primary loading" disabled>{t.gettingQuote}</button>
          ) : status === 'swapping' ? (
            <button className="btn-primary loading" disabled>{t.swapping}</button>
          ) : status === 'ready' ? (
            <button className="btn-primary" onClick={() => swap(tokenIn, tokenOut, amount, parseInt(slippage))}>
              {t.doSwap} {amount} {tokenIn} → {amountOut} {tokenOut}
            </button>
          ) : (
            <button className="btn-primary" onClick={() => estimateSwap(tokenIn, tokenOut, amount)}
              disabled={!amount || parseFloat(amount) <= 0}>{t.getQuote}</button>
          )
        )}

        <a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer" className="arcscan-banner">
          <span className="arcscan-icon">🔍</span>
          <span className="arcscan-text">
            <strong>ArcScan Explorer</strong>
            <span>View all transactions on Arc Testnet</span>
          </span>
          <span className="arcscan-arrow">↗</span>
        </a>
        <div className="swap-info">
          <div className="info-item"><span>⚡ Speed</span><span>~20s</span></div>
          <div className="info-item"><span>🔐 {t.protocol}</span><span>Circle Swap Kit</span></div>
          <div className="info-item"><span>⛓ Network</span><span>Arc Testnet</span></div>
          <div className="info-item"><span>💧 Tokens</span><span>USDC · EURC</span></div>
        </div>
      </div>
    </div>
  )
}
