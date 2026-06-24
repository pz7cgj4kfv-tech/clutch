'use client'
// ─────────────────────────────────────────────────────────────────────────────
// ANIMATION LAB — /animation. Le labo où on prévisualise et on règle les
// animations de l'app (radar de proximité, effet Doppler, Verrou qui se ferme,
// pulsations, transitions…). Page isolée, sans risque pour l'app.
// On la remplit au fur et à mesure. Append-only : on ajoute des animations.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react'

const C = {
  bg: '#FAF6F0', card: '#FFFFFF', card2: '#FFF8F2', border: 'rgba(42,16,32,0.12)',
  ink: '#1a0810', gold: '#532943', salmon: '#C0603A', mid: 'rgba(26,8,16,0.78)', dim: 'rgba(26,8,16,0.45)',
  pink: '#EB6BAF', prune: '#2a1020',
}

const LINKS: [string, string, boolean][] = [
  ['/animation', '✨ Animations', true], ['/vision2', '📖 Vision 2', false],
  ['/vision', '🗺 Vision (carte)', false], ['/sim', '🧪 Simulateur', false], ['/hq', '🔒 QG', false],
]

// ── Démo 1 : pulsation « disponible » (battement) ──
const Pulse = () => (
  <div style={{ position: 'relative', width: 80, height: 80, display: 'grid', placeItems: 'center' }}>
    <style>{`@keyframes ringPulse{0%{transform:scale(.5);opacity:.7}100%{transform:scale(2.2);opacity:0}}`}</style>
    {[0, 0.6, 1.2].map((d, i) => <span key={i} style={{ position: 'absolute', width: 34, height: 34, borderRadius: '50%', background: C.pink, animation: `ringPulse 2s ${d}s infinite ease-out` }} />)}
    <span style={{ position: 'relative', width: 18, height: 18, borderRadius: '50%', background: C.pink, boxShadow: `0 0 12px ${C.pink}` }} />
  </div>
)
// ── Démo 2 : Verrou qui se referme (rapprochement) ──
const Verrou = () => (
  <div style={{ width: 80, height: 80, display: 'grid', placeItems: 'center' }}>
    <style>{`@keyframes closeIn{0%{gap:34px;opacity:.5}100%{gap:2px;opacity:1}}`}</style>
    <div style={{ display: 'flex', alignItems: 'center', animation: 'closeIn 1.8s infinite alternate ease-in-out' }}>
      <span style={{ width: 22, height: 22, borderRadius: '50%', border: `3px solid ${C.gold}` }} />
      <span style={{ width: 22, height: 22, borderRadius: '50%', border: `3px solid ${C.salmon}` }} />
    </div>
  </div>
)
// ── Démo 3 : onde Doppler (approche) ──
const Doppler = () => (
  <div style={{ position: 'relative', width: 80, height: 80, display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
    <style>{`@keyframes dopp{0%{transform:translateX(-30px) scaleX(1);opacity:.8}100%{transform:translateX(10px) scaleX(.4);opacity:0}}`}</style>
    {[0, 0.4, 0.8, 1.2].map((d, i) => <span key={i} style={{ position: 'absolute', width: 50, height: 50, borderRadius: '50%', border: `2px solid ${C.prune}`, animation: `dopp 1.6s ${d}s infinite linear` }} />)}
    <span style={{ position: 'relative', fontSize: 18 }}>🏃</span>
  </div>
)

const DEMOS = [
  { id: 'pulse', t: 'Pulsation « disponible »', d: 'Le battement d\'une présence active. Réf : battement cardiaque / sonar.', C: Pulse },
  { id: 'verrou', t: 'Verrou qui se referme', d: 'Deux cercles qui se rapprochent = le rapprochement vers le RDV.', C: Verrou },
  { id: 'doppler', t: 'Onde Doppler (approche)', d: 'Ondes compressées quand la personne approche du lieu. Réf : effet Doppler.', C: Doppler },
]

export default function AnimationLab() {
  const [bg, setBg] = useState<'clair' | 'prune'>('prune')
  const tileBg = bg === 'prune' ? C.prune : C.card
  const tileInk = bg === 'prune' ? '#f5e8de' : C.ink
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'ui-sans-serif,system-ui,-apple-system,sans-serif' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '24px 18px 80px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
          {LINKS.map(([href, label, here]) => (
            <a key={href} href={href} style={{ fontSize: 11.5, fontWeight: here ? 800 : 600, textDecoration: 'none', color: here ? '#fff' : C.mid, background: here ? C.gold : C.card, border: `1px solid ${here ? C.gold : C.border}`, borderRadius: 9, padding: '5px 11px', whiteSpace: 'nowrap' }}>{label}{here ? ' · ici' : ''}</a>
          ))}
        </div>

        <div style={{ fontSize: 25, fontWeight: 900, color: C.gold, letterSpacing: '-.5px', marginBottom: 4 }}>✨ Animation Lab</div>
        <p style={{ fontSize: 14, color: C.mid, lineHeight: 1.8, margin: '0 0 16px' }}>Le labo où on prévisualise et on règle les animations de l'app, en isolé (zéro risque). On le remplit au fur et à mesure — chaque animation aura toujours une <b style={{ color: C.ink }}>référence réelle</b> (sonar, Doppler, battement cardiaque…). Voici 3 premières maquettes pour démarrer.</p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: C.dim, alignSelf: 'center' }}>Fond :</span>
          {(['prune', 'clair'] as const).map(b => (
            <button key={b} onClick={() => setBg(b)} style={{ fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${bg === b ? C.gold : C.border}`, background: bg === b ? `${C.gold}1a` : C.card, color: bg === b ? C.gold : C.mid }}>{b === 'prune' ? 'Prune (app)' : 'Clair'}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
          {DEMOS.map(D => (
            <div key={D.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
              <div style={{ background: tileBg, borderRadius: 10, height: 120, display: 'grid', placeItems: 'center', marginBottom: 10 }}><D.C /></div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink, marginBottom: 3 }}>{D.t}</div>
              <div style={{ fontSize: 11.5, color: C.dim, lineHeight: 1.5 }}>{D.d}</div>
            </div>
          ))}
          <div style={{ border: `2px dashed ${C.border}`, borderRadius: 14, display: 'grid', placeItems: 'center', color: C.dim, fontSize: 12.5, fontWeight: 700, minHeight: 180, textAlign: 'center', padding: 14 }}>
            ➕ À remplir ensemble<br /><span style={{ fontWeight: 400 }}>(transitions, célébrations, radar, halo Clutch…)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
