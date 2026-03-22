import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'food',          emoji: '🍔', label: 'Food',          color: '#e8824a' },
  { id: 'transport',     emoji: '🚗', label: 'Transport',     color: '#4a9ee8' },
  { id: 'shopping',      emoji: '🛒', label: 'Shopping',      color: '#b04ae8' },
  { id: 'health',        emoji: '🏥', label: 'Health',        color: '#e84a7a' },
  { id: 'entertainment', emoji: '🎬', label: 'Fun',           color: '#e8c44a' },
  { id: 'bills',         emoji: '💡', label: 'Bills',         color: '#4ae8c4' },
  { id: 'travel',        emoji: '✈️', label: 'Travel',        color: '#4a7ae8' },
  { id: 'other',         emoji: '📦', label: 'Other',         color: '#8a8680' },
]

const FILTERS = [
  { id: 'today',   label: 'Today' },
  { id: 'week',    label: 'This Week' },
  { id: 'month',   label: 'This Month' },
  { id: 'custom',  label: 'Custom' },
]

const STORAGE_KEY = 'spentit_v2_expenses'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateStr(date) {
  return date.toISOString().slice(0, 10)
}

function today() {
  return toDateStr(new Date())
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR',
    minimumFractionDigits: 0, maximumFractionDigits: 2
  }).format(amount)
}

function formatDisplayDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const t = today()
  const yesterday = toDateStr(new Date(Date.now() - 86400000))
  if (dateStr === t) return 'Today'
  if (dateStr === yesterday) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

function getFilterRange(filterId, customRange) {
  const now = new Date()
  const t = today()
  if (filterId === 'today') return { from: t, to: t }
  if (filterId === 'week') {
    const day = now.getDay()
    const mon = new Date(now); mon.setDate(now.getDate() - ((day + 6) % 7))
    return { from: toDateStr(mon), to: t }
  }
  if (filterId === 'month') {
    const first = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from: toDateStr(first), to: t }
  }
  if (filterId === 'custom') return customRange
  return { from: t, to: t }
}

function getCategoryById(id) {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1]
}

function loadExpenses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveExpenses(expenses) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses))
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SummaryCard({ expenses, filter }) {
  const total = expenses.reduce((s, e) => s + e.amount, 0)
  const count = expenses.length
  const topCategory = (() => {
    const map = {}
    expenses.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount })
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1])
    return sorted[0] ? getCategoryById(sorted[0][0]) : null
  })()

  const filterLabel = FILTERS.find(f => f.id === filter)?.label || 'Today'

  return (
    <div style={{
      padding: '20px 20px 16px',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            {filterLabel}
          </p>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: 40,
            lineHeight: 1,
            color: total > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)',
            fontStyle: total > 0 ? 'normal' : 'italic',
            letterSpacing: '-0.02em'
          }}>
            {total > 0 ? formatCurrency(total) : 'nothing yet'}
          </p>
        </div>
        {topCategory && (
          <div style={{
            background: 'var(--bg-elevated)',
            borderRadius: 12,
            padding: '8px 12px',
            textAlign: 'center',
            border: '1px solid var(--border)'
          }}>
            <div style={{ fontSize: 20 }}>{topCategory.emoji}</div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>top spend</div>
          </div>
        )}
      </div>
      {count > 0 && (
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 8 }}>
          {count} {count === 1 ? 'expense' : 'expenses'}
        </p>
      )}
    </div>
  )
}

