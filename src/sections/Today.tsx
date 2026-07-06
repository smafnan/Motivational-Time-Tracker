import { useEffect, useState } from 'react'

export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

export default function Today() {
  const now = useNow()
  return (
    <section className="section">
      <ClockHero now={now} />
      <HoursPanel now={now} />
      <QuartersPanel now={now} />
    </section>
  )
}

export function ClockHero({ now }: { now: Date }) {
  const h = now.getHours()
  const m = now.getMinutes()
  const s = now.getSeconds()
  const dayPct = ((h * 60 + m + s / 60) / 1440) * 100
  const clock = [h, m, s].map((v) => String(v).padStart(2, '0'))

  return (
    <div className="hero">
      <p className="hero-kicker">
        {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>
      <div className="hero-num clock">
        {clock[0]}
        <span className="clock-sep">:</span>
        {clock[1]}
        <span className="clock-sec">{clock[2]}</span>
      </div>
      <div className="bar">
        <div className="bar-fill" style={{ width: `${dayPct}%` }} />
      </div>
      <div className="bar-meta">
        <span>{dayPct.toFixed(1)}% of today is gone</span>
        <span>{(100 - dayPct).toFixed(1)}% still yours</span>
      </div>
    </div>
  )
}

export function HoursPanel({ now }: { now: Date }) {
  const h = now.getHours()
  const hourFill = ((now.getMinutes() * 60 + now.getSeconds()) / 3600) * 100
  const hoursLeft = 24 - h - 1

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Hours</h2>
        <div className="panel-stat">
          <b>{h}</b> spent · <b className="accent">{hoursLeft}</b> whole hours left
        </div>
      </div>
      <div className="hgrid">
        {Array.from({ length: 24 }, (_, i) => {
          const cls = i < h ? 'spent' : i === h ? 'today' : 'left'
          return (
            <span
              key={i}
              className={`cell ${cls}`}
              title={`${String(i).padStart(2, '0')}:00${i === h ? ` — ${Math.round(hourFill)}% gone` : ''}`}
              style={i === h ? ({ ['--fill' as string]: `${hourFill}%` }) : undefined}
            >
              {i}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export function QuartersPanel({ now }: { now: Date }) {
  const minutesGone = now.getHours() * 60 + now.getMinutes()
  const quarterIdx = Math.floor(minutesGone / 15) // 0..95, the one running now
  const quartersLeft = 96 - quarterIdx - 1
  const quarterFill = ((((minutesGone % 15) * 60) + now.getSeconds()) / 900) * 100

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Quarter hours</h2>
        <div className="panel-stat">
          <b>{quarterIdx}</b> spent · <b className="accent">{quartersLeft}</b> × 15 min left
        </div>
      </div>
      <div className="qgrid">
        {Array.from({ length: 96 }, (_, i) => {
          const hh = String(Math.floor(i / 4)).padStart(2, '0')
          const mm = String((i % 4) * 15).padStart(2, '0')
          const cls = i < quarterIdx ? 'spent' : i === quarterIdx ? 'today' : 'left'
          return (
            <span
              key={i}
              className={`qcell ${cls}`}
              title={`${hh}:${mm}${i === quarterIdx ? ` — ${Math.round(quarterFill)}% gone` : ''}`}
              style={i === quarterIdx ? ({ ['--fill' as string]: `${quarterFill}%` }) : undefined}
            />
          )
        })}
      </div>
      <p className="muted small">
        Each square is 15 minutes. {quartersLeft} blocks is {(quartersLeft / 4).toFixed(1)} hours —
        enough to move something forward.
      </p>
    </div>
  )
}
