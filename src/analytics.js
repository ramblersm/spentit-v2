// Fire and forget — never block the UI for tracking
export async function track(name, properties = {}, userId = null) {
  try {
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, properties, user_id: userId }),
    })
  } catch (_) {
    // Tracking must never crash the app
  }
}
