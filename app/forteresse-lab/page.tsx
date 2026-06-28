'use client'
// ─────────────────────────────────────────────────────────────────────────────
// /forteresse-lab — LA COQUE (David 29.06) : voir TOUTES les possibilités du moteur forteresse
// d'un coup d'œil, + un bac à sable interactif. Source de vérité = lib/forteresse-engine (prouvé
// par scripts/test-forteresse, 26/26). Sert à valider AVANT de câbler les molettes.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react'
import { evaluate, reachKm, MIN_LEAD_MIN, DEFAULT_LEAD_MIN } from '@/lib/forteresse-engine'

const C = { bg: '#2a1020', card: '#3a1a2e', ink: '#f5e8de', mid: '#c9a9bd', green: '#77BC1F', rose: '#EB6BAF', plum: '#532943', red: '#E05353' }
const MIN = 60_000, now = 0
const ME: [number, number] = [46.5, 6.58]
const pinAt = (km: number): [number, number] => [ME[0], ME[1] + km / 76]
const fmtLead = (m: number) => m < 60 ? `+${m}min` : `+${(m / 60).toFixed(m % 60 ? 1 : 0)}h`

const LEADS = [MIN_LEAD_MIN, 30, 60, 120, 360, 720, 1080 - 30]
const DISTS = [0, 1, 3, 10, 30]

function capColor(cap: number, pinTooFar: boolean) {
  if (pinTooFar) return C.red
  if (cap >= 25) return C.green
  if (cap >= 8) return '#B6D77A'
  if (cap >= 2) return C.rose
  return C.plum
}

export default function ForteresseLab() {
  const [leadMin, setLead] = useState(DEFAULT_LEAD_MIN)
  const [pinD, setPinD] = useState(0)
  const [R, setR] = useState(5)
  const start = now + leadMin * MIN
  const e = evaluate({ now, gps: ME, pin: pinAt(pinD), start, end: start + 30 * MIN, radiusKm: R })

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'ui-sans-serif,system-ui,-apple-system,sans-serif', padding: '28px 18px 60px' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.16em', color: C.rose, marginBottom: 4 }}>🏰 FORTERESSE · COQUE</div>
        <h1 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 900 }}>Toutes les possibilités, d'un coup d'œil</h1>
        <p style={{ margin: '0 0 6px', fontSize: 13.5, color: C.mid, lineHeight: 1.5 }}>
          Une seule formule : <b style={{ color: C.ink }}>D + R ≤ portée(Δt)</b>. D = distance moi→pin · R = rayon · Δt = temps avant le début.
          Tout en sort (plafond, pin trop loin, tension). Prouvé par <code>scripts/test-forteresse</code> (26/26).
        </p>

        {/* ── BAC À SABLE interactif ── */}
        <div style={{ background: C.card, borderRadius: 16, padding: '16px 18px', margin: '14px 0 22px', border: `1px solid ${C.plum}` }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>🎛️ Bac à sable</div>
          {[
            { l: `Début dans : ${fmtLead(leadMin)}`, v: leadMin, set: setLead, min: MIN_LEAD_MIN, max: 1050, step: 5 },
            { l: `Pin à : ${pinD} km de moi`, v: pinD, set: setPinD, min: 0, max: 50, step: 1 },
            { l: `Rayon : ${R} km`, v: R, set: setR, min: 1, max: 50, step: 1 },
          ].map((s, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: C.mid, marginBottom: 4, fontWeight: 700 }}>{s.l}</div>
              <input type="range" min={s.min} max={s.max} step={s.step} value={s.v} onChange={ev => s.set(Number(ev.target.value))} style={{ width: '100%', accentColor: C.rose }} />
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10, marginTop: 8 }}>
            {[
              ['Portée (Δt)', `${e.budgetKm.toFixed(1)} km`, C.ink],
              ['Plafond rayon', `${e.maxRadiusKm.toFixed(1)} km`, e.pinTooFar ? C.red : C.green],
              ['Tension', `${e.tension.toFixed(1)}/10`, e.tension >= 7 ? C.red : e.tension >= 4 ? C.rose : C.green],
              ['Verdict', e.pinTooFar ? '📍 pin trop loin' : e.feasible ? '✅ OK' : '⛔ rayon trop grand', e.ok ? C.green : C.red],
            ].map(([k, v, col]) => (
              <div key={k as string} style={{ background: C.bg, borderRadius: 10, padding: '9px 11px' }}>
                <div style={{ fontSize: 10, color: C.mid, fontWeight: 700 }}>{k}</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: col as string }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── MATRICE : plafond de rayon (km) selon lead × distance pin ── */}
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>📊 Plafond de rayon (km) — lignes = quand je démarre · colonnes = pin à X km de moi</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'separate', borderSpacing: 4, width: '100%', minWidth: 520 }}>
            <thead><tr>
              <th style={{ fontSize: 11, color: C.mid, textAlign: 'left', padding: 6 }}>début ↓ / pin →</th>
              {DISTS.map(d => <th key={d} style={{ fontSize: 11.5, color: C.mid, padding: 6, fontWeight: 800 }}>{d} km</th>)}
            </tr></thead>
            <tbody>
              {LEADS.map(lead => {
                const st = now + lead * MIN
                return (
                  <tr key={lead}>
                    <td style={{ fontSize: 12, fontWeight: 800, color: C.ink, padding: 6, whiteSpace: 'nowrap' }}>{fmtLead(lead)}</td>
                    {DISTS.map(d => {
                      const ev = evaluate({ now, gps: ME, pin: pinAt(d), start: st, end: st + 30 * MIN, radiusKm: 0 })
                      return (
                        <td key={d} style={{ textAlign: 'center', borderRadius: 9, padding: '8px 4px', fontWeight: 900, fontSize: 13, color: '#1a0d16', background: capColor(ev.maxRadiusKm, ev.pinTooFar) }}>
                          {ev.pinTooFar ? '📍✖' : `${ev.maxRadiusKm.toFixed(0)}`}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 11.5, color: C.mid, marginTop: 10, lineHeight: 1.6 }}>
          🟢 vert = large · 🌸 rose = serré · 🟣 violet = très court · <span style={{ color: C.red }}>📍✖</span> = pin trop loin (rapproche le lieu ou décale).
          <br />→ Au défaut <b style={{ color: C.ink }}>+1h, pin sur moi</b> : ~28 km dispo (les premiers km ne bloquent jamais). Le plafond rétrécit quand le début approche, et croît si tu décales plus tard. <b style={{ color: C.ink }}>Aucune case incohérente.</b>
        </div>
      </div>
    </div>
  )
}
