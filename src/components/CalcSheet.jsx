import { useState } from 'react'
import { formatCurrency } from '../utils'
import { sheetBackdrop, sheetBase } from './sharedStyles'
import SheetHandle from './SheetHandle'

export default function CalcSheet({ onClose, onSaveAsExpense, isIncognito }) {
  const [tape,    setTape]    = useState([])
  const [current, setCurrent] = useState('')
  const [totAnim, setTotAnim] = useState(false)
  const total = tape.reduce((s, n) => s + n, 0)

  function handleKey(val) {
    if (val === 'del') { setCurrent(p => p.slice(0, -1)); return }
    if (val === '.' && current.includes('.')) return
    if (current.includes('.') && current.split('.')[1]?.length >= 2) return
    if (current.replace('.','').length >= 8) return
    setCurrent(p => p + val)
  }

  function handleAdd() {
    const n = parseFloat(current)
    if (!current || isNaN(n) || n <= 0) return
    setTape(p => [...p, n]); setCurrent('')
    setTotAnim(true); setTimeout(() => setTotAnim(false), 400)
  }

  const keys = ['7','8','9','4','5','6','1','2','3','.','0','del']

  return (
    <>
      <div onClick={onClose} style={sheetBackdrop} />
      <div style={{ ...sheetBase, paddingBottom: 'calc(24px + var(--safe-bottom))', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        <SheetHandle />
        <div style={{ padding: '6px 20px 12px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>🧮 Expense Calculator</p>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 1 }}>Add items, then save total as expense</p>
          </div>
          <button onClick={onClose} style={{ fontSize: 20, color: 'var(--text-tertiary)', padding: 4 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px 4px', minHeight: 60 }}>
          {tape.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '10px 0' }}>Enter amounts and tap + to add them</p>}
          {tape.map((n, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', marginBottom: 4, background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)', animation: 'calcTapeIn 0.2s ease' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Item {i + 1}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 16, color: 'var(--text-primary)' }}>{formatCurrency(n, isIncognito)}</span>
                <button onClick={() => setTape(p => p.filter((_, j) => j !== i))} style={{ fontSize: 14, color: 'var(--danger)', padding: '0 2px' }}>✕</button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ margin: '6px 20px', padding: '10px 14px', background: total > 0 ? 'var(--accent-dim)' : 'var(--bg-elevated)', borderRadius: 14, border: '1px solid ' + (total > 0 ? 'var(--border-strong)' : 'var(--border)'), display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 500 }}>{tape.length > 0 ? `${tape.length} item${tape.length > 1 ? 's' : ''}` : 'Total'}</span>
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22, color: total > 0 ? 'var(--accent)' : 'var(--text-tertiary)', letterSpacing: '-0.02em', animation: totAnim ? 'totalPop 0.35s ease' : 'none' }}>{total > 0 ? formatCurrency(total, isIncognito) : '₹0'}</span>
        </div>
        <div style={{ margin: '0 20px 8px', padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 14, border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Add item</span>
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22, color: current ? 'var(--text-primary)' : 'var(--text-tertiary)', letterSpacing: '-0.02em' }}>₹{current || '0'}</span>
        </div>
        <div style={{ padding: '0 20px', flexShrink: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7, marginBottom: 8 }}>
            {keys.map(k => (
              <button key={k}
                onTouchStart={e => e.currentTarget.style.transform = 'scale(0.91)'}
                onTouchEnd={e => { e.preventDefault(); e.currentTarget.style.transform = 'scale(1)'; handleKey(k) }}
                onClick={() => handleKey(k)}
                style={{ padding: '14px 8px', borderRadius: 12, fontSize: k === 'del' ? 16 : 18, fontWeight: 500, background: k === 'del' ? 'var(--bg)' : 'var(--bg-elevated)', color: k === 'del' ? 'var(--text-secondary)' : 'var(--text-primary)', border: '1px solid var(--border)', transition: 'transform 0.08s ease', touchAction: 'manipulation' }}>
                {k === 'del' ? '⌫' : k}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleAdd} disabled={!current || parseFloat(current) <= 0} style={{ flex: 1, padding: '14px', borderRadius: 'var(--radius-md)', fontSize: 15, fontWeight: 600, background: (!current || parseFloat(current) <= 0) ? 'var(--bg-elevated)' : '#1a7a4a', color: (!current || parseFloat(current) <= 0) ? 'var(--text-tertiary)' : '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.15s ease' }}>+ Add</button>
            <button onClick={() => { if (total > 0) { onSaveAsExpense(total); onClose() } }} disabled={total <= 0} style={{ flex: 2, padding: '14px', borderRadius: 'var(--radius-md)', fontSize: 15, fontWeight: 700, background: total <= 0 ? 'var(--bg-elevated)' : 'var(--accent)', color: total <= 0 ? 'var(--text-tertiary)' : '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.15s ease', boxShadow: total > 0 ? '0 2px 12px var(--accent-glow)' : 'none' }}>
              Save ₹{total > 0 ? Math.round(total).toLocaleString('en-IN') : '0'} →
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
