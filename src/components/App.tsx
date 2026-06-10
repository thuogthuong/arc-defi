import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { CryptoBg } from './CryptoBg'
import { SwapPage }    from '../pages/SwapPage'
import { LendingPage } from '../pages/LendingPage'
import { StakePage }   from '../pages/StakePage'
import { HistoryPage } from '../pages/HistoryPage'
import { T, Lang } from '../lib/i18n'
import { loadHistory } from '../lib/history'

type Tab = 'swap' | 'lending' | 'stake' | 'history'

function shortAddr(a: string) { return `${a.slice(0,6)}...${a.slice(-4)}` }

export function App() {
  const { address, isConnected } = useAccount()
  const { connect, connectors }  = useConnect()
  const { disconnect }           = useDisconnect()

  const [tab,  setTab]  = useState<Tab>('swap')
  const [dark, setDark] = useState(() => localStorage.getItem('arc-defi-theme') === 'dark')
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('arc-defi-lang') as Lang) || 'en')
  const [historyCount, setHistoryCount] = useState(() => loadHistory().length)

  const t = T[lang]

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('arc-defi-theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    localStorage.setItem('arc-defi-lang', lang)
  }, [lang])

  // Refresh history count when switching tabs
  useEffect(() => {
    if (tab === 'history') setHistoryCount(loadHistory().length)
  }, [tab])

  const TABS: { id: Tab; icon: string; label: string }[] = [
    { id: 'swap',    icon: '⇄',  label: t.swap    },
    { id: 'lending', icon: '🏦', label: t.lending  },
    { id: 'stake',   icon: '🔒', label: t.stake    },
    { id: 'history', icon: '📜', label: t.historyTab },
  ]

  return (
    <div className="app">
      <CryptoBg />

      <header className="header">
        <div className="logo">
          <span className="logo-icon">⬡</span>
          <span className="logo-name">{t.appName}</span>
          <span className="logo-sub">{t.network}</span>
        </div>

        <nav className="main-nav">
          {TABS.map(tb => (
            <button key={tb.id} className={`nav-btn ${tab===tb.id?'active':''}`}
              onClick={() => setTab(tb.id)}>
              {tb.icon} {tb.label}
              {tb.id === 'history' && historyCount > 0 && (
                <span className="nav-badge">{historyCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="header-right">
          {/* Language */}
          <button className="theme-toggle"
            onClick={() => setLang(lang==='en'?'vi':'en')}
            style={{ fontSize:'12px', fontWeight:700 }}>
            {lang==='en' ? '🇻🇳 VI' : '🇺🇸 EN'}
          </button>
          {/* Theme */}
          <button className="theme-toggle" onClick={() => setDark(!dark)}>
            {dark ? '☀️' : '🌙'}
          </button>
          {isConnected ? (
            <div className="wallet-row">
              <span className="chain-pill">Arc Testnet</span>
              <span className="wallet-addr">{shortAddr(address!)}</span>
              <button className="btn-sm" onClick={() => disconnect()}>{t.disconnect}</button>
            </div>
          ) : (
            connectors.slice(0,1).map(c => (
              <button key={c.id} className="btn-sm btn-connect"
                onClick={() => connect({ connector: c })}>{t.connect}</button>
            ))
          )}
        </div>
      </header>

      <main className="main">
        {tab === 'swap'    && <SwapPage    t={t} />}
        {tab === 'lending' && <LendingPage t={t} />}
        {tab === 'stake'   && <StakePage   t={t} />}
        {tab === 'history' && <HistoryPage t={t} />}
      </main>

      <footer className="footer">
        <span className="footer-brand">⬡ Built by <strong>Namcamm</strong></span>
        <span>Arc DeFi · Powered by Circle · Testnet only</span>

      </footer>
    </div>
  )
}
