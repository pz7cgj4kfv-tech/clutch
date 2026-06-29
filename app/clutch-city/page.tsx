'use client'
// ─────────────────────────────────────────────────────────────────────────────
// 🏙️ /clutch-city — LE COCKPIT (SimCity de Clutch). Pilote une ville de N agents qui agissent sur la VRAIE
//    forteresse + le VRAI algo (lib/sim/engine, le MÊME que le CLI). Horloge accélérable/pause/RETOUR ARRIÈRE
//    (tout est précalculé & seedé = rejouable). Le COQ affiche les trous en direct, cliquables pour sauter
//    le film à l'instant du bug. cf. docs/clutch-city-comportements.md + docs/clutch-city-trous.md.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { runSim, LAUSANNE, type SimResult, type Code, type CustomSpec, type ScriptStep, type ScriptAct } from '@/lib/sim/engine'

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
  const [watched, setWatched] = useState<number[]>([])   // 👥 agents suivis (cartes POV)
  const [focus, setFocus] = useState<number | null>(null) // 👁 personne au centre du POV (carte mise en avant)
  const [scripted, setScripted] = useState<ScriptStep[]>([]) // 🎮 gestes que David a fait faire (incarnation)
  const [customs, setCustoms] = useState<CustomSpec[]>([])  // 👤 profils créés à la main
  const [showCreate, setShowCreate] = useState(false)
  const [nm, setNm] = useState(''), [cg, setCg] = useState<'F' | 'M'>('F'), [cage, setCage] = useState(27), [csg, setCsg] = useState<'all' | 'man' | 'woman'>('all')
  const cv = useRef<HTMLCanvasElement | null>(null)

  const run = (enf = enforce, cst = customs, scr = scripted, keepTick = false) => {
    setBusy(true); if (!keepTick) setPlaying(false)
    setTimeout(() => {
      const r = runSim({ n, seed, pctFemale: pf, captureFrames: true, enforce: enf, custom: cst, scripted: scr }); setRes(r); setBusy(false)
      if (!keepTick) {
        setTick(0); setPlaying(true)
        // 👤 mes profils créés (indices n..) TOUJOURS suivis · puis 👥 les plus vivants pour compléter.
        const customIdx = cst.map((_, j) => n + j)
        const ranked = Object.keys(r.life).map(k => +k).filter(i => !customIdx.includes(i)).sort((a, b) => (r.life[b]?.length || 0) - (r.life[a]?.length || 0))
        setWatched([...customIdx, ...ranked].slice(0, 12))
      }
    }, 30)
  }
  // 🎮 INCARNER : David fait faire un geste à la personne suivie, à l'instant courant → la ville rejoue de là.
  const incarnate = (act: ScriptAct) => { if (focus == null) return; const next = [...scripted, { idx: focus, tick, act }]; setScripted(next); run(enforce, customs, next, true) }
  const addCustom = () => {
    const spec: CustomSpec = { name: nm.trim() || (cg === 'F' ? 'Elle' : 'Lui'), gender: cg, age: cage, seekGender: csg }
    const next = [...customs, spec]; setCustoms(next); setShowCreate(false); setNm(''); run(enforce, next)
  }
  const toggleWatch = (idx: number) => setWatched(w => w.includes(idx) ? w.filter(x => x !== idx) : (w.length >= 12 ? w : [...w, idx]))
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
    const pos = fr.pos
    // 🔍 ZOOM B+ : en mode POV, la bbox se RESSERRE autour de la personne (on la voit en gros + son rayon).
    const focused = focus != null && focus < r.meta.length
    const bb = focused
      ? { latMin: pos[focus! * 4] - 0.028, latMax: pos[focus! * 4] + 0.028, lngMin: pos[focus! * 4 + 1] - 0.052, lngMax: pos[focus! * 4 + 1] + 0.052 }
      : BB
    const px = (lat: number, lng: number): [number, number] => [((lng - bb.lngMin) / (bb.lngMax - bb.lngMin)) * W, (1 - (lat - bb.latMin) / (bb.latMax - bb.latMin)) * Hh]
    const pxPerKm = Hh / ((bb.latMax - bb.latMin) * 111)   // échelle km→pixels (vertical)
    ctx.clearRect(0, 0, W, Hh); ctx.fillStyle = '#241019'; ctx.fillRect(0, 0, W, Hh)
    if (!focused) { const [cx, cy] = px(LAUSANNE[0], LAUSANNE[1]); ctx.strokeStyle = C.plum; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, W * 0.36, 0, 7); ctx.stroke(); ctx.fillStyle = C.mid; ctx.font = '11px system-ui'; ctx.fillText('Lausanne', cx - 26, cy - W * 0.36 - 6) }
    // agents
    for (let i = 0; i < r.meta.length; i++) {
      const flag = pos[i * 4 + 2]; const [x, y] = px(pos[i * 4], pos[i * 4 + 1])
      if (flag === 0) { ctx.fillStyle = 'rgba(201,169,189,.18)'; ctx.beginPath(); ctx.arc(x, y, focused ? 2.5 : 1.5, 0, 7); ctx.fill(); continue }
      if (flag === 2) { ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(x, y, focused ? 4.5 : 3.4, 0, 7); ctx.fill(); ctx.strokeStyle = C.green + '66'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, focused ? 8 : 6, 0, 7); ctx.stroke() }
      else { ctx.fillStyle = r.meta[i].gender === 'F' ? C.rose : '#8fb3e0'; ctx.beginPath(); ctx.arc(x, y, focused ? 3.6 : 2.6, 0, 7); ctx.fill() }
    }
    // 👥 SURLIGNAGE des suivis : halo doré + nom.
    for (const i of watched) {
      if (i >= r.meta.length) continue
      const [x, y] = px(pos[i * 4], pos[i * 4 + 1]); const fl = pos[i * 4 + 2]
      ctx.strokeStyle = '#E27C00'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 8.5, 0, 7); ctx.stroke()
      ctx.fillStyle = fl === 0 ? 'rgba(226,124,0,.5)' : '#E27C00'; ctx.beginPath(); ctx.arc(x, y, 3.4, 0, 7); ctx.fill()
      ctx.fillStyle = '#f5e8de'; ctx.font = 'bold 10px system-ui'; ctx.fillText(r.meta[i].name, x + 11, y + 3.5)
    }
    // 👁 MODE POV : zoomé sur la personne · son RAYON de dispo · ses liens récents (qui la clutche / elle clutche / RDV).
    if (focused) {
      ctx.fillStyle = 'rgba(36,16,25,.5)'; ctx.fillRect(0, 0, W, Hh)
      const [fx, fy] = px(pos[focus! * 4], pos[focus! * 4 + 1]); const rad = pos[focus! * 4 + 3]
      // son rayon de dispo (cercle pointillé rose)
      if (rad > 0) { ctx.setLineDash([5, 5]); ctx.strokeStyle = C.rose + 'aa'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(fx, fy, rad * pxPerKm, 0, 7); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = C.rose + '99'; ctx.font = '10px system-ui'; ctx.fillText(`rayon ${rad.toFixed(0)} km`, fx + rad * pxPerKm * 0.7, fy - rad * pxPerKm * 0.7) }
      const recent = (r.life[focus!] || []).filter(e => e.tick <= tick && e.tick > tick - 18 && e.otherIdx != null)
      for (const e of recent) {
        const o = e.otherIdx!; if (o >= r.meta.length) continue
        const [ox, oy] = px(pos[o * 4], pos[o * 4 + 1])
        const col = e.kind === 'sent' ? C.rose : e.kind === 'received' ? '#8fb3e0' : e.kind === 'locked' ? C.green : C.mid
        ctx.strokeStyle = col + 'cc'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(ox, oy); ctx.stroke()
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(ox, oy, 3.5, 0, 7); ctx.fill()
        ctx.fillStyle = '#f5e8de'; ctx.font = '10px system-ui'; ctx.fillText(r.meta[o].name, ox + 6, oy + 3)
      }
      ctx.strokeStyle = '#E27C00'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(fx, fy, 12, 0, 7); ctx.stroke()
      ctx.fillStyle = '#E27C00'; ctx.beginPath(); ctx.arc(fx, fy, 5.5, 0, 7); ctx.fill()
      ctx.fillStyle = '#fff'; ctx.font = 'bold 13px system-ui'; ctx.fillText(`${r.meta[focus!].name} 👁`, fx + 15, fy + 4)
    }
  }, [res, tick, watched, focus])

  // clic sur la carte → suivre/dé-suivre l'agent le plus proche
  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = res, c = cv.current; if (!r || !c) return
    const rect = c.getBoundingClientRect(); const mx = (e.clientX - rect.left) / rect.width * c.width, my = (e.clientY - rect.top) / rect.height * c.height
    const fr = r.frames[Math.min(tick, r.frames.length - 1)]; if (!fr) return
    const focused = focus != null && focus < r.meta.length
    const bb = focused
      ? { latMin: fr.pos[focus! * 4] - 0.028, latMax: fr.pos[focus! * 4] + 0.028, lngMin: fr.pos[focus! * 4 + 1] - 0.052, lngMax: fr.pos[focus! * 4 + 1] + 0.052 }
      : BB
    const px = (lat: number, lng: number): [number, number] => [((lng - bb.lngMin) / (bb.lngMax - bb.lngMin)) * c.width, (1 - (lat - bb.latMin) / (bb.latMax - bb.latMin)) * c.height]
    let best = -1, bd = 18 * 18
    for (let i = 0; i < r.meta.length; i++) { const [x, y] = px(fr.pos[i * 4], fr.pos[i * 4 + 1]); const d = (x - mx) ** 2 + (y - my) ** 2; if (d < bd) { bd = d; best = i } }
    if (best >= 0) toggleWatch(best)
  }

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
          <button onClick={() => { setScripted([]); setFocus(null); run(enforce, customs, []) }} disabled={busy} style={{ padding: '11px 20px', borderRadius: 12, border: 'none', background: busy ? C.plum : C.green, color: '#fff', fontSize: 14, fontWeight: 900, cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit' }}>{busy ? '⏳ calcul…' : '▶︎ Lancer'}</button>
        </div>
        {/* INTERRUPTEUR FORTERESSE — permissive (app actuelle) ↔ corrigée (evaluateSchedule) */}
        <button onClick={toggleForteresse} disabled={busy} style={{ width: '100%', marginBottom: 12, padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${enforce ? C.green : C.border}`, background: enforce ? `${C.green}1c` : C.card, color: C.ink, fontSize: 13, fontWeight: 800, cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
          🏰 Forteresse (mode du simulateur) : <b style={{ color: enforce ? C.green : C.orange }}>{enforce ? 'AVEC garde-fous ✅ (evaluateSchedule, blocage dur)' : 'SANS garde-fou (pour montrer les trous)'}</b>
          <span style={{ color: C.mid, fontWeight: 500 }}> — clique pour {enforce ? 'revoir les trous' : 'les faire fondre'}{enforce && res ? ` · ${res.stats.blocked} RDV impossibles bloqués` : ''}</span>
        </button>

        {/* 👤 CRÉER UN PROFIL À LA MAIN — il est injecté dans la ville et toujours suivi */}
        <div style={{ marginBottom: 12 }}>
          {!showCreate ? (
            <button onClick={() => setShowCreate(true)} disabled={busy} style={{ padding: '9px 14px', borderRadius: 11, border: `1px dashed ${C.rose}`, background: 'transparent', color: C.rose, fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
              ➕ Créer un profil à la main {customs.length > 0 ? `· ${customs.length} créé(s)` : ''}
            </button>
          ) : (
            <div style={{ background: C.card, border: `1px solid ${C.rose}55`, borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 130px' }}><div style={{ fontSize: 10.5, color: C.mid, fontWeight: 700, marginBottom: 3 }}>Prénom</div>
                <input value={nm} onChange={e => setNm(e.target.value)} placeholder="ex : Manon" style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 9, padding: '8px 10px', color: C.ink, fontSize: 13, fontFamily: 'inherit' }} /></div>
              <div><div style={{ fontSize: 10.5, color: C.mid, fontWeight: 700, marginBottom: 3 }}>Genre</div>
                <div style={{ display: 'flex', gap: 4 }}>{(['F', 'M'] as const).map(g => <button key={g} onClick={() => setCg(g)} style={{ padding: '8px 12px', borderRadius: 9, border: `1.5px solid ${cg === g ? C.rose : C.border}`, background: cg === g ? `${C.rose}22` : 'transparent', color: C.ink, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>{g === 'F' ? '♀' : '♂'}</button>)}</div></div>
              <div style={{ width: 92 }}><div style={{ fontSize: 10.5, color: C.mid, fontWeight: 700, marginBottom: 3 }}>Âge {cage}</div>
                <input type="range" min={18} max={60} value={cage} onChange={e => setCage(+e.target.value)} style={{ width: '100%', accentColor: C.rose }} /></div>
              <div><div style={{ fontSize: 10.5, color: C.mid, fontWeight: 700, marginBottom: 3 }}>Cherche</div>
                <div style={{ display: 'flex', gap: 4 }}>{([['all', 'Tous'], ['woman', '♀'], ['man', '♂']] as const).map(([k, l]) => <button key={k} onClick={() => setCsg(k)} style={{ padding: '8px 10px', borderRadius: 9, border: `1.5px solid ${csg === k ? C.rose : C.border}`, background: csg === k ? `${C.rose}22` : 'transparent', color: C.ink, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>{l}</button>)}</div></div>
              <button onClick={addCustom} style={{ padding: '9px 18px', borderRadius: 11, border: 'none', background: C.green, color: '#fff', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>Lâcher dans la ville</button>
              <button onClick={() => setShowCreate(false)} style={{ padding: '9px 10px', borderRadius: 11, border: `1px solid ${C.border}`, background: 'transparent', color: C.mid, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>annuler</button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {/* CARTE + HORLOGE */}
          <div style={{ flex: '1 1 420px', minWidth: 300 }}>
            <div style={{ background: '#241019', border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
              <canvas ref={cv} width={560} height={420} onClick={onCanvasClick} style={{ width: '100%', height: 'auto', display: 'block', cursor: 'pointer' }} />
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

        {/* 👥 CARTES DE SUIVI (POV) — le vécu de ~10 personnes, dans une ville vivante */}
        {res && watched.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 9, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 16, fontWeight: 900 }}>👥 Tes profils suivis <span style={{ fontSize: 12, color: C.mid, fontWeight: 600 }}>({watched.length})</span></div>
              <div style={{ fontSize: 11, color: C.mid }}>clique un point sur la carte pour suivre / lâcher quelqu'un · clique une ligne → saute le film à ce moment</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 10 }}>
              {watched.map(idx => {
                const m = res.meta[idx]; if (!m) return null
                const flag = last ? last.pos[idx * 4 + 2] : 0
                const ev = (res.life[idx] || []).filter(e => e.tick <= tick)
                const nSent = ev.filter(e => e.kind === 'sent').length, nRec = ev.filter(e => e.kind === 'received').length, nLock = ev.filter(e => e.kind === 'locked').length
                const feed = ev.slice(-6).reverse()
                const gCol = m.gender === 'F' ? C.rose : '#8fb3e0'
                const stCol = flag === 2 ? C.green : flag === 1 ? C.rose : C.mid
                const stLabel = flag === 2 ? 'en RDV' : flag === 1 ? 'en ligne' : 'hors-ligne'
                const foc = focus === idx, isCustom = idx >= n
                return (
                  <div key={idx} style={{ background: foc ? `${C.orange}14` : C.card, border: `1.5px solid ${foc ? C.orange : flag === 2 ? C.green + '66' : C.border}`, borderRadius: 14, padding: '11px 12px', boxShadow: foc ? `0 2px 16px ${C.orange}44` : '0 2px 10px rgba(0,0,0,.18)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: gCol, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#1a0d16', fontSize: 17, flexShrink: 0 }}>{m.name[0]}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 900 }}>{m.name} {isCustom && <span title="créé par toi" style={{ fontSize: 10 }}>✋</span>} <span style={{ fontSize: 11, color: C.mid, fontWeight: 600 }}>{m.gender === 'F' ? '♀' : '♂'} {m.age}{m.premium ? ' ⭐' : ''}</span></div>
                        <div style={{ fontSize: 10.5, color: stCol, fontWeight: 800 }}>● {stLabel}</div>
                      </div>
                      <button onClick={() => setFocus(foc ? null : idx)} title="POV — voir qui il/elle voit sur la carte" style={{ background: foc ? C.orange : 'transparent', border: `1px solid ${foc ? C.orange : C.border}`, borderRadius: 8, color: foc ? '#fff' : C.mid, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', padding: '3px 7px' }}>👁</button>
                      <button onClick={() => { if (foc) setFocus(null); toggleWatch(idx) }} title="ne plus suivre" style={{ background: 'transparent', border: 'none', color: C.mid, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                      {([['📤', nSent, 'envoyés'], ['📥', nRec, 'reçus'], ['🔒', nLock, 'RDV']] as [string, number, string][]).map(([e, v, l]) => (
                        <div key={l} style={{ flex: 1, background: C.bg, borderRadius: 8, padding: '5px 4px', textAlign: 'center' }}>
                          <div style={{ fontSize: 15, fontWeight: 900, color: l === 'RDV' && v > 0 ? C.green : C.ink }}>{v}</div><div style={{ fontSize: 9, color: C.mid }}>{e} {l}</div>
                        </div>
                      ))}
                    </div>
                    {/* 🎮 INCARNATION (C) — sur la carte focus : tu fais faire un geste à {nom}, la ville rejoue de cet instant. */}
                    {foc && (
                      <div style={{ background: `${C.orange}10`, border: `1px solid ${C.orange}40`, borderRadius: 10, padding: '7px 8px', marginBottom: 8 }}>
                        <div style={{ fontSize: 9.5, color: C.orange, fontWeight: 800, marginBottom: 5 }}>🎮 INCARNER à {last ? fmtClock(last.now) : '—'} — la ville rejoue de là</div>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {([['online', '🟢 En ligne'], ['clutch', '📤 Clutcher'], ['accept', '✅ Accepter'], ['refuse', '❌ Refuser']] as [ScriptAct, string][]).map(([act, l]) => (
                            <button key={act} disabled={busy} onClick={() => incarnate(act)} style={{ flex: '1 1 auto', padding: '6px 8px', borderRadius: 8, border: `1px solid ${C.orange}66`, background: 'transparent', color: C.ink, fontSize: 11, fontWeight: 800, cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>{l}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div style={{ maxHeight: 122, overflowY: 'auto' }}>
                      {feed.length === 0 && <div style={{ fontSize: 11, color: C.mid, padding: '4px 0' }}>Rien encore — laisse tourner ▶︎</div>}
                      {feed.map((e, i) => (
                        <button key={i} onClick={() => { setPlaying(false); setTick(e.tick) }} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', borderTop: i ? `1px solid ${C.border}55` : 'none', padding: '4px 0', cursor: 'pointer', fontFamily: 'inherit' }}>
                          <span style={{ fontSize: 9.5, color: C.mid, fontWeight: 700 }}>{fmtClock(e.at)}</span>
                          <div style={{ fontSize: 11, color: C.ink, lineHeight: 1.3 }}>{e.msg}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div style={{ fontSize: 11, color: C.mid, marginTop: 16, lineHeight: 1.6 }}>
          ⚠️ Les alertes sont <b style={{ color: C.ink }}>attendues</b> en mode SANS garde-fou : le COQ révèle les trous (cf. <code>docs/clutch-city-trous.md</code>). 🛡️ La vraie app, elle, a DÉJÀ : double-booking bloqué dur + alertes d'enchaînement à l'envoi & à l'acceptation (cf. <code>docs/protection-forteresse.md</code>).
          Au fil des corrections de la forteresse (enchaînement, exclusion…), ces compteurs <b style={{ color: C.green }}>fondront</b>. Headless : <code>npx tsx scripts/clutch-city.mts</code>.
        </div>
      </div>
    </div>
  )
}
