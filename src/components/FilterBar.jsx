import { useState } from 'react'
import { FILTERS } from '../constants'
import { today } from '../utils'
import { dateInputStyle } from './sharedStyles'

export default function FilterBar({ activeFilter, onFilterChange, customRange, onCustomRangeChange }) {
  const [showPicker, setShowPicker] = useState(false)
  function handleChip(id) {
    if (id === 'custom') setShowPicker(p => !p); else setShowPicker(false)
    onFilterChange(id)
  }
  return (
    <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => handleChip(f.id)} style={{
            flexShrink: 0, padding: '7px 16px', borderRadius: 20,
            fontSize: 13, fontWeight: 500, transition: 'all 0.15s ease',
            background: activeFilter === f.id ? 'var(--accent)' : 'var(--bg-card)',
            color:      activeFilter === f.id ? '#ffffff' : 'var(--text-secondary)',
            border: '1px solid ' + (activeFilter === f.id ? 'var(--accent)' : 'var(--border-strong)'),
            boxShadow: activeFilter === f.id ? '0 2px 8px var(--accent-glow)' : 'none',
            cursor: 'pointer',
          }}>{f.label}</button>
        ))}
      </div>
      {activeFilter === 'custom' && showPicker && (
        <div style={{ marginTop: 10, display: 'flex', gap: 10, animation: 'fadeSlideIn 0.2s ease' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>FROM</label>
            <input type="date" value={customRange.from} max={customRange.to} onChange={e => onCustomRangeChange({ ...customRange, from: e.target.value })} style={dateInputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>TO</label>
            <input type="date" value={customRange.to} min={customRange.from} max={today()} onChange={e => onCustomRangeChange({ ...customRange, to: e.target.value })} style={dateInputStyle} />
          </div>
        </div>
      )}
    </div>
  )
}
