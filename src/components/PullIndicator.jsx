import React from 'react'

export default function PullIndicator({ distance, threshold, refreshing }) {
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
