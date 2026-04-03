import { useState, useEffect } from 'react'
import { fetchWeather } from '../utils'

export default function WeatherBar() {
  const [weather,   setWeather]   = useState(null)
  const [dismissed, setDismissed] = useState(false)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    fetchWeather().then(w => { setWeather(w); setLoading(false) })
  }, [])

  if (loading || !weather || dismissed) return null

  return (
    <div style={{
      margin: '8px 16px 0',
      padding: '9px 14px',
      borderRadius: 12,
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      animation: 'fadeSlideIn 0.3s ease',
    }}>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
        {weather.hint} · <span style={{ color: 'var(--text-tertiary)' }}>{weather.city} {weather.temp}°C</span>
      </p>
      <button onClick={() => setDismissed(true)} style={{ fontSize: 14, color: 'var(--text-tertiary)', padding: '0 0 0 8px', flexShrink: 0 }}>✕</button>
    </div>
  )
}
