import React, { useMemo } from 'react'
import { getCat, formatCurrency, today, toDateStr } from '../utils'

export default function TrendsView({ expenses, isIncognito }) {
  const dailyData = useMemo(() => {
    const data = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const dateStr = toDateStr(d)
      const total = expenses
        .filter(e => e.date === dateStr)
        .reduce((sum, e) => sum + e.amount, 0)
      data.push({
        label: i === 0 ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 1),
        fullDate: dateStr,
        amount: total
      })
    }
    return data
  }, [expenses])

  const maxDaily = Math.max(...dailyData.map(d => d.amount), 100)

  const catData = useMemo(() => {
    const now = new Date()
    const startOfMonth = toDateStr(new Date(now.getFullYear(), now.getMonth(), 1))
    const currentMonthExp = expenses.filter(e => e.date >= startOfMonth)
    
    const totals = {}
    currentMonthExp.forEach(e => {
      totals[e.category] = (totals[e.category] || 0) + e.amount
    })
    
    return Object.entries(totals)
      .map(([id, amount]) => ({ ...getCat(id), amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [expenses])

  return (
    <div style={{ marginTop: 24, animation: 'fadeIn 0.4s ease' }}>
      <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Last 7 Days</p>
      
      {/* Simple Bar Chart */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 100, gap: 8, marginBottom: 8, padding: '0 4px' }}>
        {dailyData.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ 
              width: '100%', 
              height: `${(d.amount / maxDaily) * 80}px`, 
              minHeight: d.amount > 0 ? 4 : 0,
              background: d.fullDate === today() ? 'var(--accent)' : 'var(--accent-dim)', 
              borderRadius: '4px 4px 2px 2px',
              transition: 'height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
              position: 'relative'
            }}>
              {d.amount > 0 && (
                <div className="bar-hover-val" style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  {isIncognito ? '••' : Math.round(d.amount)}
                </div>
              )}
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500 }}>{d.label}</span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 32, marginBottom: 12 }}>This Month by Category</p>
      {catData.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px 0' }}>No data for this month</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {catData.map(cat => (
            <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{cat.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{cat.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{formatCurrency(cat.amount, isIncognito)}</span>
                </div>
                <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${(cat.amount / Math.max(...catData.map(c => c.amount))) * 100}%`, 
                    background: cat.color,
                    transition: 'width 0.8s ease'
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
