'use client'
// ─────────────────────────────────────────────────────────────────────────────
// COCKPIT — /cockpit. Centre de contrôle de la dynamique (mission control).
// V1 SIMULÉE (données factices animées) mais architecturée pour brancher plus
// tard une table `metrics` pré-agrégée (cron) + une table `params` (les boutons).
// La partie unique : le FLUX DE DÉCISIONS & DOUTES — l'IA raconte ce qu'elle
// décide, avoue ses doutes, demande validation. Page isolée, zéro risque.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useRef, useState } from 'react'

const C = {
  bg: '#0A0F1E', panel: '#121A2E', panel2: '#1A2440', border: '#26314F',
  ink: '#E8EEFA', dim: '#8493B5', gold: '#F5B83D', green: '#34D399', amber: '#FBBF24',
  red: '#F87171', blue: '#5B9DFF', pink: '#EB6BAF', purple: '#9B7CF0',
}
const LINKS: [string, string][] = [
  ['/cockpit', '🛰️ Cockpit'], ['/clutchlive', '⚡ Clutch Live'], ['/sim', '🧪 Simulateur'],
  ['/eventsmap', '🗺️ Carte events'], ['/vision2', '📖 Vision 2'], ['/hq', '🔒 QG'],
]

const ZONE_NAMES = ['Le Flon', 'Vieille Ville', 'Ouchy', 'EPFL', 'Gare', 'Sauvabelin']
function thermoLabel(n: number) { return n < 30 ? 'éteint' : n < 700 ? 'doux' : n < 1500 ? 'actif' : 'serré' }
function thermoPct(n: number) { return Math.max(0, Math.min(100, Math.round((n - 30) / (2000 - 30) * 100))) }

type Zone = { name: string; people: number; women: number; clutchH: number }
type Feed = { id: number; t: string; type: 'auto' | 'doubt' | 'suggest' | 'info'; text: string; pending?: boolean }

