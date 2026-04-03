import { useState, useEffect } from 'react'
import { computeStreak } from '../utils'
import { sheetBackdrop, sheetBase } from './sharedStyles'
import SheetHandle from './SheetHandle'

function streakAffirmation(streak) {
  if (streak >= 30) return { msg: "Incredible dedication! 🏆", sub: "Mindful spending has become a true lifestyle for you." }
  if (streak >= 14) return { msg: "Amazing consistency! 💪", sub: "You've proven that you can stick with your goals long-term." }
  if (streak >= 7)  return { msg: "You're officially on fire! 🔥", sub: "You've built the momentum needed to make lasting changes." }
  if (streak >= 3)  return { msg: "Building real momentum! 🎉", sub: "You've pushed through the initial hurdle of starting a new habit." }
  return { msg: "Great start — keep it up! ✨", sub: "Small, daily actions lead to big financial wins over time." }
}

function StreakSheet({ streak, onClose }) {
  const { msg, sub } = streakAffirmation(streak)
  return (
    <>
      <div onClick={onClose} style={sheetBackdrop} />
      <div style={{ ...sheetBase, paddingBottom: 'calc(32px + var(--safe-bottom))' }}>
        <SheetHandle />
        <div style={{ padding: '8px 24px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 8, display: 'inline-block', animation: 'streakFlame 1.4s ease-in-out infinite' }}>🔥</div>
          <p style={{ fontSize: 48, fontWeight: 800, color: streak >= 7 ? '#e65100' : '#f57f17', lineHeight: 1, marginBottom: 4 }}>{streak}</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 20 }}>day streak</p>
          <div style={{ background: streak >= 7 ? '#fff3e0' : '#fff8e1', border: `1px solid ${streak >= 7 ? '#ffb74d' : '#ffe082'}`, borderRadius: 'var(--radius-md)', padding: '16px 18px', marginBottom: 8 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: streak >= 7 ? '#e65100' : '#f57f17', marginBottom: 6 }}>{msg}</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{sub}</p>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 12 }}>Track an expense today to keep your streak alive.</p>
        </div>
      </div>
    </>
  )
}

export default function StreakBadge({ expenses }) {
  const streak = computeStreak(expenses)
  const [prev, setPrev] = useState(streak)
  const [anim, setAnim] = useState(false)
  const [showSheet, setShowSheet] = useState(false)
  useEffect(() => {
    if (streak > prev) { setAnim(true); setTimeout(() => setAnim(false), 600) }
    setPrev(streak)
  }, [streak, prev])
  if (streak === 0) return null
  return (
    <>
      <div onClick={() => setShowSheet(true)} style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '4px 10px', borderRadius: 20,
        background: streak >= 7 ? '#fff3e0' : '#fff8e1',
        border: `1px solid ${streak >= 7 ? '#ffb74d' : '#ffe082'}`,
        color: streak >= 7 ? '#e65100' : '#f57f17',
        fontSize: 12, fontWeight: 700, cursor: 'pointer',
        animation: anim ? 'rankPop 0.5s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
      }}>
        <span style={{ fontSize: 13, display: 'inline-block', animation: streak >= 3 ? 'streakFlame 1.4s ease-in-out infinite' : 'none' }}>🔥</span>
        <span>{streak}d</span>
      </div>
      {showSheet && <StreakSheet streak={streak} onClose={() => setShowSheet(false)} />}
    </>
  )
}
