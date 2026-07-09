import type { jsPDF } from 'jspdf'
import {
  AppState, addDays, compoundSeries, currentStreak, dayScore, fmtDate,
  focusMinutes, taskStats, trailingAvg,
} from './lib'

export type ReportRange = 7 | 30 | 90 | 365

// print palette — validated (dataviz six checks) against a white surface:
// gold #A9782E carries magnitude; green/red are status-only and always
// accompanied by a text label; all values/labels render in ink.
const INK: [number, number, number] = [27, 27, 27]
const PAPER: [number, number, number] = [251, 247, 238]
const GOLD: [number, number, number] = [169, 120, 46]
const GOLD_SOFT: [number, number, number] = [236, 224, 200]
const GRAY: [number, number, number] = [110, 106, 94]
const FAINT: [number, number, number] = [222, 216, 200]
const GREEN: [number, number, number] = [44, 140, 74]

const M = 16 // page margin, mm
const W = 210 - M * 2 // content width

let goblockB64: string | null | undefined

async function loadGoblock(): Promise<string | null> {
  if (goblockB64 !== undefined) return goblockB64
  try {
    const buf = await (await fetch('./fonts/GoblockBold.ttf')).arrayBuffer()
    const bytes = new Uint8Array(buf)
    let bin = ''
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
    }
    goblockB64 = btoa(bin)
  } catch {
    goblockB64 = null
  }
  return goblockB64
}

const short = (d: Date) =>
  d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

