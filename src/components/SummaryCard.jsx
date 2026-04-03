import { useState } from 'react'
import { FILTERS } from '../constants'
import { getCat } from '../utils'
import { sheetBackdrop, sheetBase } from './sharedStyles'
import SheetHandle from './SheetHandle'
import CountUp from './CountUp'

export default function SummaryCard({ expenses, filter, isIncognito, budget, onOpenBudget }) {
  const [showTopInfo, setShowTopInfo] = useState(false)
  const total = expenses.reduce((s, e) => s + e.amount, 0)
  const count = expenses.length
  const label = FILTERS.find(f => f.id === filter)?.label || 'Today'

  const catMap = {}
  expenses.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + e.amount })
  const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1])
  const topCat     = sortedCats[0] ? getCat(sortedCats[0][0]) : null
  const topAmt     = sortedCats[0]?.[1] || 0
  const topCount   = expenses.filter(e => e.category === topCat?.id).length
  const topPct     = total > 0 ? Math.round((topAmt / total) * 100) : 0

  return (
    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div onClick={onOpenBudget} style={{ cursor: 'pointer' }}>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label} Total {budget > 0 && filter === 'month' && '· Budget 🎯'}</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>

            <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 38, lineHeight: 1, color: total > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)', letterSpacing: '-0.02em' }}>
              {total > 0 ? <CountUp end={total} isIncognito={isIncognito} /> : 'nothing yet'}
            </p>
            {budget > 0 && filter === 'month' && total > 0 && (
              <span style={{ fontSize: 12, fontWeight: 600, color: total > budget ? 'var(--danger)' : 'var(--success)', background: total > budget ? 'var(--danger-dim)' : 'rgba(26,122,74,0.1)', padding: '2px 6px', borderRadius: 8 }}>
                {Math.round((total / budget) * 100)}%
              </span>
            )}
          </div>
        </div>
        {topCat && (
          <button onClick={() => setShowTopInfo(true)} style={{
            background: 'var(--bg-elevated)', borderRadius: 14,
            padding: '10px 14px', textAlign: 'center',
            border: '1px solid var(--border)', cursor: 'pointer',
          }}>
            <div style={{ fontSize: 22 }}>{topCat.emoji}</div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>top spend</div>
          </button>
        )}
      </div>
      {count > 0 && <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 6 }}>{count} {count === 1 ? 'expense' : 'expenses'}</p>}

      {showTopInfo && topCat && (
        <>
          <div onClick={() => setShowTopInfo(false)} style={sheetBackdrop} />
          <div style={{ ...sheetBase, paddingBottom: 'calc(28px + var(--safe-bottom))' }}>
            <SheetHandle />
            <div style={{ padding: '4px 20px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: topCat.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{topCat.emoji}</div>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{topCat.label}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Your top spend this {label.toLowerCase()}</p>
                </div>
              </div>
              {[
                ['Total spent',  <CountUp end={topAmt} isIncognito={isIncognito} />],
                ['% of overall', `${topPct}%`],
                ['Transactions', `${topCount} ${topCount === 1 ? 'entry' : 'entries'}`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{k}</span>
                  <span style={{ fontSize: 16, fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600, color: 'var(--text-primary)' }}>{v}</span>
                </div>
              ))}
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 14, lineHeight: 1.6 }}>
                {topPct >= 50
                  ? `Over half your ${label.toLowerCase()} spend went to ${topCat.label}. Consider spreading it across categories.`
                  : topPct >= 30
                  ? `${topCat.label} is your biggest category at ${topPct}% of total spend.`
                  : `${topCat.label} leads your spend at ${topPct}%. Your spending is fairly distributed.`}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
