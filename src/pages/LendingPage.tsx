import { useState } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { LENDING_MARKETS } from '../lib/config'
import { addHistory } from '../lib/history'
import { useUSDCBalance } from '../hooks/useTokenBalance'
import type { Translations } from '../lib/i18n'

interface Props { t: Translations }
type Mode = 'supply' | 'borrow'

export function LendingPage({ t }: Props) {
  const { isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { balance, formatted: balanceFormatted, maxStr } = useUSDCBalance()
  const [mode, setMode]         = useState<Mode>('supply')
  const [selected, setSelected] = useState<string | null>(null)
  const [amount, setAmount]     = useState('')
  const [txStatus, setTxStatus] = useState<'idle'|'pending'|'done'>('idle')

  const market = LENDING_MARKETS.find(m => m.token === selected)

  function handleAction() {
    if (!amount || !selected || !market) return
    setTxStatus('pending')
    setTimeout(() => {
      setTxStatus('done')
      addHistory({
        type: mode === 'supply' ? 'supply' : 'borrow',
        status: 'success',
        tokenIn: market.token, amountIn: amount,
      })
    }, 1500)
  }

  function resetModal() { setSelected(null); setAmount(''); setTxStatus('idle') }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>{t.lendingTitle}</h1>
        <p>{t.lendingDesc}</p>
      </div>

      <div className="mock-banner">
        🚧 <strong>Demo only</strong> — APY and market data are simulated. No real lending protocol is live on Arc Testnet yet.
      </div>

      <a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer" className="arcscan-banner">
        <span className="arcscan-icon">🔍</span>
        <span className="arcscan-text">
          <strong>ArcScan Explorer</strong>
          <span>View all transactions on Arc Testnet</span>
        </span>
        <span className="arcscan-arrow">↗</span>
      </a>
      <div className="mode-tabs">
        <button className={`mode-tab ${mode==='supply'?'active':''}`} onClick={() => setMode('supply')}>{t.supply}</button>
        <button className={`mode-tab ${mode==='borrow'?'active':''}`} onClick={() => setMode('borrow')}>{t.borrow}</button>
      </div>

      <div className="stats-banner">
        <div className="stat-item"><div className="stat-label">{t.tvlSupplied}</div><div className="stat-value">$18.7M</div></div>
        <div className="stat-item"><div className="stat-label">{t.tvlBorrowed}</div><div className="stat-value">$12.2M</div></div>
        <div className="stat-item"><div className="stat-label">{t.avgSupplyApy}</div><div className="stat-value green">4.7%</div></div>
        <div className="stat-item"><div className="stat-label">{t.yourPosition}</div><div className="stat-value">{isConnected ? '$0.00' : '—'}</div></div>
      </div>

      <div className="markets-grid">
        {LENDING_MARKETS.map(m => (
          <div key={m.token} className="market-card">
            <div className="market-header">
              <div className="market-icon" style={{ background: m.color+'20', color: m.color }}>{m.icon}</div>
              <div><div className="market-token">{m.token}</div><div className="market-sub">Arc Testnet</div></div>
              <div className="market-apy" style={{ color: m.color }}>
                {mode==='supply' ? m.supplyApy : m.borrowApy}%
                <div className="apy-label">{mode==='supply' ? t.supplyApy : t.borrowApy}</div>
              </div>
            </div>
            <div className="market-stats">
              <div className="mstat"><span>{mode==='supply' ? t.totalSupply : t.totalBorrow}</span><span>{mode==='supply' ? m.totalSupply : m.totalBorrow} {m.token}</span></div>
              <div className="mstat"><span>{t.utilization}</span><span>{m.utilization}%</span></div>
            </div>
            <div className="util-bar-bg"><div className="util-bar-fill" style={{ width:`${m.utilization}%`, background: m.color }} /></div>
            <button className="btn-primary market-btn" style={{ background: m.color }}
              onClick={() => { setSelected(m.token); setAmount(''); setTxStatus('idle') }}>
              {mode==='supply' ? t.supply : t.borrow} {m.token}
            </button>
          </div>
        ))}
      </div>

      {selected && market && (
        <div className="modal-overlay" onClick={resetModal}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>{mode==='supply' ? t.supply : t.borrow} {market.token}</span>
              <button className="modal-close" onClick={resetModal}>✕</button>
            </div>
            {txStatus === 'done' ? (
              <div className="done-box">
                <div className="done-icon">🎉</div>
                <div className="done-text">{mode==='supply' ? t.supplySuccess : t.borrowSuccess}</div>
                <div className="done-sub">{amount} {market.token} {mode==='supply' ? t.supplied : t.borrowed}</div>
                <button className="btn-secondary" onClick={resetModal}>{t.close}</button>
              </div>
            ) : (
              <>
                <div className="modal-info">
                  <div className="mstat"><span>APY</span><span style={{ color: market.color }}>{mode==='supply' ? market.supplyApy : market.borrowApy}%</span></div>
                  <div className="mstat"><span>{t.utilization}</span><span>{market.utilization}%</span></div>
                </div>
                <div className="field-group">
                  <label className="field-label">{t.amount} ({market.token})</label>
                  <div className="amount-wrap">
                    <input className="amount-input" type="number" min="0.01" step="0.01"
                      placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
                    <span className="amount-unit">{market.token}</span>
                  </div>
                  <div className="presets">{['1','10','100'].map(v => (
                    <button key={v} className="preset" onClick={() => setAmount(v)}>{v}</button>
                  ))}
                  <button className="preset preset-max" onClick={() => setAmount(maxStr)} disabled={!isConnected || balance <= 0}>Max</button></div>
                </div>
                {!isConnected ? (
                  <div className="connect-list">{connectors.map(c => (
                    <button key={c.id} className="btn-primary" onClick={() => connect({ connector: c })}>{t.connect} ({c.name})</button>
                  ))}</div>
                ) : txStatus === 'pending' ? (
                  <button className="btn-primary loading" disabled>{t.processing}</button>
                ) : (
                  <button className="btn-primary" style={{ background: market.color }}
                    onClick={handleAction} disabled={!amount || parseFloat(amount) <= 0}>
                    {mode==='supply' ? t.supply : t.borrow} {amount || '0'} {market.token}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
