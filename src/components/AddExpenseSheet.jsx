import { useState, useEffect, useMemo, useRef } from 'react'
import { CATEGORIES } from '../constants'
import { today, formatDisplayDate, genId, getCat, formatCurrency, useDragToClose } from '../utils'
import { sheetBackdrop, sheetBase, dateInputStyle } from './sharedStyles'
import SheetHandle from './SheetHandle'

function getPastNotes(expenses) {
  if (!expenses.length) return []
  const freq = {}
  expenses.forEach(e => { if (e.note) freq[e.note] = (freq[e.note] || 0) + 1 })
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([note]) => note)
}

export default function AddExpenseSheet({ onClose, onAdd, onUpdate, editExpense = null, seedAmount = null, expenses = [], defaultType = 'all' }) {
  const isEdit = !!editExpense
  const validDefault = (defaultType === 'personal' || defaultType === 'shared') ? defaultType : null
  const [step,     setStep]     = useState(isEdit || seedAmount || validDefault ? 'details' : 'type')
  const [type,     setType]     = useState(isEdit ? (editExpense.type || 'personal') : (validDefault || localStorage.getItem('spentit_last_type') || 'personal'))
  const [amount,   setAmount]   = useState(isEdit ? String(editExpense.amount) : seedAmount ? String(seedAmount) : '')
  const [category, setCategory] = useState(isEdit ? editExpense.category : 'food')
  const [note,     setNote]     = useState(isEdit ? editExpense.note : '')
  const [date,     setDate]     = useState(isEdit ? editExpense.date : today())
  const [showNote, setShowNote] = useState(isEdit && !!editExpense.note)
  const [showDate, setShowDate] = useState(false)
  const [ghost,    setGhost]    = useState('')
  const pastNotes = useMemo(() => getPastNotes(expenses), [expenses])
  const noteRef = useRef(null)

  // If we have a defaultType or seedAmount, we should actually go to 'amount' step first, unless it's an edit
  useEffect(() => {
    if (!isEdit && !seedAmount && validDefault) {
      setStep('amount')
    }
  }, [isEdit, seedAmount, validDefault])

  useEffect(() => {
    if (showNote) {
      setTimeout(() => noteRef.current?.focus(), 150)
    }
  }, [showNote])

  function handleNoteChange(e) {
    const val = e.target.value
    setNote(val)
    if (val.trim().length < 2) { setGhost(''); return }
    const match = pastNotes.find(n =>
      n.toLowerCase().startsWith(val.toLowerCase()) &&
      n.toLowerCase() !== val.toLowerCase()
    )
    setGhost(match ? match.slice(val.length) : '')
  }
  function acceptGhost() {
    if (!ghost) return
    setNote(prev => prev + ghost)
    setGhost('')
  }
  function handleNoteKeyDown(e) {
    if (ghost && e.key === ' ') { e.preventDefault(); acceptGhost() }
    if (e.key === 'Escape') setGhost('')
  }

  function handleKey(val) {
    if (val === 'del') { setAmount(p => p.slice(0, -1)); return }
    if (val === '.' && amount.includes('.')) return
    if (amount.includes('.') && amount.split('.')[1]?.length >= 2) return
    if (amount.length >= 10) return
    setAmount(p => p + val)
  }

  function handleSubmit() {
    if (!amount || parseFloat(amount) <= 0) return
    if (isEdit) {
      onUpdate({ ...editExpense, amount: parseFloat(amount), category, note: note.trim(), date, type })
    } else {
      onAdd({ id: genId(), amount: parseFloat(amount), category, note: note.trim(), date, createdAt: Date.now(), type })
    }
    onClose()
  }

  const drag = useDragToClose(useState, useRef, onClose)
  const keys = ['1','2','3','4','5','6','7','8','9','.','0','del']

  return (
    <>
      <div onClick={onClose} style={sheetBackdrop} />
      <div 
        {...drag.props}
        style={{ 
          ...sheetBase, 
          ...drag.style,
          paddingBottom: 'calc(24px + var(--safe-bottom))', 
          maxHeight: '92vh', 
          overflow: 'hidden' 
        }}
      >
        <SheetHandle />
        {step === 'type' ? (
          <div style={{ padding: '12px 20px 28px' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>What kind of expense?</p>
            <div style={{ display: 'flex', gap: 12 }}>
              {[['personal','👤','Personal'],['shared','👥','Shared']].map(([val,emoji,label]) => (
                <button key={val} onClick={() => { setType(val); localStorage.setItem('spentit_last_type', val); setStep('amount') }} style={{
                  flex: 1, padding: '20px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  background: type === val ? (val === 'shared' ? 'rgba(26,122,74,0.08)' : 'var(--accent-dim)') : 'var(--bg-elevated)',
                  border: '2px solid ' + (type === val ? (val === 'shared' ? '#1a7a4a' : 'var(--accent)') : 'var(--border-strong)'),
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ fontSize: 28 }}>{emoji}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : step === 'amount' ? (
          <div style={{ padding: '0 24px' }}>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', marginBottom: 16 }}>How much did you spend?</p>
            <div style={{ textAlign: 'center', marginBottom: 22, padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: amount.length > 6 ? 36 : 50, color: amount ? 'var(--text-primary)' : 'var(--text-tertiary)', letterSpacing: '-0.03em', transition: 'font-size 0.15s ease' }}>₹{amount || '0'}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
              {keys.map(k => (
                <button key={k}
                  onTouchStart={e => e.currentTarget.style.transform = 'scale(0.91)'}
                  onTouchEnd={e => { e.preventDefault(); e.currentTarget.style.transform = 'scale(1)'; handleKey(k) }}
                  onClick={() => handleKey(k)}
                  style={{ padding: '17px 8px', borderRadius: 'var(--radius-md)', fontSize: k === 'del' ? 18 : 20, fontWeight: 500, background: k === 'del' ? 'var(--bg)' : 'var(--bg-elevated)', color: k === 'del' ? 'var(--text-secondary)' : 'var(--text-primary)', border: '1px solid var(--border)', transition: 'transform 0.08s ease', touchAction: 'manipulation' }}>
                  {k === 'del' ? '⌫' : k}
                </button>
              ))}
            </div>
            <button onClick={() => { if (amount && parseFloat(amount) > 0) setStep('details') }} disabled={!amount || parseFloat(amount) <= 0}
              style={{ width: '100%', padding: '15px', borderRadius: 'var(--radius-md)', fontSize: 15, fontWeight: 600, background: (!amount || parseFloat(amount) <= 0) ? 'var(--bg-elevated)' : 'var(--accent)', color: (!amount || parseFloat(amount) <= 0) ? 'var(--text-tertiary)' : '#ffffff', border: 'none', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: (!amount || parseFloat(amount) <= 0) ? 'none' : '0 2px 12px var(--accent-glow)' }}>
              Continue →
            </button>
          </div>
        ) : (
          <div style={{ padding: '0 24px', overflowY: 'auto', maxHeight: '78vh' }}>
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <button onClick={() => setStep('amount')} style={{ background: 'var(--bg-elevated)', border: '1.5px dashed var(--accent)', borderRadius: 14, padding: '6px 20px', cursor: 'pointer', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 34, color: 'var(--accent)', letterSpacing: '-0.02em' }}>₹{amount}</span>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>tap to edit</span>
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {[['personal','👤 Personal'],['shared','👥 Shared']].map(([val,label]) => (
                <button key={val} onClick={() => setType(val)} style={{
                  flex: 1, padding: '9px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500,
                  background: type === val ? (val === 'shared' ? 'rgba(26,122,74,0.1)' : 'var(--accent-dim)') : 'var(--bg-elevated)',
                  border: '1.5px solid ' + (type === val ? (val === 'shared' ? '#1a7a4a' : 'var(--accent)') : 'var(--border-strong)'),
                  color: type === val ? (val === 'shared' ? '#1a7a4a' : 'var(--accent)') : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}>{label}</button>
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Category</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 18 }}>
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setCategory(cat.id)} style={{ padding: '10px 4px', borderRadius: 14, border: '1.5px solid ' + (category === cat.id ? cat.color : 'var(--border)'), background: category === cat.id ? cat.color + '14' : 'var(--bg-elevated)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all 0.15s ease', cursor: 'pointer' }}>
                  <span style={{ fontSize: 20 }}>{cat.emoji}</span>
                  <span style={{ fontSize: 10, color: category === cat.id ? 'var(--text-primary)' : 'var(--text-tertiary)', fontWeight: 500 }}>{cat.label}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowNote(p => !p)} style={{ width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid ' + (showNote ? 'var(--accent)' : 'var(--border)'), color: note ? 'var(--text-primary)' : 'var(--text-tertiary)', fontSize: 14, marginBottom: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{note || 'Add a note...'}</span>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{showNote ? '▲' : '▼'}</span>
            </button>
            {showNote && (
              <div style={{ position: 'relative', marginBottom: 8, animation: 'fadeSlideIn 0.2s ease' }}>
                <input
                  ref={noteRef}
                  value={note}
                  onChange={handleNoteChange}
                  onKeyDown={handleNoteKeyDown}
                  onBlur={() => setGhost('')}
                  placeholder={ghost ? '' : 'e.g. Lunch at Rajdhani'}
                  maxLength={60}
                  style={{ width: '100%', padding: '12px 44px 12px 14px', borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--accent)', color: 'var(--text-primary)', fontSize: 16, outline: 'none', position: 'relative', zIndex: 1, boxSizing: 'border-box' }}
                />
                {ghost && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: '12px 44px 12px 14px', fontSize: 16, color: 'var(--text-tertiary)', pointerEvents: 'none', whiteSpace: 'nowrap', overflow: 'hidden', borderRadius: 12, display: 'flex', alignItems: 'center', zIndex: 2 }}>
                    <span style={{ visibility: 'hidden' }}>{note}</span>
                    <span>{ghost}</span>
                  </div>
                )}
                {ghost && (
                  <button onClick={acceptGhost} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', zIndex: 3, width: 28, height: 28, borderRadius: 8, background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>→</button>
                )}
              </div>
            )}
            <button onClick={() => setShowDate(p => !p)} style={{ width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid ' + (showDate ? 'var(--accent)' : 'var(--border)'), color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>📅 {formatDisplayDate(date)}</span>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{showDate ? '▲' : '▼'}</span>
            </button>
            {showDate && <input type="date" value={date} max={today()} onChange={e => setDate(e.target.value)} style={{ ...dateInputStyle, marginBottom: 8, animation: 'fadeSlideIn 0.2s ease' }} />}
            <div style={{ display: 'flex', gap: 10, marginTop: 14, paddingBottom: 8 }}>
              {!isEdit && <button onClick={() => setStep('amount')} style={{ flex: 1, padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500, border: '1px solid var(--border)', cursor: 'pointer' }}>← Back</button>}
              <button onClick={handleSubmit} style={{ flex: 2, padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--accent)', color: '#ffffff', fontSize: 15, fontWeight: 700, border: 'none', boxShadow: '0 2px 12px var(--accent-glow)', cursor: 'pointer' }}>
                {isEdit ? '✓ Save Changes' : 'Save Expense'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