function FilterBar({ activeFilter, onFilterChange, customRange, onCustomRangeChange }) {
  const [showDatePicker, setShowDatePicker] = useState(false)

  function handleChip(id) {
    if (id === 'custom') {
      setShowDatePicker(prev => !prev)
    } else {
      setShowDatePicker(false)
    }
    onFilterChange(id)
  }

  return (
    <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => handleChip(f.id)}
            style={{
              flexShrink: 0,
              padding: '7px 14px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 500,
              transition: 'all 0.15s ease',
              background: activeFilter === f.id ? 'var(--accent)' : 'var(--bg-elevated)',
              color: activeFilter === f.id ? '#0f0e0c' : 'var(--text-secondary)',
              border: '1px solid ' + (activeFilter === f.id ? 'var(--accent)' : 'var(--border)'),
              cursor: 'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Progressive date picker — only shown when Custom is active */}
      {activeFilter === 'custom' && showDatePicker && (
        <div style={{
          marginTop: 12,
          display: 'flex',
          gap: 10,
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>FROM</label>
            <input
              type="date"
              value={customRange.from}
              max={customRange.to}
              onChange={e => onCustomRangeChange({ ...customRange, from: e.target.value })}
              style={dateInputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>TO</label>
            <input
              type="date"
              value={customRange.to}
              min={customRange.from}
              max={today()}
              onChange={e => onCustomRangeChange({ ...customRange, to: e.target.value })}
              style={dateInputStyle}
            />
          </div>
        </div>
      )}
    </div>
  )
}

const dateInputStyle = {
  width: '100%',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-strong)',
  borderRadius: 10,
  padding: '8px 12px',
  color: 'var(--text-primary)',
  fontSize: 14,
  outline: 'none',
  colorScheme: 'dark',
}

function ExpenseRow({ expense, onDelete, style: extStyle }) {
  const cat = getCategoryById(expense.category)
  const [swiped, setSwiped] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const touchStartX = useRef(null)

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
  }
  function handleTouchMove(e) {
    if (!touchStartX.current) return
    const dx = touchStartX.current - e.touches[0].clientX
    if (dx > 50) setSwiped(true)
    if (dx < -20) setSwiped(false)
  }
  function handleTouchEnd() {
    touchStartX.current = null
  }

  function handleDelete() {
    setDeleting(true)
    setTimeout(() => onDelete(expense.id), 300)
  }

  return (
    <div style={{
      position: 'relative',
      overflow: 'hidden',
      opacity: deleting ? 0 : 1,
      maxHeight: deleting ? 0 : 80,
      transition: deleting ? 'all 0.3s ease' : 'none',
      ...extStyle,
    }}>
      {/* Delete background */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0,
        width: 80, background: 'var(--danger-dim)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 'var(--radius-md)',
      }}>
        <span style={{ fontSize: 18 }}>🗑️</span>
      </div>

      {/* Row */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 16px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          transform: swiped ? 'translateX(-72px)' : 'translateX(0)',
          transition: 'transform 0.2s ease',
          position: 'relative', zIndex: 1,
        }}
      >
        {/* Category dot */}
        <div style={{
          width: 42, height: 42, borderRadius: 13, flexShrink: 0,
          background: cat.color + '1a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}>
          {cat.emoji}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', truncate: true,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {expense.note || cat.label}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
            {cat.label} · {new Date(expense.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </p>
        </div>

        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: 18,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}>
            {formatCurrency(expense.amount)}
          </p>
        </div>

        {swiped && (
          <button
            onClick={handleDelete}
            style={{
              position: 'absolute', right: -64, width: 56, top: 0, bottom: 0,
              background: 'var(--danger)', color: '#fff', border: 'none',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: '0 var(--radius-md) var(--radius-md) 0',
            }}
          >
            Del
          </button>
        )}
      </div>
    </div>
  )
}

function EmptyState({ filter }) {
  const messages = {
    today: { icon: '🎉', title: 'Nothing spent today', sub: 'Your wallet is safe... for now.' },
    week:  { icon: '📭', title: 'A clean week so far', sub: 'No expenses recorded this week.' },
    month: { icon: '🌱', title: 'Fresh month', sub: 'No expenses this month yet.' },
    custom:{ icon: '🔍', title: 'No expenses found', sub: 'Try a different date range.' },
  }
  const m = messages[filter] || messages.today

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', gap: 12, animation: 'fadeIn 0.4s ease',
    }}>
      <div style={{ fontSize: 48, lineHeight: 1 }}>{m.icon}</div>
      <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>{m.title}</p>
      <p style={{ fontSize: 14, color: 'var(--text-tertiary)', textAlign: 'center' }}>{m.sub}</p>
    </div>
  )
}

function AddExpenseSheet({ onClose, onAdd }) {
  const [step, setStep] = useState('amount') // amount → details
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('food')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(today())
  const [showNote, setShowNote] = useState(false)
  const [showDate, setShowDate] = useState(false)
  const amountRef = useRef(null)

  useEffect(() => {
    setTimeout(() => amountRef.current?.focus(), 350)
  }, [])

  function handleAmountKey(val) {
    if (val === 'del') {
      setAmount(prev => prev.slice(0, -1))
      return
    }
    if (val === '.' && amount.includes('.')) return
    if (amount.includes('.') && amount.split('.')[1]?.length >= 2) return
    if (amount.length >= 10) return
    setAmount(prev => prev + val)
  }

  function handleContinue() {
    if (!amount || parseFloat(amount) <= 0) return
    setStep('details')
  }

  function handleSubmit() {
    if (!amount || parseFloat(amount) <= 0) return
    onAdd({
      id: generateId(),
      amount: parseFloat(amount),
      category,
      note: note.trim(),
      date,
      createdAt: Date.now(),
    })
    onClose()
  }

  const numPadKeys = ['1','2','3','4','5','6','7','8','9','.','0','del']

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 50, backdropFilter: 'blur(4px)',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 51,
        background: 'var(--bg-sheet)',
        borderRadius: '28px 28px 0 0',
        border: '1px solid var(--border-strong)',
        borderBottom: 'none',
        paddingBottom: 'calc(24px + var(--safe-bottom))',
        animation: 'slideUp 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        maxHeight: '90vh',
        overflow: 'hidden',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 14, paddingBottom: 8 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)' }} />
        </div>

        {step === 'amount' ? (
          <AmountStep
            amount={amount}
            onKey={handleAmountKey}
            onContinue={handleContinue}
            numPadKeys={numPadKeys}
          />
        ) : (
          <DetailsStep
            amount={amount}
            category={category}
            onCategoryChange={setCategory}
            note={note}
            onNoteChange={setNote}
            date={date}
            onDateChange={setDate}
            showNote={showNote}
            onToggleNote={() => setShowNote(p => !p)}
            showDate={showDate}
            onToggleDate={() => setShowDate(p => !p)}
            onBack={() => setStep('amount')}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </>
  )
}

