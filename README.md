# SpentIt v2 💸

A modern, PWA-ready expense tracker.

## Stack
- **React 18** + **Vite 5**
- **vite-plugin-pwa** for service worker + manifest
- **localStorage** for persistence (no database)

## Local Development

```bash
npm install
npm run dev
```

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Vercel auto-detects Vite — no config needed
4. Deploy ✅

## iOS PWA (Add to Home Screen)

After deploying to Vercel:
1. Open the URL in Safari on iPhone
2. Tap the Share button → **Add to Home Screen**
3. Name it "SpentIt" → Add

The app will launch full-screen, offline-capable, with your custom icon.

## Features

- 📊 Summary card (total + top category) per filter
- 🗂 Quick filters: Today / This Week / This Month / Custom date range
- ➕ Two-step add flow: Amount (numpad) → Category + optional Note/Date
- 👆 Swipe-to-delete on expense rows
- 💾 All data stored in localStorage — no sign-in, works offline
- 📱 Safe area insets for iPhone notch/home indicator
- 🎨 Warm dark theme with amber accent

## Customising Currency

In `src/App.jsx`, find the `formatCurrency` function and change `'INR'` to your currency code.

```js
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', // ← change this
    ...
  }).format(amount)
}
```
