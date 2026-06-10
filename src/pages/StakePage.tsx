import { useState } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { STAKING_POOLS } from '../lib/config'
import { addHistory } from '../lib/history'
import { useUSDCBalance } from '../hooks/useTokenBalance'
import type { Translations } from '../lib/i18n'

interface Props { t: Translations }

export function StakePage({ t }: Props) {
  const { isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { balance, formatted: balanceFormatted, maxStr } = useUSDCBalance()
  const [selected,  setSelected]  = useState<string | null>(null)
  const [action,    setAction]    = useState<'stake'|'unstake'>('stake')
  const [amount,    setAmount]    = useState('')
  const [txStatus,  setTxStatus]  = useState<'idle'|'pending'|'done'>('idle')

  const pool = STAKING_POOLS.find(p => p.name === selected)

  function handleAction() {
    if (!amount || !selected || !pool) return
    setTxStatus('pending')
    setTimeout(() => {
      setTxStatus('done')
      addHistory({ type: action, status: 'success', tokenIn: pool.token, amountIn: amount })
    }, 1500)
  }

  function resetModal() { setSelected(null); setAmount(''); setTxStatus('idle') }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>{t.stakeTitle}</h1>
        <p>{t.stakeDesc}</p>
      </div>

      <div className="mock-banner">
        🚧 <strong>Demo only</strong> — APY and pool data are simulated. No real staking protocol is live on Arc Testnet yet.
      </div>

      <a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer" className="arcscan-banner">
        <span className="arcscan-icon">🔍</span>
        <span className="arcscan-text">
          <strong>ArcScan Explorer</strong>
          <span>View all transactions on Arc Testnet</span>
        </span>
        <span className="arcscan-arrow">↗</span>
      </a>
      <div className="stats-banner">
        <div className="stat-item"><div className="stat-label">{t.tvlStaked}</div><div className="stat-value">$35.7M</div></div>
        <div className="stat-item"><div className="stat-label">{t.rewardsPaid}</div><div className="stat-value">$1.2M</div></div>
        <div className="stat-item"><div className="stat-label">{t.highestApy}</div><div className="stat-value green">6.5%</div></div>
        <div className="stat-item"><div className="stat-label">{t.yourStaked}</div><div className="stat-value">{isConnected ? '$0.00' : '—'}</div></div>
      </div>

      <div className="pools-grid">
        {STAKING_POOLS.map(p => (
          <div key={p.name} className="pool-card">
            <div className="pool-header">
              <div className="pool-icon" style={{ background: p.color+'20', color: p.color }}>{p.icon}</div>
              <div className="pool-title"><div className="pool-name">{p.name}</div><div className="pool-token">{p.token}</div></div>
              <div className={`risk-badge risk-${p.risk.toLowerCase()}`}>{p.risk}</div>
            </div>
            <div className="pool-apy" style={{ color: p.color }}>{p.apy}%<span className="pool-apy-label"> APY</span></div>
            <div className="pool-stats">
              <div className="mstat"><span>TVL</span><span>{p.tvl} {p.token}</span></div>
              <div className="mstat"><span>{t.lockup}</span><span>{p.lockup}</span></div>
              <div className="mstat"><span>{t.rewardsIn}</span><span>{p.reward}</span></div>
            </div>
            <div className="pool-actions">
              <button className="btn-primary pool-btn" style={{ background: p.color }}
                onClick={() => { setSelected(p.name); setAction('stake'); setAmount(''); setTxStatus('idle') }}>
                {t.stakeBtn}
              </button>
              <button className="btn-secondary pool-btn"
                onClick={() => { setSelected(p.name); setAction('unstake'); setAmount(''); setTxStatus('idle') }}>
                {t.unstakeBtn}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rewards-section">
        <h2>{t.yourRewards}</h2>
        {!isConnected ? (
          <div className="rewards-empty">{t.connectToView}</div>
        ) : (
          <div className="rewards-grid">
            {STAKING_POOLS.map(p => (
              <div key={p.name} className="reward-item">
                <span style={{ color: p.color }}>{p.icon} {p.token}</span>
                <span>0.000000 {p.reward}</span>
                <button className="btn-sm" disabled>{t.claim}</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && pool && (
        <div className="modal-overlay" onClick={resetModal}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>{action==='stake' ? t.stakeBtn : t.unstakeBtn} {pool.token}</span>
              <button className="modal-close" onClick={resetModal}>✕</button>
            </div>
            {txStatus === 'done' ? (
              <div className="done-box">
                <div className="done-icon">🎉</div>
                <div className="done-text">{action==='stake' ? t.staked : t.unstaked}!</div>
                <div className="done-sub">{amount} {pool.token}</div>
                {action==='stake' && <div className="done-sub" style={{fontSize:'12px',opacity:.7}}>{t.earningApy(pool.apy)}</div>}
                <button className="btn-secondary" onClick={resetModal}>{t.close}</button>
              </div>
            ) : (
              <>
                <div className="modal-info">
                  <div className="mstat"><span>APY</span><span style={{ color: pool.color }}>{pool.apy}%</span></div>
                  <div className="mstat"><span>{t.lockup}</span><span>{pool.lockup}</span></div>
                  <div className="mstat"><span>{t.rewardsIn}</span><span>{pool.reward}</span></div>
                </div>
                <div className="field-group">
                  <label className="field-label">{t.amount} ({pool.token})</label>
                  <div className="amount-wrap">
                    <input className="amount-input" type="number" min="0.01" step="0.01"
                      placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
                    <span className="amount-unit">{pool.token}</span>
                  </div>
                  <div className="presets">{['1','10','100'].map(v => (
                    <button key={v} className="preset" onClick={() => setAmount(v)}>{v}</button>
                  ))}
                  <button className="preset preset-max" onClick={() => setAmount(maxStr)} disabled={!isConnected || balance <= 0}>Max</button></div>
                </div>
                {amount && parseFloat(amount) > 0 && action==='stake' && (
                  <div className="estimate-row">
                    <span>{t.estYearlyRewards}</span>
                    <span style={{ color: pool.color }}>+{(parseFloat(amount)*pool.apy/100).toFixed(4)} {pool.reward}</span>
                  </div>
                )}
                {!isConnected ? (
                  <div className="connect-list">{connectors.map(c => (
                    <button key={c.id} className="btn-primary" onClick={() => connect({ connector: c })}>{t.connect} ({c.name})</button>
                  ))}</div>
                ) : txStatus === 'pending' ? (
                  <button className="btn-primary loading" disabled>{t.processing}</button>
                ) : (
                  <button className="btn-primary" style={{ background: action==='stake' ? pool.color : undefined }}
                    onClick={handleAction} disabled={!amount || parseFloat(amount) <= 0}>
                    {action==='stake' ? t.stakeBtn : t.unstakeBtn} {amount||'0'} {pool.token}
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
