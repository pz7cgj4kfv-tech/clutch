'use client'
// ─────────────────────────────────────────────────────────────────────────────
// VERROU PARTAGÉ — toutes les pages internes (hub, tutoriel, onboarding, live,
// night, events, sim, animation, cockpit, nda). Mot de passe « 26hctulc ».
// Entré UNE fois → mémorisé (localStorage) → tout est déverrouillé pour la session.
// Pour le sensible (vision…), un 2e mot de passe plus fort sera ajouté plus tard.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react'

const PASS = '26hctulc'
const KEY = 'clutch_access_v1'

export function useClutchGate() {
  const [ok, setOk] = useState(false)
  const [ready, setReady] = useState(false)
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)
  useEffect(() => { try { if (localStorage.getItem(KEY) === '1') setOk(true) } catch {} setReady(true) }, [])
  if (ok) return { ok: true, screen: null }
  const go = () => { if (pw === PASS) { try { localStorage.setItem(KEY, '1') } catch {} setOk(true) } else setErr(true) }
  const screen = ready ? (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#ECE7EB', fontFamily: 'ui-sans-serif,system-ui,-apple-system,sans-serif', padding: 20 }}>
      <div style={{ background: '#fff', border: '1px solid #E3E3E3', borderRadius: 16, padding: 32, width: 300, maxWidth: '100%', textAlign: 'center', boxShadow: '0 8px 30px rgba(83,41,67,.12)' }}>
        <div style={{ fontSize: 30, marginBottom: 4 }}>🔒</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#532943', letterSpacing: '-1px' }}>CLUTCH</div>
        <div style={{ fontSize: 11, color: '#8a8a8a', marginBottom: 18 }}>Accès interne</div>
        <input autoFocus type="password" value={pw} onChange={e => { setPw(e.target.value); setErr(false) }} onKeyDown={e => { if (e.key === 'Enter') go() }} placeholder="mot de passe"
          style={{ width: '100%', boxSizing: 'border-box', background: '#F7F4F6', border: `2px solid ${err ? '#c0392b' : 'rgba(235,107,175,.5)'}`, borderRadius: 10, padding: '11px 14px', fontSize: 15, color: '#1a1418', textAlign: 'center', outline: 'none', marginBottom: 8 }} />
        {err && <div style={{ fontSize: 11, color: '#c0392b', marginBottom: 8 }}>Code incorrect</div>}
        <button onClick={go} style={{ width: '100%', background: '#532943', color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>Entrer</button>
      </div>
    </div>
  ) : null
  return { ok: false, screen }
}
