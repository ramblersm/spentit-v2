import { useState } from 'react'
import { useAuth } from '../useAuth'
import { AVATARS } from '../constants'
import { sheetBackdrop, sheetBase } from './sharedStyles'
import SheetHandle from './SheetHandle'
import RankBadge from './RankBadge'
import StreakBadge from './StreakBadge'
import TrendsView from './TrendsView'

export default function SignInSheet({ onClose, avatarId, setAvatarId, showToast, expenses = [], isIncognito = false }) {
  const { user, signIn, verifyCode, signOut } = useAuth()
  const [email,   setEmail]   = useState('')
  const [code,    setCode]    = useState('')
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [showTrends, setShowTrends] = useState(false)

  function handleAvatarSelect(id) {
    setAvatarId(id)
    showToast('✨ Avatar updated successfully!')
    onClose()
  }

  async function handleSend() {
    if (!email.trim()) return
    setLoading(true); setError(null)
    const res = await signIn(email.trim())
    setLoading(false)
    if (res.error) setError(res.error)
    else setSent(true)
  }

  async function handleVerify() {
    if (!code.trim()) return
    setLoading(true); setError(null)
    const res = await verifyCode(email.trim(), code.trim())
    setLoading(false)
    if (res.error) setError(res.error)
    else onClose()
  }

  const inputStyle = {
    width: '100%', padding: '13px 14px', borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--border-strong)', background: 'var(--bg-elevated)',
    fontSize: 15, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box', marginBottom: 12,
  }

  return (
    <>
      <div onClick={onClose} style={sheetBackdrop} />
      <div style={{ ...sheetBase, paddingBottom: 'calc(32px + var(--safe-bottom))', maxHeight: '92vh', overflowY: 'auto' }}>
        <SheetHandle />
        <div style={{ padding: '4px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
              {user ? 'Your account' : 'Sign in'}
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              <RankBadge expenses={expenses} isIncognito={isIncognito} />
              <StreakBadge expenses={expenses} />
            </div>
          </div>

          {user ? (
            <>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 16 }}>{user.email}</p>
              
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Choose Avatar</p>
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10 }}>
                  {AVATARS.map(av => (
                    <button key={av.id} onClick={() => handleAvatarSelect(av.id)} style={{
                      flexShrink: 0, width: 48, height: 48, borderRadius: '50%',
                      background: 'var(--bg-elevated)', border: avatarId === av.id ? '2px solid var(--accent)' : '1px solid var(--border-strong)',
                      padding: 2, cursor: 'pointer', transition: 'all 0.2s ease',
                      boxShadow: avatarId === av.id ? '0 0 8px var(--accent-glow)' : 'none',
                    }}>
                      <img src={av.url} alt={av.id} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={() => setShowTrends(!showTrends)}
                  style={{ width: '100%', padding: '13px', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', color: 'var(--accent)', fontSize: 14, fontWeight: 600, border: '1px solid var(--border-strong)', cursor: 'pointer' }}
                >
                  {showTrends ? '📊 Hide Spending Trends' : '📊 View Spending Trends'}
                </button>

                {showTrends && <TrendsView expenses={expenses} isIncognito={isIncognito} />}

                <button
                  onClick={() => { signOut(); onClose() }}
                  style={{ width: '100%', padding: '13px', borderRadius: 'var(--radius-md)', background: 'var(--danger-dim)', color: 'var(--danger)', fontSize: 14, fontWeight: 600, border: '1px solid var(--danger-dim)', cursor: 'pointer' }}
                >Sign out</button>
              </div>
            </>
          ) : sent ? (
            <>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 20 }}>
                Enter the 6-digit code sent to <strong>{email}</strong>
              </p>
              <input
                type="text"
                inputMode="numeric"
                placeholder="12345678"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
                autoFocus
                style={{ ...inputStyle, fontSize: 22, letterSpacing: '0.2em', textAlign: 'center' }}
              />
              {error && <p style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 10 }}>{error}</p>}
              <button
                onClick={handleVerify}
                disabled={loading || code.length < 8}
                style={{
                  width: '100%', padding: '13px', borderRadius: 'var(--radius-md)',
                  background: loading || code.length < 8 ? 'var(--border-strong)' : 'var(--accent)',
                  color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: loading || code.length < 8 ? 'default' : 'pointer',
                }}
              >{loading ? 'Verifying…' : 'Verify code'}</button>
              <button
                onClick={() => { setSent(false); setCode(''); setError(null) }}
                style={{ width: '100%', padding: '10px', marginTop: 8, background: 'none', border: 'none', fontSize: 13, color: 'var(--text-tertiary)', cursor: 'pointer' }}
              >Use a different email</button>
            </>
          ) : (
            <>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 20 }}>We'll send an 8-digit code — no password needed.</p>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                style={inputStyle}
              />
              {error && <p style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 10 }}>{error}</p>}
              <button
                onClick={handleSend}
                disabled={loading || !email.trim()}
                style={{
                  width: '100%', padding: '13px', borderRadius: 'var(--radius-md)',
                  background: loading || !email.trim() ? 'var(--border-strong)' : 'var(--accent)',
                  color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: loading || !email.trim() ? 'default' : 'pointer',
                }}
              >{loading ? 'Sending…' : 'Send code'}</button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
