import { useEffect, useRef, useState } from 'react'
import { AppState, CanvasItem, WidgetKind, parseDate, uid } from '../lib'
import { Hero, MonthGrid } from './Countdown'
import { ClockHero, HoursPanel, QuartersPanel, useNow } from './Today'
import { ChartPanel, GrowthCards } from './Growth'

interface Props {
  state: AppState
  setState: React.Dispatch<React.SetStateAction<AppState>>
}

const PALETTE: { kind: WidgetKind; label: string; icon: string }[] = [
  { kind: 'clock', label: 'Clock', icon: '◔' },
  { kind: 'pomodoro', label: 'Focus timer', icon: '⏱' },
  { kind: 'countdown', label: 'Countdown', icon: '◳' },
  { kind: 'month', label: 'Month', icon: '▤' },
  { kind: 'hours', label: 'Hours', icon: '▥' },
  { kind: 'quarters', label: 'Quarters', icon: '▦' },
  { kind: 'growth', label: 'Growth', icon: '◮' },
  { kind: 'curve', label: 'Curve', icon: '∿' },
]

/** Free-form dashboard: drop any widget anywhere, drag it wherever you want. */
export default function Canvas({ state, setState }: Props) {
  const now = useNow()
  const boardRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null)
  // live position while dragging — committed to (and saved in) state on release
  const [live, setLive] = useState<{ id: string; x: number; y: number } | null>(null)
  const liveRef = useRef<{ id: string; x: number; y: number } | null>(null)

  const items = state.canvas
  const maxZ = items.reduce((m, i) => Math.max(m, i.z), 0)

  function add(kind: WidgetKind, x?: number, y?: number) {
    setState((s) => {
      const n = s.canvas.length
      const z = s.canvas.reduce((m, i) => Math.max(m, i.z), 0) + 1
      const item: CanvasItem = {
        id: uid(),
        kind,
        x: Math.max(0, x ?? 24 + (n % 6) * 48),
        y: Math.max(0, y ?? 24 + (n % 6) * 48),
        z,
      }
      return { ...s, canvas: [...s.canvas, item] }
    })
  }

  function remove(id: string) {
    setState((s) => ({ ...s, canvas: s.canvas.filter((i) => i.id !== id) }))
  }

  function bringToFront(id: string) {
    setState((s) => ({
      ...s,
      canvas: s.canvas.map((i) => (i.id === id ? { ...i, z: maxZ + 1 } : i)),
    }))
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const kind = e.dataTransfer.getData('widget') as WidgetKind
    if (!PALETTE.some((p) => p.kind === kind)) return
    const r = boardRef.current!.getBoundingClientRect()
    add(kind, e.clientX - r.left - 60, e.clientY - r.top - 16)
  }

  function onHandleDown(e: React.PointerEvent, item: CanvasItem) {
    if ((e.target as Element).closest('button')) return // let ✕ clicks through
    const r = boardRef.current!.getBoundingClientRect()
    dragRef.current = { id: item.id, dx: e.clientX - r.left - item.x, dy: e.clientY - r.top - item.y }
    bringToFront(item.id)
    try {
      ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    } catch {
      // pointer capture unsupported — move/up on the handle still work
    }
  }

  function onHandleMove(e: React.PointerEvent) {
    const d = dragRef.current
    if (!d) return
    const r = boardRef.current!.getBoundingClientRect()
    const x = Math.min(Math.max(e.clientX - r.left - d.dx, 0), Math.max(r.width - 120, 0))
    const y = Math.min(Math.max(e.clientY - r.top - d.dy, 0), Math.max(r.height - 48, 0))
    liveRef.current = { id: d.id, x, y }
    setLive(liveRef.current)
  }

  function onHandleUp() {
    const d = dragRef.current
    const pos = liveRef.current
    dragRef.current = null
    liveRef.current = null
    if (d && pos && pos.id === d.id) {
      setState((s) => ({
        ...s,
        canvas: s.canvas.map((i) => (i.id === d.id ? { ...i, x: pos.x, y: pos.y } : i)),
      }))
    }
    setLive(null)
  }

  return (
    <section className="section">
      <div className="panel pal-panel">
        <div className="panel-head">
          <h2>Canvas</h2>
          <div className="panel-stat">click a widget to add it — then drag it anywhere</div>
        </div>
        <div className="palette">
          {PALETTE.map((p) => (
            <button
              key={p.kind}
              className="pal-chip"
              draggable
              onDragStart={(e) => e.dataTransfer.setData('widget', p.kind)}
              onClick={() => add(p.kind)}
              title={`Add ${p.label}`}
            >
              <span aria-hidden>{p.icon}</span> {p.label}
            </button>
          ))}
          {items.length > 0 && (
            <button
              className="btn-ghost"
              onClick={() => setState((s) => ({ ...s, canvas: [] }))}
              title="Remove all widgets"
            >
              clear all
            </button>
          )}
        </div>
      </div>

      <div
        className="board"
        ref={boardRef}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        {items.length === 0 && (
          <div className="board-hint">
            your space is empty — grab a widget from the tray above
            <br />
            and build the screen <em>you</em> want to stare at
          </div>
        )}
        {items.map((item) => {
          const pos = live && live.id === item.id ? live : item
          return (
            <div
              key={item.id}
              className={`widget widget-${item.kind}`}
              style={{ left: pos.x, top: pos.y, zIndex: item.z }}
            >
              <div
                className="widget-head"
                onPointerDown={(e) => onHandleDown(e, item)}
                onPointerMove={onHandleMove}
                onPointerUp={onHandleUp}
                onPointerCancel={onHandleUp}
              >
                <span className="widget-grip" aria-hidden>⣿</span>
                <span className="widget-title">
                  {PALETTE.find((p) => p.kind === item.kind)?.label}
                </span>
                <button className="icon-btn tiny" title="Remove" onClick={() => remove(item.id)}>
                  ✕
                </button>
              </div>
              <div className="widget-body">
                <Widget kind={item.kind} state={state} now={now} />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function Widget({ kind, state, now }: { kind: WidgetKind; state: AppState; now: Date }) {
  const primary =
    state.deadlines.find((d) => d.id === state.primaryId) ?? state.deadlines[0] ?? null

  switch (kind) {
    case 'clock':
      return <ClockHero now={now} />
    case 'pomodoro':
      return <Pomodoro />
    case 'countdown':
      return primary
        ? <Hero deadline={primary} now={now} />
        : <p className="muted">No deadline yet — add one in the Countdown tab.</p>
    case 'month': {
      const start = primary ? parseDate(primary.start) : new Date(now.getFullYear(), now.getMonth(), 1)
      const end = primary ? parseDate(primary.date) : new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return <MonthGrid year={now.getFullYear()} month={now.getMonth()} start={start} end={end} now={now} />
    }
    case 'hours':
      return <HoursPanel now={now} />
    case 'quarters':
      return <QuartersPanel now={now} />
    case 'growth':
      return <GrowthCards state={state} />
    case 'curve':
      return <ChartPanel state={state} />
  }
}

/** A simple focus timer: pick a block, start, stay until the sand runs out. */
function Pomodoro() {
  const [total, setTotal] = useState(25 * 60)
  const [left, setLeft] = useState(25 * 60)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          setRunning(false)
          return 0
        }
        return l - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [running])

  function reset(mins: number) {
    setTotal(mins * 60)
    setLeft(mins * 60)
    setRunning(false)
  }

  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  const pct = total === 0 ? 0 : ((total - left) / total) * 100

  return (
    <div className="pomodoro">
      <div className={`pomo-time ${left === 0 ? 'done' : ''}`}>{mm}:{ss}</div>
      <div className="bar"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
      <div className="pomo-controls">
        <button className="btn-accent" onClick={() => (left === 0 ? reset(total / 60) : setRunning(!running))}>
          {left === 0 ? 'again' : running ? 'pause' : 'start'}
        </button>
        {[25, 15, 5].map((m) => (
          <button key={m} className="btn-ghost" onClick={() => reset(m)}>{m}m</button>
        ))}
      </div>
      {left === 0 && <p className="muted small">block done — tick something off ✓</p>}
    </div>
  )
}
