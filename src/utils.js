import { CATEGORIES, RANKS, WEATHER_HINTS, STORAGE_KEY, WEATHER_KEY } from './constants'
import { supabase } from './supabase'

export const toDateStr = d  => d.toISOString().slice(0, 10)
export const today     = () => toDateStr(new Date())

export function formatCurrency(amount, isIncognito = false) {
  if (isIncognito) return '••••'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR',
    minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDisplayDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const t = today()
  const yesterday = toDateStr(new Date(Date.now() - 86400000))
  if (dateStr === t)         return 'Today'
  if (dateStr === yesterday) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function formatExportDate(dateStr) {
  return new Date(dateStr + 'T00:00:00')
    .toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export function getFilterRange(filterId, customRange) {
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

export const getCat  = id => CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1]
export const loadExp = ()  => { try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : [] } catch { return [] } }
export const saveExp = ex  => localStorage.setItem(STORAGE_KEY, JSON.stringify(ex))
export const genId   = ()  => Date.now().toString(36) + Math.random().toString(36).slice(2)

export function getRank(avgPerDay) {
  for (const r of RANKS) if (avgPerDay >= r.min && avgPerDay <= r.max) return r
  return RANKS[RANKS.length - 1]
}

export function computeStreak(expenses) {
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

export function buildExportText(expenses) {
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

export function getWeatherHint(weatherCode) {
  if ([51,53,55,61,63,65,80,81,82].includes(weatherCode)) return WEATHER_HINTS.rain
  if ([95,96,99].includes(weatherCode))                   return WEATHER_HINTS.storm
  if ([71,73,75,77,85,86].includes(weatherCode))          return WEATHER_HINTS.snow
  if ([0,1].includes(weatherCode))                        return WEATHER_HINTS.clear
  if ([45,48].includes(weatherCode))                      return WEATHER_HINTS.fog
  return WEATHER_HINTS.cloud
}

export async function fetchWeather() {
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

export function playChime() {
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

