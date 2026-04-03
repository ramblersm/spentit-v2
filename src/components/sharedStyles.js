export const dateInputStyle = {
  width: '100%', background: 'var(--bg-elevated)',
  border: '1px solid var(--border-strong)', borderRadius: 10,
  padding: '8px 12px', color: 'var(--text-primary)',
  fontSize: 14, outline: 'none', colorScheme: 'light',
}

export const sheetBackdrop = {
  position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.35)',
  zIndex: 50, backdropFilter: 'blur(4px)',
}

export const sheetBase = {
  position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 51,
  background: 'var(--bg-sheet)', borderRadius: '28px 28px 0 0',
  border: '1px solid var(--border-strong)', borderBottom: 'none',
  animation: 'slideUp 0.35s cubic-bezier(0.32,0.72,0,1)',
}
