import { useEffect, useState } from 'react'
import { AppState, loadState, saveState } from './lib'
import Countdown from './sections/Countdown'
import Today from './sections/Today'
import Checklist from './sections/Checklist'
import Growth from './sections/Growth'
import Overview from './sections/Overview'

type Tab = 'countdown' | 'today' | 'checklist' | 'growth' | 'all'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'countdown', label: 'Countdown', icon: '◳' },
  { id: 'today', label: 'Today', icon: '◔' },
  { id: 'checklist', label: 'Checklist', icon: '▦' },
  { id: 'growth', label: 'Growth', icon: '◮' },
  { id: 'all', label: 'All', icon: '✦' },
]

function initialTab(): Tab {
  const t = new URLSearchParams(location.search).get('tab')
  return TABS.some((x) => x.id === t) ? (t as Tab) : 'countdown'
}

export default function App() {
  const [state, setState] = useState<AppState>(loadState)
  const [tab, setTab] = useState<Tab>(initialTab)

  useEffect(() => {
    saveState(state)
  }, [state])

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <svg className="brand-sun" viewBox="0 0 48 48" aria-hidden>
            <g stroke="#1B1B1B" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="24" cy="24" r="11" fill="#F7C948" />
              <line x1="24" y1="3" x2="24" y2="9" />
              <line x1="24" y1="39" x2="24" y2="45" />
              <line x1="3" y1="24" x2="9" y2="24" />
              <line x1="39" y1="24" x2="45" y2="24" />
              <line x1="9" y1="9" x2="13.5" y2="13.5" />
              <line x1="34.5" y1="34.5" x2="39" y2="39" />
              <line x1="39" y1="9" x2="34.5" y2="13.5" />
              <line x1="13.5" y1="34.5" x2="9" y2="39" />
            </g>
            <g fill="#1B1B1B">
              <rect x="17" y="20" width="6" height="4" rx="1.5" />
              <rect x="25" y="20" width="6" height="4" rx="1.5" />
              <rect x="22" y="21" width="4" height="1.6" />
            </g>
            <path d="M19 29 q5 4 10 0" stroke="#1B1B1B" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
          COMPOUND
        </div>
        <nav className="tabs" aria-label="Sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span className="tab-icon" aria-hidden>{t.icon}</span>
              <span className="tab-label">{t.label}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className="content">
        {tab === 'countdown' && <Countdown state={state} setState={setState} />}
        {tab === 'today' && <Today />}
        {tab === 'checklist' && <Checklist state={state} setState={setState} />}
        {tab === 'growth' && <Growth state={state} />}
        {tab === 'all' && <Overview state={state} />}
      </main>

      <footer className="foot">every day counts !</footer>
    </div>
  )
}
