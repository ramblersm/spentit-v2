import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useAuth } from './useAuth'
import { supabase } from './supabase'
import * as api from './api'
import { track } from './analytics'

import { 
  AVATARS, STORAGE_KEY, SPLASH_SHOWN, MIGRATED_KEY 
} from './constants'

import { 
  today, getFilterRange, loadExp, saveExp, playChime, formatCurrency, formatDisplayDate 
} from './utils'

import RankBadge from './components/RankBadge'
import StreakBadge from './components/StreakBadge'
import BudgetSummarySheet from './components/BudgetSummarySheet'
import SummaryCard from './components/SummaryCard'
import FilterBar from './components/FilterBar'
import TypeFilterBar from './components/TypeFilterBar'
import WeatherBar from './components/WeatherBar'
import ExpenseRow from './components/ExpenseRow'
import EmptyState from './components/EmptyState'
import PullIndicator from './components/PullIndicator'
import ExportSheet from './components/ExportSheet'
import CalcSheet from './components/CalcSheet'
import SignInSheet from './components/SignInSheet'
import AddExpenseSheet from './components/AddExpenseSheet'
import SplashScreen from './components/SplashScreen'
import ChimeRipple from './components/ChimeRipple'

import { useRegisterSW } from 'virtual:pwa-register/react'

async function upsertUser(user, avatarId = null) {
  if (!supabase) return
  await supabase.from('users').upsert({
    id: user.id,
    email: user.email,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    ...(avatarId ? { avatar_id: avatarId } : {}),
  }, { onConflict: 'id' })
}

