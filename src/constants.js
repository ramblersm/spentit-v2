export const AVATARS = [
  { id: 'av1', url: 'https://api.dicebear.com/7.x/big-smile/svg?seed=Felix' },
  { id: 'av2', url: 'https://api.dicebear.com/7.x/big-smile/svg?seed=Aneka' },
  { id: 'av3', url: 'https://api.dicebear.com/7.x/big-smile/svg?seed=Buddy' },
  { id: 'av4', url: 'https://api.dicebear.com/7.x/big-smile/svg?seed=Cookie' },
  { id: 'av5', url: 'https://api.dicebear.com/7.x/big-smile/svg?seed=Daisy' },
  { id: 'av6', url: 'https://api.dicebear.com/7.x/big-smile/svg?seed=Emma' },
  { id: 'av7', url: 'https://api.dicebear.com/7.x/big-smile/svg?seed=Fiona' },
  { id: 'av8', url: 'https://api.dicebear.com/7.x/big-smile/svg?seed=George' },
  { id: 'av9', url: 'https://api.dicebear.com/7.x/big-smile/svg?seed=Milo' },
  { id: 'av10', url: 'https://api.dicebear.com/7.x/big-smile/svg?seed=Sophie' },
]

export const CATEGORIES = [
  { id: 'food',          emoji: '🍔', label: 'Food',          color: '#e8622a' },
  { id: 'transport',     emoji: '🚗', label: 'Transport',     color: '#4361d8' },
  { id: 'shopping',      emoji: '🛒', label: 'Groceries',     color: '#9333ea' },
  { id: 'health',        emoji: '🏥', label: 'Health',        color: '#e24b4a' },
  { id: 'entertainment', emoji: '🎬', label: 'Fun',           color: '#d97706' },
  { id: 'bills',         emoji: '💡', label: 'Bills',         color: '#0891b2' },
  { id: 'travel',        emoji: '✈️', label: 'Travel',        color: '#0284c7' },
  { id: 'other',         emoji: '📦', label: 'Other',         color: '#6b7280' },
]

export const FILTERS = [
  { id: 'today',  label: 'Today' },
  { id: 'week',   label: 'This Week' },
  { id: 'month',  label: 'This Month' },
  { id: 'custom', label: 'Custom' },
]

export const RANKS = [
  { label: '🧘 Monk',     min: 0,    max: 0,        bg: '#e0f2f1', color: '#00695c', desc: 'Zero spend today. Absolute discipline.' },
  { label: '🌱 Frugal',   min: 0.01, max: 750,      bg: '#e8f5e9', color: '#2e7d32', desc: 'Daily avg under ₹750. Spending wisely.' },
  { label: '⚡ Balanced', min: 750,  max: 1500,     bg: '#e3f2fd', color: '#1565c0', desc: 'Daily avg ₹750–1500. Healthy balance.' },
  { label: '🔥 Spender',  min: 1500, max: 4000,     bg: '#fff3e0', color: '#e65100', desc: 'Daily avg ₹1500–4000. Watch the burn rate.' },
  { label: '💸 Splurger', min: 4000, max: Infinity, bg: '#fce4ec', color: '#880e4f', desc: 'Daily avg over ₹4000. Living large!' },
]

export const WEATHER_HINTS = {
  rain:  '🌧️ Rainy day — expect more food delivery spend',
  storm: '⛈️ Stormy out — good day to stay in and save',
  snow:  '❄️ Cold outside — warm up without overspending',
  clear: '☀️ Beautiful day — enjoy without splurging',
  cloud: '⛅ Overcast — neutral spending day ahead',
  fog:   '🌫️ Foggy morning — slow day, track carefully',
}

export const STORAGE_KEY  = 'spentit_v2_expenses'
export const SPLASH_SHOWN = 'spentit_splash_shown'
export const STREAK_KEY   = 'spentit_v2_streak'
export const WEATHER_KEY  = 'spentit_v2_weather'
export const MIGRATED_KEY = 'spentit_migrated'
