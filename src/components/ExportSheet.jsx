import { useState } from 'react'
import { buildExportText } from '../utils'
import { sheetBackdrop, sheetBase } from './sharedStyles'
import SheetHandle from './SheetHandle'

export default function ExportSheet({ expenses, onClose }) {
  const [copied, setCopied] = useState(false)
  const text = buildExportText(expenses)
  function handleCopy() { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2200) }) }
  return (
    <>
      <div onClick={onClose} style={sheetBackdrop} />
      <div style={{ ...sheetBase, paddingBottom: 'calc(24px + var(--safe-bottom))', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <SheetHandle />
        <div style={{ padding: '4px 20px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>Export for Splitwise</p>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>{expenses.length} expenses · copy and paste as a note</p>
          </div>
          <button onClick={onClose} style={{ fontSize: 20, color: 'var(--text-tertiary)', padding: 4 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          <pre style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.8, color: 'var(--text-secondary)', background: 'var(--bg)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--border)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{text || 'No expenses to export.'}</pre>
        </div>
        <div style={{ padding: '12px 20px 4px', flexShrink: 0 }}>
          <button onClick={handleCopy} disabled={!text} style={{ width: '100%', padding: '16px', borderRadius: 'var(--radius-md)', fontSize: 15, fontWeight: 600, background: copied ? '#1a7a4a' : 'var(--accent)', color: '#ffffff', border: 'none', cursor: 'pointer', transition: 'background 0.25s ease', boxShadow: '0 2px 12px var(--accent-glow)' }}>
            {copied ? '✓ Copied to clipboard!' : '📋 Copy to clipboard'}
          </button>
        </div>
      </div>
    </>
  )
}
