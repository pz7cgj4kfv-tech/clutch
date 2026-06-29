'use client'
// ─────────────────────────────────────────────────────────────────────────────
// 🏙️ /clutch-city — LE COCKPIT (SimCity de Clutch). Pilote une ville de N agents qui agissent sur la VRAIE
//    forteresse + le VRAI algo (lib/sim/engine, le MÊME que le CLI). Horloge accélérable/pause/RETOUR ARRIÈRE
//    (tout est précalculé & seedé = rejouable). Le COQ affiche les trous en direct, cliquables pour sauter
//    le film à l'instant du bug. cf. docs/clutch-city-comportements.md + docs/clutch-city-trous.md.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { runSim, LAUSANNE, type SimResult, type Code } from '@/lib/sim/engine'

const C = { bg: '#2a1020', card: '#3a1a2e', ink: '#f5e8de', mid: '#c9a9bd', border: '#5a3048', green: '#77BC1F', rose: '#EB6BAF', plum: '#532943', orange: '#E27C00', red: '#E05353' }
const CODES: Code[] = ['CHAINING', 'EXCLUSION', 'REACH', 'CAP_RECEIVED', 'FILTER', 'EVENT_SEATS', 'HORIZON', 'COOLDOWN']
const CODE_LABEL: Record<Code, string> = {
  CHAINING: '🎯 Enchaînement impossible', EXCLUSION: 'Double-booking', REACH: 'RDV inatteignable',
  CAP_RECEIVED: 'Boîte ♀ saturée', FILTER: 'Filtre contourné', EVENT_SEATS: 'Places event dépassées',
  HORIZON: 'Horizon 18h dépassé', COOLDOWN: 'Cooldown contourné',
}
const CODE_COL: Record<Code, string> = { CHAINING: C.rose, EXCLUSION: C.red, REACH: C.orange, CAP_RECEIVED: '#d18ec0', FILTER: '#c0a0d0', EVENT_SEATS: '#e0a060', HORIZON: C.mid, COOLDOWN: C.mid }
// bbox géo autour de Lausanne (rayon ville ~6 km + marge)
const BB = { latMin: LAUSANNE[0] - 0.085, latMax: LAUSANNE[0] + 0.085, lngMin: LAUSANNE[1] - 0.13, lngMax: LAUSANNE[1] + 0.13 }
const fmtClock = (ms: number) => { const m = Math.round(ms / 60000); return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}h${String(m % 60).padStart(2, '0')}` }

export default function ClutchCity() {
  const [n, setN] = useState(300), [pf, setPf] = useState(50), [seed, setSeed] = useState(7)
  const [enforce, setEnforce] = useState(false)   // forteresse corrigée (evaluateSchedule)
  const [res, setRes] = useState<SimResult | null>(null)
  const [tick, setTick] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(6)        // ticks / seconde
  const [busy, setBusy] = useState(false)
  const cv = useRef<HTMLCanvasElement | null>(null)

  const run = (enf = enforce) => {
    setBusy(true); setPlaying(false)
    setTimeout(() => { const r = runSim({ n, seed, pctFemale: pf, captureFrames: true, enforce: enf }); setRes(r); setTick(0); setBusy(false); setPlaying(true) }, 30)
  }
  useEffect(() => { run(false) }, [])  // run initial
  const toggleForteresse = () => { const v = !enforce; setEnforce(v); run(v) }

  // horloge : avance les ticks pendant la lecture
  useEffect(() => {
    if (!playing || !res) return
    const id = setInterval(() => setTick(t => { if (t >= res.frames.length - 1) { setPlaying(false); return t } return t + 1 }), 1000 / speed)
    return () => clearInterval(id)
  }, [playing, speed, res])

  // cumul d'alertes par code jusqu'au tick courant (pour le panneau)
  const cum = useMemo(() => {
    if (!res) return [] as Record<string, number>[]
    const out: Record<string, number>[] = []; const acc: Record<string, number> = {}
    for (let t = 0; t < res.frames.length; t++) { out.push({ ...acc }); for (const al of res.alerts) if (al.tick === t) acc[al.code] = (acc[al.code] || 0) + 1 }
    out.push({ ...acc }); return out
  }, [res])
  const cumNow = cum[Math.min(tick, cum.length - 1)] || {}
  const totalNow = Object.values(cumNow).reduce((a, b) => a + b, 0)

  // dessin de la frame courante sur le canvas
  useEffect(() => {
    const c = cv.current, r = res; if (!c || !r) return
    const ctx = c.getContext('2d'); if (!ctx) return
    const W = c.width, Hh = c.height, fr = r.frames[Math.min(tick, r.frames.length - 1)]; if (!fr) return
    const px = (lat: number, lng: number): [number, number] => [((lng - BB.lngMin) / (BB.lngMax - BB.lngMin)) * W, (1 - (lat - BB.latMin) / (BB.latMax - BB.latMin)) * Hh]
    ctx.clearRect(0, 0, W, Hh); ctx.fillStyle = '#241019'; ctx.fillRect(0, 0, W, Hh)
    // cercle de la ville
    const [cx, cy] = px(LAUSANNE[0], LAUSANNE[1]); ctx.strokeStyle = C.plum; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, W * 0.36, 0, 7); ctx.stroke()
    ctx.fillStyle = C.mid; ctx.font = '11px system-ui'; ctx.fillText('Lausanne', cx - 26, cy - W * 0.36 - 6)
    // agents
    const pos = fr.pos
    for (let i = 0; i < r.meta.length; i++) {
      const flag = pos[i * 3 + 2]; const [x, y] = px(pos[i * 3], pos[i * 3 + 1])
      if (flag === 0) { ctx.fillStyle = 'rgba(201,169,189,.18)'; ctx.beginPath(); ctx.arc(x, y, 1.5, 0, 7); ctx.fill(); continue }
      if (flag === 2) { ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(x, y, 3.4, 0, 7); ctx.fill(); ctx.strokeStyle = C.green + '66'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.stroke() }
      else { ctx.fillStyle = r.meta[i].gender === 'F' ? C.rose : '#8fb3e0'; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 7); ctx.fill() }
    }
  }, [res, tick])

  const last = res ? res.frames[Math.min(tick, res.frames.length - 1)] : null
  const recent = useMemo(() => res ? res.alerts.filter(a => a.tick <= tick).slice(-14).reverse() : [], [res, tick])

  const Slider = ({ label, val, set, min, max, step = 1, disabled = false }: any) => (
    <div style={{ flex: 1, minWidth: 120 }}>
      <div style={{ fontSize: 11, color: C.mid, fontWeight: 700, marginBottom: 3 }}>{label} <b style={{ color: C.ink }}>{val}</b></div>
      <input type="range" min={min} max={max} step={step} value={val} disabled={disabled} onChange={e => set(Number(e.target.value))} style={{ width: '100%', accentColor: C.rose }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'ui-sans-serif,system-ui,-apple-system,sans-serif', padding: 'max(16px,env(safe-area-inset-top)) 14px 40px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.16em', color: C.rose }}>🏙️ CLUTCH CITY · COCKPIT</div>
        <h1 style={{ margin: '2px 0 2px', fontSize: 23, fontWeight: 900 }}>Une ville vivante, sous surveillance du 🐓 COQ</h1>
        <p style={{ margin: '0 0 12px', fontSize: 12.5, color: C.mid, lineHeight: 1.5 }}>
          {n} agents agissent sur la <b style={{ color: C.ink }}>vraie forteresse</b>. Tout est rejouable (seed {seed}).
          Le COQ lève une alerte à chaque trou — clique une alerte pour <b style={{ color: C.ink }}>sauter le film</b> à cet instant.
        </p>

        {/* RÉGLAGES */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '12px 14px', marginBottom: 12, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Slider label="Agents" val={n} set={setN} min={100} max={700} step={50} disabled={busy} />
          <Slider label="% femmes" val={pf} set={setPf} min={0} max={100} step={5} disabled={busy} />
          <Slider label="Seed" val={seed} set={setSeed} min={1} max={99} disabled={busy} />
          <button onClick={() => run()} disabled={busy} style={{ padding: '11px 20px', borderRadius: 12, border: 'none', background: busy ? C.plum : C.green, color: '#fff', fontSize: 14, fontWeight: 900, cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit' }}>{busy ? '⏳ calcul…' : '▶︎ Lancer'}</button>
        </div>
        {/* INTERRUPTEUR FORTERESSE — permissive (app actuelle) ↔ corrigée (evaluateSchedule) */}
        <button onClick={toggleForteresse} disabled={busy} style={{ width: '100%', marginBottom: 12, padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${enforce ? C.green : C.border}`, background: enforce ? `${C.green}1c` : C.card, color: C.ink, fontSize: 13, fontWeight: 800, cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
          🏰 Forteresse : <b style={{ color: enforce ? C.green : C.orange }}>{enforce ? 'CORRIGÉE ✅ (evaluateSchedule)' : 'permissive (app actuelle)'}</b>
          <span style={{ color: C.mid, fontWeight: 500 }}> — clique pour {enforce ? 'revoir les trous' : 'les faire fondre'}{enforce && res ? ` · ${res.stats.blocked} RDV impossibles bloqués` : ''}</span>
        </button>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {/* CARTE + HORLOGE */}
          <div style={{ flex: '1 1 420px', minWidth: 300 }}>
            <div style={{ background: '#241019', border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
              <canvas ref={cv} width={560} height={420} style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
            {/* contrôles horloge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <button onClick={() => setPlaying(p => !p)} disabled={!res} style={{ padding: '9px 14px', borderRadius: 10, border: 'none', background: C.rose, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', minWidth: 86 }}>{playing ? '⏸ Pause' : '▶︎ Lire'}</button>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, minWidth: 56 }}>{last ? fmtClock(last.now) : '—'}</div>
              <input type="range" min={0} max={res ? res.frames.length - 1 : 0} value={tick} onChange={e => { setPlaying(false); setTick(Number(e.target.value)) }} style={{ flex: 1, accentColor: C.green }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: 11, color: C.mid }}>
              <span>Vitesse</span>
              <input type="range" min={1} max={20} value={speed} onChange={e => setSpeed(Number(e.target.value))} style={{ width: 120, accentColor: C.rose }} />
              <b style={{ color: C.ink }}>×{speed}</b>
              <span style={{ marginLeft: 'auto' }}>🌸 ♀ live · 🔵 ♂ live · <span style={{ color: C.green }}>● en RDV</span> · · faible = hors-ligne</span>
            </div>
          </div>

          {/* PANNEAU COQ */}
          <div style={{ flex: '1 1 300px', minWidth: 280 }}>
            {/* stats live */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 10 }}>
              {[['En ligne', last?.online ?? 0, C.rose], ['Clutchs', last?.sent ?? 0, C.ink], ['RDV', last?.accept ?? 0, C.green]].map(([k, v, col]) => (
                <div key={k as string} style={{ background: C.card, borderRadius: 10, padding: '8px 10px', border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 10, color: C.mid, fontWeight: 700 }}>{k}</div><div style={{ fontSize: 18, fontWeight: 900, color: col as string }}>{v}</div>
                </div>
              ))}
            </div>
            {/* compteurs COQ */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '10px 12px', marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>🐓 LE COQ — {totalNow} trou(s) à {last ? fmtClock(last.now) : '—'}</div>
              {CODES.map(code => { const v = cumNow[code] || 0; return (
                <div key={code} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: CODE_COL[code], flexShrink: 0, opacity: v ? 1 : .25 }} />
                  <span style={{ fontSize: 11.5, color: v ? C.ink : C.mid, flex: 1 }}>{CODE_LABEL[code]}</span>
                  <b style={{ fontSize: 12.5, color: v ? CODE_COL[code] : C.mid }}>{v}</b>
                </div>
              )})}
            </div>
            {/* feed cliquable */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.mid, marginBottom: 6 }}>DERNIÈRES ALERTES (clic = sauter le film)</div>
              {recent.length === 0 && <div style={{ fontSize: 11.5, color: C.mid }}>Rien pour l'instant — laisse tourner.</div>}
              {recent.map((a, i) => (
                <button key={i} onClick={() => { setPlaying(false); setTick(a.tick) }} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', borderTop: i ? `1px solid ${C.border}66` : 'none', padding: '5px 0', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <span style={{ fontSize: 10, color: CODE_COL[a.code], fontWeight: 800 }}>{fmtClock(a.at)} · {a.from}{a.to ? '→' + a.to : ''}</span>
                  <div style={{ fontSize: 11, color: C.ink, lineHeight: 1.3 }}>{a.msg}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ fontSize: 11, color: C.mid, marginTop: 12, lineHeight: 1.6 }}>
          ⚠️ Les alertes sont <b style={{ color: C.ink }}>attendues</b> : le simulateur joue la permissivité actuelle de l'app, le COQ révèle les trous (cf. <code>docs/clutch-city-trous.md</code>).
          Au fil des corrections de la forteresse (enchaînement, exclusion…), ces compteurs <b style={{ color: C.green }}>fondront</b>. Headless : <code>npx tsx scripts/clutch-city.mts</code>.
        </div>
      </div>
    </div>
  )
}
