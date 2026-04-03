import { useState, useEffect } from 'react'
import { RANKS } from '../constants'
import { getRank } from '../utils'
import { sheetBackdrop, sheetBase } from './sharedStyles'
import SheetHandle from './SheetHandle'
import CountUp from './CountUp'

export default function RankBadge({ expenses, isIncognito }) {
  const [showInfo, setShowInfo] = useState(false)
  const [prev,     setPrev]     = useState(null)
  const [anim,     setAnim]     = useState(false)
  const days = expenses.length ? [...new Set(expenses.map(e => e.date))].length : 1
  const avg  = expenses.reduce((s, e) => s + e.amount, 0) / days
  const rank = getRank(avg)

  useEffect(() => {
    if (prev && prev !== rank.label) { setAnim(true); setTimeout(() => setAnim(false), 500) }
    setPrev(rank.label)
  }, [rank.label])

  return (
    <>
      <button onClick={() => setShowInfo(true)} style={{
        padding: '4px 11px', borderRadius: 20,
        background: rank.bg, color: rank.color,
        fontSize: 12, fontWeight: 600,
        border: `1px solid ${rank.color}33`,
        animation: anim ? 'rankPop 0.45s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
        cursor: 'pointer', whiteSpace: 'nowrap',
      }}>{rank.label}</button>

      {showInfo && (
        <>
          <div onClick={() => setShowInfo(false)} style={sheetBackdrop} />
          <div style={{ ...sheetBase, paddingBottom: 'calc(28px + var(--safe-bottom))', maxHeight: '75vh', overflowY: 'auto' }}>
            <SheetHandle />
            <div style={{ padding: '4px 20px 20px' }}>
              <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Your Saver Rank</p>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 16 }}>
                Based on daily avg spend · currently <strong style={{ color: rank.color }}><CountUp end={Math.round(avg)} isIncognito={isIncognito} />/day</strong>
              </p>
              {RANKS.map(r => (
                <div key={r.label} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 14, marginBottom: 8,
                  background: r.label === rank.label ? r.bg : 'var(--bg-elevated)',
                  border: `1.5px solid ${r.label === rank.label ? r.color + '88' : 'var(--border)'}`,
                  ...(r.label === rank.label ? {
                    '--glow-color': r.color + '55',
                    '--glow-color-soft': r.color + '22',
                    animation: 'rankBorderGlow 2.4s ease-in-out infinite',
                  } : {}),
                }}>
                  <span style={{ fontSize: 22, minWidth: 30 }}>{r.label.split(' ')[0]}</span>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: r.label === rank.label ? r.color : 'var(--text-primary)' }}>
                      {r.label.split(' ').slice(1).join(' ')}
                      {r.label === rank.label && <span style={{ fontSize: 11, marginLeft: 6, opacity: 0.7 }}>← you</span>}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}
