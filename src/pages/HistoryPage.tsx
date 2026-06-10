import { useState, useEffect } from 'react'
import { loadHistory, clearHistory, TxRecord } from '../lib/history'
import type { Translations } from '../lib/i18n'

interface Props { t: Translations }

function timeAgo(ts: number, t: Translations) {
  const d = (Date.now() - ts) / 1000
  if (d < 60)   return t.justNow
  if (d < 3600) return t.minAgo(Math.floor(d / 60))
  if (d < 86400) return t.hourAgo(Math.floor(d / 3600))
  return t.dayAgo(Math.floor(d / 86400))
}

const TYPE_ICON: Record<string, string> = {
  swap: '⇄', supply: '📈', borrow: '💸', stake: '🔒', unstake: '🔓'
}

export function HistoryPage({ t }: Props) {
  const [history, setHistory] = useState<TxRecord[]>([])

  useEffect(() => { setHistory(loadHistory()) }, [])

  function handleClear() { clearHistory(); setHistory([]) }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>{t.historyTitle}</h1>
      </div>

      {history.length === 0 ? (
        <div className="history-empty">{t.noHistory}</div>
      ) : (
        <>
          <div className="history-list">
            {history.map(tx => (
              <div key={tx.id} className={`history-item hi-${tx.status}`}>
                <div className="hi-left">
                  <span className="hi-type-icon">{TYPE_ICON[tx.type] ?? '•'}</span>
                  <div className="hi-info">
                    <div className="hi-route">
                      <span className="hi-token">{tx.tokenIn}</span>
                      {tx.tokenOut && <><span className="hi-arrow"> → </span><span className="hi-token">{tx.tokenOut}</span></>}
                    </div>
                    <div className="hi-amounts">
                      {tx.amountIn} {tx.tokenIn}
                      {tx.amountOut && tx.amountOut !== '—' && ` → ${tx.amountOut} ${tx.tokenOut}`}
                    </div>
                  </div>
                </div>
                <div className="hi-right">
                  <span className={`hi-status hi-${tx.status}`}>
                    {tx.status === 'success' ? '✅' : tx.status === 'error' ? '❌' : '⏳'} {tx.status}
                  </span>
                  <span className="hi-time">{timeAgo(tx.timestamp, t)}</span>
                  {tx.explorerUrl && (
                    <a href={tx.explorerUrl} target="_blank" rel="noopener noreferrer" className="hi-link">
                      {t.viewTx}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button className="btn-secondary" style={{ marginTop: '16px' }} onClick={handleClear}>
            {t.clearHistory}
          </button>
        </>
      )}
    </div>
  )
}
