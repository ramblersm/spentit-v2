import { useEffect } from 'react'

export default function ChimeRipple({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 700); return () => clearTimeout(t) }, [onDone])
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {[0,1].map(i => <div key={i} style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', border: '2px solid rgba(67,97,216,0.4)', animation: `chimeRipple 0.7s ease ${i*0.18}s forwards` }} />)}
      <div style={{ fontSize: 32, animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>✅</div>
    </div>
  )
}