function AmountStep({ amount, onKey, onContinue, numPadKeys }) {
  const displayAmount = amount || '0'

  return (
    <div style={{ padding: '0 24px' }}>
      <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', marginBottom: 20 }}>
        How much did you spend?
      </p>

      {/* Amount display */}
      <div style={{
        textAlign: 'center', marginBottom: 28,
        padding: '16px', background: 'var(--bg-elevated)',
        borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: amount.length > 6 ? 36 : 52,
          color: amount ? 'var(--text-primary)' : 'var(--text-tertiary)',
          letterSpacing: '-0.03em',
          transition: 'font-size 0.2s ease',
        }}>
          ₹{displayAmount}
        </span>
      </div>

      {/* Numpad */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8, marginBottom: 16,
      }}>
        {numPadKeys.map(k => (
          <button
            key={k}
            onClick={() => onKey(k)}
            style={{
              padding: '18px 8px',
              borderRadius: 'var(--radius-md)',
              fontSize: k === 'del' ? 18 : 22,
              fontWeight: k === 'del' ? 400 : 500,
              background: k === 'del' ? 'var(--bg)' : 'var(--bg-elevated)',
              color: k === 'del' ? 'var(--text-secondary)' : 'var(--text-primary)',
              border: '1px solid var(--border)',
              transition: 'all 0.1s ease',
              active: { background: 'var(--bg-card)' },
            }}
          >
            {k === 'del' ? '⌫' : k}
          </button>
        ))}
      </div>

      <button
        onClick={onContinue}
        disabled={!amount || parseFloat(amount) <= 0}
        style={{
          width: '100%', padding: '16px',
          borderRadius: 'var(--radius-md)',
          fontSize: 16, fontWeight: 600,
          background: (!amount || parseFloat(amount) <= 0) ? 'var(--bg-elevated)' : 'var(--accent)',
          color: (!amount || parseFloat(amount) <= 0) ? 'var(--text-tertiary)' : '#0f0e0c',
          transition: 'all 0.2s ease',
          border: 'none', cursor: 'pointer',
        }}
      >
        Continue →
      </button>
    </div>
  )
}

