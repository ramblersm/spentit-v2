# SpentIt v2 💸

**SpentIt v2** is a modern, lightweight expense tracking Progressive Web App (PWA) designed for speed and simplicity. Built with React and Vite, it offers a mobile-first experience that makes logging and analyzing your daily spending effortless.

## 🚀 High-Level Features

### ⚡ Seamless Tracking
- **Two-Step Entry:** A streamlined flow using a custom numpad for quick amount entry followed by category selection.
- **Expense Calculator:** A built-in calculator to sum up multiple items before saving them as a single expense.
- **Autocomplete Notes:** Suggests frequently used notes to speed up your entry process.
- **Smart Categorization:** Organize expenses into clear categories like Food, Transport, Shopping, and more.
- **Personal vs. Shared:** Clearly distinguish between personal spending and shared costs with a simple toggle.
- **Swipe-to-Action:** Intuitive swipe-to-delete on expense rows for rapid management.
- **Quick Edit & Undo:** Easily modify past entries with built-in undo support for accidental deletions.

### 🎮 Gamification & Insights
- **Saver Ranks:** See your spending persona based on daily averages (from **🧘 Monk** to **💸 Splurger**).
- **Daily Streaks:** Stay motivated with a visual streak counter and affirmations for consistent tracking (3, 7, 14, and 30-day milestones).
- **Weather-Based Hints:** Get contextual spending tips based on your local weather (e.g., "Rainy day — expect more food delivery spend").
- **Dynamic Summaries:** Instantly view total spending and your top category for any selected period.
- **Category Deep Dives:** Detailed breakdown of your biggest spending categories, including percentage of total and distribution analysis.

### 📱 Modern PWA Experience
- **Installable:** Add to your home screen on iOS and Android for a native app feel.
- **Offline Capable:** Keep tracking even without an internet connection.
- **Pull-to-Refresh:** Smooth, mobile-native data synchronization.
- **Audio Feedback:** A satisfying "chime" and visual ripple on successful entries.
- **Cloud Sync:** Secure data persistence and multi-device synchronization powered by **Supabase**.

### 🛠 Tools & Customization
- **Flexible Filtering:** Quickly toggle between Today, This Week, and This Month, or define a custom date range.
- **Export Data:** Download your expense history for personal records or external tools like Splitwise.
- **Currency Support:** Easily customize the app for your local currency (defaults to INR).

---

## 🛠 Stack
- **Frontend:** React 18 + Vite 5
- **PWA:** `vite-plugin-pwa` for service workers and manifest management
- **Backend:** Supabase (Auth & Database)
- **APIs:** Open-Meteo (Weather), Nominatim (Geolocation)

## 💻 Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Run development server:**
   ```bash
   npm run dev
   ```

## 🚀 Deployment

The app is optimized for deployment on **Vercel**:
1. Push your repository to GitHub.
2. Import the project on [vercel.com](https://vercel.com).
3. Vercel automatically detects the Vite configuration — simply hit deploy! ✅

## 📱 iOS PWA (Add to Home Screen)

After deploying:
1. Open the app URL in **Safari** on your iPhone.
2. Tap the **Share** button.
3. Select **"Add to Home Screen"**.
4. Name it "SpentIt" and tap **Add**.

The app will now launch full-screen, offline-capable, with its own icon.

## ⚙️ Customizing Currency

To change the default currency, navigate to `src/App.jsx` and update the `formatCurrency` function:

```js
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', 
    currency: 'INR', // ← Change this to your desired currency code (e.g., 'USD', 'EUR')
    ...
  }).format(amount)
}
```