export default function Cockpit() {
  const [zones, setZones] = useState<Zone[]>(() => ZONE_NAMES.map((name, i) => ({
    name, people: [420, 280, 90, 60, 150, 20][i], women: [38, 45, 40, 30, 42, 48][i], clutchH: [60, 35, 8, 5, 18, 2][i],
  })))
  const [feed, setFeed] = useState<Feed[]>([
    { id: 1, t: '—', type: 'info', text: 'Cockpit en ligne. Surveillance des 6 zones de Lausanne.' },
  ])
  const [wCompat, setWCompat] = useState(50)
  const [wProx, setWProx] = useState(30)
  const [wFiab, setWFiab] = useState(20)
  const [paused, setPaused] = useState(false)
  const idRef = useRef(2)

  // tick : anime les données + génère parfois une décision/doute
  useEffect(() => {
    if (paused) return
    const iv = setInterval(() => {
      setZones(zs => zs.map(z => {
        const dp = Math.round((Math.random() - 0.45) * z.people * 0.08)
        const people = Math.max(0, z.people + dp)
        const women = Math.max(15, Math.min(60, z.women + Math.round((Math.random() - 0.5) * 3)))
        const clutchH = Math.max(0, z.clutchH + Math.round((Math.random() - 0.45) * 4))
        return { ...z, people, women, clutchH }
      }))
      if (Math.random() < 0.6) {
        setZones(zs => {
          const z = zs[Math.floor(Math.random() * zs.length)]
          const tp = thermoPct(z.people)
          const now = new Date().toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          let item: Feed
          const r = Math.random()
          if (z.women < 32 && r < 0.5) {
            item = { id: idRef.current++, t: now, type: 'suggest', pending: true, text: `Zone ${z.name} : seulement ${z.women}% de femmes en ligne (ratio déséquilibré). J'active le mode réception sélective pour protéger contre la sur-sollicitation ?` }
          } else if (tp > 70 && r < 0.7) {
            item = { id: idRef.current++, t: now, type: 'auto', text: `Zone ${z.name} saturée (${z.people} en ligne) → thermostat monté à ${tp}%. Je remonte la compatibilité dans le tri.` }
          } else if (r < 0.45) {
            item = { id: idRef.current++, t: now, type: 'doubt', text: `Doute — Zone ${z.name} : ${z.clutchH} clutchs/h mais taux de réponse en baisse. Possible fatigue. Je surveille.` }
          } else {
            item = { id: idRef.current++, t: now, type: 'info', text: `Zone ${z.name} : ${z.people} en ligne, ${z.clutchH} clutchs/h, thermostat ${thermoLabel(z.people)}.` }
          }
          setFeed(f => [item, ...f].slice(0, 40))
          return zs
        })
      }
    }, 2600)
    return () => clearInterval(iv)
  }, [paused])

  const totalPeople = zones.reduce((n, z) => n + z.people, 0)
  const totalClutchH = zones.reduce((n, z) => n + z.clutchH, 0)
  const avgWomen = Math.round(zones.reduce((n, z) => n + z.women, 0) / zones.length)
  // funnel simulé
  const funnel = [
    { k: 'Disponibles', v: totalPeople, c: C.blue },
    { k: 'Clutchs envoyés/h', v: totalClutchH, c: C.pink },
    { k: 'Acceptés', v: Math.round(totalClutchH * 0.42), c: C.purple },
    { k: 'RDV honorés', v: Math.round(totalClutchH * 0.42 * 0.78), c: C.green },
  ]
  const maxF = Math.max(...funnel.map(f => f.v), 1)

  const decide = (id: number, ok: boolean) => {
    setFeed(f => f.map(it => it.id === id ? { ...it, pending: false, text: it.text + (ok ? '  ✓ Validé par toi.' : '  ✗ Ignoré.') } : it))
  }

  const KPI = ({ label, value, sub, c }: any) => (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', flex: 1, minWidth: 130 }}>
      <div style={{ fontSize: 10.5, color: C.dim, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: c || C.ink }}>{value}</div>
      {sub && <div style={{ fontSize: 10.5, color: C.dim }}>{sub}</div>}
    </div>
  )
  const feedColor = (t: Feed['type']) => t === 'auto' ? C.blue : t === 'doubt' ? C.amber : t === 'suggest' ? C.pink : C.dim
  const feedTag = (t: Feed['type']) => t === 'auto' ? 'AUTO' : t === 'doubt' ? 'DOUTE' : t === 'suggest' ? 'SUGGESTION' : 'INFO'

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'ui-sans-serif,system-ui,-apple-system,sans-serif' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '16px 16px 50px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
          {LINKS.map(([href, label], i) => (
            <a key={href} href={href} style={{ fontSize: 11.5, fontWeight: i === 0 ? 800 : 600, textDecoration: 'none', color: i === 0 ? '#0A0F1E' : C.dim, background: i === 0 ? C.gold : C.panel, border: `1px solid ${i === 0 ? C.gold : C.border}`, borderRadius: 9, padding: '5px 11px', whiteSpace: 'nowrap' }}>{label}{i === 0 ? ' · ici' : ''}</a>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 23, fontWeight: 900, color: C.gold }}>🛰️ Cockpit — contrôle de la dynamique</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: C.green }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, boxShadow: `0 0 8px ${C.green}`, animation: 'cpBlink 1.4s infinite' }} /> EN DIRECT (simulé)</span>
          <button onClick={() => setPaused(p => !p)} style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, padding: '6px 13px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${C.border}`, background: C.panel, color: C.ink }}>{paused ? '▶ Reprendre' : '⏸ Pause'}</button>
        </div>
        <style>{`@keyframes cpBlink{0%,100%{opacity:1}50%{opacity:.25}}`}</style>

        {/* KPIs */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          <KPI label="En ligne (total)" value={totalPeople.toLocaleString('fr-CH')} sub="6 zones · Lausanne" c={C.blue} />
          <KPI label="Clutchs / heure" value={totalClutchH} sub="toutes zones" c={C.pink} />
          <KPI label="% femmes en ligne" value={avgWomen + '%'} sub={avgWomen < 35 ? '⚠ déséquilibré' : 'équilibré'} c={avgWomen < 35 ? C.amber : C.green} />
          <KPI label="RDV honorés/h (est.)" value={funnel[3].v} sub="fiabilité du réseau" c={C.green} />
        </div>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Colonne gauche : zones + funnel + boutons */}
          <div style={{ flex: '1 1 460px', minWidth: 320 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: C.dim, margin: '2px 0 8px', textTransform: 'uppercase', letterSpacing: '.05em' }}>Zones en temps réel</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 9, marginBottom: 18 }}>
              {zones.map(z => {
                const tp = thermoPct(z.people)
                return (
                  <div key={z.name} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 11, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 800 }}>{z.name}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: tp > 70 ? C.red : tp > 35 ? C.amber : C.green }}>{thermoLabel(z.people)}</span>
                    </div>
                    <div style={{ fontSize: 19, fontWeight: 900, color: C.ink, margin: '2px 0' }}>{z.people} <span style={{ fontSize: 11, color: C.dim, fontWeight: 500 }}>en ligne</span></div>
                    <div style={{ height: 6, background: C.panel2, borderRadius: 4, overflow: 'hidden', margin: '5px 0' }}>
                      <div style={{ width: `${tp}%`, height: '100%', background: `linear-gradient(90deg,${C.green},${C.amber},${C.red})` }} />
                    </div>
                    <div style={{ fontSize: 10.5, color: C.dim }}>{z.clutchH} clutchs/h · {z.women}% ♀</div>
                  </div>
                )
              })}
            </div>

            <div style={{ fontSize: 12.5, fontWeight: 800, color: C.dim, margin: '2px 0 8px', textTransform: 'uppercase', letterSpacing: '.05em' }}>Entonnoir (par heure)</div>
            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 18 }}>
              {funnel.map((f, i) => (
                <div key={i} style={{ marginBottom: i < 3 ? 9 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 3 }}><span style={{ color: C.dim }}>{f.k}</span><span style={{ fontWeight: 800 }}>{f.v}</span></div>
                  <div style={{ height: 8, background: C.panel2, borderRadius: 5, overflow: 'hidden' }}><div style={{ width: `${f.v / maxF * 100}%`, height: '100%', background: f.c }} /></div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 12.5, fontWeight: 800, color: C.dim, margin: '2px 0 8px', textTransform: 'uppercase', letterSpacing: '.05em' }}>Les boutons de l'algo (écrivent dans `params`)</div>
            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
              {[['Compatibilité', wCompat, setWCompat], ['Proximité', wProx, setWProx], ['Fiabilité', wFiab, setWFiab]].map(([lab, val, set]: any) => (
                <div key={lab} style={{ marginBottom: 9 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 2 }}><span style={{ color: C.dim }}>{lab}</span><span style={{ fontWeight: 800 }}>{val}%</span></div>
                  <input type="range" min={0} max={100} value={val} onChange={e => set(parseInt(e.target.value))} style={{ width: '100%', accentColor: C.gold }} />
                </div>
              ))}
              <div style={{ fontSize: 10.5, color: C.dim, marginTop: 4 }}>En vrai : ces curseurs écriraient dans une table `params` lue par l'app, avec bornes + kill-switch + journal.</div>
            </div>
          </div>

          {/* Colonne droite : FLUX DE DÉCISIONS & DOUTES */}
          <div style={{ flex: '1 1 380px', minWidth: 300 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: C.gold, margin: '2px 0 8px', textTransform: 'uppercase', letterSpacing: '.05em' }}>🧠 Décisions &amp; doutes de l'algo (live)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '74vh', overflowY: 'auto' }}>
              {feed.map(it => (
                <div key={it.id} style={{ background: C.panel, border: `1px solid ${feedColor(it.type)}40`, borderLeft: `3px solid ${feedColor(it.type)}`, borderRadius: 10, padding: '9px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 9.5, fontWeight: 900, color: feedColor(it.type), letterSpacing: '.05em' }}>{feedTag(it.type)}</span>
                    <span style={{ fontSize: 9.5, color: C.dim }}>{it.t}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: C.ink, lineHeight: 1.55 }}>{it.text}</div>
                  {it.pending && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button onClick={() => decide(it.id, true)} style={{ flex: 1, fontSize: 12, fontWeight: 800, padding: '6px', borderRadius: 8, border: 'none', cursor: 'pointer', background: C.green, color: '#06281C' }}>✓ Valider</button>
                      <button onClick={() => decide(it.id, false)} style={{ flex: 1, fontSize: 12, fontWeight: 700, padding: '6px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${C.border}`, background: C.panel2, color: C.ink }}>✗ Ignorer</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
