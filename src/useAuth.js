import { useState, useEffect } from 'react'
import { supabase } from './supabase'

export function useAuth() {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    )
    return () => subscription.unsubscribe()
  }, [])

  // Magic link flow for PWA:
  // 1. User enters email → supabase.auth.signInWithOtp → Supabase sends email
  // 2. User taps link in email → opens /api/auth/callback on Vercel
  // 3. Callback verifies OTP → redirects to /?access_token=...&type=magiclink
  // 4. App.jsx picks up tokens from URL → calls supabase.auth.setSession()
  // 5. URL is cleaned via history.replaceState → user sees the app, signed in
  // Note: On iOS, step 3's redirect to '/' opens in Safari, not the PWA.
  // Fully solving this requires a custom URL scheme (e.g. spentit://) —
  // a known iOS limitation with magic links + PWAs.
  async function signIn(email) {
    if (!supabase) return { error: 'Auth not configured' }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    })
    return error ? { error: error.message } : { success: true }
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  return { user, loading, signIn, signOut }
}
