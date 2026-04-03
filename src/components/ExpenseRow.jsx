import { useState, useRef } from 'react'
import { getCat, formatCurrency, formatDisplayDate, formatTime } from '../utils'
import { sheetBackdrop, sheetBase } from './sharedStyles'
import SheetHandle from './SheetHandle'

export default function ExpenseRow({ expense, onDelete, onEdit, isIncognito, index = 0 }) {
  const cat = getCat(expense.category)
  const [showDetail, setShowDetail] = useState(false)
  const [swiped,     setSwiped]     = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const touchStartX = useRef(null)

  const onTouchStart = e => { touchStartX.current = e.touches[0].clientX }
  const onTouchMove  = e => {
    if (!touchStartX.current) return
    const dx = touchStartX.current - e.touches[0].clientX
    if (dx > 50)  setSwiped(true)
    if (dx < -20) setSwiped(false)
  }
  const onTouchEnd = () => { touchStartX.current = null }

  function handleDelete() { setDeleting(true); setTimeout(() => onDelete(expense.id), 380) }

  return (
    <>
      <div style={{
        position: 'relative', overflow: 'hidden',
        animation: deleting ? 'rowDelete 0.38s ease forwards' : 'popIn 0.28s cubic-bezier(0.34,1.56,0.64,1)',
        animationDelay: deleting ? '0s' : `${index * 0.04}s`,
        animationFillMode: 'both',
      }}>
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontSize: 18 }}>🗑️</span>
        </div>
        <div
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
          onClick={() => { if (!swiped) setShowDetail(true) }}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
            background: expense.type === 'shared' ? '#f5fbf7' : 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: expense.type === 'shared' ? '1px solid rgba(26,122,74,0.18)' : '1px solid var(--border)',
            borderLeft: expense.type === 'shared' ? '3px solid #1a7a4a' : undefined,
            transform: swiped ? 'translateX(-72px)' : 'translateX(0)',
            transition: 'transform 0.2s ease',
            position: 'relative', zIndex: 1, cursor: 'pointer',
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: cat.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{cat.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{expense.note || cat.label}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{cat.label}</p>
              <span style={{
                fontSize: 10, fontWeight: 600, letterSpacing: '0.02em',
                padding: '1px 6px', borderRadius: 99,
                background: expense.type === 'shared' ? 'rgba(26,122,74,0.1)' : 'var(--accent-dim)',
                color: expense.type === 'shared' ? '#1a7a4a' : 'var(--accent)',
                border: expense.type === 'shared' ? '1px solid rgba(26,122,74,0.2)' : '1px solid var(--accent-glow)',
              }}>{expense.type === 'shared' ? 'Shared' : 'Personal'}</span>
            </div>
          </div>
          <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 17, color: 'var(--text-primary)', letterSpacing: '-0.02em', flexShrink: 0 }}>{formatCurrency(expense.amount, isIncognito)}</p>
          {swiped && <button onClick={handleDelete} style={{ position: 'absolute', right: -64, width: 56, top: 0, bottom: 0, background: 'var(--danger)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}>Del</button>}
        </div>
      </div>

      {/* Detail sheet */}
      {showDetail && (
        <>
          <div onClick={() => setShowDetail(false)} style={sheetBackdrop} />
          <div style={{ ...sheetBase, paddingBottom: 'calc(28px + var(--safe-bottom))' }}>
            <SheetHandle />
            <div style={{ padding: '4px 20px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: cat.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{cat.emoji}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>{expense.note || cat.label}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{cat.label}</p>
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 26, color: 'var(--accent)', letterSpacing: '-0.02em' }}>{formatCurrency(expense.amount, isIncognito)}</p>
              </div>
              {[
                ['📅 Date',     formatDisplayDate(expense.date)],
                ['🕐 Added at', formatTime(expense.createdAt)],
                ['🗂 Category', cat.label],
                ['📝 Note',     expense.note || '—'],
                ['👤 Type',     expense.type === 'shared' ? '👥 Shared' : '👤 Personal'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{k}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => { setShowDetail(false); onDelete(expense.id) }} style={{ flex: 1, padding: '13px', borderRadius: 'var(--radius-md)', background: 'var(--danger-dim)', color: 'var(--danger)', fontSize: 14, fontWeight: 600, border: '1px solid var(--danger-dim)', cursor: 'pointer' }}>Delete</button>
                <button onClick={() => { setShowDetail(false); onEdit(expense) }} style={{ flex: 2, padding: '13px', borderRadius: 'var(--radius-md)', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px var(--accent-glow)' }}>✏️ Edit Expense</button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
