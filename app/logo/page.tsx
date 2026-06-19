'use client'
/**
 * CLUTCH — Proto design : logo flottant animé (verre + néon + suspension)
 * + barre d'onglets redesignée (cercles, thème clair). Page isolée — n'affecte pas /app2.
 */
import { useState } from 'react'
import { brand as C } from '../../lib/brand'

// Logo réel — viewBox recadré sur le dessin pour qu'il remplisse le cercle
const Logo = ({ size = 56 }: { size?: number }) => (
  <svg width={size} height={size * (205/258)} viewBox="103 127 258 205" aria-label="Clutch">
    <polygon fill="#E27D09" points="174,294.9 181.3,287.6 181.8,267.3 146.5,267.3 "/>
    <polygon fill="#E27D09" points="207.4,223.5 246.4,222.5 253.6,215.3 246,207.7 207.8,207.7 "/>
    <path fill="#F8BE9F" d="M249.4,229.1l13.9-13.9l-47.5-47.5L202,181.6l-1,42l-11.2,0.4l1.1-44.9c0-1.4,0.6-2.8,1.6-3.8l19.4-19.4c2.2-2.2,5.7-2.2,7.9,0l55.3,55.3c2.2,2.2,2.2,5.7,0,7.9l-19.4,19.4c-1,1-2.4,1.6-3.8,1.6L140.6,243l-13.9,13.9l47.5,47.5l13.9-13.9l1-41.7l11.2-0.2l-1.1,44.4c0,1.4-0.6,2.8-1.6,3.8l-19.4,19.4c-2.2,2.2-5.7,2.2-7.9,0l-55.3-55.3c-2.2-2.2-2.2-5.7,0-7.9l19.4-19.4c1-1,2.4-1.6,3.8-1.6L249.4,229.1z"/>
    <path fill="#E27D09" d="M338.1,215.6h-42.8v-42.8C318.9,172.8,338.1,192,338.1,215.6z"/>
    <path fill="#F8BE9F" d="M301.2,154.7v-7.4h4.5c1.6,0,2.8-1.3,2.8-2.8v-9.3c0-1.6-1.3-2.8-2.8-2.8H285c-1.6,0-2.8,1.3-2.8,2.8v9.3c0,1.6,1.3,2.8,2.8,2.8h4.5v7.4c-16,1.5-30.2,9.2-40.2,20.7l8,8c9.2-10.8,22.8-17.7,38-17.7c27.5,0,49.8,22.4,49.8,49.8s-22.4,49.9-49.8,49.9c-15.8,0-29.9-7.4-39.1-19c-1.3,0.5-2.7,0.8-4.1,0.8l-9,0.2c10.8,17.5,30.1,29.3,52.2,29.3c33.7,0,61.2-27.4,61.2-61.2C356.5,183.8,332.2,157.6,301.2,154.7z"/>
    <path fill="#F8BE9F" d="M346,173.3c1.1,1.1,2.9,1.1,4,0l3.9-3.9c1.1-1.1,1.1-2.9,0-4l-7.1-7.1c-1.1-1.1-2.9-1.1-4,0l-3.9,3.9c-1.1,1.1-1.1,2.9,0,4L346,173.3z"/>
  </svg>
)

// Onglets — icônes simples en trait
const ICONS: Record<string, any> = {
  pres: <path d="M12 3l2 6 6 .5-4.6 4 1.5 6L12 16l-5.4 3.5 1.5-6L3.5 9.5 9.5 9z"/>,
  even: <><rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 9h16M8 3v4M16 3v4"/></>,
  contacts: <><circle cx="9" cy="9" r="3"/><circle cx="16" cy="10" r="2.4"/><path d="M4 19c0-3 2.2-5 5-5s5 2 5 5M14.5 19c.2-2.2 1.6-3.6 3.4-3.6 1.5 0 2.7 1 3.1 2.6"/></>,
  profil: <><circle cx="12" cy="8" r="3.4"/><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6"/></>,
}

