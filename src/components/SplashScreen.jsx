import { useState, useEffect } from 'react'

export default function SplashScreen({ onDone }) {
  const [hiding, setHiding] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => { setHiding(true); setTimeout(onDone, 500) }, 1800)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#4361d8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, animation: hiding ? 'splashFadeOut 0.5s ease forwards' : 'none' }}>
      <div style={{ animation: 'splashLogoIn 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards', opacity: 0, animationDelay: '0.1s' }}>
        <p style={{ fontFamily: 'Instrument Serif, serif', fontSize: 56, color: '#fff', letterSpacing: '-0.03em', fontStyle: 'italic', lineHeight: 1 }}>SpentIt</p>
      </div>
      <div style={{ animation: 'splashSubIn 0.5s ease forwards', opacity: 0, animationDelay: '0.4s' }}>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)' }}>Track your spends easy! 💸</p>
      </div>
      <div style={{ display: 'flex', gap: 7, marginTop: 32 }}>
        {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.6)', animation: `splashDotPulse 1.1s ease ${i*0.18}s infinite` }} />)}
      </div>
    </div>
  )
}
