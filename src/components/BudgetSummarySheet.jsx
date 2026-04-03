import { useState } from 'react'
import { toDateStr, today, formatCurrency } from '../utils'
import { sheetBackdrop, sheetBase } from './sharedStyles'
import SheetHandle from './SheetHandle'
import CountUp from './CountUp'

export default function BudgetSummarySheet({ expenses, budget, onUpdateBudget, onClose, isIncognito }) {
  const [inputValue, setInputValue] = useState(budget ? String(budget) : '')
  const [editing, setEditing] = useState(false)

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const day = now.getDate()
  const totalDays = new Date(year, month + 1, 0).getDate()
  
  const startOfMonth = toDateStr(new Date(year, month, 1))
  const endOfToday = today()
  
  const monthlyExpenses = expenses.filter(e => e.date >= startOfMonth && e.date <= endOfToday)
  const monthlyTotal = monthlyExpenses.reduce((s, e) => s + e.amount, 0)
  
  // Weekly calculations
  const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  const startOfWeek = toDateStr(mon)
  const weeklyExpenses = expenses.filter(e => e.date >= startOfWeek && e.date <= endOfToday)
  const weeklyTotal = weeklyExpenses.reduce((s, e) => s + e.amount, 0)
  
  const monthlyLimit = parseFloat(budget) || 0
  const proratedLimit = (monthlyLimit / totalDays) * day
  const weeklyLimit = monthlyLimit / 4.345 // average weeks in month
  
  const isOverMonthly = monthlyTotal > monthlyLimit
  const isOverProrated = monthlyTotal > proratedLimit
  const isOverWeekly = weeklyTotal > weeklyLimit
  
  const overshootAmt = monthlyTotal - monthlyLimit
  const overshootPct = monthlyLimit > 0 ? Math.round((monthlyTotal / monthlyLimit) * 100) : 0
  
  const progressPct = monthlyLimit > 0 ? Math.min((monthlyTotal / monthlyLimit) * 100, 100) : 0
  const proratedMark = (proratedLimit / monthlyLimit) * 100

  function handleSave() {
    const val = parseFloat(inputValue)
    if (isNaN(val) || val < 0) return
    onUpdateBudget(val)
    setEditing(false)
  }

  return (
    <>
      <div onClick={onClose} style={sheetBackdrop} />
      <div style={{ ...sheetBase, paddingBottom: 'calc(32px + var(--safe-bottom))', maxHeight: '90vh', overflowY: 'auto' }}>
        <SheetHandle />
        <div style={{ padding: '4px 24px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Monthly Budget</h2>
            <button onClick={onClose} style={{ fontSize: 20, color: 'var(--text-tertiary)' }}>✕</button>
          </div>

          <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '20px', border: '1px solid var(--border)', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Setting</p>
              {!editing ? (
                <button onClick={() => setEditing(true)} style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Edit Budget</button>
              ) : (
                <button onClick={handleSave} style={{ color: 'var(--success)', fontSize: 13, fontWeight: 600 }}>Save</button>
              )}
            </div>
            
            {editing ? (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>₹</span>
                <input
                  autoFocus
                  type="number"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder="Enter monthly limit"
                  style={{ width: '100%', fontSize: 24, fontWeight: 700, border: 'none', background: 'none', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
            ) : (
              <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 36, color: budget > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {budget > 0 ? formatCurrency(budget, isIncognito) : 'No budget set'}
              </p>
            )}
          </div>

          {budget > 0 && (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
                  <div>
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 2 }}>MONTH TO DATE</p>
                    <p style={{ fontSize: 22, fontWeight: 700, color: isOverProrated ? 'var(--danger)' : 'var(--text-primary)' }}>
                      <CountUp end={monthlyTotal} isIncognito={isIncognito} />
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 2 }}>PRORATED LIMIT</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>{formatCurrency(proratedLimit, isIncognito)}</p>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div style={{ height: 8, background: 'var(--bg-elevated)', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, height: '100%',
                    width: `${progressPct}%`,
                    background: isOverMonthly ? 'var(--danger)' : (isOverProrated ? '#d97706' : 'var(--accent)'),
                    transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }} />
                  {/* Prorated marker */}
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0, left: `${proratedMark}%`,
                    width: 2, background: 'rgba(255,255,255,0.4)', zIndex: 1
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>₹0</p>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{formatCurrency(budget, isIncognito)}</p>
                </div>
              </div>

              {isOverMonthly && (
                <div style={{ background: 'var(--danger-dim)', border: '1px solid rgba(226, 75, 74, 0.2)', borderRadius: 12, padding: '14px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 24 }}>🚨</span>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--danger)' }}>Over budget by {formatCurrency(overshootAmt, isIncognito)}</p>
                    <p style={{ fontSize: 12, color: 'var(--danger)', opacity: 0.8 }}>You are at {overshootPct}% of your monthly limit.</p>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ padding: '14px', borderRadius: 14, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>WEEKLY SPEND</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: isOverWeekly ? 'var(--danger)' : 'var(--text-primary)' }}>{formatCurrency(weeklyTotal, isIncognito)}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>Limit: {formatCurrency(weeklyLimit, isIncognito)}</p>
                </div>
                <div style={{ padding: '14px', borderRadius: 14, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>DAYS ELAPSED</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{day} / {totalDays}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{Math.round((day/totalDays)*100)}% through month</p>
                </div>
              </div>
            </div>
          )}
          
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 32, lineHeight: 1.6 }}>
            {budget > 0 
              ? `Your budget is prorated based on the current day (${day}/${totalDays}). Tracking this helps you stay consistent across the month.`
              : 'Set an overall monthly budget to track your spending pace throughout the month.'}
          </p>
        </div>
      </div>
    </>
  )
}