export default function LogoShowcase() {
  const [light, setLight] = useState(true)
  const [activeTab, setActiveTab] = useState('pres')
  const bg = light ? '#f4eee8' : C.bgBase
  const ring = light ? '#E27D09' : C.gold
  const glass = light ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.07)'
  const glassBorder = light ? 'rgba(255,255,255,0.95)' : 'rgba(255,191,158,0.35)'
  const ink = light ? '#3a2418' : C.textPrimary
  const tabInactive = light ? '#b9a99c' : 'rgba(245,232,222,.4)'
  const barBg = light ? 'rgba(255,255,255,0.72)' : 'rgba(42,16,32,0.85)'
  const tabActive = '#542A44' // pastille VIOLETTE (couleur app actuelle), pas orange

  const TABS = [
    { id: 'pres', label: 'Présences' },
    { id: 'even', label: 'Événements' },
    { id: 'clutchs', label: 'Clutchs', badge: 3 },
    { id: 'contacts', label: 'Contacts' },
    { id: 'profil', label: 'Profil' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 40, transition: 'background .4s', fontFamily: '-apple-system, system-ui, sans-serif', paddingBottom: 120 }}>
      <style>{`
        @keyframes clutchBeat { 0%,100%{transform:scale(1)} 12%{transform:scale(1.05)} 24%{transform:scale(1)} 36%{transform:scale(1.03)} 50%{transform:scale(1)} }
        @keyframes clutchGlow {
          0%,100% { box-shadow: inset 0 1px 7px rgba(255,255,255,.5), 0 0 0 0 ${ring}00, 0 8px 20px rgba(0,0,0,.26); }
          12% { box-shadow: inset 0 1px 7px rgba(255,255,255,.5), 0 0 24px 7px ${ring}88, 0 8px 20px rgba(0,0,0,.26); }
          36% { box-shadow: inset 0 1px 7px rgba(255,255,255,.5), 0 0 16px 5px ${ring}55, 0 8px 20px rgba(0,0,0,.26); }
        }
        @keyframes floatY { 0%,100%{translate:0 0} 50%{translate:0 -8px} }
        @keyframes floatX { 0%,100%{margin-left:0} 50%{margin-left:4px} }
        @keyframes tilt   { 0%,100%{rotate:-2deg} 50%{rotate:2.5deg} }
        @keyframes shadowPulse { 0%,100%{transform:scaleX(1);opacity:.26} 50%{transform:scaleX(.72);opacity:.14} }
        .cf { animation: floatY 5.2s ease-in-out infinite, floatX 7.3s ease-in-out infinite, tilt 11s ease-in-out infinite; }
        .cc { animation: clutchBeat 3.6s ease-in-out infinite, clutchGlow 3.6s ease-in-out infinite; }
        .cs { animation: shadowPulse 5.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce){ .cf,.cc,.cs{animation:none!important} }
      `}</style>

      {/* Logo flottant — l'icône remplit le cercle */}
      <div style={{ position: 'relative', width: 110, height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="cf" style={{ position: 'relative' }}>
          <div className="cc" style={{
            width: 66, height: 66, borderRadius: '50%',
            background: glass, backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${glassBorder}`,
          }}>
            <Logo size={50} />
          </div>
        </div>
        <div className="cs" style={{ position: 'absolute', bottom: 0, width: 52, height: 12, borderRadius: '50%', background: light ? 'rgba(90,50,25,.5)' : '#000', filter: 'blur(7px)' }}/>
      </div>

      <div style={{ textAlign: 'center', color: ink }}>
        <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: 1.5, opacity: .8 }}>CLUTCH</div>
        <div style={{ fontSize: 11.5, opacity: .45, marginTop: 4 }}>pastille flottante · verre · battement néon</div>
      </div>

      <button onClick={() => setLight(v => !v)} style={{ padding: '10px 18px', borderRadius: 99, border: `1px solid ${ring}55`, background: 'transparent', color: ring, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
        Basculer fond {light ? 'sombre' : 'clair'}
      </button>

      {/* ── Mini pastille flottante (placement réel : bas-droite, très petite, cliquable) ── */}
      <button onClick={() => alert('→ ouvre la page Clutch')} aria-label="Clutch"
        className="cc" style={{ position: 'fixed', right: 16, bottom: 92, width: 46, height: 46, borderRadius: '50%',
          background: glass, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          border: `1px solid ${glassBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
        <Logo size={34} />
      </button>

      {/* ── Barre d'onglets redesignée (cercles) ── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end',
        padding: '10px 8px calc(env(safe-area-inset-bottom,10px) + 10px)', background: barBg, backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
        borderTop: `1px solid ${light ? 'rgba(0,0,0,.06)' : 'rgba(255,191,158,.12)'}` }}>
        {TABS.map(tb => {
          const on = activeTab === tb.id
          return (
            <button key={tb.id} onClick={() => setActiveTab(tb.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, fontFamily: 'inherit', flex: 1 }}>
              <div style={{ position: 'relative', width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: on ? tabActive : 'transparent',
                border: on ? 'none' : `1.5px solid ${light ? 'rgba(0,0,0,.12)' : 'rgba(255,191,158,.22)'}`,
                boxShadow: on ? `0 4px 14px ${tabActive}66` : 'none', transition: 'all .25s' }}>
                {tb.id === 'clutchs'
                  ? <div style={{ filter: on ? 'brightness(0) invert(1)' : 'none', opacity: on ? 1 : .8 }}><Logo size={26} /></div>
                  : <svg width="22" height="22" viewBox="0 0 24 24" fill={tb.id==='pres'&&on ? '#fff' : 'none'} stroke={on ? '#fff' : tabInactive} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{ICONS[tb.id]}</svg>}
                {tb.badge && <div style={{ position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, background: '#FF8C00', color: '#fff', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', boxShadow: '0 0 8px rgba(255,140,0,.6)' }}>{tb.badge}</div>}
              </div>
              <span style={{ fontSize: 10, fontWeight: on ? 800 : 500, color: on ? tabActive : tabInactive }}>{tb.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
