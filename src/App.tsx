import { useEffect, useState } from 'react'
import { AppState, loadState, saveState } from './lib'
import Countdown from './sections/Countdown'
import Today from './sections/Today'
import Checklist from './sections/Checklist'
import Growth from './sections/Growth'
import Overview from './sections/Overview'
import Canvas from './sections/Canvas'

type Tab = 'countdown' | 'today' | 'checklist' | 'growth' | 'all' | 'canvas'
type Theme = 'paper' | 'night' | 'neo'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'countdown', label: 'Countdown', icon: '◳' },
  { id: 'today', label: 'Today', icon: '◔' },
  { id: 'checklist', label: 'Checklist', icon: '▦' },
  { id: 'growth', label: 'Growth', icon: '◮' },
  { id: 'all', label: 'All', icon: '✦' },
  { id: 'canvas', label: 'Canvas', icon: '✥' },
]

const THEMES: { id: Theme; icon: string; title: string }[] = [
  { id: 'paper', icon: '☀', title: 'Paper — hand-drawn light' },
  { id: 'night', icon: '☾', title: 'Night — hand-drawn dark' },
  { id: 'neo', icon: '◇', title: 'Neo — modern & futuristic' },
]

function initialTab(): Tab {
  const t = new URLSearchParams(location.search).get('tab')
  return TABS.some((x) => x.id === t) ? (t as Tab) : 'countdown'
}

function initialTheme(): Theme {
  const t = localStorage.getItem('compound.theme')
  return THEMES.some((x) => x.id === t) ? (t as Theme) : 'paper'
}

export default function App() {
  const [state, setState] = useState<AppState>(loadState)
  const [tab, setTab] = useState<Tab>(initialTab)
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('compound.theme', theme)
  }, [theme])

  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void document.documentElement.requestFullscreen().catch(() => {})
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <svg className="brand-sun" viewBox="0 0 48 48" aria-hidden>
            <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
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

        <div className="ctrls">
          <div className="theme-picker" role="group" aria-label="Theme">
            {THEMES.map((t) => (
              <button
                key={t.id}
                className={`ctrl-btn ${theme === t.id ? 'active' : ''}`}
                title={t.title}
                onClick={() => setTheme(t.id)}
              >
                {t.icon}
              </button>
            ))}
          </div>
          <button
            className="ctrl-btn"
            title={fullscreen ? 'Exit full screen' : 'Full screen'}
            onClick={toggleFullscreen}
          >
            {fullscreen ? '🗗' : '⛶'}
          </button>
        </div>
      </header>

      <main className="content">
        {tab === 'countdown' && <Countdown state={state} setState={setState} />}
        {tab === 'today' && <Today />}
        {tab === 'checklist' && <Checklist state={state} setState={setState} />}
        {tab === 'growth' && <Growth state={state} />}
        {tab === 'all' && <Overview state={state} />}
        {tab === 'canvas' && <Canvas state={state} setState={setState} />}
      </main>

      <footer className="foot">every day counts !</footer>
    </div>
  )
}
