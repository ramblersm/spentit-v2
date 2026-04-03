import React from 'react'

export default function TypeFilterBar({ active, onChange }) {
  return (
    <div style={{ padding: '8px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
      {['all','personal','shared'].map(t => (
        <button key={t} onClick={() => onChange(t)} style={{
          padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
          background: active === t ? 'var(--accent)' : 'var(--bg-card)',
          color:      active === t ? '#ffffff'       : 'var(--text-secondary)',
          border: '1px solid ' + (active === t ? 'var(--accent)' : 'var(--border-strong)'),
          boxShadow: active === t ? '0 2px 8px var(--accent-glow)' : 'none',
          cursor: 'pointer',
        }}>
          {t === 'all' ? 'All' : t === 'personal' ? '👤 Personal' : '👥 Shared'}
        </button>
      ))}
    </div>
  )
}