export default function App() {
  const { user, loading: authLoading, signIn, signOut } = useAuth()
  const [expenses,       setExpenses]       = useState(() => loadExp())
  const [activeFilter,   setActiveFilter]   = useState('today')
  const [activeTypeFilter, setActiveTypeFilter] = useState('all')
  const [customRange,    setCustomRange]    = useState({ from: today(), to: today() })
  const [avatarId,       setAvatarId]       = useState(() => localStorage.getItem('spentit_avatar_id'))
  const [overallBudget,  setOverallBudget]  = useState(0)
  const [isIncognito,    setIsIncognito]    = useState(false)
  const [showSheet,      setShowSheet]      = useState(false)
  const [showBudgetSheet, setShowBudgetSheet] = useState(false)
  const [showSignIn,     setShowSignIn]     = useState(false)
  const [showExport,     setShowExport]     = useState(false)
  const [showCalc,       setShowCalc]       = useState(false)
  const [showQuickAdd,   setShowQuickAdd]   = useState(false)
  const [showSplash,     setShowSplash]     = useState(() => !sessionStorage.getItem(SPLASH_SHOWN))
  const [showChime,      setShowChime]      = useState(false)
  const [refreshing,     setRefreshing]     = useState(false)
  const [listKey,        setListKey]        = useState(0)
  const [editExpense,    setEditExpense]    = useState(null)
  const [calcSeedAmount, setCalcSeedAmount] = useState(null)
  const [undoToast,      setUndoToast]      = useState(null)
  const [syncing,        setSyncing]        = useState(false)
  const undoTimerRef = useRef(null)
  const scrollRef    = useRef(null)
  const lastFetchId  = useRef(0)
  const longPressTimer = useRef(null)
  const isLongPress    = useRef(false)

  // PWA Update Logic
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      r && setInterval(() => {
        r.update()
      }, 60 * 60 * 1000) // check for updates every hour
    },
  })

  useEffect(() => {
    if (needRefresh) {
      showToast('🚀 New update available!', true)
    }
  }, [needRefresh])

  // Pick up magic link tokens from URL (PWA deep link flow)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const accessToken  = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const type         = params.get('type')
    if (accessToken && refreshToken && type === 'magiclink') {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(() => window.history.replaceState({}, '', '/'))
    }
    const error = params.get('error')
    if (error === 'auth_failed') {
      window.history.replaceState({}, '', '/')
    }
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      localStorage.removeItem(MIGRATED_KEY)
      localStorage.removeItem('spentit_avatar_id')
      setAvatarId(null)
    }
  }, [user, authLoading])

  useEffect(() => { 
    if (user) { 
      // Initial upsert on login to ensure user exists
      upsertUser(user, avatarId); 
      track('login_completed', {}, user.id) 
    } 
  }, [user])

  useEffect(() => {
    if (!user || !supabase) return
    api.fetchUserSettings()
      .then(data => {
        if (data.avatar_id) {
          setAvatarId(data.avatar_id)
          localStorage.setItem('spentit_avatar_id', data.avatar_id)
        }
        if (data.monthly_budget !== undefined) setOverallBudget(data.monthly_budget)
      })
      .catch(() => {})
  }, [user])

  function handleAvatarSelect(id) {
    setAvatarId(id)
    localStorage.setItem('spentit_avatar_id', id)
    if (user) {
      api.updateUserSettings({ avatar_id: id }).catch(() => {})
    }
  }

  useEffect(() => {
    track('app_opened', {
      platform: navigator.userAgent.includes('iPhone') ? 'ios_pwa' : 'web',
    }, user?.id || null)
  }, [user])

  useEffect(() => {
    if (!user) return
    const fetchId = ++lastFetchId.current
    api.fetchExpenses()
      .then(data => {
        if (fetchId !== lastFetchId.current) return
        const shaped = data.map(e => ({
          id: e.id, amount: Number(e.amount), category: e.category,
          note: e.note, type: e.type, date: e.date,
          createdAt: new Date(e.created_at).getTime(),
        }))
        if (shaped.length > 0 || loadExp().length === 0) {
          setExpenses(shaped)
        }
      })
      .catch(() => {})
  }, [user])

  useEffect(() => {
    if (!user) return
    if (localStorage.getItem(MIGRATED_KEY) === 'true') return
    const local = loadExp()
    if (!local.length) { 
      localStorage.setItem(MIGRATED_KEY, 'true')
      return 
    }
    
    setSyncing(true)
    setTimeout(() => {
      Promise.all(local.map(e => api.createExpense(e).catch(() => null)))
        .then(() => { 
          localStorage.setItem(MIGRATED_KEY, 'true')
          setSyncing(false) 
          return api.fetchExpenses()
        })
        .then(data => {
          if (data) {
            const shaped = data.map(e => ({
              id: e.id, amount: Number(e.amount), category: e.category,
              note: e.note, type: e.type, date: e.date,
              createdAt: new Date(e.created_at).getTime(),
            }))
            setExpenses(shaped)
          }
        })
        .catch(() => setSyncing(false))
    }, 1000)
  }, [user])

  useEffect(() => { saveExp(expenses) }, [expenses])

  function showToast(message, isUpdate = false) {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    setUndoToast({ message, fading: false, isUpdate })
    if (!isUpdate) {
      undoTimerRef.current = setTimeout(() => {
        setUndoToast(t => t ? { ...t, fading: true } : null)
        setTimeout(() => setUndoToast(null), 400)
      }, 3000)
    }
  }

  function showUndo(message, snapshot) {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    setUndoToast({ message, snapshot, fading: false })
    undoTimerRef.current = setTimeout(() => {
      setUndoToast(t => t ? { ...t, fading: true } : null)
      setTimeout(() => setUndoToast(null), 400)
    }, 5000)
  }

  function addExpense(exp) {
    setExpenses(p => [exp, ...p])
    playChime(); setShowChime(true)
    if (user) api.createExpense(exp).catch(() => {})
    track('expense_added', { category: exp.category, type: exp.type, amount: exp.amount, has_note: !!exp.note }, user?.id || null)
  }
  function deleteExpense(id) {
    const snapshot = [...expenses]
    const exp = expenses.find(e => e.id === id)
    setExpenses(p => p.filter(e => e.id !== id))
    showUndo(`${exp.note || 'Expense'} deleted`, snapshot)
    if (user) api.deleteExpense(id).catch(() => {})
    track('expense_deleted', { category: exp.category }, user?.id || null)
  }
  function updateExpense(exp) {
    const snapshot = [...expenses]
    setExpenses(p => p.map(e => e.id === exp.id ? exp : e))
    playChime(); setShowChime(true)
    showUndo('✏️ Expense updated', snapshot)
    if (user) api.updateExpense(exp.id, {
      amount: exp.amount, category: exp.category,
      note: exp.note, type: exp.type, date: exp.date,
    }).catch(() => {})
    track('expense_edited', { category: exp.category, type: exp.type }, user?.id || null)
  }

  function handleEdit(exp)   { setEditExpense(exp); setShowSheet(true) }
  function handleCloseSheet() { setShowSheet(false); setEditExpense(null); setCalcSeedAmount(null) }
  function handleSaveFromCalc(amount) { setCalcSeedAmount(amount); setShowSheet(true) }
  function handleSplashDone() { sessionStorage.setItem(SPLASH_SHOWN, '1'); setShowSplash(false) }

  function handleUpdateBudget(amount) {
    setOverallBudget(amount)
    if (user) api.updateUserSettings({ monthly_budget: amount }).catch(() => {})
    showToast('🎯 Budget updated!')
  }

  function handleRefresh() {
    if (refreshing) return
    setRefreshing(true)
    if (user) {
      api.fetchExpenses().then(data => {
        const shaped = data.map(e => ({
          id: e.id, amount: Number(e.amount), category: e.category,
          note: e.note, type: e.type, date: e.date,
          createdAt: new Date(e.created_at).getTime(),
        }))
        setExpenses(shaped)
        setListKey(k => k + 1)
        setRefreshing(false)
      }).catch(() => {
        setRefreshing(false)
      })
    } else {
      setTimeout(() => { setExpenses(loadExp()); setListKey(k => k + 1); setRefreshing(false) }, 800)
    }
  }

  function handleQuickAdd(amount) {
    const exp = {
      id: api.genId ? api.genId() : Date.now().toString(36),
      amount,
      category: 'shopping',
      note: 'Quick add: Groceries',
      date: today(),
      createdAt: Date.now(),
      type: 'shared'
    }
    addExpense(exp)
    setShowQuickAdd(false)
    showToast(`✨ Added ₹${amount} for Groceries`)
  }

  function onFabPointerDown() {
    isLongPress.current = false
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true
      if (navigator.vibrate) navigator.vibrate(20)
      setShowQuickAdd(true)
    }, 350)
  }

  function onFabPointerUp(e) {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
    if (!isLongPress.current && !showQuickAdd) {
      setShowSheet(true)
    }
    e.currentTarget.style.transform = 'scale(1)'
  }

  function onFabPointerMove() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }

  function onFabPointerLeave() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }

  const { distance, THRESHOLD, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh(handleRefresh, scrollRef)

  const range = getFilterRange(activeFilter, customRange)
  const filtered = expenses.filter(e => {
    const inRange = e.date >= range.from && e.date <= range.to
    const inType  = activeTypeFilter === 'all' || e.type === activeTypeFilter
    return inRange && inType
  })

  const grouped = {}
  filtered.forEach(e => { if (!grouped[e.date]) grouped[e.date] = []; grouped[e.date].push(e) })
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  const userAvatar = AVATARS.find(av => av.id === avatarId) || AVATARS[0]

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', background: 'var(--bg)', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {showSplash && <SplashScreen onDone={handleSplashDone} />}
      {showChime && <ChimeRipple onDone={() => setShowChime(false)} />}
      
      {/* Header */}
      <header style={{ padding: 'calc(16px + var(--safe-top)) 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 24, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.02em' }}>SpentIt</h1>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setIsIncognito(!isIncognito)} style={{ width: 38, height: 38, borderRadius: 12, background: isIncognito ? 'var(--accent)' : 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, cursor: 'pointer', transition: 'all 0.2s ease' }}>
            {isIncognito ? '👻' : '👁️'}
          </button>
          <button onClick={() => setShowCalc(true)} style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, cursor: 'pointer' }}>🧮</button>
          <button onClick={() => setShowExport(true)} style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, cursor: 'pointer' }}>📤</button>
          <button onClick={() => setShowSignIn(true)} style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1.5px solid var(--border-strong)', padding: 2, cursor: 'pointer', position: 'relative' }}>
            <img src={userAvatar.url} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
            {syncing && <div style={{ position: 'absolute', inset: -2, borderRadius: '50%', border: '2px solid var(--accent)', borderTopColor: 'transparent', animation: 'spinnerRotate 0.8s linear infinite' }} />}
          </button>
        </div>
      </header>

      {/* Stats & Controls */}
      <SummaryCard expenses={filtered} filter={activeFilter} isIncognito={isIncognito} budget={overallBudget} onOpenBudget={() => setShowBudgetSheet(true)} />
      <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} customRange={customRange} onCustomRangeChange={setCustomRange} />
      <TypeFilterBar active={activeTypeFilter} onChange={setActiveTypeFilter} />
      <WeatherBar />

      {/* List */}
      <div key={listKey} ref={scrollRef} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <PullIndicator distance={distance} threshold={THRESHOLD} refreshing={refreshing} />
        <div style={{ flex: 1, padding: '12px 16px 100px' }}>
          {sortedDates.length === 0 ? <EmptyState filter={activeFilter} /> : sortedDates.map(date => (
            <div key={date} style={{ marginBottom: 18, animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{formatDisplayDate(date)}</p>
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{formatCurrency(grouped[date].reduce((s, e) => s + e.amount, 0), isIncognito)}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {grouped[date].map((exp, idx) => (
                  <ExpenseRow key={exp.id} expense={exp} onDelete={deleteExpense} onEdit={handleEdit} isIncognito={isIncognito} index={idx} />
                ))}
              </div>
            </div>
          ))}
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', padding: '8px 0 4px' }}>SpentIt v2.0 · Built with 💙</p>
        </div>
      </div>

      {/* Toast / Undo */}
      {undoToast && (
        <div style={{
          position: 'fixed', bottom: 'calc(28px + var(--safe-bottom) + 68px)', left: 20, right: 20, zIndex: 45,
          background: '#1f2937', color: '#fff', borderRadius: 'var(--radius-md)', padding: '12px 14px',
          display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          animation: undoToast.fading ? 'toastFadeOut 0.4s ease forwards' : 'toastSlideUp 0.3s cubic-bezier(0.32,0.72,0,1)',
        }}>
          <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{undoToast.message}</span>
          {undoToast.snapshot && (
            <button onClick={() => { setExpenses(undoToast.snapshot); clearTimeout(undoTimerRef.current); setUndoToast(null) }}
              style={{ padding: '5px 12px', borderRadius: 20, background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
              Undo
            </button>
          )}
          {undoToast.isUpdate && (
            <button onClick={() => updateServiceWorker(true)}
              style={{ padding: '5px 12px', borderRadius: 20, background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
              Refresh
            </button>
          )}
          <button onClick={() => { clearTimeout(undoTimerRef.current); setUndoToast(null) }}
            style={{ padding: '4px 8px', borderRadius: 20, background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 13, border: 'none', cursor: 'pointer' }}>
            ✕
          </button>
        </div>
      )}

      {/* Quick Add Menu */}
      {showQuickAdd && (
        <>
          <div onClick={() => setShowQuickAdd(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.1)', backdropFilter: 'blur(2px)', zIndex: 35 }} />
          <div style={{ position: 'fixed', bottom: 'calc(100px + var(--safe-bottom))', right: 24, display: 'flex', flexDirection: 'column', gap: 12, zIndex: 40 }}>
            {[1000, 700, 500, 300].map((amt, i) => (
              <button key={amt} onClick={() => handleQuickAdd(amt)} style={{
                width: 58, height: 58, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1.5px solid var(--border-strong)',
                color: 'var(--accent)', fontSize: 16, fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: `quickAddPop 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards`,
                animationDelay: `${i * 0.04}s`,
                opacity: 0,
              }}>
                ₹{amt}
              </button>
            ))}
          </div>
        </>
      )}

      {/* FAB */}
      <button 
        onPointerDown={(e) => { e.currentTarget.style.transform = 'scale(0.88)'; onFabPointerDown() }} 
        onPointerUp={onFabPointerUp}
        onPointerMove={onFabPointerMove}
        onPointerLeave={onFabPointerLeave}
        onContextMenu={(e) => e.preventDefault()}
        style={{ position: 'fixed', bottom: 'calc(28px + var(--safe-bottom))', right: 24, width: 58, height: 58, borderRadius: '50%', background: 'var(--accent)', color: '#ffffff', fontSize: 28, fontWeight: 300, boxShadow: '0 4px 20px var(--accent-glow)', zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)', touchAction: 'none' }}>
        {showQuickAdd ? '✕' : '+'}
      </button>

      {showSheet   && <AddExpenseSheet onClose={handleCloseSheet} onAdd={addExpense} onUpdate={updateExpense} editExpense={editExpense} seedAmount={calcSeedAmount} expenses={expenses} defaultType={activeTypeFilter} />}
      {showBudgetSheet && <BudgetSummarySheet expenses={expenses} budget={overallBudget} onUpdateBudget={handleUpdateBudget} onClose={() => setShowBudgetSheet(false)} isIncognito={isIncognito} />}
      {showExport  && <ExportSheet     expenses={filtered} onClose={() => setShowExport(false)} />}
      {showCalc    && <CalcSheet       onClose={() => setShowCalc(false)} onSaveAsExpense={handleSaveFromCalc} isIncognito={isIncognito} />}
      {showSignIn  && <SignInSheet     onClose={() => setShowSignIn(false)} avatarId={avatarId} onAvatarSelect={handleAvatarSelect} showToast={showToast} expenses={expenses} isIncognito={isIncognito} />}
    </div>
  )
}

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