function DetailsStep({ amount, category, onCategoryChange, note, onNoteChange, date, onDateChange, showNote, onToggleNote, showDate, onToggleDate, onBack, onSubmit }) {
  return (
    <div style={{ padding: '0 24px', overflowY: 'auto', maxHeight: '75vh' }}>
      {/* Amount recap */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 36, color: 'var(--accent)',
          letterSpacing: '-0.02em',
        }}>
          ₹{amount}
        </span>
      </div>

      {/* Category grid */}
      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
        Category
      </p>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 8, marginBottom: 20,
      }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            style={{
              padding: '10px 4px',
              borderRadius: 12,
              border: '1.5px solid ' + (category === cat.id ? cat.color : 'var(--border)'),
              background: category === cat.id ? cat.color + '18' : 'var(--bg-elevated)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              transition: 'all 0.15s ease',
              cursor: 'pointer',
              animation: 'scaleIn 0.2s ease',
            }}
          >
            <span style={{ fontSize: 22 }}>{cat.emoji}</span>
            <span style={{ fontSize: 10, color: category === cat.id ? 'var(--text-primary)' : 'var(--text-tertiary)', fontWeight: 500 }}>
              {cat.label}
            </span>
          </button>
        ))}
      </div>

      {/* Progressive: Note */}
      <button
        onClick={onToggleNote}
        style={{
          width: '100%', textAlign: 'left', padding: '12px 14px',
          borderRadius: 12, background: 'var(--bg-elevated)',
          border: '1px solid var(--border)', color: 'var(--text-secondary)',
          fontSize: 14, marginBottom: 8, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <span>{note || 'Add a note...'}</span>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{showNote ? '▲' : '▼'}</span>
      </button>
      {showNote && (
        <input
          autoFocus
          value={note}
          onChange={e => onNoteChange(e.target.value)}
          placeholder="e.g. Lunch at Rajdhani"
          maxLength={60}
          style={{
            width: '100%', padding: '12px 14px',
            borderRadius: 12, background: 'var(--bg-elevated)',
            border: '1px solid var(--accent)',
            color: 'var(--text-primary)', fontSize: 15,
            outline: 'none', marginBottom: 8,
            animation: 'fadeIn 0.2s ease',
          }}
        />
      )}

      {/* Progressive: Date */}
      <button
        onClick={onToggleDate}
        style={{
          width: '100%', textAlign: 'left', padding: '12px 14px',
          borderRadius: 12, background: 'var(--bg-elevated)',
          border: '1px solid var(--border)', color: 'var(--text-secondary)',
          fontSize: 14, marginBottom: 8, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <span>📅 {formatDisplayDate(date)}</span>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{showDate ? '▲' : '▼'}</span>
      </button>
      {showDate && (
        <input
          type="date"
          value={date}
          max={today()}
          onChange={e => onDateChange(e.target.value)}
          style={{
            ...dateInputStyle,
            marginBottom: 8,
            animation: 'fadeIn 0.2s ease',
          }}
        />
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginTop: 12, paddingBottom: 8 }}>
        <button
          onClick={onBack}
          style={{
            flex: 1, padding: '15px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
            fontSize: 15, fontWeight: 500, border: '1px solid var(--border)',
          }}
        >
          ← Back
        </button>
        <button
          onClick={onSubmit}
          style={{
            flex: 2, padding: '15px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent)', color: '#0f0e0c',
            fontSize: 15, fontWeight: 700, border: 'none',
          }}
        >
          Save Expense
        </button>
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [expenses, setExpenses] = useState(() => loadExpenses())
  const [activeFilter, setActiveFilter] = useState('today')
  const [customRange, setCustomRange] = useState({ from: today(), to: today() })
  const [showSheet, setShowSheet] = useState(false)

  // Persist on change
  useEffect(() => {
    saveExpenses(expenses)
  }, [expenses])

  function addExpense(exp) {
    setExpenses(prev => [exp, ...prev])
  }

  function deleteExpense(id) {
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  // Filter expenses
  const range = getFilterRange(activeFilter, customRange)
  const filtered = expenses
    .filter(e => e.date >= range.from && e.date <= range.to)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)

  // Group by date
  const grouped = filtered.reduce((acc, e) => {
    if (!acc[e.date]) acc[e.date] = []
    acc[e.date].push(e)
    return acc
  }, {})
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--bg)',
      paddingTop: 'var(--safe-top)',
    }}>
      {/* Header */}
      <div style={{
        padding: '18px 20px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28, letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
          }}>
            SpentIt
          </h1>
        </div>
        <div style={{
          fontSize: 12, color: 'var(--text-tertiary)',
          background: 'var(--bg-elevated)', padding: '5px 10px',
          borderRadius: 20, border: '1px solid var(--border)',
        }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
        </div>
      </div>

      {/* Summary */}
      <SummaryCard expenses={filtered} filter={activeFilter} />

      {/* Filter bar */}
      <FilterBar
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        customRange={customRange}
        onCustomRangeChange={setCustomRange}
      />

      {/* Expense list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 100px' }}>
        {sortedDates.length === 0 ? (
          <EmptyState filter={activeFilter} />
        ) : (
          sortedDates.map(date => (
            <div key={date} style={{ marginBottom: 20, animation: 'fadeIn 0.3s ease' }}>
              {/* Date header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 8, padding: '0 4px',
              }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {formatDisplayDate(date)}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                  {formatCurrency(grouped[date].reduce((s, e) => s + e.amount, 0))}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {grouped[date].map(exp => (
                  <ExpenseRow
                    key={exp.id}
                    expense={exp}
                    onDelete={deleteExpense}
                    style={{ animation: 'popIn 0.25s ease' }}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowSheet(true)}
        style={{
          position: 'fixed',
          bottom: `calc(28px + var(--safe-bottom))`,
          right: 24,
          width: 60, height: 60,
          borderRadius: '50%',
          background: 'var(--accent)',
          color: '#0f0e0c',
          fontSize: 28,
          fontWeight: 300,
          boxShadow: '0 4px 24px var(--accent-glow)',
          zIndex: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          border: 'none', cursor: 'pointer',
        }}
        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        onTouchStart={e => e.currentTarget.style.transform = 'scale(0.92)'}
        onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        +
      </button>

      {/* Add expense sheet */}
      {showSheet && (
        <AddExpenseSheet
          onClose={() => setShowSheet(false)}
          onAdd={addExpense}
        />
      )}
    </div>
  )
}
