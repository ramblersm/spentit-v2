import React from 'react'

export default function EmptyState({ filter }) {
  const msgs = {
    today:  { icon: '🎉', title: 'Nothing spent today',  sub: 'Your wallet is breathing easy.' },
    week:   { icon: '📭', title: 'Clean week so far',    sub: 'No expenses recorded this week.' },
    month:  { icon: '🌱', title: 'Fresh month',          sub: 'No expenses this month yet.' },
    custom: { icon: '🔍', title: 'No expenses found',    sub: 'Try a different date range.' },
  }
  const m = msgs[filter] || msgs.today
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: 10, animation: 'fadeIn 0.4s ease' }}>
      <div style={{ fontSize: 44 }}>{m.icon}</div>
      <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{m.title}</p>
      <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center' }}>{m.sub}</p>
    </div>
  )
}