export async function downloadReport(state: AppState, range: ReportRange): Promise<void> {
  const { jsPDF } = await import('jspdf') // lazy: keeps the main bundle light
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const b64 = await loadGoblock()
  if (b64) {
    doc.addFileToVFS('Goblock.ttf', b64)
    doc.addFont('Goblock.ttf', 'Goblock', 'normal')
  }
  const display = b64 ? 'Goblock' : 'helvetica'

  // ---------- data ----------
  const scores: (number | null)[] = []
  for (let i = range - 1; i >= 0; i--) {
    scores.push(dayScore(state, fmtDate(addDays(today, -i))))
  }
  // weekly buckets keep the long ranges readable (thin-mark rule)
  const weekly = range > 60
  const series: (number | null)[] = weekly
    ? Array.from({ length: Math.ceil(range / 7) }, (_, w) => {
        const chunk = scores.slice(w * 7, w * 7 + 7).filter((v): v is number => v !== null)
        return chunk.length ? chunk.reduce((a, b) => a + b, 0) / chunk.length : null
      })
    : scores

  const avg = trailingAvg(state, range, now)
  const streak = currentStreak(state, now)
  const focusH = Math.round((focusMinutes(state, range, now) / 60) * 10) / 10
  const rated = scores.filter((v): v is number => v !== null)
  const best = rated.length ? Math.max(...rated) : null
  const stats = taskStats(state, range, now).filter((t) => t.pct !== null)
  const compound = compoundSeries(state, range, now)
  const index = compound[compound.length - 1] ?? 1

  const from = addDays(today, -(range - 1))
  const rangeLabel = `${short(from)} — ${short(today)}`

  // ---------- header band ----------
  doc.setFillColor(...INK)
  doc.rect(0, 0, 210, 34, 'F')
  doc.setFont(display, 'normal')
  doc.setTextColor(...PAPER)
  doc.setFontSize(24)
  doc.text('COMPOUND', M, 16)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(217, 178, 95)
  doc.text('PROGRESS REPORT', M, 24)
  doc.setTextColor(...PAPER)
  doc.text(rangeLabel, 210 - M, 16, { align: 'right' })
  const who = state.profile.name || 'Anonymous compounder'
  doc.text(who, 210 - M, 24, { align: 'right' })

  // ---------- stat tiles ----------
  let y = 44
  const tiles: { k: string; v: string; s: string }[] = [
    { k: 'AVG PRODUCTIVITY', v: avg === null ? '—' : `${Math.round(avg * 100)}%`, s: `over ${range} days` },
    { k: 'BEST DAY', v: best === null ? '—' : `${Math.round(best * 100)}%`, s: 'single-day peak' },
    { k: 'STREAK', v: `${streak}`, s: 'days running' },
    { k: 'FOCUS', v: `${focusH}h`, s: 'timed deep work' },
  ]
  const tw = (W - 3 * 5) / 4
  tiles.forEach((t, i) => {
    const x = M + i * (tw + 5)
    doc.setDrawColor(...INK)
    doc.setLineWidth(0.45)
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(x, y, tw, 25, 2.5, 2.5, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(...GRAY)
    doc.text(t.k, x + 4, y + 6.5)
    doc.setFont(display, 'normal')
    doc.setFontSize(17)
    doc.setTextColor(...INK)
    doc.text(t.v, x + 4, y + 16.5)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(...GRAY)
    doc.text(t.s, x + 4, y + 21.5)
  })

  // ---------- daily rhythm bars ----------
  y = 84
  sectionTitle(doc, display, weekly ? 'WEEKLY RHYTHM' : 'DAILY RHYTHM', y)
  y += 5
  const chartH = 34
  const baseY = y + chartH
  const n = series.length
  const slot = W / n
  const barW = Math.max(0.9, slot * 0.66)
  let maxIdx = -1
  series.forEach((v, i) => {
    if (v !== null && (maxIdx === -1 || v > (series[maxIdx] ?? 0))) maxIdx = i
  })
  series.forEach((v, i) => {
    const x = M + i * slot + (slot - barW) / 2
    if (v === null) {
      doc.setFillColor(...FAINT)
      doc.rect(x, baseY - 0.8, barW, 0.8, 'F')
      return
    }
    const h = Math.max(1, v * chartH)
    doc.setFillColor(...GOLD)
    doc.roundedRect(x, baseY - h, barW, h, Math.min(0.9, barW / 3), Math.min(0.9, barW / 3), 'F')
  })
  // baseline + selective labels (max and endpoints only)
  doc.setDrawColor(...INK)
  doc.setLineWidth(0.4)
  doc.line(M, baseY, M + W, baseY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(...GRAY)
  doc.text(weekly ? `wk of ${short(from)}` : short(from), M, baseY + 4)
  doc.text(short(today), M + W, baseY + 4, { align: 'right' })
  if (maxIdx >= 0) {
    const v = series[maxIdx]!
    const x = M + maxIdx * slot + slot / 2
    doc.setTextColor(...INK)
    doc.setFont('helvetica', 'bold')
    doc.text(`${Math.round(v * 100)}%`, x, baseY - v * chartH - 1.5, { align: 'center' })
  }

  // ---------- habits ----------
  y = baseY + 12
  sectionTitle(doc, display, 'HABITS', y)
  y += 6
  const shown = stats.slice(0, 10)
  shown.forEach((t) => {
    const pct = t.pct ?? 0
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...INK)
    doc.text(t.name.length > 34 ? t.name.slice(0, 33) + '…' : t.name, M, y + 3)
    const trackX = M + 78
    const trackW = 72
    doc.setFillColor(...GOLD_SOFT)
    doc.roundedRect(trackX, y, trackW, 4, 1.4, 1.4, 'F')
    if (pct > 0) {
      doc.setFillColor(...GOLD)
      doc.roundedRect(trackX, y, Math.max(2.5, trackW * pct), 4, 1.4, 1.4, 'F')
    }
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...INK)
    doc.text(`${Math.round(pct * 100)}%`, trackX + trackW + 5, y + 3.4)
    if (t.streak >= 3) {
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...GREEN)
      doc.text(`${t.streak}d streak`, 210 - M, y + 3.4, { align: 'right' })
    }
    y += 7.5
  })
  if (stats.length > shown.length) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...GRAY)
    doc.text(`+ ${stats.length - shown.length} more habits`, M, y + 2)
    y += 6
  }
  if (shown.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...GRAY)
    doc.text('No habit data in this window yet.', M, y + 3)
    y += 8
  }

  // ---------- compound curve ----------
  y += 6
  sectionTitle(doc, display, 'THE COMPOUND CURVE', y)
  y += 5
  const curveH = 32
  const cBase = y + curveH
  const min = Math.min(...compound, 1)
  const max = Math.max(...compound, 1.001)
  const px = (i: number) => M + (i / (compound.length - 1)) * W
  const py = (v: number) => cBase - ((v - min) / (max - min)) * curveH
  // dashed baseline at 1.0
  doc.setDrawColor(...FAINT)
  doc.setLineWidth(0.35)
  doc.setLineDashPattern([1.4, 1.4], 0)
  doc.line(M, py(1), M + W, py(1))
  doc.setLineDashPattern([], 0)
  // the line (single series, 2px-equivalent)
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(0.7)
  for (let i = 1; i < compound.length; i++) {
    doc.line(px(i - 1), py(compound[i - 1]), px(i), py(compound[i]))
  }
  // end marker + direct label
  doc.setFillColor(...INK)
  doc.circle(px(compound.length - 1), py(index), 1.1, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...INK)
  doc.text(`×${index.toFixed(3)}`, 210 - M, py(index) - 2.5, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(...GRAY)
  doc.text('1.00', M, py(1) - 1.5)

  // ---------- footer ----------
  const fy = 285
  doc.setDrawColor(...FAINT)
  doc.setLineWidth(0.3)
  doc.line(M, fy - 6, 210 - M, fy - 6)
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7.5)
  doc.setTextColor(...GRAY)
  doc.text('1% better every day for a year is ×37.8. Small things, done daily, are not small.', M, fy)
  doc.setFont('helvetica', 'normal')
  doc.text(`generated ${now.toLocaleDateString()} · compound`, 210 - M, fy, { align: 'right' })

  doc.save(`compound-report-${range}d-${fmtDate(today)}.pdf`)
}

function sectionTitle(doc: jsPDF, display: string, text: string, y: number): void {
  doc.setFont(display, 'normal')
  doc.setFontSize(10.5)
  doc.setTextColor(...GOLD)
  doc.text(text, M, y)
  const w = doc.getTextWidth(text)
  doc.setDrawColor(...FAINT)
  doc.setLineWidth(0.3)
  doc.line(M + w + 4, y - 1.2, 210 - M, y - 1.2)
}
