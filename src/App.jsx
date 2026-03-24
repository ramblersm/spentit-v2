import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'food',          emoji: '🍔', label: 'Food',          color: '#e8622a' },
  { id: 'transport',     emoji: '🚗', label: 'Transport',     color: '#4361d8' },
  { id: 'shopping',      emoji: '🛒', label: 'Shopping',      color: '#9333ea' },
  { id: 'health',        emoji: '🏥', label: 'Health',        color: '#e24b4a' },
  { id: 'entertainment', emoji: '🎬', label: 'Fun',           color: '#d97706' },
  { id: 'bills',         emoji: '💡', label: 'Bills',         color: '#0891b2' },
  { id: 'travel',        emoji: '✈️', label: 'Travel',        color: '#0284c7' },
  { id: 'other',         emoji: '📦', label: 'Other',         color: '#6b7280' },
]

const FILTERS = [
  { id: 'today',  label: 'Today' },
  { id: 'week',   label: 'This Week' },
  { id: 'month',  label: 'This Month' },
  { id: 'custom', label: 'Custom' },
]

const RANKS = [
  { label: '🧘 Monk',     min: 0,    max: 0,        bg: '#e0f2f1', color: '#00695c', desc: 'Zero spend today. Absolute discipline.' },
  { label: '🌱 Frugal',   min: 0.01, max: 500,      bg: '#e8f5e9', color: '#2e7d32', desc: 'Daily avg under ₹500. Spending wisely.' },
  { label: '⚡ Balanced', min: 500,  max: 1500,     bg: '#e3f2fd', color: '#1565c0', desc: 'Daily avg ₹500–1500. Healthy balance.' },
  { label: '🔥 Spender',  min: 1500, max: 3000,     bg: '#fff3e0', color: '#e65100', desc: 'Daily avg ₹1500–3000. Watch the burn rate.' },
  { label: '💸 Splurger', min: 3000, max: Infinity, bg: '#fce4ec', color: '#880e4f', desc: 'Daily avg over ₹3000. Living large!' },
]

const WEATHER_HINTS = {
  rain:  '🌧️ Rainy day — expect more food delivery spend',
  storm: '⛈️ Stormy out — good day to stay in and save',
  snow:  '❄️ Cold outside — warm up without overspending',
  clear: '☀️ Beautiful day — enjoy without splurging',
  cloud: '⛅ Overcast — neutral spending day ahead',
  fog:   '🌫️ Foggy morning — slow day, track carefully',
}

const STORAGE_KEY  = 'spentit_v2_expenses'
const SPLASH_SHOWN = 'spentit_splash_shown'
const STREAK_KEY   = 'spentit_v2_streak'
const WEATHER_KEY  = 'spentit_v2_weather'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toDateStr = d  => d.toISOString().slice(0, 10)
const today     = () => toDateStr(new Date())

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR',
    minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(amount)
}

function formatDisplayDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const t = today()
  const yesterday = toDateStr(new Date(Date.now() - 86400000))
  if (dateStr === t)         return 'Today'
  if (dateStr === yesterday) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatExportDate(dateStr) {
  return new Date(dateStr + 'T00:00:00')
    .toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function getFilterRange(filterId, customRange) {
  const now = new Date(); const t = today()
  if (filterId === 'today') return { from: t, to: t }
  if (filterId === 'week') {
    const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    return { from: toDateStr(mon), to: t }
  }
  if (filterId === 'month') return { from: toDateStr(new Date(now.getFullYear(), now.getMonth(), 1)), to: t }
  if (filterId === 'custom') return customRange
  return { from: t, to: t }
}

const getCat  = id => CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1]
const loadExp = ()  => { try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : [] } catch { return [] } }
const saveExp = ex  => localStorage.setItem(STORAGE_KEY, JSON.stringify(ex))
const genId   = ()  => Date.now().toString(36) + Math.random().toString(36).slice(2)

function getRank(avgPerDay) {
  for (const r of RANKS) if (avgPerDay >= r.min && avgPerDay <= r.max) return r
  return RANKS[RANKS.length - 1]
}

function computeStreak(expenses) {
  const dates = [...new Set(expenses.map(e => e.date))].sort((a, b) => b.localeCompare(a))
  if (!dates.length) return 0
  const t         = today()
  const yesterday = toDateStr(new Date(Date.now() - 86400000))
  if (dates[0] !== t && dates[0] !== yesterday) return 0
  let streak = 0
  let cursor = dates[0] === t ? new Date() : new Date(yesterday + 'T00:00:00')
  for (const d of dates) {
    if (d === toDateStr(cursor)) { streak++; cursor = new Date(cursor.getTime() - 86400000) }
    else break
  }
  return streak
}

function buildExportText(expenses) {
  if (!expenses.length) return ''
  const grouped = {}
  expenses.forEach(e => { if (!grouped[e.date]) grouped[e.date] = []; grouped[e.date].push(e) })
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))
  const lines = []
  dates.forEach(date => {
    lines.push(`📅 ${formatExportDate(date)}`)
    grouped[date].sort((a, b) => b.createdAt - a.createdAt).forEach(e => {
      const cat = getCat(e.category)
      lines.push(`  ${cat.emoji} ${e.note || cat.label} · ${cat.label} · ${formatCurrency(e.amount)}`)
    })
    lines.push('')
  })
  const catTotals = {}
  expenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount })
  Object.entries(catTotals).sort((a, b) => b[1] - a[1]).forEach(([catId, total]) => {
    lines.push(`${getCat(catId).emoji} ${getCat(catId).label.padEnd(14)} ${formatCurrency(total)}`)
  })
  lines.push('─────────────────────────')
  lines.push(`💰 Total           ${formatCurrency(expenses.reduce((s, e) => s + e.amount, 0))}`)
  return lines.join('\n')
}

// ─── Weather helpers ──────────────────────────────────────────────────────────

function getWeatherHint(weatherCode) {
  if ([51,53,55,61,63,65,80,81,82].includes(weatherCode)) return WEATHER_HINTS.rain
  if ([95,96,99].includes(weatherCode))                   return WEATHER_HINTS.storm
  if ([71,73,75,77,85,86].includes(weatherCode))          return WEATHER_HINTS.snow
  if ([0,1].includes(weatherCode))                        return WEATHER_HINTS.clear
  if ([45,48].includes(weatherCode))                      return WEATHER_HINTS.fog
  return WEATHER_HINTS.cloud
}

async function fetchWeather() {
  try {
    const cached = JSON.parse(localStorage.getItem(WEATHER_KEY) || 'null')
    if (cached && cached.date === today()) return cached

    const pos = await new Promise((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, { timeout: 6000 })
    )
    const { latitude: lat, longitude: lon } = pos.coords

    const [wxRes, geoRes] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`),
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
    ])
    const wxData  = await wxRes.json()
    const geoData = await geoRes.json()

    const city  = geoData.address?.city || geoData.address?.town || geoData.address?.suburb || 'Your city'
    const temp  = Math.round(wxData.current_weather.temperature)
    const code  = wxData.current_weather.weathercode
    const hint  = getWeatherHint(code)
    const result = { date: today(), city, temp, hint }
    localStorage.setItem(WEATHER_KEY, JSON.stringify(result))
    return result
  } catch { return null }
}

// ─── Chime ────────────────────────────────────────────────────────────────────

function playChime() {
  try {
    const ctx   = new (window.AudioContext || window.webkitAudioContext)()
    const notes = [523.25, 659.25, 783.99]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'; osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.13
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.18, t + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)
      osc.start(t); osc.stop(t + 0.36)
    })
  } catch (_) {}
}

// ─── Splash ───────────────────────────────────────────────────────────────────

function SplashScreen({ onDone }) {
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

// ─── Chime Ripple ─────────────────────────────────────────────────────────────

function ChimeRipple({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 700); return () => clearTimeout(t) }, [onDone])
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {[0,1].map(i => <div key={i} style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', border: '2px solid rgba(67,97,216,0.4)', animation: `chimeRipple 0.7s ease ${i*0.18}s forwards` }} />)}
      <div style={{ fontSize: 32, animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>✅</div>
    </div>
  )
}

// ─── Pull to refresh ──────────────────────────────────────────────────────────

function usePullToRefresh(onRefresh, scrollRef) {
  const [distance, setDistance] = useState(0)
  const startY = useRef(null); const active = useRef(false)
  const THRESHOLD = 68

  const onTouchStart = useCallback(e => {
    if (scrollRef.current && scrollRef.current.scrollTop <= 0) {
      startY.current = e.touches[0].clientY; active.current = false
    }
  }, [scrollRef])

  const onTouchMove = useCallback(e => {
    if (startY.current === null) return
    const dy = e.touches[0].clientY - startY.current
    if (dy > 4) { active.current = true; setDistance(Math.min(dy * 0.45, 90)) }
    else { active.current = false; setDistance(0) }
  }, [])

  const onTouchEnd = useCallback(() => {
    if (active.current && distance >= THRESHOLD) onRefresh()
    setDistance(0); startY.current = null; active.current = false
  }, [distance, onRefresh, THRESHOLD])

  return { distance, THRESHOLD, onTouchStart, onTouchMove, onTouchEnd }
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const dateInputStyle = {
  width: '100%', background: 'var(--bg-elevated)',
  border: '1px solid var(--border-strong)', borderRadius: 10,
  padding: '8px 12px', color: 'var(--text-primary)',
  fontSize: 14, outline: 'none', colorScheme: 'light',
}

const sheetBackdrop = {
  position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.35)',
  zIndex: 50, backdropFilter: 'blur(4px)',
}

const sheetBase = {
  position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 51,
  background: 'var(--bg-sheet)', borderRadius: '28px 28px 0 0',
  border: '1px solid var(--border-strong)', borderBottom: 'none',
  animation: 'slideUp 0.35s cubic-bezier(0.32,0.72,0,1)',
}

function SheetHandle() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 14, paddingBottom: 8 }}>
      <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)' }} />
    </div>
  )
}

// ─── Rank Badge ───────────────────────────────────────────────────────────────

function RankBadge({ expenses }) {
  const [showInfo, setShowInfo] = useState(false)
  const [prev,     setPrev]     = useState(null)
  const [anim,     setAnim]     = useState(false)
  const days = expenses.length ? [...new Set(expenses.map(e => e.date))].length : 1
  const avg  = expenses.reduce((s, e) => s + e.amount, 0) / days
  const rank = getRank(avg)

  useEffect(() => {
    if (prev && prev !== rank.label) { setAnim(true); setTimeout(() => setAnim(false), 500) }
    setPrev(rank.label)
  }, [rank.label])

  return (
    <>
      <button onClick={() => setShowInfo(true)} style={{
        padding: '4px 11px', borderRadius: 20,
        background: rank.bg, color: rank.color,
        fontSize: 12, fontWeight: 600,
        border: `1px solid ${rank.color}33`,
        animation: anim ? 'rankPop 0.45s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
        cursor: 'pointer', whiteSpace: 'nowrap',
      }}>{rank.label}</button>

      {showInfo && (
        <>
          <div onClick={() => setShowInfo(false)} style={sheetBackdrop} />
          <div style={{ ...sheetBase, paddingBottom: 'calc(28px + var(--safe-bottom))', maxHeight: '75vh', overflowY: 'auto' }}>
            <SheetHandle />
            <div style={{ padding: '4px 20px 20px' }}>
              <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Your Saver Rank</p>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 16 }}>
                Based on daily avg spend · currently <strong style={{ color: rank.color }}>{formatCurrency(Math.round(avg))}/day</strong>
              </p>
              {RANKS.map(r => (
                <div key={r.label} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 14, marginBottom: 8,
                  background: r.label === rank.label ? r.bg : 'var(--bg-elevated)',
                  border: `1.5px solid ${r.label === rank.label ? r.color + '55' : 'var(--border)'}`,
                }}>
                  <span style={{ fontSize: 22, minWidth: 30 }}>{r.label.split(' ')[0]}</span>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: r.label === rank.label ? r.color : 'var(--text-primary)' }}>
                      {r.label.split(' ').slice(1).join(' ')}
                      {r.label === rank.label && <span style={{ fontSize: 11, marginLeft: 6, opacity: 0.7 }}>← you</span>}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}

// ─── Streak Badge ─────────────────────────────────────────────────────────────

function StreakBadge({ expenses }) {
  const streak = computeStreak(expenses)
  const [prev, setPrev] = useState(streak)
  const [anim, setAnim] = useState(false)
  useEffect(() => {
    if (streak > prev) { setAnim(true); setTimeout(() => setAnim(false), 600) }
    setPrev(streak)
  }, [streak])
  if (streak === 0) return null
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      padding: '4px 10px', borderRadius: 20,
      background: streak >= 7 ? '#fff3e0' : '#fff8e1',
      border: `1px solid ${streak >= 7 ? '#ffb74d' : '#ffe082'}`,
      color: streak >= 7 ? '#e65100' : '#f57f17',
      fontSize: 12, fontWeight: 700,
      animation: anim ? 'rankPop 0.5s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
    }}>
      <span style={{ fontSize: 13, display: 'inline-block', animation: streak >= 3 ? 'streakFlame 1.4s ease-in-out infinite' : 'none' }}>🔥</span>
      <span>{streak}d</span>
    </div>
  )
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({ expenses, filter }) {
  const [showTopInfo, setShowTopInfo] = useState(false)
  const total = expenses.reduce((s, e) => s + e.amount, 0)
  const count = expenses.length
  const label = FILTERS.find(f => f.id === filter)?.label || 'Today'

  const catMap = {}
  expenses.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + e.amount })
  const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1])
  const topCat     = sortedCats[0] ? getCat(sortedCats[0][0]) : null
  const topAmt     = sortedCats[0]?.[1] || 0
  const topCount   = expenses.filter(e => e.category === topCat?.id).length
  const topPct     = total > 0 ? Math.round((topAmt / total) * 100) : 0

  return (
    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</p>
          <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 38, lineHeight: 1, color: total > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)', letterSpacing: '-0.02em' }}>
            {total > 0 ? formatCurrency(total) : 'nothing yet'}
          </p>
        </div>
        {topCat && (
          <button onClick={() => setShowTopInfo(true)} style={{
            background: 'var(--bg-elevated)', borderRadius: 14,
            padding: '10px 14px', textAlign: 'center',
            border: '1px solid var(--border)', cursor: 'pointer',
          }}>
            <div style={{ fontSize: 22 }}>{topCat.emoji}</div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>top spend</div>
          </button>
        )}
      </div>
      {count > 0 && <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 6 }}>{count} {count === 1 ? 'expense' : 'expenses'}</p>}

      {showTopInfo && topCat && (
        <>
          <div onClick={() => setShowTopInfo(false)} style={sheetBackdrop} />
          <div style={{ ...sheetBase, paddingBottom: 'calc(28px + var(--safe-bottom))' }}>
            <SheetHandle />
            <div style={{ padding: '4px 20px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: topCat.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{topCat.emoji}</div>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{topCat.label}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Your top spend this {label.toLowerCase()}</p>
                </div>
              </div>
              {[
                ['Total spent',  formatCurrency(topAmt)],
                ['% of overall', `${topPct}%`],
                ['Transactions', `${topCount} ${topCount === 1 ? 'entry' : 'entries'}`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{k}</span>
                  <span style={{ fontSize: 16, fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600, color: 'var(--text-primary)' }}>{v}</span>
                </div>
              ))}
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 14, lineHeight: 1.6 }}>
                {topPct >= 50
                  ? `Over half your ${label.toLowerCase()} spend went to ${topCat.label}. Consider spreading it across categories.`
                  : topPct >= 30
                  ? `${topCat.label} is your biggest category at ${topPct}% of total spend.`
                  : `${topCat.label} leads your spend at ${topPct}%. Your spending is fairly distributed.`}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

function FilterBar({ activeFilter, onFilterChange, customRange, onCustomRangeChange }) {
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

// ─── Weather Bar ──────────────────────────────────────────────────────────────

function WeatherBar() {
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

// ─── Expense Row + Detail Sheet ───────────────────────────────────────────────

function ExpenseRow({ expense, onDelete, onEdit }) {
  const cat = getCat(expense.category)
  const [showDetail, setShowDetail] = useState(false)
  const [swiped,     setSwiped]     = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const touchStartX = useRef(null)

  const onTouchStart = e => { touchStartX.current = e.touches[0].clientX }
  const onTouchMove  = e => {
    if (!touchStartX.current) return
    const dx = touchStartX.current - e.touches[0].clientX
    if (dx > 50)  setSwiped(true)
    if (dx < -20) setSwiped(false)
  }
  const onTouchEnd = () => { touchStartX.current = null }

  function handleDelete() { setDeleting(true); setTimeout(() => onDelete(expense.id), 380) }

  return (
    <>
      <div style={{
        position: 'relative', overflow: 'hidden',
        animation: deleting ? 'rowDelete 0.38s ease forwards' : 'popIn 0.28s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, background: 'var(--danger-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontSize: 18 }}>🗑️</span>
        </div>
        <div
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
          onClick={() => { if (!swiped) setShowDetail(true) }}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
            background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            transform: swiped ? 'translateX(-72px)' : 'translateX(0)',
            transition: 'transform 0.2s ease',
            position: 'relative', zIndex: 1, cursor: 'pointer',
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: cat.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{cat.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{expense.note || cat.label}</p>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 1 }}>{cat.label}</p>
          </div>
          <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 17, color: 'var(--text-primary)', letterSpacing: '-0.02em', flexShrink: 0 }}>{formatCurrency(expense.amount)}</p>
          {swiped && <button onClick={handleDelete} style={{ position: 'absolute', right: -64, width: 56, top: 0, bottom: 0, background: 'var(--danger)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}>Del</button>}
        </div>
      </div>

      {/* Detail sheet */}
      {showDetail && (
        <>
          <div onClick={() => setShowDetail(false)} style={sheetBackdrop} />
          <div style={{ ...sheetBase, paddingBottom: 'calc(28px + var(--safe-bottom))' }}>
            <SheetHandle />
            <div style={{ padding: '4px 20px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: cat.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{cat.emoji}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>{expense.note || cat.label}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{cat.label}</p>
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 26, color: 'var(--accent)', letterSpacing: '-0.02em' }}>{formatCurrency(expense.amount)}</p>
              </div>
              {[
                ['📅 Date',     formatDisplayDate(expense.date)],
                ['🕐 Added at', formatTime(expense.createdAt)],
                ['🗂 Category', cat.label],
                ['📝 Note',     expense.note || '—'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{k}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => { setShowDetail(false); onDelete(expense.id) }} style={{ flex: 1, padding: '13px', borderRadius: 'var(--radius-md)', background: 'var(--danger-dim)', color: 'var(--danger)', fontSize: 14, fontWeight: 600, border: '1px solid var(--danger-dim)', cursor: 'pointer' }}>Delete</button>
                <button onClick={() => { setShowDetail(false); onEdit(expense) }} style={{ flex: 2, padding: '13px', borderRadius: 'var(--radius-md)', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 2px 12px var(--accent-glow)' }}>✏️ Edit Expense</button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ filter }) {
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

// ─── Pull Indicator ───────────────────────────────────────────────────────────

function PullIndicator({ distance, threshold, refreshing }) {
  const progress = Math.min(distance / threshold, 1)
  return (
    <div style={{ height: distance > 0 || refreshing ? (refreshing ? 44 : distance * 0.55) : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: refreshing ? 'height 0.2s ease' : 'none', overflow: 'hidden' }}>
      {refreshing
        ? <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2.5px solid var(--border-strong)', borderTopColor: 'var(--accent)', animation: 'spinnerRotate 0.7s linear infinite' }} />
        : distance > 8 && <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2.5px solid var(--border-strong)', background: `conic-gradient(var(--accent) ${progress * 360}deg, transparent 0)`, opacity: progress, transition: 'opacity 0.1s' }} />
      }
    </div>
  )
}

// ─── Export Sheet ─────────────────────────────────────────────────────────────

function ExportSheet({ expenses, onClose }) {
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

// ─── Add / Edit Expense Sheet ─────────────────────────────────────────────────

function AddExpenseSheet({ onClose, onAdd, onUpdate, editExpense = null, seedAmount = null }) {
  const isEdit = !!editExpense
  const [step,     setStep]     = useState(isEdit || seedAmount ? 'details' : 'amount')
  const [amount,   setAmount]   = useState(isEdit ? String(editExpense.amount) : seedAmount ? String(seedAmount) : '')
  const [category, setCategory] = useState(isEdit ? editExpense.category : 'food')
  const [note,     setNote]     = useState(isEdit ? editExpense.note : '')
  const [date,     setDate]     = useState(isEdit ? editExpense.date : today())
  const [showNote, setShowNote] = useState(isEdit && !!editExpense.note)
  const [showDate, setShowDate] = useState(false)

  function handleKey(val) {
    if (val === 'del') { setAmount(p => p.slice(0, -1)); return }
    if (val === '.' && amount.includes('.')) return
    if (amount.includes('.') && amount.split('.')[1]?.length >= 2) return
    if (amount.length >= 10) return
    setAmount(p => p + val)
  }

  function handleSubmit() {
    if (!amount || parseFloat(amount) <= 0) return
    if (isEdit) {
      onUpdate({ ...editExpense, amount: parseFloat(amount), category, note: note.trim(), date })
    } else {
      onAdd({ id: genId(), amount: parseFloat(amount), category, note: note.trim(), date, createdAt: Date.now() })
    }
    onClose()
  }

  const keys = ['1','2','3','4','5','6','7','8','9','.','0','del']

  return (
    <>
      <div onClick={onClose} style={sheetBackdrop} />
      <div style={{ ...sheetBase, paddingBottom: 'calc(24px + var(--safe-bottom))', maxHeight: '92vh', overflow: 'hidden' }}>
        <SheetHandle />
        {step === 'amount' ? (
          <div style={{ padding: '0 24px' }}>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', marginBottom: 16 }}>How much did you spend?</p>
            <div style={{ textAlign: 'center', marginBottom: 22, padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: amount.length > 6 ? 36 : 50, color: amount ? 'var(--text-primary)' : 'var(--text-tertiary)', letterSpacing: '-0.03em', transition: 'font-size 0.15s ease' }}>₹{amount || '0'}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
              {keys.map(k => (
                <button key={k} onClick={() => handleKey(k)}
                  onTouchStart={e => e.currentTarget.style.transform = 'scale(0.91)'}
                  onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
                  style={{ padding: '17px 8px', borderRadius: 'var(--radius-md)', fontSize: k === 'del' ? 18 : 20, fontWeight: 500, background: k === 'del' ? 'var(--bg)' : 'var(--bg-elevated)', color: k === 'del' ? 'var(--text-secondary)' : 'var(--text-primary)', border: '1px solid var(--border)', transition: 'transform 0.08s ease' }}>
                  {k === 'del' ? '⌫' : k}
                </button>
              ))}
            </div>
            <button onClick={() => { if (amount && parseFloat(amount) > 0) setStep('details') }} disabled={!amount || parseFloat(amount) <= 0}
              style={{ width: '100%', padding: '15px', borderRadius: 'var(--radius-md)', fontSize: 15, fontWeight: 600, background: (!amount || parseFloat(amount) <= 0) ? 'var(--bg-elevated)' : 'var(--accent)', color: (!amount || parseFloat(amount) <= 0) ? 'var(--text-tertiary)' : '#ffffff', border: 'none', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: (!amount || parseFloat(amount) <= 0) ? 'none' : '0 2px 12px var(--accent-glow)' }}>
              Continue →
            </button>
          </div>
        ) : (
          <div style={{ padding: '0 24px', overflowY: 'auto', maxHeight: '78vh' }}>
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 34, color: 'var(--accent)', letterSpacing: '-0.02em' }}>₹{amount}</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Category</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 18 }}>
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setCategory(cat.id)} style={{ padding: '10px 4px', borderRadius: 14, border: '1.5px solid ' + (category === cat.id ? cat.color : 'var(--border)'), background: category === cat.id ? cat.color + '14' : 'var(--bg-elevated)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all 0.15s ease', cursor: 'pointer' }}>
                  <span style={{ fontSize: 20 }}>{cat.emoji}</span>
                  <span style={{ fontSize: 10, color: category === cat.id ? 'var(--text-primary)' : 'var(--text-tertiary)', fontWeight: 500 }}>{cat.label}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowNote(p => !p)} style={{ width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid ' + (showNote ? 'var(--accent)' : 'var(--border)'), color: note ? 'var(--text-primary)' : 'var(--text-tertiary)', fontSize: 14, marginBottom: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{note || 'Add a note...'}</span>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{showNote ? '▲' : '▼'}</span>
            </button>
            {showNote && <input autoFocus value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Lunch at Rajdhani" maxLength={60} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--accent)', color: 'var(--text-primary)', fontSize: 15, outline: 'none', marginBottom: 8, animation: 'fadeSlideIn 0.2s ease' }} />}
            <button onClick={() => setShowDate(p => !p)} style={{ width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid ' + (showDate ? 'var(--accent)' : 'var(--border)'), color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>📅 {formatDisplayDate(date)}</span>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{showDate ? '▲' : '▼'}</span>
            </button>
            {showDate && <input type="date" value={date} max={today()} onChange={e => setDate(e.target.value)} style={{ ...dateInputStyle, marginBottom: 8, animation: 'fadeSlideIn 0.2s ease' }} />}
            <div style={{ display: 'flex', gap: 10, marginTop: 14, paddingBottom: 8 }}>
              {!isEdit && <button onClick={() => setStep('amount')} style={{ flex: 1, padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500, border: '1px solid var(--border)' }}>← Back</button>}
              <button onClick={handleSubmit} style={{ flex: 2, padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--accent)', color: '#ffffff', fontSize: 15, fontWeight: 700, border: 'none', boxShadow: '0 2px 12px var(--accent-glow)', cursor: 'pointer' }}>
                {isEdit ? '✓ Save Changes' : 'Save Expense'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ─── Calc Sheet ───────────────────────────────────────────────────────────────

function CalcSheet({ onClose, onSaveAsExpense }) {
  const [tape,    setTape]    = useState([])
  const [current, setCurrent] = useState('')
  const [totAnim, setTotAnim] = useState(false)
  const total = tape.reduce((s, n) => s + n, 0)

  function handleKey(val) {
    if (val === 'del') { setCurrent(p => p.slice(0, -1)); return }
    if (val === '.' && current.includes('.')) return
    if (current.includes('.') && current.split('.')[1]?.length >= 2) return
    if (current.replace('.','').length >= 8) return
    setCurrent(p => p + val)
  }

  function handleAdd() {
    const n = parseFloat(current)
    if (!current || isNaN(n) || n <= 0) return
    setTape(p => [...p, n]); setCurrent('')
    setTotAnim(true); setTimeout(() => setTotAnim(false), 400)
  }

  const keys = ['7','8','9','4','5','6','1','2','3','.','0','del']

  return (
    <>
      <div onClick={onClose} style={sheetBackdrop} />
      <div style={{ ...sheetBase, paddingBottom: 'calc(24px + var(--safe-bottom))', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        <SheetHandle />
        <div style={{ padding: '6px 20px 12px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>🧮 Expense Calculator</p>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 1 }}>Add items, then save total as expense</p>
          </div>
          <button onClick={onClose} style={{ fontSize: 20, color: 'var(--text-tertiary)', padding: 4 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px 4px', minHeight: 60 }}>
          {tape.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '10px 0' }}>Enter amounts and tap + to add them</p>}
          {tape.map((n, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', marginBottom: 4, background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)', animation: 'calcTapeIn 0.2s ease' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Item {i + 1}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 16, color: 'var(--text-primary)' }}>{formatCurrency(n)}</span>
                <button onClick={() => setTape(p => p.filter((_, j) => j !== i))} style={{ fontSize: 14, color: 'var(--danger)', padding: '0 2px' }}>✕</button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ margin: '6px 20px', padding: '10px 14px', background: total > 0 ? 'var(--accent-dim)' : 'var(--bg-elevated)', borderRadius: 14, border: '1px solid ' + (total > 0 ? 'var(--border-strong)' : 'var(--border)'), display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 500 }}>{tape.length > 0 ? `${tape.length} item${tape.length > 1 ? 's' : ''}` : 'Total'}</span>
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22, color: total > 0 ? 'var(--accent)' : 'var(--text-tertiary)', letterSpacing: '-0.02em', animation: totAnim ? 'totalPop 0.35s ease' : 'none' }}>{total > 0 ? formatCurrency(total) : '₹0'}</span>
        </div>
        <div style={{ margin: '0 20px 8px', padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 14, border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Add item</span>
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22, color: current ? 'var(--text-primary)' : 'var(--text-tertiary)', letterSpacing: '-0.02em' }}>₹{current || '0'}</span>
        </div>
        <div style={{ padding: '0 20px', flexShrink: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7, marginBottom: 8 }}>
            {keys.map(k => (
              <button key={k} onClick={() => handleKey(k)}
                onTouchStart={e => e.currentTarget.style.transform = 'scale(0.91)'}
                onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
                style={{ padding: '14px 8px', borderRadius: 12, fontSize: k === 'del' ? 16 : 18, fontWeight: 500, background: k === 'del' ? 'var(--bg)' : 'var(--bg-elevated)', color: k === 'del' ? 'var(--text-secondary)' : 'var(--text-primary)', border: '1px solid var(--border)', transition: 'transform 0.08s ease' }}>
                {k === 'del' ? '⌫' : k}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleAdd} disabled={!current || parseFloat(current) <= 0} style={{ flex: 1, padding: '14px', borderRadius: 'var(--radius-md)', fontSize: 15, fontWeight: 600, background: (!current || parseFloat(current) <= 0) ? 'var(--bg-elevated)' : '#1a7a4a', color: (!current || parseFloat(current) <= 0) ? 'var(--text-tertiary)' : '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.15s ease' }}>+ Add</button>
            <button onClick={() => { if (total > 0) { onSaveAsExpense(total); onClose() } }} disabled={total <= 0} style={{ flex: 2, padding: '14px', borderRadius: 'var(--radius-md)', fontSize: 15, fontWeight: 700, background: total <= 0 ? 'var(--bg-elevated)' : 'var(--accent)', color: total <= 0 ? 'var(--text-tertiary)' : '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.15s ease', boxShadow: total > 0 ? '0 2px 12px var(--accent-glow)' : 'none' }}>
              Save ₹{total > 0 ? Math.round(total).toLocaleString('en-IN') : '0'} →
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [expenses,       setExpenses]       = useState(() => loadExp())
  const [activeFilter,   setActiveFilter]   = useState('today')
  const [customRange,    setCustomRange]    = useState({ from: today(), to: today() })
  const [showSheet,      setShowSheet]      = useState(false)
  const [showExport,     setShowExport]     = useState(false)
  const [showCalc,       setShowCalc]       = useState(false)
  const [showSplash,     setShowSplash]     = useState(() => !sessionStorage.getItem(SPLASH_SHOWN))
  const [showChime,      setShowChime]      = useState(false)
  const [refreshing,     setRefreshing]     = useState(false)
  const [listKey,        setListKey]        = useState(0)
  const [editExpense,    setEditExpense]    = useState(null)
  const [calcSeedAmount, setCalcSeedAmount] = useState(null)

  useEffect(() => { saveExp(expenses) }, [expenses])

  function addExpense(exp)    { setExpenses(p => [exp, ...p]); playChime(); setShowChime(true) }
  function deleteExpense(id)  { setExpenses(p => p.filter(e => e.id !== id)) }
  function updateExpense(exp) { setExpenses(p => p.map(e => e.id === exp.id ? exp : e)); playChime(); setShowChime(true) }

  function handleEdit(exp)   { setEditExpense(exp); setShowSheet(true) }
  function handleCloseSheet() { setShowSheet(false); setEditExpense(null); setCalcSeedAmount(null) }
  function handleSaveFromCalc(amount) { setCalcSeedAmount(amount); setShowSheet(true) }
  function handleSplashDone() { sessionStorage.setItem(SPLASH_SHOWN, '1'); setShowSplash(false) }

  function handleRefresh() {
    setRefreshing(true)
    setTimeout(() => { setExpenses(loadExp()); setListKey(k => k + 1); setRefreshing(false) }, 800)
  }

  const scrollRef = useRef(null)
  const { distance, THRESHOLD, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh(handleRefresh, scrollRef)

  const range      = getFilterRange(activeFilter, customRange)
  const filtered   = expenses.filter(e => e.date >= range.from && e.date <= range.to).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
  const grouped    = filtered.reduce((acc, e) => { if (!acc[e.date]) acc[e.date] = []; acc[e.date].push(e); return acc }, {})
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', paddingTop: 'var(--safe-top)' }}>
      {showSplash && <SplashScreen onDone={handleSplashDone} />}
      {showChime  && <ChimeRipple  onDone={() => setShowChime(false)} />}

      {/* Header */}
      <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid var(--border)', animation: 'headerAppear 0.5s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 26, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>SpentIt</h1>
          {filtered.length > 0 && (
            <button onClick={() => setShowExport(true)} style={{ padding: '6px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: 'var(--bg-elevated)', color: 'var(--accent)', border: '1px solid var(--border-strong)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
              <span>📤</span> Export
            </button>
          )}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Track your spends easy! 💸</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <StreakBadge expenses={expenses} />
          <RankBadge   expenses={filtered} />
          <button onClick={() => setShowCalc(true)} style={{ width: 34, height: 34, borderRadius: '50%', fontSize: 16, background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🧮</button>
        </div>
      </div>

      <SummaryCard expenses={filtered} filter={activeFilter} />
      <FilterBar   activeFilter={activeFilter} onFilterChange={setActiveFilter} customRange={customRange} onCustomRangeChange={setCustomRange} />
      <WeatherBar />

      {/* List */}
      <div key={listKey} ref={scrollRef} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <PullIndicator distance={distance} threshold={THRESHOLD} refreshing={refreshing} />
        <div style={{ flex: 1, padding: '12px 16px 100px' }}>
          {sortedDates.length === 0 ? <EmptyState filter={activeFilter} /> : sortedDates.map(date => (
            <div key={date} style={{ marginBottom: 18, animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{formatDisplayDate(date)}</p>
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{formatCurrency(grouped[date].reduce((s, e) => s + e.amount, 0))}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {grouped[date].map(exp => <ExpenseRow key={exp.id} expense={exp} onDelete={deleteExpense} onEdit={handleEdit} />)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAB */}
      <button onClick={() => setShowSheet(true)} onTouchStart={e => e.currentTarget.style.transform = 'scale(0.90)'} onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
        style={{ position: 'fixed', bottom: 'calc(28px + var(--safe-bottom))', right: 24, width: 58, height: 58, borderRadius: '50%', background: 'var(--accent)', color: '#ffffff', fontSize: 28, fontWeight: 300, boxShadow: '0 4px 20px var(--accent-glow)', zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', transition: 'transform 0.12s ease' }}>+</button>

      {showSheet  && <AddExpenseSheet onClose={handleCloseSheet} onAdd={addExpense} onUpdate={updateExpense} editExpense={editExpense} seedAmount={calcSeedAmount} />}
      {showExport && <ExportSheet     expenses={filtered} onClose={() => setShowExport(false)} />}
      {showCalc   && <CalcSheet       onClose={() => setShowCalc(false)} onSaveAsExpense={handleSaveFromCalc} />}
    </div>
  )
}
