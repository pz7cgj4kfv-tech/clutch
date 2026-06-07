'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/supabase'

const C = {
  bg:'#FDFAF7', bgDeep:'#F5F0EA',
  primary:'#C4748A', primaryDark:'#A85C72', primaryLight:'#F2D4DB',
  sage:'#7A9E8A', sageLight:'#D4E8DE',
  peach:'#E8A87C', peachLight:'#FAEBD7',
  gold:'#C9A96E', purple:'#8B7CB8', purpleLight:'#EAE6F8',
  text:'#2C1810', textMid:'#6B4C3B', textLight:'#A08878',
  card:'#FFFFFF', border:'#EDE8E3', shadow:'rgba(44,24,16,0.08)',
  red:'#D64545', redLight:'#FDEAEA',
}

type Screen =
  | 'splash' | 'login' | 'register' | 'forgot-password'
  | 'ob-name' | 'ob-gender' | 'ob-age' | 'ob-photo' | 'ob-interests' | 'ob-done'
  | 'set-avail'
  | 'discover' | 'events' | 'inbox' | 'myprofile' | 'edit-profile'
  | 'profile-detail'
  | 'propose' | 'propose2' | 'propose3' | 'sent'
  | 'clutch-received' | 'chat' | 'rdv' | 'rdv-active' | 'sos'
  | 'create-event' | 'my-events'
  | 'feedback' | 'get-certified'

const BANNED_WORDS = ['salope','pute','fdp','enculé','nique','bite','chier','merde ta gueule','ta gueule']
const SUPABASE_FUNCTIONS_URL = 'https://fnucdicfcjoxbozpfdau.supabase.co/functions/v1'

const INTERESTS_CATS = [
  { label:'Sport', icon:'🏃', items:['Randonnée','Yoga','Tennis','Natation','Cyclisme','Course','Escalade','Ski','Fitness'] },
  { label:'Culture', icon:'🎨', items:['Cinéma','Musique','Lecture','Théâtre','Musées','Photo','Danse','Podcasts'] },
  { label:'Cuisine', icon:'☕', items:['Cafés','Brunch','Cuisine','Vins','Boulangeries','Cocktails','Pâtisserie'] },
  { label:'Loisirs', icon:'🎲', items:['Voyages','Jeux de société','Concerts','Stand-up','Gaming','Nature'] },
]

// ─── VENUES curatés Lausanne ──────────────────────────────────────────────────
const VENUES = [
  // Cafés (🟢 sûr)
  { name:'Café du Grütli', safety:'safe', emoji:'☕', type:'café', neighborhood:'Flon' },
  { name:'Blackbird Coffee', safety:'safe', emoji:'☕', type:'café', neighborhood:'Centre' },
  { name:'Café de l\'Évêché', safety:'safe', emoji:'☕', type:'café', neighborhood:'Vieille Ville' },
  { name:'Café Romand', safety:'safe', emoji:'☕', type:'café', neighborhood:'Centre' },
  { name:'Café du Tunnel', safety:'safe', emoji:'☕', type:'café', neighborhood:'Flon' },
  { name:'Flon Café', safety:'safe', emoji:'☕', type:'café', neighborhood:'Flon' },
  { name:'Starbucks Flon', safety:'safe', emoji:'☕', type:'café', neighborhood:'Flon' },
  { name:'Holy Cow! Lausanne', safety:'safe', emoji:'🍔', type:'café', neighborhood:'Centre' },
  { name:'Café Bel-Air', safety:'safe', emoji:'☕', type:'café', neighborhood:'Bel-Air' },
  { name:'Caribana', safety:'safe', emoji:'☕', type:'café', neighborhood:'Ouchy' },
  { name:'Café du Pont', safety:'safe', emoji:'☕', type:'café', neighborhood:'Pully' },
  { name:'Café du Marché', safety:'safe', emoji:'☕', type:'café', neighborhood:'Palud' },
  { name:'Les Grandes Roches', safety:'safe', emoji:'☕', type:'café', neighborhood:'Sallaz' },
  { name:'Café de Chailly', safety:'safe', emoji:'☕', type:'café', neighborhood:'Chailly' },
  // Bars & Brasseries (🟢 sûr)
  { name:'Brasserie de Montbenon', safety:'safe', emoji:'🍺', type:'bar', neighborhood:'Montbenon' },
  { name:'Mad – Le Club', safety:'safe', emoji:'🍺', type:'bar', neighborhood:'Flon' },
  { name:'Le Bleu Lézard', safety:'safe', emoji:'🍺', type:'bar', neighborhood:'Flon' },
  { name:'Brasserie du Château', safety:'safe', emoji:'🍺', type:'bar', neighborhood:'Vieille Ville' },
  { name:'Le Bourg Plage', safety:'safe', emoji:'🍹', type:'bar', neighborhood:'Bourg' },
  { name:'Café du Centre', safety:'safe', emoji:'🍺', type:'bar', neighborhood:'Centre' },
  { name:'L\'Éléphant', safety:'safe', emoji:'🍺', type:'bar', neighborhood:'Flon' },
  { name:'Bar du Flon', safety:'safe', emoji:'🍺', type:'bar', neighborhood:'Flon' },
  { name:'Le Bellevue', safety:'safe', emoji:'🍹', type:'bar', neighborhood:'Ouchy' },
  { name:'Café de la Paix', safety:'safe', emoji:'🍺', type:'bar', neighborhood:'Flon' },
  // Restaurants (🟢 sûr)
  { name:'Le Jardin d\'Ete', safety:'safe', emoji:'🍽️', type:'restaurant', neighborhood:'Ouchy' },
  { name:'Café du Grütli', safety:'safe', emoji:'🍽️', type:'restaurant', neighborhood:'Vieille Ville' },
  { name:'Brasserie Lipp', safety:'safe', emoji:'🍽️', type:'restaurant', neighborhood:'Centre' },
  { name:'Le Nomade', safety:'safe', emoji:'🍜', type:'restaurant', neighborhood:'Flon' },
  { name:'La Punaise', safety:'safe', emoji:'🍕', type:'restaurant', neighborhood:'Centre' },
  { name:'Sushi Shop Flon', safety:'safe', emoji:'🍱', type:'restaurant', neighborhood:'Flon' },
  // Lieux publics (🟡 neutre)
  { name:'Quai d\'Ouchy', safety:'neutral', emoji:'🌊', type:'parc', neighborhood:'Ouchy' },
  { name:'Place de la Palud', safety:'neutral', emoji:'⛲', type:'place', neighborhood:'Vieille Ville' },
  { name:'Place St-François', safety:'neutral', emoji:'🕍', type:'place', neighborhood:'Centre' },
  { name:'Esplanade de Montbenon', safety:'neutral', emoji:'🌿', type:'parc', neighborhood:'Montbenon' },
  { name:'Parc Mon-Repos', safety:'neutral', emoji:'🌿', type:'parc', neighborhood:'Mon-Repos' },
  { name:'Jardin de Valency', safety:'neutral', emoji:'🌳', type:'parc', neighborhood:'Valency' },
  { name:'Parc de Beaulieu', safety:'neutral', emoji:'🌳', type:'parc', neighborhood:'Beaulieu' },
  { name:'Parc de l\'Hermitage', safety:'neutral', emoji:'🌳', type:'parc', neighborhood:'Pully' },
  { name:'Bord du Lac (Vidy)', safety:'neutral', emoji:'🌊', type:'parc', neighborhood:'Vidy' },
  { name:'Place du Tunnel', safety:'neutral', emoji:'🏙️', type:'place', neighborhood:'Tunnel' },
  // Lieux culturels (🟢 sûr)
  { name:'Musée de l\'Élysée', safety:'safe', emoji:'📷', type:'culture', neighborhood:'Montriond' },
  { name:'MUDAC – Mudac', safety:'safe', emoji:'🎨', type:'culture', neighborhood:'Plateforme 10' },
  { name:'Musée Cantonal des Beaux-Arts', safety:'safe', emoji:'🖼️', type:'culture', neighborhood:'Plateforme 10' },
  { name:'Cinéma Pathé Flon', safety:'safe', emoji:'🎬', type:'culture', neighborhood:'Flon' },
  { name:'Théâtre de Vidy', safety:'safe', emoji:'🎭', type:'culture', neighborhood:'Vidy' },
  { name:'Opéra de Lausanne', safety:'safe', emoji:'🎶', type:'culture', neighborhood:'Centre' },
]

// ─── OVERPASS / OpenStreetMap venue search ────────────────────────────────────
async function searchOSMVenues(query: string): Promise<typeof VENUES> {
  if (query.length < 2) return []
  try {
    const overpassQuery = `
      [out:json][timeout:8];
      (
        node["amenity"~"cafe|bar|restaurant|pub|fast_food"]["name"~"${query}",i](around:6000,46.5197,6.6323);
        node["leisure"~"park"]["name"~"${query}",i](around:6000,46.5197,6.6323);
        node["tourism"~"museum|gallery"]["name"~"${query}",i](around:6000,46.5197,6.6323);
      );
      out 8;
    `.trim()
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: overpassQuery,
      signal: AbortSignal.timeout(6000),
    })
    const data = await res.json()
    return (data.elements || []).slice(0, 6).map((el: any) => {
      const amenity = el.tags?.amenity || el.tags?.leisure || el.tags?.tourism || ''
      const isCafe = ['cafe', 'fast_food'].includes(amenity)
      const isBar = ['bar', 'pub'].includes(amenity)
      const isPark = ['park'].includes(amenity)
      const isCulture = ['museum', 'gallery'].includes(amenity)
      const emoji = isCafe ? '☕' : isBar ? '🍺' : isPark ? '🌿' : isCulture ? '🎨' : '📍'
      const safety = isPark ? 'neutral' : 'safe'
      const type = isCafe ? 'café' : isBar ? 'bar' : isPark ? 'parc' : isCulture ? 'culture' : 'lieu'
      return { name: el.tags?.name || 'Lieu inconnu', safety, emoji, type, neighborhood: 'Lausanne' }
    })
  } catch {
    return []
  }
}

// ─── SHARE HELPERS ────────────────────────────────────────────────────────────
const APP_URL = 'https://clutch-mel.netlify.app'

function shareIt({ title, text, url }: { title:string; text:string; url:string }) {
  if (typeof navigator !== 'undefined' && navigator.share) {
    navigator.share({ title, text, url }).catch(()=>{})
  } else {
    // Fallback: ouvre WhatsApp
    const msg = encodeURIComponent(`${text}\n${url}`)
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }
}

function ShareSheet({ options, onClose }: { options:{icon:string;label:string;onTap:()=>void}[]; onClose:()=>void }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:999, display:'flex', alignItems:'flex-end', justifyContent:'center' }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:'24px 24px 0 0', padding:'20px 20px 36px', width:'100%', maxWidth:390 }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:36, height:4, borderRadius:2, background:'#ddd', margin:'0 auto 20px' }}/>
        <p style={{ fontWeight:800, color:'#2C1810', fontSize:16, marginBottom:16, textAlign:'center' }}>Partager</p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          {options.map(o=>(
            <button key={o.label} onClick={()=>{o.onTap();onClose()}} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', padding:'8px 12px' }}>
              <div style={{ width:52, height:52, borderRadius:16, background:'#F5F0EA', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>{o.icon}</div>
              <span style={{ fontSize:11, color:'#6B4C3B', fontWeight:600 }}>{o.label}</span>
            </button>
          ))}
        </div>
        <button onClick={onClose} style={{ width:'100%', marginTop:20, padding:12, borderRadius:12, background:'#F5F0EA', border:'none', color:'#A08878', fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>Annuler</button>
      </div>
    </div>
  )
}

// Génère des créneaux exacts à partir de l'heure actuelle
function getTimeSlots() {
  const now = new Date()
  const slots: { label: string; time: Date; iso: string }[] = []
  // Start at next 30-min mark
  const start = new Date(now)
  const m = start.getMinutes()
  const rem = 30 - (m % 30)
  start.setMinutes(m + rem, 0, 0)
  // Generate 8 slots every 30 min
  for (let i = 0; i < 8; i++) {
    const t = new Date(start.getTime() + i * 30 * 60000)
    const diff = Math.round((t.getTime() - now.getTime()) / 60000)
    if (diff > 18 * 60) break
    const h = t.getHours(), mn = t.getMinutes()
    const mStr = mn === 0 ? '00' : String(mn).padStart(2,'0')
    const diffLabel = diff < 60 ? `dans ${diff} min` : `dans ${Math.floor(diff/60)}h${diff%60>0?String(diff%60).padStart(2,'0'):''}`
    slots.push({ label: `${h}h${mStr} · ${diffLabel}`, time: t, iso: t.toISOString() })
  }
  return slots
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function Avatar({ p, size=48 }: { p: Partial<Profile>; size?: number }) {
  const init = (p.name || '?').slice(0,2).toUpperCase()
  return p.photo_url
    ? <img src={p.photo_url} alt="" style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover', border:`2px solid ${C.border}`, flexShrink:0 }} />
    : <div style={{ width:size, height:size, borderRadius:'50%', background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <span style={{ color:'#fff', fontSize:size*0.32, fontWeight:700 }}>{init}</span>
      </div>
}

function Btn({ children, onClick, variant='primary', disabled=false, loading=false }: any) {
  const s: Record<string,any> = {
    primary: { background:disabled?C.bgDeep:`linear-gradient(135deg,${C.primary},${C.primaryDark})`, color:disabled?C.textLight:'#fff' },
    secondary: { background:C.bgDeep, color:C.text, border:`1.5px solid ${C.border}` },
    ghost: { background:'transparent', color:C.primary, border:`1.5px solid ${C.primaryLight}` },
    sage: { background:`linear-gradient(135deg,${C.sage},#5A8A6A)`, color:'#fff' },
    danger: { background:C.redLight, color:C.red, border:`1.5px solid ${C.red}33` },
  }
  return (
    <button onClick={disabled||loading?undefined:onClick} style={{ ...(s[variant]||s.primary), borderRadius:14, padding:'13px 20px', fontSize:15, fontWeight:700, cursor:disabled||loading?'not-allowed':'pointer', border:'none', width:'100%', fontFamily:'inherit', letterSpacing:'-0.01em', opacity:loading?.7:1 }}>
      {loading?'…':children}
    </button>
  )
}

function Input({ label, type='text', value, onChange, placeholder, error, autoFocus }: any) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {label&&<label style={{ color:C.textLight, fontSize:12, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>{label}</label>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} autoFocus={autoFocus}
        style={{ background:C.bgDeep, border:`1.5px solid ${value?C.primary:C.border}`, borderRadius:13, padding:'14px 16px', color:C.text, fontSize:15, outline:'none', fontFamily:'inherit', transition:'border 0.2s' }} />
      {error&&<span style={{ color:C.red, fontSize:12 }}>{error}</span>}
    </div>
  )
}

function ProgressBar({ step, total }: { step:number; total:number }) {
  return (
    <div style={{ display:'flex', gap:6, marginBottom:8 }}>
      {Array.from({length:total}).map((_,i) => <div key={i} style={{ flex:1, height:3, borderRadius:2, background:i<step?C.primary:C.border }} />)}
    </div>
  )
}

function TabBar({ tab, setTab, badge=0 }: { tab:string; setTab:(t:string)=>void; badge?:number }) {
  return (
    <div style={{ display:'flex', borderTop:`1px solid ${C.border}`, background:C.bg, flexShrink:0, position:'sticky', bottom:0, zIndex:10 }}>
      {[{id:'discover',icon:'✦',label:'Discover'},{id:'events',icon:'🗓',label:'Événements'},{id:'inbox',icon:'💬',label:'Messages',b:badge},{id:'myprofile',icon:'◉',label:'Profil'}].map(t=>(
        <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1, background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'10px 4px env(safe-area-inset-bottom,14px)', position:'relative' }}>
          <span style={{ fontSize:20, lineHeight:1, color:tab===t.id?C.primary:C.textLight }}>{t.icon}</span>
          <span style={{ fontSize:10, fontWeight:tab===t.id?700:500, color:tab===t.id?C.primary:C.textLight }}>{t.label}</span>
          {(t as any).b>0&&<div style={{ position:'absolute', top:6, right:'14%', width:16, height:16, borderRadius:'50%', background:C.primary, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#fff', fontWeight:700 }}>{(t as any).b}</div>}
        </button>
      ))}
    </div>
  )
}

function TopBar({ title, onBack, right }: any) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px 8px', background:C.bg, flexShrink:0, borderBottom:`1px solid ${C.border}` }}>
      <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', fontSize:22, color:C.textMid, padding:'0 8px 0 0', minWidth:40 }}>{onBack?'←':' '}</button>
      <span style={{ fontWeight:700, fontSize:16, color:C.text }}>{title}</span>
      <div style={{ minWidth:40, display:'flex', justifyContent:'flex-end' }}>{right}</div>
    </div>
  )
}

function SafetyBadge({ safety }: { safety:string }) {
  const m: Record<string,{icon:string;label:string;bg:string;color:string}> = {
    safe:   { icon:'🛡', label:'Lieu certifié sûr', bg:C.sageLight,  color:C.sage },
    neutral:{ icon:'👁', label:'Lieu public',        bg:'#FFF8DC',    color:'#B8860B' },
    alert:  { icon:'⚠️', label:'Prudence',           bg:C.redLight,   color:C.red },
  }
  const s = m[safety]||m.safe
  return <span style={{ fontSize:11, padding:'3px 9px', borderRadius:10, background:s.bg, color:s.color, fontWeight:700 }}>{s.icon} {s.label}</span>
}

function ReliabilityStars({ score, light }: { score:number; light?:boolean }) {
  const stars = Math.round((score / 100) * 5)
  return (
    <div style={{ display:'flex', alignItems:'center', gap:3 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize:12, color: i<=stars ? (light?'#FFD700':C.primary) : (light?'rgba(255,255,255,0.35)':C.border), lineHeight:1 }}>
          {i <= stars ? '★' : '☆'}
        </span>
      ))}
      <span style={{ fontSize:10, color:light?'rgba(255,255,255,0.7)':C.textLight, marginLeft:3, fontWeight:600 }}>{score}%</span>
    </div>
  )
}

// ─── CLUTCH LOGO SVG ─────────────────────────────────────────────────────────
// Deux chevrons (> et <) qui se croisent au centre, inclinés à 45°
// Vert = moi qui part vers l'autre. Rose = l'autre qui vient vers moi.
// Ensemble = deux personnes qui se rejoignent. Concept Clutch pur.
function CclutchLogo({ size = 40, glow = false }: { size?: number; glow?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
      style={{ display:'block', filter: glow ? 'drop-shadow(0 0 12px #7DC840) drop-shadow(0 0 24px #E82060)' : undefined }}>
      <rect width="100" height="100" rx="22" fill="#5D1048"/>
      {/* Reflet haut-gauche */}
      <ellipse cx="22" cy="20" rx="26" ry="18" fill="white" opacity="0.07"/>

      {/* Chevron 1 — pointe vers haut-droit, accent vert au sommet */}
      <g transform="rotate(-45 50 50)">
        <polyline points="22,30 58,50 22,70"
          stroke="white" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <circle cx="59" cy="50" r="9" fill="#7DC840"/>
      </g>

      {/* Chevron 2 — pointe vers bas-gauche, accent rose au sommet */}
      <g transform="rotate(135 50 50)">
        <polyline points="22,30 58,50 22,70"
          stroke="white" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <circle cx="59" cy="50" r="9" fill="#E82060"/>
      </g>
    </svg>
  )
}

// ─── PROXIMITY METER ─────────────────────────────────────────────────────────
// Les deux flèches Clutch qui se rapprochent en temps réel via GPS
function ProximityMeter({ distance, merged }: { distance: number|null; merged: boolean }) {
  const MAX_DIST = 2000
  const progress = distance == null ? 0 : Math.max(0, 1 - Math.min(distance, MAX_DIST) / MAX_DIST)
  const clr = progress < 0.3 ? '#6B7280' : progress < 0.6 ? '#F59E0B' : progress < 0.85 ? '#10B981' : '#22C55E'
  const distLabel = distance == null ? 'Activation GPS…' :
    distance > 2000 ? 'Encore loin…' :
    distance > 500 ? 'Tu approches !' :
    distance > 100 ? '⚡ Presque là !' :
    distance > 50 ? '🔥 Tout près !' : '✅ Tu y es !'
  const distStr = distance == null ? '' : distance > 1000 ? ` · ${(distance/1000).toFixed(1)}km` : ` · ${Math.round(distance)}m`
  // Décalage des flèches : 0% = fusionnées, 100% = aux extrémités
  const spread = (1 - progress) * 36 // % de chaque côté du centre

  const ArrowRight = () => (
    <svg width="64" height="46" viewBox="0 0 64 46" fill="none">
      <polygon points="0,8 42,8 60,23 42,38 0,38 18,23"
        fill="#0A0A0A" stroke={clr} strokeWidth="3.5" strokeLinejoin="round"/>
      <polygon points="44,11 59,23 44,35" fill="#7DC840"/>
    </svg>
  )
  const ArrowLeft = () => (
    <svg width="64" height="46" viewBox="0 0 64 46" fill="none">
      <polygon points="64,8 22,8 4,23 22,38 64,38 46,23"
        fill="#0A0A0A" stroke={clr} strokeWidth="3.5" strokeLinejoin="round"/>
      <polygon points="20,11 5,23 20,35" fill="#E82060"/>
    </svg>
  )

  if (merged) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
      <CclutchLogo size={90} glow/>
      <p style={{ color:'#22C55E', fontWeight:900, fontSize:20, textAlign:'center', letterSpacing:'-0.02em' }}>
        🔒 Verrou GPS — vous y êtes !
      </p>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, alignItems:'center' }}>
      {/* Label distance */}
      <div style={{ background:`${clr}18`, border:`1px solid ${clr}44`, borderRadius:12, padding:'7px 20px', color:clr, fontWeight:700, fontSize:14 }}>
        {distLabel}<span style={{ color:'#6B7280', fontSize:12, fontWeight:500 }}>{distStr}</span>
      </div>
      {/* Les deux flèches animées */}
      <div style={{ position:'relative', width:'100%', height:60, display:'flex', alignItems:'center' }}>
        <div style={{
          position:'absolute',
          left:`${50 - spread}%`,
          transform:'translateX(-100%)',
          transition:'left 1.2s cubic-bezier(.34,1.56,.64,1)',
          filter: progress > 0.6 ? `drop-shadow(0 0 ${progress*6}px ${clr})` : undefined
        }}>
          <ArrowRight/>
        </div>
        <div style={{
          position:'absolute',
          right:`${50 - spread}%`,
          transform:'translateX(100%)',
          transition:'right 1.2s cubic-bezier(.34,1.56,.64,1)',
          filter: progress > 0.6 ? `drop-shadow(0 0 ${progress*6}px ${clr})` : undefined
        }}>
          <ArrowLeft/>
        </div>
      </div>
      {/* Barre de progression */}
      <div style={{ width:'100%', height:3, background:'#222', borderRadius:2, overflow:'hidden' }}>
        <div style={{
          width:`${progress*100}%`, height:'100%',
          background:`linear-gradient(90deg,#444,${clr})`,
          borderRadius:2, transition:'width 1.2s ease-out, background 1.2s ease-out'
        }}/>
      </div>
      {distance == null && (
        <p style={{ fontSize:12, color:'#6B7280', textAlign:'center', lineHeight:1.5 }}>
          Active ton GPS pour voir la position de l'autre personne en temps réel
        </p>
      )}
    </div>
  )
}

// ─── AUTH SCREENS ──────────────────────────────────────────────────────────────
function Splash({ go }: { go:(s:Screen)=>void }) {
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:`linear-gradient(160deg,#FDF6F0,${C.primaryLight})`, padding:'0 32px', gap:28 }}>
      <div style={{ textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
        <CclutchLogo size={82}/>
        <div style={{ fontSize:46, fontWeight:900, letterSpacing:'-0.05em', color:C.text, lineHeight:.9 }}>CLU<span style={{ color:C.primary }}>TCH</span></div>
        <div style={{ color:C.primary, fontSize:11, letterSpacing:'0.3em', textTransform:'uppercase', fontWeight:600 }}>be spontaneous · bêta lausanne</div>
        <div style={{ color:C.textMid, fontSize:14, lineHeight:1.7, marginTop:4 }}>Un vrai café dans les 18h.<br/>Réponds en 2h ou c'est libéré.</div>
      </div>
      <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:12 }}>
        <Btn onClick={()=>go('register')}>Créer mon compte →</Btn>
        <Btn variant="secondary" onClick={()=>go('login')}>J'ai déjà un compte</Btn>
      </div>
      <div style={{ textAlign:'center' }}>
        <p style={{ fontSize:12, color:C.textLight, marginBottom:8 }}>Sécurité & contrôle inclus pour tous 🛡</p>
        <a href="/demo" style={{ fontSize:12, color:C.primary, fontWeight:600, textDecoration:'none' }}>→ Voir la démo interactive d'abord</a>
      </div>
    </div>
  )
}

function Login({ go, setUser }: any) {
  const [email,setEmail]=useState(''); const [pass,setPass]=useState(''); const [loading,setLoading]=useState(false); const [err,setErr]=useState('')
  const login=async()=>{
    setLoading(true);setErr('')
    const {data,error}=await supabase.auth.signInWithPassword({email,password:pass})
    if(error){setErr('Email ou mot de passe incorrect');setLoading(false);return}
    if(data.user){
      const {data:p}=await supabase.from('profiles').select('*').eq('id',data.user.id).single()
      setUser(p||{id:data.user.id,email})
      const obKey='ob_'+data.user.id
      if(p?.name&&p.name!=='Utilisateur'){
        localStorage.setItem(obKey,'1')
        const isPrem=['premium','partner','admin'].includes(p?.account_type||'')
        const now=new Date()
        const until=p?.available_until?new Date(p.available_until):null
        const isReallyAvail=p?.is_available&&until&&until>now
        if(!isPrem&&!isReallyAvail) go('set-avail')
        else go('discover')
      } else if(localStorage.getItem(obKey)){
        go('discover')
      } else{go('ob-name')}
    }
    setLoading(false)
  }
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'32px 24px', gap:24, background:C.bg }}>
      <button onClick={()=>go('splash')} style={{ background:'none', border:'none', color:C.textMid, fontSize:22, cursor:'pointer', alignSelf:'flex-start' }}>←</button>
      <div><h2 style={{ color:C.text, fontSize:26, fontWeight:800 }}>Bon retour 👋</h2><p style={{ color:C.textMid, fontSize:14, marginTop:6 }}>Connecte-toi pour voir qui est dispo.</p></div>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <Input label="Email" type="email" value={email} onChange={(e:any)=>setEmail(e.target.value)} placeholder="ton@email.com" autoFocus />
        <Input label="Mot de passe" type="password" value={pass} onChange={(e:any)=>setPass(e.target.value)} placeholder="••••••••" error={err} />
      </div>
      <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', gap:12 }}>
        <Btn onClick={login} loading={loading} disabled={!email||!pass}>Se connecter →</Btn>
        <button onClick={()=>go('forgot-password')} style={{ background:'none', border:'none', color:C.primary, fontSize:13, cursor:'pointer', fontWeight:600 }}>Mot de passe oublié ?</button>
        <button onClick={()=>go('register')} style={{ background:'none', border:'none', color:C.textMid, fontSize:13, cursor:'pointer' }}>Pas de compte ? <span style={{ color:C.primary, fontWeight:700 }}>Créer un compte</span></button>
      </div>
    </div>
  )
}

function ForgotPassword({ go }: any) {
  const [email,setEmail]=useState(''); const [loading,setLoading]=useState(false); const [done,setDone]=useState(false); const [err,setErr]=useState('')
  const send=async()=>{
    if(!email.trim())return
    setLoading(true);setErr('')
    const {error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo:window.location.origin+'/app'})
    if(error){setErr('Email non trouvé ou erreur. Vérifie l\'adresse.');setLoading(false);return}
    setDone(true);setLoading(false)
  }
  if(done) return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:C.bg, padding:40, gap:20, textAlign:'center' }}>
      <div style={{ fontSize:60 }}>📧</div>
      <h2 style={{ fontSize:22, fontWeight:800, color:C.text }}>Email envoyé !</h2>
      <p style={{ color:C.textMid, lineHeight:1.7, fontSize:14 }}>Vérifie ta boîte mail à <strong>{email}</strong>.<br/>Clique sur le lien pour choisir un nouveau mot de passe.</p>
      <div style={{ background:C.bgDeep, borderRadius:12, padding:'12px 16px', width:'100%' }}>
        <p style={{ fontSize:12, color:C.textLight }}>Pas reçu ? Vérifie tes spams ou réessaie dans 2 minutes.</p>
      </div>
      <Btn variant="secondary" onClick={()=>go('login')}>← Retour à la connexion</Btn>
    </div>
  )
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'32px 24px', gap:24, background:C.bg }}>
      <button onClick={()=>go('login')} style={{ background:'none', border:'none', color:C.textMid, fontSize:22, cursor:'pointer', alignSelf:'flex-start' }}>←</button>
      <div>
        <h2 style={{ color:C.text, fontSize:26, fontWeight:800 }}>Mot de passe oublié ?</h2>
        <p style={{ color:C.textMid, fontSize:14, marginTop:6 }}>On t'envoie un lien pour en choisir un nouveau.</p>
      </div>
      <Input label="Ton email" type="email" value={email} onChange={(e:any)=>setEmail(e.target.value)} placeholder="ton@email.com" autoFocus error={err}/>
      <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', gap:12 }}>
        <Btn onClick={send} loading={loading} disabled={!email.trim()}>Envoyer le lien →</Btn>
        <button onClick={()=>go('login')} style={{ background:'none', border:'none', color:C.textMid, fontSize:13, cursor:'pointer' }}>← Annuler</button>
      </div>
    </div>
  )
}

function Register({ go, setUser }: any) {
  const [email,setEmail]=useState(''); const [pass,setPass]=useState(''); const [loading,setLoading]=useState(false); const [err,setErr]=useState(''); const [cgu,setCgu]=useState(false)
  const reg=async()=>{
    if(!cgu){setErr('Accepte les CGU pour continuer');return}
    if(pass.length<6){setErr('Minimum 6 caractères');return}
    setLoading(true);setErr('')
    const {data,error}=await supabase.auth.signUp({email,password:pass})
    if(error){setErr(error.message);setLoading(false);return}
    if(data.user){setUser({id:data.user.id,email});go('ob-name')}
    setLoading(false)
  }
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'32px 24px', gap:20, background:C.bg, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y' }}>
      <button onClick={()=>go('splash')} style={{ background:'none', border:'none', color:C.textMid, fontSize:22, cursor:'pointer', alignSelf:'flex-start', flexShrink:0 }}>←</button>
      <div><h2 style={{ color:C.text, fontSize:26, fontWeight:800 }}>Rejoins Clutch ✦</h2><p style={{ color:C.textMid, fontSize:14, marginTop:6 }}>2 min pour créer ton profil.</p></div>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <Input label="Email" type="email" value={email} onChange={(e:any)=>setEmail(e.target.value)} placeholder="ton@email.com" autoFocus />
        <Input label="Mot de passe" type="password" value={pass} onChange={(e:any)=>setPass(e.target.value)} placeholder="6 caractères minimum" error={err} />
      </div>
      <div style={{ background:C.sageLight, border:`1px solid ${C.sage}44`, borderRadius:12, padding:'10px 14px' }}>
        <span style={{ color:C.sage, fontSize:13, fontWeight:600 }}>🛡 Clutch est gratuit pour commencer. Ton contrôle, tes règles.</span>
      </div>
      {/* CGU */}
      <button onClick={()=>setCgu(v=>!v)} style={{ display:'flex', gap:10, alignItems:'flex-start', background:'none', border:'none', cursor:'pointer', padding:0, textAlign:'left' }}>
        <div style={{ width:20, height:20, borderRadius:5, border:`2px solid ${cgu?C.primary:C.border}`, background:cgu?C.primary:'transparent', flexShrink:0, marginTop:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
          {cgu&&<span style={{ color:'#fff', fontSize:12, fontWeight:700 }}>✓</span>}
        </div>
        <span style={{ fontSize:12, color:C.textMid, lineHeight:1.5 }}>
          J'accepte les <a href="/legal" target="_blank" onClick={e=>e.stopPropagation()} style={{ color:C.primary, fontWeight:600 }}>Conditions d'utilisation</a> et la <a href="/legal" target="_blank" onClick={e=>e.stopPropagation()} style={{ color:C.primary, fontWeight:600 }}>Politique de confidentialité</a>. J'ai 18 ans ou plus.
        </span>
      </button>
      <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', gap:12 }}>
        <Btn onClick={reg} loading={loading} disabled={!email||!pass||!cgu}>Créer mon compte →</Btn>
        <button onClick={()=>go('login')} style={{ background:'none', border:'none', color:C.textMid, fontSize:13, cursor:'pointer' }}>Déjà un compte ? <span style={{ color:C.primary, fontWeight:700 }}>Se connecter</span></button>
      </div>
    </div>
  )
}

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
function ObName({ go, user, save }: any) {
  const locked = !!(user?.name && user.name !== 'Utilisateur')
  const [val,setVal]=useState(user?.name||''); const [loading,setLoading]=useState(false)
  const next=async()=>{
    if(locked){go('ob-gender');return}
    if(!val.trim())return
    setLoading(true)
    await supabase.from('profiles').upsert({id:user.id,name:val.trim()})
    save({name:val.trim()})
    go('ob-gender')
    setLoading(false)
  }
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'40px 24px 32px', gap:24, background:C.bg }}>
      <ProgressBar step={1} total={5}/>
      <div>
        <p style={{ color:C.primary, fontSize:12, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>1 / 5</p>
        <h2 style={{ color:C.text, fontSize:26, fontWeight:800 }}>Comment on t'appelle ?</h2>
      </div>
      <div style={{ position:'relative' }}>
        <input value={val} onChange={e=>!locked&&setVal(e.target.value)} placeholder="Ton prénom…" autoFocus={!locked} onKeyDown={e=>e.key==='Enter'&&next()} style={{ background:'none', border:'none', borderBottom:`2px solid ${locked?C.sage:val?C.primary:C.border}`, padding:'8px 0', color:locked?C.sage:C.text, fontSize:24, fontWeight:700, outline:'none', fontFamily:'inherit', width:'100%', cursor:locked?'default':'text' }}/>
        {locked&&<span style={{ position:'absolute', right:0, bottom:10, fontSize:12, color:C.sage, fontWeight:600 }}>🔒 Non modifiable</span>}
      </div>
      <p style={{ color:C.textLight, fontSize:13 }}>{locked?`Bienvenue de retour, ${val} !`:'Seul ton prénom sera visible.'}</p>
      <div style={{ marginTop:'auto' }}><Btn disabled={!val.trim()} loading={loading} onClick={next}>{locked?'Continuer →':'Confirmer →'}</Btn></div>
    </div>
  )
}

function ObGender({ go, user, save }: any) {
  const locked = !!user?.gender
  const [picked,setPicked]=useState(user?.gender||null); const [loading,setLoading]=useState(false)
  const opts=[{id:'woman',label:'Femme',desc:'Contrôles de sécurité avancés inclus',color:C.sage},{id:'man',label:'Homme',desc:'Accès gratuit · Premium disponible',color:C.primary},{id:'nb',label:'Non-binaire',desc:'Tu choisis tes préférences',color:C.purple}]
  const next=async()=>{
    if(locked){go('ob-age');return}
    if(!picked)return;setLoading(true);await supabase.from('profiles').upsert({id:user.id,gender:picked});save({gender:picked});go('ob-age');setLoading(false)
  }
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'40px 24px 32px', gap:20, background:C.bg }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <button onClick={()=>go('ob-name')} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:C.textMid, padding:0 }}>←</button>
        <ProgressBar step={2} total={5}/>
      </div>
      <div>
        <p style={{ color:C.primary, fontSize:12, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>2 / 5</p>
        <h2 style={{ color:C.text, fontSize:26, fontWeight:800 }}>Salut {user?.name} 👋</h2>
        {locked&&<p style={{ color:C.sage, fontSize:13, marginTop:4 }}>🔒 Non modifiable après inscription</p>}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {opts.map(o=>(
          <button key={o.id} onClick={()=>!locked&&setPicked(o.id)} style={{ background:picked===o.id?`${o.color}18`:C.bgDeep, border:`1.5px solid ${picked===o.id?o.color:C.border}`, borderRadius:14, padding:16, textAlign:'left', cursor:locked?'default':'pointer', opacity:locked&&picked!==o.id?0.4:1 }}>
            <div style={{ color:picked===o.id?o.color:C.text, fontSize:16, fontWeight:700 }}>{o.label} {picked===o.id?'✓':''}</div>
            <div style={{ color:C.textLight, fontSize:12, marginTop:3 }}>{o.desc}</div>
          </button>
        ))}
      </div>
      <div style={{ marginTop:'auto' }}><Btn disabled={!picked} loading={loading} onClick={next}>{locked?'Continuer →':'Confirmer →'}</Btn></div>
    </div>
  )
}

function ObAge({ go, user, save }: any) {
  const locked = !!user?.age
  const [val,setVal]=useState(''); const [loading,setLoading]=useState(false)
  const age=locked?user.age:(val?Math.floor((Date.now()-new Date(val).getTime())/(365.25*24*3600*1000)):null)
  const valid=locked||(!!age&&age>=18&&age<=80)
  const next=async()=>{
    if(locked){go('ob-photo');return}
    if(!valid)return;setLoading(true);await supabase.from('profiles').upsert({id:user.id,age});save({age});go('ob-photo');setLoading(false)
  }
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'40px 24px 32px', gap:24, background:C.bg }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <button onClick={()=>go('ob-gender')} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:C.textMid, padding:0 }}>←</button>
        <ProgressBar step={3} total={5}/>
      </div>
      <div>
        <p style={{ color:C.primary, fontSize:12, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>3 / 5</p>
        <h2 style={{ color:C.text, fontSize:26, fontWeight:800 }}>Ton âge</h2>
        {locked&&<p style={{ color:C.sage, fontSize:13, marginTop:4 }}>🔒 {user.age} ans · Non modifiable</p>}
      </div>
      {!locked&&<>
        <input type="date" value={val} onChange={e=>setVal(e.target.value)} style={{ width:'100%', background:C.bgDeep, border:`1.5px solid ${val?C.primary:C.border}`, borderRadius:14, padding:'14px 16px', color:C.text, fontSize:16, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}/>
        {age&&!valid&&<p style={{ color:C.red, fontSize:13 }}>18 ans minimum requis.</p>}
        {valid&&!locked&&<p style={{ color:C.sage, fontSize:14, fontWeight:600 }}>✓ {age} ans</p>}
      </>}
      <div style={{ marginTop:'auto' }}><Btn disabled={!valid} loading={loading} onClick={next}>{locked?'Continuer →':'Confirmer →'}</Btn></div>
    </div>
  )
}

function ObPhoto({ go, user, save }: any) {
  const [preview,setPreview]=useState<string|null>(null); const [loading,setLoading]=useState(false); const ref=useRef<HTMLInputElement>(null)
  const onChange=(e: React.ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>setPreview(ev.target?.result as string);r.readAsDataURL(f)}
  const next=async()=>{
    setLoading(true)
    try{const file=ref.current?.files?.[0];if(file){const ext=file.name.split('.').pop();const path=`${user.id}/avatar.${ext}`;await supabase.storage.from('avatars').upload(path,file,{upsert:true});const {data:{publicUrl}}=supabase.storage.from('avatars').getPublicUrl(path);await supabase.from('profiles').upsert({id:user.id,photo_url:publicUrl});save({photo_url:publicUrl})}}catch(e){console.error(e)}
    go('ob-interests');setLoading(false)
  }
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'40px 24px 32px', gap:24, background:C.bg }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <button onClick={()=>go('ob-age')} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:C.textMid, padding:0 }}>←</button>
        <ProgressBar step={4} total={5}/>
      </div>
      <div><p style={{ color:C.primary, fontSize:12, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>4 / 5</p><h2 style={{ color:C.text, fontSize:26, fontWeight:800 }}>Ta photo</h2><p style={{ color:C.textMid, fontSize:14, marginTop:6 }}>4× plus de clutches avec une vraie photo.</p></div>
      <input ref={ref} type="file" accept="image/*" onChange={onChange} style={{ display:'none' }}/>
      <div onClick={()=>ref.current?.click()} style={{ alignSelf:'center', width:140, height:140, borderRadius:'50%', overflow:'hidden', background:preview?`url(${preview}) center/cover no-repeat`:C.bgDeep, border:`3px dashed ${preview?C.primary:C.border}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, cursor:'pointer' }}>
        {!preview&&<><span style={{ fontSize:40 }}>📷</span><span style={{ color:C.textLight, fontSize:12, textAlign:'center' }}>Appuyer</span></>}
      </div>
      {preview&&<p style={{ textAlign:'center', color:C.sage, fontSize:14, fontWeight:600 }}>✓ Parfait !</p>}
      <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', gap:10 }}>
        <Btn loading={loading} onClick={next}>{preview?'Sauvegarder →':'Passer pour l\'instant'}</Btn>
      </div>
    </div>
  )
}

function ObInterests({ go, user, save }: any) {
  const [sel,setSel]=useState<string[]>(user?.interests||[]); const [loading,setLoading]=useState(false)
  const toggle=(i:string)=>setSel(p=>p.includes(i)?p.filter(x=>x!==i):p.length<5?[...p,i]:p)
  const next=async()=>{if(sel.length<3)return;setLoading(true);await supabase.from('profiles').upsert({id:user.id,interests:sel});save({interests:sel});go('ob-done');setLoading(false)}
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'24px 20px 20px', gap:10, background:C.bg, minHeight:0 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <button onClick={()=>go('ob-photo')} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:C.textMid, padding:0 }}>←</button>
        <ProgressBar step={5} total={5}/>
      </div>
      <div style={{ padding:'0 4px', flexShrink:0 }}>
        <p style={{ color:C.primary, fontSize:12, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>5 / 5</p>
        <h2 style={{ color:C.text, fontSize:22, fontWeight:800 }}>Tes passions <span style={{ fontSize:13, color:C.textLight, fontWeight:500 }}>({sel.length}/5)</span></h2>
        <p style={{ color:C.textMid, fontSize:13, marginTop:2 }}>Choisis 3 à 5 passions.</p>
      </div>
      <div style={{ flex:1, minHeight:0, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y', display:'flex', flexDirection:'column', gap:12 }}>
        {INTERESTS_CATS.map(cat=>(
          <div key={cat.label}>
            <p style={{ fontSize:11, fontWeight:700, color:C.textLight, letterSpacing:'0.08em', padding:'0 4px 8px' }}>{cat.icon} {cat.label.toUpperCase()}</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {cat.items.map(item=>{const active=sel.includes(item);const disabled=!active&&sel.length>=5;return(
                <button key={item} onClick={()=>toggle(item)} style={{ padding:'6px 14px', borderRadius:20, fontSize:13, border:'none', cursor:disabled?'not-allowed':'pointer', background:active?C.primary:C.bgDeep, color:active?'#fff':C.textMid, opacity:disabled?.4:1, fontFamily:'inherit', fontWeight:500 }}>{item}</button>
              )})}
            </div>
          </div>
        ))}
      </div>
      <Btn disabled={sel.length<3} loading={loading} onClick={next}>Terminer ✓</Btn>
    </div>
  )
}

function ObDone({ go, user }: any) {
  useEffect(() => {
    if (user?.id) localStorage.setItem('ob_'+user.id, '1')
  }, [user?.id])
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:`linear-gradient(160deg,${C.bg},${C.primaryLight})`, padding:40, gap:24, textAlign:'center' }}>
      <div style={{ fontSize:72 }}>🎉</div>
      <div><h2 style={{ fontSize:26, fontWeight:800, color:C.text }}>Bienvenue, {user?.name} !</h2><p style={{ color:C.textMid, marginTop:10, lineHeight:1.6 }}>Ton profil est prêt 😊</p></div>
      <div style={{ background:C.sageLight, border:`1px solid ${C.sage}44`, borderRadius:16, padding:16, width:'100%' }}>
        <p style={{ fontSize:13, color:C.sage, fontWeight:600 }}>✓ Profil créé avec succès dans la bêta Lausanne</p>
      </div>
      {/* Gate : nouveaux utilisateurs doivent se mettre disponibles avant Discover */}
      <Btn onClick={()=>go('set-avail')}>Me mettre disponible ✦</Btn>
    </div>
  )
}

// ─── DISCOVER = GRILLE 2 COLONNES ─────────────────────────────────────────────
function Discover({ profiles, user, onSelect, go, refresh }: any) {
  const [showAll, setShowAll] = useState(false)
  const [kmFilter, setKmFilter] = useState<number>(25) // 25km = pas de filtre en beta
  const hasGPS = !!(user?.lat && user?.lng)
  const now = new Date()
  const activeProfiles = profiles.filter((p: Profile) => {
    if (!p.is_available) return false
    if (p.available_until) {
      const until = new Date(p.available_until)
      if (!isNaN(until.getTime()) && until < now) return false
    }
    // Filtre distance GPS
    if (hasGPS && (p as any).lat && (p as any).lng && kmFilter < 25) {
      const d = distKm(user.lat, user.lng, (p as any).lat, (p as any).lng)
      if (d > kmFilter) return false
    }
    return true
  })
  const displayed = showAll ? profiles : activeProfiles

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:C.bgDeep, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y' }}>
      <div style={{ padding:'12px 16px 8px', display:'flex', justifyContent:'space-between', alignItems:'center', background:C.bg, borderBottom:`1px solid ${C.border}`, position:'sticky', top:0, zIndex:5 }}>
        <div>
          <a href="/" style={{ fontSize:18, fontWeight:900, letterSpacing:'-0.05em', color:C.text, textDecoration:'none' }}>CLUTCH <span style={{ fontSize:10, background:C.primaryLight, color:C.primary, padding:'2px 7px', borderRadius:7, fontWeight:700, letterSpacing:0 }}>BÊTA</span></a>
          <p style={{ fontSize:10, color:C.textLight, fontWeight:600, marginTop:1 }}>{displayed.length} profil{displayed.length>1?'s':''} {showAll?'au total':'disponible'}{displayed.length>1&&!showAll?'s':''}</p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={()=>{refresh&&refresh()}} style={{ fontSize:14, background:'none', border:'none', cursor:'pointer', color:C.textLight, padding:'4px 6px' }} title="Rafraîchir">↻</button>
          {hasGPS && (
            <div style={{ display:'flex', alignItems:'center', gap:5, background:C.bgDeep, borderRadius:10, padding:'4px 8px' }}>
              <span style={{ fontSize:10, color:C.textLight }}>📍</span>
              <input type="range" min={1} max={25} value={kmFilter} onChange={e=>setKmFilter(Number(e.target.value))}
                style={{ width:56, accentColor:C.primary, cursor:'pointer' }}/>
              <span style={{ fontSize:10, fontWeight:700, color:C.primary, minWidth:28 }}>{kmFilter<25?`${kmFilter}km`:'∞'}</span>
            </div>
          )}
          <button onClick={()=>setShowAll(s=>!s)} style={{ fontSize:11, background:showAll?C.bgDeep:C.primaryLight, color:showAll?C.textLight:C.primary, padding:'5px 10px', borderRadius:10, border:'none', cursor:'pointer', fontWeight:600, fontFamily:'inherit' }}>
            {showAll?'Tous':'Disponibles'}
          </button>
          <button onClick={()=>go('sos')} style={{ background:C.redLight, border:'none', borderRadius:14, padding:'5px 11px', cursor:'pointer', color:C.red, fontWeight:700, fontSize:12, fontFamily:'inherit' }}>SOS</button>
        </div>
      </div>

      <div style={{ padding:'10px 12px 12px' }}>
        {displayed.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:20, textAlign:'center', padding:32 }}>
            <div style={{ fontSize:56 }}>🌿</div>
            <h2 style={{ fontSize:20, fontWeight:800, color:C.text }}>Pas encore de profils {showAll?'':'disponibles'}</h2>
            <p style={{ color:C.textMid, lineHeight:1.6, fontSize:14 }}>
              {showAll ? 'Soyez les premiers bêta-testeurs à Lausanne !' : 'Personne n\'est dispo pour l\'instant. Reviens plus tard ou active "Tous".'}
            </p>
            {showAll && <a href="/demo" style={{ display:'block', padding:'12px 24px', borderRadius:14, background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`, color:'#fff', fontWeight:700, fontSize:14, textDecoration:'none' }}>👁 Voir la démo →</a>}
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {displayed.map((p: Profile) => {
              const myInterests: string[] = user?.interests || []
              const common = (p.interests||[]).filter((i:string)=>myInterests.includes(i)).length
              const relScore = p.reliability_score || 100
              const relStars = Math.round((relScore / 100) * 5)
              const isAvailNow = p.is_available && (!p.available_from || new Date(p.available_from) <= new Date())
              const hasEvent = (p as any).has_event || false
              return (
                <button key={p.id} onClick={()=>{ onSelect(p); go('profile-detail') }}
                  style={{ width:'100%', background:C.card, border:`1px solid ${hasEvent ? C.peach : C.border}`, borderRadius:16,
                    display:'flex', gap:0, cursor:'pointer', textAlign:'left', overflow:'hidden',
                    boxShadow: hasEvent ? `0 2px 12px ${C.peach}44` : `0 1px 6px ${C.shadow}` }}>
                  {/* Photo */}
                  <div style={{ position:'relative', width:88, height:108, flexShrink:0 }}>
                    {p.photo_url
                      ? <img src={p.photo_url} alt="" style={{ width:88, height:108, objectFit:'cover' }}/>
                      : <div style={{ width:88, height:108, background:`linear-gradient(135deg,${C.primary},${C.peach})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:30 }}>☕</div>
                    }
                    {isAvailNow && (
                      <div style={{ position:'absolute', bottom:7, right:7, width:12, height:12, borderRadius:'50%', background:'#22c55e', border:'2px solid #fff', boxShadow:'0 0 0 3px #22c55e33' }}/>
                    )}
                    {(p as any).certified && (
                      <div style={{ position:'absolute', top:6, left:6, background:'rgba(255,255,255,0.95)', borderRadius:8, padding:'1px 5px', fontSize:9, fontWeight:700, color:C.gold }}>✓ certifié</div>
                    )}
                    {hasEvent && (
                      <div style={{ position:'absolute', bottom:7, left:7, background:C.peach, borderRadius:8, padding:'2px 5px', fontSize:10, fontWeight:800, color:'#fff' }}>🗓</div>
                    )}
                  </div>
                  {/* Contenu */}
                  <div style={{ flex:1, padding:'10px 12px', minWidth:0, display:'flex', flexDirection:'column', gap:3 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <span style={{ fontWeight:800, fontSize:15, color:C.text, lineHeight:1.2 }}>{p.name}{p.age?`, ${p.age}`:''}</span>
                      {hasEvent && <span style={{ fontSize:9, background:C.peachLight, color:C.peach, padding:'2px 6px', borderRadius:6, fontWeight:700, flexShrink:0 }}>🗓 Propose un event</span>}
                    </div>
                    <p style={{ fontSize:11, color:C.textLight, lineHeight:1.3 }}>
                      📍 {p.neighborhood||'Lausanne'}
                      {user?.lat&&user?.lng&&(p as any).lat&&(p as any).lng ? ` · ${fmtDist(distKm(user.lat,user.lng,(p as any).lat,(p as any).lng))}` : ''}
                      {isAvailNow ? ' · maintenant' : p.available_from ? ` · dès ${fmtDate(p.available_from)}` : ''}
                      {p.available_until ? ` → ${fmtIsoTime(p.available_until, true)}` : ''}
                    </p>
                    {/* Étoiles fiabilité */}
                    <div style={{ display:'flex', alignItems:'center', gap:2 }}>
                      {[1,2,3,4,5].map(i=>(
                        <span key={i} style={{ fontSize:11, color: i<=relStars ? C.primary : C.border }}>{i<=relStars?'★':'☆'}</span>
                      ))}
                      <span style={{ fontSize:9, color:C.textLight, marginLeft:3 }}>fiabilité</span>
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:1 }}>
                      {(p.available_modes||[]).map((m:string)=>{
                        const mode=AVAIL_MODES.find(x=>x.id===m)
                        return mode?<span key={m} style={{ fontSize:10, background:m==='rencontre'?C.primaryLight:m==='professionnel'?'#E8F0FE':C.sageLight, color:m==='rencontre'?C.primary:m==='professionnel'?'#1a73e8':C.sage, padding:'1px 6px', borderRadius:6, fontWeight:700 }}>{mode.label}</span>:null
                      })}
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                      {(p.interests||[]).slice(0,3).map((i:string)=>{
                        const isCommon = myInterests.includes(i)
                        return <span key={i} style={{ fontSize:10, background:isCommon?C.primaryLight:C.bgDeep, color:isCommon?C.primary:C.textMid, padding:'2px 7px', borderRadius:7, fontWeight:isCommon?700:400 }}>{i}</span>
                      })}
                      {common > 0 && <span style={{ fontSize:10, color:C.primary, fontWeight:700 }}>+{common} en commun</span>}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── PROFILE DETAIL ───────────────────────────────────────────────────────────
function ProfileDetail({ profile, go, currentUser }: { profile: Profile|null; go:(s:Screen)=>void; currentUser:any }) {
  const [reporting, setReporting] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDone, setReportDone] = useState(false)
  const [blocked, setBlocked] = useState(false)

  const sendReport = async () => {
    if (!reportReason || !profile?.id || !currentUser?.id) return
    await supabase.from('reports').insert({ reported_id: profile.id, reporter_id: currentUser.id, reason: reportReason })
    setReportDone(true)
  }

  const blockUser = async () => {
    if (!profile?.id || !currentUser?.id) return
    await supabase.from('blocks').insert({ blocker_id: currentUser.id, blocked_id: profile.id }).select()
    setBlocked(true)
    setTimeout(() => go('discover'), 1500)
  }

  if (!profile) return null
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:C.bg, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y' }}>
      <div style={{ position:'relative' }}>
        {profile.photo_url
          ? <img src={profile.photo_url} alt="" style={{ width:'100%', height:300, objectFit:'cover', objectPosition:(profile as any).photo_pos||'center top' }}/>
          : <div style={{ width:'100%', height:220, background:`linear-gradient(135deg,${C.primary},${C.peach})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:72 }}>☕</div>
        }
        <button onClick={()=>go('discover')} style={{ position:'absolute', top:16, left:16, width:38, height:38, borderRadius:'50%', background:'rgba(255,255,255,0.92)', border:'none', fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>←</button>
        <div style={{ position:'absolute', top:16, right:16, display:'flex', gap:8 }}>
          <button onClick={()=>shareIt({ title:`${profile.name} sur Clutch`, text:`Regarde le profil de ${profile.name} sur Clutch Lausanne ☕`, url:APP_URL+'/app' })} style={{ width:38, height:38, borderRadius:'50%', background:'rgba(255,255,255,0.92)', border:'none', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>↗</button>
          <button onClick={()=>setReporting(true)} style={{ width:38, height:38, borderRadius:'50%', background:'rgba(255,255,255,0.92)', border:'none', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }} title="Signaler">🚩</button>
          <button onClick={async()=>{ if(!confirm(`Bloquer ${profile.name} ? Il/elle ne te verra plus dans Discover.`)) return; await supabase.from('blocks').insert({ blocker_id: currentUser.id, blocked_id: profile.id }).then(()=>{}); go('discover') }} style={{ width:38, height:38, borderRadius:'50%', background:'rgba(255,255,255,0.92)', border:'none', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }} title="Bloquer">🚫</button>
        </div>
      </div>
      <div style={{ padding:20, display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h2 style={{ fontSize:24, fontWeight:800, color:C.text }}>{profile.name}, {profile.age}</h2>
            <p style={{ color:C.textLight, fontSize:13 }}>📍 {profile.neighborhood||'Lausanne'}{profile.job?` · ${profile.job}`:''}</p>
          </div>
          <span style={{ fontSize:11, background:profile.is_available?C.sageLight:C.bgDeep, color:profile.is_available?C.sage:C.textLight, padding:'4px 10px', borderRadius:12, fontWeight:600 }}>
            {profile.is_available?'● Disponible':'○ Pas dispo'}
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <ReliabilityStars score={profile.reliability_score||100}/>
          <span style={{ fontSize:11, background:C.bgDeep, color:C.textLight, padding:'2px 8px', borderRadius:8, fontWeight:600 }}>{profile.badge||'Nouveau'}</span>
        </div>
        {profile.bio&&<p style={{ color:C.textMid, lineHeight:1.65, fontSize:14 }}>{profile.bio}</p>}
        {(profile.interests||[]).length>0&&(
          <div>
            <p style={{ fontWeight:700, fontSize:13, color:C.text, marginBottom:8 }}>Passions</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {(profile.interests||[]).map((i:string)=><span key={i} style={{ padding:'6px 14px', borderRadius:20, fontSize:13, background:C.bgDeep, color:C.textMid, fontWeight:500 }}>{i}</span>)}
            </div>
          </div>
        )}
      </div>
      <div style={{ padding:'0 20px 32px', display:'flex', flexDirection:'column', gap:10 }}>
        {profile.is_available
          ? <button onClick={()=>go('propose')} style={{ padding:'16px', borderRadius:16, border:'none', background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`, color:'#fff', fontWeight:800, fontSize:17, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              ☕ Clutcher {profile.name}
            </button>
          : <div style={{ padding:14, borderRadius:14, background:C.bgDeep, textAlign:'center', fontSize:14, color:C.textLight }}>
              {profile.name} n'est pas disponible pour l'instant
            </div>
        }
        <Btn variant="ghost" onClick={()=>go('discover')}>← Retour à la liste</Btn>
      </div>

      {/* Modal signalement */}
      {reporting && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:999, display:'flex', alignItems:'flex-end', justifyContent:'center' }} onClick={()=>{if(!reportDone)setReporting(false)}}>
          <div style={{ background:'#fff', borderRadius:'20px 20px 0 0', padding:'24px 20px 36px', width:'100%', maxWidth:390 }} onClick={e=>e.stopPropagation()}>
            {reportDone ? (
              <div style={{ textAlign:'center', padding:'16px 0' }}>
                <p style={{ fontSize:32, marginBottom:12 }}>✅</p>
                <p style={{ fontWeight:700, color:C.text, fontSize:16 }}>Signalement envoyé</p>
                <p style={{ color:C.textMid, fontSize:13, marginTop:6 }}>L'équipe Clutch examinera le profil sous 24h.</p>
                <button onClick={()=>{setReporting(false);setReportDone(false)}} style={{ marginTop:16, padding:'10px 24px', borderRadius:12, border:'none', background:C.bgDeep, color:C.textMid, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>Fermer</button>
              </div>
            ) : (
              <>
                <div style={{ width:36, height:4, borderRadius:2, background:'#ddd', margin:'0 auto 20px' }}/>
                <p style={{ fontWeight:800, color:C.text, fontSize:16, marginBottom:4 }}>🚩 Signaler ce profil</p>
                <p style={{ color:C.textMid, fontSize:13, marginBottom:16 }}>Quelle est la raison ?</p>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {['Photo inappropriée ou fausse','Comportement harcelant','Profil fake / bot','Contenu offensant','Mineur·e','Autre raison'].map(r=>(
                    <button key={r} onClick={()=>setReportReason(r)} style={{ padding:'11px 14px', borderRadius:12, border:`1.5px solid ${reportReason===r?C.red:C.border}`, background:reportReason===r?C.redLight:'transparent', color:reportReason===r?C.red:C.textMid, fontSize:13, fontWeight:reportReason===r?700:400, textAlign:'left', cursor:'pointer', fontFamily:'inherit' }}>{r}</button>
                  ))}
                </div>
                <div style={{ display:'flex', gap:10, marginTop:16 }}>
                  <button onClick={()=>setReporting(false)} style={{ flex:1, padding:12, borderRadius:12, border:`1px solid ${C.border}`, background:'none', color:C.textMid, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Annuler</button>
                  <button onClick={sendReport} disabled={!reportReason} style={{ flex:2, padding:12, borderRadius:12, border:'none', background:reportReason?C.red:C.bgDeep, color:reportReason?'#fff':C.textLight, fontSize:13, fontWeight:700, cursor:reportReason?'pointer':'not-allowed', fontFamily:'inherit' }}>Envoyer le signalement</button>
                </div>
                <button onClick={blockUser} style={{ width:'100%', marginTop:8, padding:'11px', borderRadius:12, border:`1.5px solid ${C.border}`, background:'none', color:C.textLight, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                  {blocked ? '✓ Utilisateur·ice bloqué·e' : '🚫 Bloquer cet·te utilisateur·ice'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── ÉCRAN DISPO OBLIGATOIRE — avec carte interactive ────────────────────────
// Justification : force l'engagement actif, réduit les voyeurs, différencie le premium
// GPS auto-detect → carte Leaflet → épingle déplaçable → rayon d'action
function SetAvail({ user, go, save, fromProfile }: any) {
  const [saving, setSaving] = useState(false)
  const [modes, setModes] = useState<string[]>(['rencontre'])
  const [fromTime, setFromTime] = useState('')   // '' = maintenant
  const [untilTime, setUntilTime] = useState('') // obligatoire
  const [lat, setLat] = useState(46.5197)
  const [lng, setLng] = useState(6.6323)
  const [cityLabel, setCityLabel] = useState('')
  const [radius, setRadius] = useState(1) // Audit: défaut 1km — spontanéité locale, user peut augmenter
  const [gpsLoading, setGpsLoading] = useState(true)
  const [citySearch, setCitySearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const mapDivRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const circleRef = useRef<any>(null)
  const timeSlots = genTimeSlotsAvail()
  const isPremium = ['premium','partner','admin'].includes(user?.account_type||'')
  const canConfirm = modes.length > 0 && !!untilTime && !saving

  const reverseGeocode = async (rlat: number, rlng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${rlat}&lon=${rlng}&accept-language=fr`)
      const data = await res.json()
      const addr = data.address || {}
      const city = addr.city || addr.town || addr.village || 'Lausanne'
      const suburb = addr.suburb || addr.neighbourhood || addr.district || ''
      setCityLabel(suburb ? `${city} (${suburb})` : city)
    } catch { setCityLabel('') }
  }

  const initMap = (initLat: number, initLng: number) => {
    if (!mapDivRef.current || mapRef.current) return
    const L = (window as any).L
    const map = L.map(mapDivRef.current, { zoomControl: false }).setView([initLat, initLng], 14)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OSM © CartoDB', maxZoom: 19, subdomains: 'abcd'
    }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // Marqueur personnalisé rose
    const icon = (L as any).divIcon({
      html: `<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:#C4748A;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);transform:rotate(-45deg)"></div>`,
      iconSize: [22, 22], iconAnchor: [11, 22], className: ''
    })

    const marker = L.marker([initLat, initLng], { draggable: true, icon }).addTo(map)
    const circle = L.circle([initLat, initLng], {
      radius: 5000, color: '#C4748A', fillColor: '#C4748A', fillOpacity: 0.12, weight: 2, dashArray: '5,5'
    }).addTo(map)

    const onMove = (newLat: number, newLng: number) => {
      setLat(newLat); setLng(newLng)
      circle.setLatLng([newLat, newLng])
      reverseGeocode(newLat, newLng)
    }

    marker.on('dragend', () => { const p = marker.getLatLng(); onMove(p.lat, p.lng) })
    map.on('click', (e: any) => { marker.setLatLng(e.latlng); onMove(e.latlng.lat, e.latlng.lng) })

    mapRef.current = map; markerRef.current = marker; circleRef.current = circle
  }

  // Charger Leaflet + GPS au montage
  useEffect(() => {
    if (typeof window === 'undefined') return
    const loadLeaflet = (cb: () => void) => {
      if ((window as any).L) { cb(); return }
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = cb
      document.body.appendChild(script)
    }
    loadLeaflet(() => {
      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          setLat(latitude); setLng(longitude); setGpsLoading(false)
          initMap(latitude, longitude)
          reverseGeocode(latitude, longitude)
        },
        () => { setGpsLoading(false); initMap(46.5197, 6.6323); setCityLabel('Lausanne') },
        { timeout: 7000, enableHighAccuracy: false }
      )
    })
    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markerRef.current = null; circleRef.current = null }
    }
  }, [])

  // Mettre à jour le rayon + adapter la vue exactement au cercle via fitBounds
  useEffect(() => {
    if (!circleRef.current || !mapRef.current) return
    circleRef.current.setRadius(radius * 1000)
    // fitBounds > setZoom : s'adapte précisément au cercle dessiné
    setTimeout(() => {
      if (circleRef.current && mapRef.current)
        mapRef.current.fitBounds(circleRef.current.getBounds(), { padding: [20, 20], animate: false })
    }, 50)
  }, [radius])

  const searchCity = async () => {
    if (citySearch.length < 2) return
    setSearching(true); setSearchResults([])
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(citySearch)}&countrycodes=ch,fr,de,it,be&limit=5&accept-language=fr`)
      setSearchResults(await res.json())
    } catch {}
    setSearching(false)
  }

  const selectResult = (r: any) => {
    const rlat = parseFloat(r.lat), rlng = parseFloat(r.lon)
    setLat(rlat); setLng(rlng)
    setCityLabel(r.display_name.split(',').slice(0,2).join(',').trim())
    setCitySearch(''); setSearchResults([])
    if (mapRef.current && markerRef.current && circleRef.current) {
      markerRef.current.setLatLng([rlat, rlng])
      circleRef.current.setLatLng([rlat, rlng])
      mapRef.current.setView([rlat, rlng], 14)
    }
  }

  const confirm = async () => {
    if (!canConfirm) return
    setSaving(true)
    const fromIso = fromTime || new Date().toISOString()
    const maxUntil = new Date(Date.now() + 18 * 3600000).toISOString()
    const untilIso = untilTime < maxUntil ? untilTime : maxUntil
    await supabase.from('profiles').update({
      is_available: true, available_city: cityLabel || 'Lausanne',
      available_from: fromIso, available_until: untilIso,
      available_modes: modes, lat, lng, available_radius: radius
    }).eq('id', user.id)
    save({ is_available: true, available_city: cityLabel || 'Lausanne', available_from: fromIso, available_until: untilIso, available_modes: modes, lat, lng, available_radius: radius })
    setSaving(false)
    go(fromProfile ? 'myprofile' : 'discover')
  }

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:C.bg, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y' }}>

      {/* En-tête avec explication */}
      <div style={{ background:`linear-gradient(135deg,${C.primaryLight},${C.peachLight})`, flexShrink:0 }}>
        <div style={{ padding:'14px 16px 10px', display:'flex', alignItems:'flex-start', gap:12 }}>
          <button onClick={()=>go('myprofile')} style={{ background:'rgba(255,255,255,0.7)', border:'none', borderRadius:'50%', width:34, height:34, fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>←</button>
          <div>
            <h2 style={{ fontSize:18, fontWeight:900, color:C.text, letterSpacing:'-0.03em' }}>📍 Où veux-tu te retrouver ?</h2>
            <p style={{ fontSize:12, color:C.textMid, marginTop:2 }}>Déplace l'épingle et choisis ton rayon et tes horaires.</p>
          </div>
        </div>
        {/* Explication du principe Clutch */}
        <div style={{ margin:'0 14px 10px', background:'rgba(255,255,255,0.75)', borderRadius:12, padding:'10px 14px', display:'flex', gap:10, alignItems:'flex-start', backdropFilter:'blur(8px)' }}>
          <span style={{ fontSize:20, flexShrink:0 }}>☕</span>
          <p style={{ fontSize:12, color:C.textMid, lineHeight:1.5 }}>
            <strong style={{ color:C.text }}>Clutch fonctionne par réciprocité.</strong> Pour voir qui est disponible autour de toi, tu dois d'abord te montrer disponible toi aussi. Pas de voyeurs — que des gens vraiment là.
          </p>
        </div>
      </div>

      {/* Recherche ville */}
      <div style={{ padding:'10px 14px 6px', display:'flex', gap:8 }}>
        <input value={citySearch} onChange={e => setCitySearch(e.target.value)}
          onKeyDown={e => e.key==='Enter' && searchCity()}
          placeholder="Rechercher une ville, quartier…"
          style={{ flex:1, padding:'9px 13px', borderRadius:12, border:`1.5px solid ${C.border}`, fontSize:13, color:C.text, background:C.bg, outline:'none', fontFamily:'inherit' }}/>
        <button onClick={searchCity} disabled={searching} style={{ padding:'9px 14px', borderRadius:12, border:'none', background:C.primary, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>
          {searching?'⏳':'🔍'}
        </button>
      </div>

      {/* Résultats recherche */}
      {searchResults.length>0 && (
        <div style={{ margin:'0 14px 6px', background:C.card, borderRadius:12, border:`1px solid ${C.border}`, overflow:'hidden', zIndex:100, position:'relative' }}>
          {searchResults.map((r:any, i:number) => (
            <button key={i} onClick={()=>selectResult(r)} style={{ width:'100%', padding:'9px 13px', textAlign:'left', background:'none', border:'none', borderTop:i>0?`1px solid ${C.border}`:'none', cursor:'pointer', fontFamily:'inherit', fontSize:13, color:C.text }}>
              📍 {r.display_name.split(',').slice(0,3).join(',')}
            </button>
          ))}
        </div>
      )}

      {/* Carte */}
      <div style={{ position:'relative', margin:'0 14px 0' }}>
        {gpsLoading && (
          <div style={{ position:'absolute', inset:0, zIndex:10, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(245,240,234,0.9)', borderRadius:14 }}>
            <p style={{ fontSize:13, color:C.textMid, fontWeight:600 }}>📍 Localisation en cours…</p>
          </div>
        )}
        <div ref={mapDivRef} style={{ height:200, borderRadius:14, overflow:'hidden', border:`1px solid ${C.border}` }}/>
        {cityLabel && (
          <div style={{ position:'absolute', bottom:8, left:8, right:8, background:'rgba(255,255,255,0.95)', borderRadius:10, padding:'5px 10px', fontSize:12, fontWeight:700, color:C.text, boxShadow:'0 2px 8px rgba(0,0,0,0.12)', pointerEvents:'none' }}>
            📍 {cityLabel}
          </div>
        )}
      </div>

      {/* Rayon */}
      <div style={{ padding:'10px 14px 0' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
          <p style={{ fontSize:12, fontWeight:700, color:C.text }}>Rayon d'action</p>
          <span style={{ fontSize:14, fontWeight:900, color:C.primary }}>{radius} km</span>
        </div>
        <input type="range" min={1} max={25} value={radius} onChange={e=>setRadius(Number(e.target.value))}
          style={{ width:'100%', accentColor:C.primary, cursor:'pointer' }}/>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:-2 }}>
          <span style={{ fontSize:10, color:C.textLight }}>1 km</span>
          <span style={{ fontSize:10, color:C.textLight }}>25 km</span>
        </div>
      </div>

      {/* Horaires (côte à côte) */}
      <div style={{ padding:'10px 14px 0', display:'flex', gap:10 }}>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:5 }}>⏰ À partir de</p>
          <select value={fromTime} onChange={e=>setFromTime(e.target.value)}
            style={{ width:'100%', padding:'8px 9px', borderRadius:10, border:`1.5px solid ${C.border}`, background:C.bg, color:C.text, fontSize:12, fontFamily:'inherit', outline:'none' }}>
            <option value="">Maintenant</option>
            {timeSlots.map(t=><option key={t.iso} value={t.iso}>{t.label}</option>)}
          </select>
        </div>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:5 }}>🔚 Jusqu'à <span style={{ color:C.red }}>*</span></p>
          <select value={untilTime} onChange={e=>setUntilTime(e.target.value)}
            style={{ width:'100%', padding:'8px 9px', borderRadius:10, border:`1.5px solid ${untilTime?C.border:C.red+'88'}`, background:C.bg, color:untilTime?C.text:C.textLight, fontSize:12, fontFamily:'inherit', outline:'none' }}>
            <option value="">Choisir…</option>
            {timeSlots.filter(t=>!fromTime||t.iso>fromTime).map(t=><option key={t.iso} value={t.iso}>{t.label}</option>)}
          </select>
        </div>
      </div>

      {/* Modes */}
      <div style={{ padding:'10px 14px 0' }}>
        <p style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:7 }}>🤝 Je suis là pour</p>
        <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
          {AVAIL_MODES.map(m=>(
            <button key={m.id} onClick={()=>setModes(p=>p.includes(m.id)?p.filter(x=>x!==m.id):[...p,m.id])}
              style={{ padding:'7px 13px', borderRadius:20, border:`1.5px solid ${modes.includes(m.id)?C.primary:C.border}`, background:modes.includes(m.id)?C.primaryLight:'none', color:modes.includes(m.id)?C.primary:C.textMid, fontSize:12, fontWeight:modes.includes(m.id)?700:400, cursor:'pointer', fontFamily:'inherit' }}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding:'14px 14px 36px', marginTop:'auto' }}>
        <button onClick={canConfirm?confirm:undefined} disabled={!canConfirm}
          style={{ width:'100%', padding:'15px', borderRadius:16, border:'none', background:canConfirm?`linear-gradient(135deg,${C.primary},${C.primaryDark})`:C.border, color:'#fff', fontWeight:800, fontSize:16, cursor:canConfirm?'pointer':'not-allowed', fontFamily:'inherit', boxShadow:canConfirm?`0 4px 20px ${C.primary}44`:'none', transition:'all 0.2s' }}>
          {saving?'⏳ Activation…':'✦ Je suis disponible'}
        </button>
        {!untilTime&&<p style={{ textAlign:'center', fontSize:11, color:C.red, marginTop:6 }}>Choisis une heure de fin pour continuer</p>}
        {isPremium&&(
          <button onClick={()=>go('discover')} style={{ display:'block', width:'100%', marginTop:10, background:'none', border:'none', color:C.textLight, fontSize:11, cursor:'pointer', fontFamily:'inherit', textAlign:'center' }}>
            💎 Passer (premium) →
          </button>
        )}
      </div>
    </div>
  )
}

// ─── PROPOSE FLOW ─────────────────────────────────────────────────────────────
function Propose({ profile, go, setVenue, setVenueInput, venueInput, selectedVenue, venueSafety, setVenueSafety }: any) {
  const [osmResults, setOsmResults] = useState<typeof VENUES>([])
  const [searching, setSearching] = useState(false)
  const searchTimer = useRef<any>(null)

  const pick = (v: typeof VENUES[0]) => {
    setVenueInput(v.name); setVenue(v.name); setVenueSafety(v.safety as any); setOsmResults([])
  }

  const handleInput = (val: string) => {
    setVenueInput(val); setVenue(''); setVenueSafety('safe'); setOsmResults([])
    clearTimeout(searchTimer.current)
    if (val.length >= 2) {
      setSearching(true)
      searchTimer.current = setTimeout(async () => {
        const local = VENUES.filter(v => v.name.toLowerCase().includes(val.toLowerCase()))
        const osm = local.length < 3 ? await searchOSMVenues(val) : []
        // merge, deduplicate by name
        const merged = [...local, ...osm.filter(o => !local.find(l => l.name === o.name))]
        setOsmResults(merged.slice(0, 6))
        setSearching(false)
      }, 400)
    }
  }

  const suggestions = venueInput.length < 1 ? VENUES.slice(0, 6) : osmResults

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:C.bg }}>
      <TopBar title={`Clutcher ${profile?.name||''}`} onBack={()=>go('profile-detail')}/>
      <div style={{ flex:1, minHeight:0, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y', padding:'12px 20px' }}>
        <p style={{ fontWeight:700, color:C.text, marginBottom:10 }}>📍 Où se retrouver ?</p>

        {/* Légende sécurité */}
        <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
          <span style={{ fontSize:10, padding:'2px 8px', borderRadius:8, background:C.sageLight, color:C.sage, fontWeight:600 }}>🛡 Certifié sûr</span>
          <span style={{ fontSize:10, padding:'2px 8px', borderRadius:8, background:'#FFF8DC', color:'#B8860B', fontWeight:600 }}>👁 Lieu public</span>
          <span style={{ fontSize:10, padding:'2px 8px', borderRadius:8, background:C.redLight, color:C.red, fontWeight:600 }}>⚠️ Prudence</span>
        </div>

        <input value={venueInput} onChange={e => handleInput(e.target.value)}
          placeholder="Tape le nom d'un café, bar, parc…"
          style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:`1.5px solid ${C.border}`, background:C.card, fontSize:14, color:C.text, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}/>

        {searching && <p style={{ fontSize:12, color:C.textLight, marginTop:6 }}>🔍 Recherche sur OpenStreetMap…</p>}

        {venueInput && !selectedVenue && suggestions.length > 0 && (
          <div style={{ marginTop:8, borderRadius:12, overflow:'hidden', border:`1px solid ${C.border}` }}>
            {suggestions.map((v, i) => (
              <button key={`${v.name}-${i}`} onClick={() => pick(v)} style={{ width:'100%', padding:'10px 14px', background:C.card, border:'none', borderBottom: i < suggestions.length-1 ? `1px solid ${C.border}` : 'none', textAlign:'left', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
                <div>
                  <span style={{ fontWeight:600, color:C.text, fontSize:13 }}>{v.emoji} {v.name}</span>
                  {v.neighborhood && <span style={{ fontSize:10, color:C.textLight, marginLeft:6 }}>{v.neighborhood}</span>}
                </div>
                <SafetyBadge safety={v.safety}/>
              </button>
            ))}
          </div>
        )}

        {selectedVenue && (
          <div style={{ marginTop:8, padding:'10px 14px', background:C.sageLight, borderRadius:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontWeight:600, color:C.text, fontSize:13 }}>✓ {selectedVenue}</span>
            <SafetyBadge safety={venueSafety}/>
          </div>
        )}

        <p style={{ fontWeight:700, color:C.text, margin:'20px 0 10px' }}>Suggestions rapides</p>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {VENUES.slice(0, 6).map(v => (
            <button key={v.name} onClick={() => pick(v)} style={{ padding:'11px 14px', background:C.card, border:`1.5px solid ${selectedVenue===v.name ? C.primary : C.border}`, borderRadius:12, textAlign:'left', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
              <div>
                <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{v.emoji} {v.name}</span>
                <span style={{ fontSize:10, color:C.textLight, marginLeft:6 }}>{v.neighborhood}</span>
              </div>
              <SafetyBadge safety={v.safety}/>
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding:'12px 20px 28px' }}>
        <Btn onClick={() => go('propose2')} disabled={!venueInput}>Choisir l'heure →</Btn>
      </div>
    </div>
  )
}

function Propose2({ profile, go, selectedTime, setSelectedTime, venueInput }: any) {
  const slots = getTimeSlots()
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:C.bg }}>
      <TopBar title="Quelle heure ?" onBack={()=>go('propose')}/>
      <div style={{ flex:1, minHeight:0, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y', padding:'12px 20px' }}>
        <div style={{ padding:'10px 14px', background:C.bgDeep, borderRadius:12, marginBottom:16 }}>
          <p style={{ fontSize:12, color:C.textLight }}>📍 {venueInput}</p>
        </div>
        <p style={{ color:C.textMid, fontSize:13, marginBottom:14, lineHeight:1.5 }}>RDV dans les <strong>18h max</strong>. Heure proposée :</p>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {slots.map((s,i)=>(
            <button key={i} onClick={()=>setSelectedTime(s.iso)} style={{ padding:'13px 16px', borderRadius:13, border:`2px solid ${selectedTime===s.iso?C.primary:C.border}`, background:selectedTime===s.iso?C.primaryLight:C.card, textAlign:'left', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontWeight:selectedTime===s.iso?700:500, color:C.text, fontSize:15 }}>🕐 {s.label.split(' (')[0]}</span>
              <span style={{ fontSize:12, color:C.textLight }}>{s.label.split('(')[1]?.replace(')','')}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding:'12px 20px 28px' }}>
        <Btn onClick={()=>go('propose3')} disabled={!selectedTime}>Écrire le message →</Btn>
      </div>
    </div>
  )
}

function Propose3({ profile, go, venueInput, selectedTime, message, setMessage, onSend, sending }: any) {
  const q = message.length>60?'excellent':message.length>30?'bien':message.length>10?'ok':'faible'
  const qColor = {excellent:C.sage,bien:C.peach,ok:C.gold,faible:C.textLight}[q]
  const canSend = message.trim().length >= 10 && !sending
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:C.bg }}>
      <TopBar title="Ton message" onBack={()=>go('propose2')}/>
      <div style={{ flex:1, minHeight:0, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y', padding:'12px 20px', display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ padding:'10px 14px', background:C.bgDeep, borderRadius:12 }}>
          <p style={{ fontSize:12, color:C.textLight, marginBottom:3 }}>Récap</p>
          <p style={{ fontWeight:700, color:C.text, fontSize:14 }}>📍 {venueInput} · 🕐 {fmtIsoTime(selectedTime||'')}</p>
        </div>
        <div>
          <p style={{ fontWeight:700, color:C.text, marginBottom:8 }}>Message pour {profile?.name}</p>
          <textarea value={message} onChange={e=>setMessage(e.target.value)}
            placeholder={`"Salut ${profile?.name||''} ! J'adorerais prendre un café — j'ai vu qu'on partage des intérêts communs. Tu es dispo ${fmtIsoTime(selectedTime||'')||''} ?"`}
            rows={5} maxLength={280}
            style={{ width:'100%', border:`1.5px solid ${C.border}`, borderRadius:14, padding:14, fontSize:14, background:C.card, color:C.text, fontFamily:'inherit', resize:'none', outline:'none', lineHeight:1.6, boxSizing:'border-box' }}/>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
            <span style={{ fontSize:12, color:qColor, fontWeight:600 }}>
              {q==='excellent'?'✨ Excellent !':q==='bien'?'👍 Bon':q==='ok'?'📝 Correct':'💡 Ajoute un peu plus…'}
            </span>
            <span style={{ fontSize:12, color:C.textLight }}>{message.length}/280</span>
          </div>
        </div>
        <div style={{ padding:12, background:C.peachLight, borderRadius:12 }}>
          <p style={{ fontSize:12, color:C.textMid, lineHeight:1.5 }}>💡 Les messages personnalisés ont <strong>3× plus</strong> de chance d'être acceptés.</p>
        </div>
      </div>
      <div style={{ padding:'12px 20px 28px' }}>
        <button onClick={canSend?onSend:undefined} disabled={!canSend} style={{ borderRadius:14, padding:'14px 20px', fontSize:15, fontWeight:700, cursor:canSend?'pointer':'not-allowed', border:'none', width:'100%', fontFamily:'inherit', background:canSend?`linear-gradient(135deg,${C.primary},${C.primaryDark})`:`${C.bgDeep}`, color:canSend?'#fff':C.textLight, opacity:sending?.7:1, letterSpacing:'-0.01em' }}>
          {sending?'Envoi…':'Envoyer le clutch ✦'}
        </button>
      </div>
    </div>
  )
}

function Sent({ profile, go, venueInput, selectedTime }: any) {
  const [countdown, setCountdown] = useState(7200)
  useEffect(()=>{ const t=setInterval(()=>setCountdown(c=>Math.max(0,c-1)),1000); return ()=>clearInterval(t) },[])
  const fmt=(s:number)=>`${Math.floor(s/3600)}h ${String(Math.floor((s%3600)/60)).padStart(2,'0')}m`
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:`linear-gradient(160deg,${C.bg},${C.primaryLight})`, padding:32, gap:20, textAlign:'center' }}>
      <div style={{ fontSize:64 }}>☕</div>
      <div><h2 style={{ fontSize:24, fontWeight:800, color:C.text }}>Clutch envoyé !</h2><p style={{ color:C.textMid, marginTop:8, lineHeight:1.6 }}>{profile?.name} a <strong>2h</strong> pour répondre.</p></div>
      <div style={{ background:C.card, borderRadius:18, padding:20, width:'100%', border:`1px solid ${C.border}` }}>
        <p style={{ fontSize:12, color:C.textLight, marginBottom:4 }}>📍 {venueInput} · {fmtIsoTime(selectedTime||'')}</p>
        <p style={{ fontSize:12, color:C.textLight, marginBottom:8 }}>Expire dans</p>
        <p style={{ fontSize:26, fontWeight:800, color:C.primary }}>{fmt(countdown)}</p>
      </div>
      <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:10 }}>
        <Btn onClick={()=>go('inbox')}>→ Voir mes messages</Btn>
        <Btn variant="secondary" onClick={()=>go('discover')}>Retour à la liste</Btn>
      </div>
    </div>
  )
}

// ─── EVENTS = LISTE COMPACTE (Supabase + fallback statique) ──────────────────
function Events({ user, go }: { user:any; go:(s:Screen)=>void }) {
  const [filter, setFilter] = useState('all')
  const [dbEvents, setDbEvents] = useState<any[]>([])
  const [myPending, setMyPending] = useState<any[]>([])
  const [registrations, setRegistrations] = useState<Record<string,number>>({}) // eventId → count
  const [myRegs, setMyRegs] = useState<Set<string>>(new Set()) // eventIds où je suis inscrit
  const [regLoading, setRegLoading] = useState<string|null>(null)

  const loadRegs = async () => {
    const { data } = await supabase.from('event_registrations').select('event_id,user_id')
    if (!data) return
    const counts: Record<string,number> = {}
    const mine = new Set<string>()
    data.forEach((r:any) => {
      counts[r.event_id] = (counts[r.event_id]||0) + 1
      if (r.user_id === user?.id) mine.add(r.event_id)
    })
    setRegistrations(counts)
    setMyRegs(mine)
  }

  const toggleReg = async (eventId: string) => {
    if (!user?.id) return
    setRegLoading(eventId)
    if (myRegs.has(eventId)) {
      await supabase.from('event_registrations').delete().eq('event_id',eventId).eq('user_id',user.id)
    } else {
      await supabase.from('event_registrations').insert({ event_id:eventId, user_id:user.id })
    }
    await loadRegs()
    setRegLoading(null)
  }

  useEffect(()=>{
    supabase.from('events').select('*,creator:profiles(name,photo_url)')
      .eq('status','approved').order('created_at',{ascending:false})
      .then(({data})=>{ if(data) setDbEvents(data) })
    if(user?.id) supabase.from('events').select('*').eq('created_by',user.id).eq('status','pending')
      .then(({data})=>{ if(data) setMyPending(data) })
    loadRegs()
  },[user?.id])

  const allEvents = dbEvents.map(e=>({...e, color:e.type==='clutch'?C.primary:e.type==='partner'?C.sage:C.peach}))
  const filtered = allEvents.filter(e=>filter==='all'||e.type===filter)

  const badgeColor = (type:string) => type==='clutch'?C.primary:type==='partner'?C.sage:C.peach
  const badgeLabel = (type:string) => type==='clutch'?'✦ Clutch':type==='partner'?'🤝 Partenaire':'👥 Communauté'

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:C.bg, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y' }}>
      <div style={{ padding:'12px 16px 8px', borderBottom:`1px solid ${C.border}`, position:'sticky', top:0, background:C.bg, zIndex:5 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <h2 style={{ fontSize:19, fontWeight:800, color:C.text }}>Événements <span style={{ fontSize:10, background:C.bgDeep, color:C.textLight, padding:'2px 7px', borderRadius:7, fontWeight:600 }}>Lausanne</span></h2>
          <div style={{ display:'flex', gap:6 }}>
            {myPending.length>0&&<button onClick={()=>go('my-events')} style={{ background:C.peachLight, border:`1px solid ${C.peach}44`, borderRadius:14, padding:'5px 10px', color:C.peach, fontWeight:700, fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>⏳ {myPending.length} en attente</button>}
            <button onClick={()=>{
              const canCreate = user?.certified || ['partner','admin'].includes(user?.account_type||'')
              if(!canCreate){ alert('🔒 Seuls les profils certifiés peuvent créer des événements.\n\nVa dans ton profil → "Me faire certifier" pour vérifier ton identité.'); return }
              go('create-event')
            }} style={{ background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`, border:'none', borderRadius:14, padding:'5px 12px', color:'#fff', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>+ Créer</button>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:2 }}>
          {[{id:'all',label:'Tous'},{id:'clutch',label:'✦ Clutch'},{id:'partner',label:'🤝 Partenaires'},{id:'user',label:'👥 Communauté'}].map(f=>(
            <button key={f.id} onClick={()=>setFilter(f.id)} style={{ padding:'5px 12px', borderRadius:20, fontSize:11, border:'none', cursor:'pointer', fontWeight:600, background:filter===f.id?C.primary:C.bgDeep, color:filter===f.id?'#fff':C.textMid, whiteSpace:'nowrap', fontFamily:'inherit' }}>{f.label}</button>
          ))}
        </div>
      </div>
      <div style={{ padding:'10px 12px 12px', display:'flex', flexDirection:'column', gap:8 }}>
        {filtered.map((ev,i)=>(
          <div key={`${ev.id}-${i}`} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden', boxShadow:`0 1px 6px ${C.shadow}`, display:'flex', minHeight:76 }}>
            {ev.photo
              ? <img src={ev.photo} alt="" style={{ width:76, height:76, objectFit:'cover', flexShrink:0 }}/>
              : <div style={{ width:76, height:76, background:`linear-gradient(135deg,${badgeColor(ev.type)}33,${badgeColor(ev.type)}55)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, flexShrink:0 }}>{ev.emoji||'📅'}</div>
            }
            <div style={{ padding:'10px 12px', flex:1, minWidth:0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:4, marginBottom:3 }}>
                <span style={{ fontSize:13, fontWeight:700, color:C.text, lineHeight:1.2 }}>{ev.emoji||''} {ev.title}</span>
                <span style={{ fontSize:9, padding:'2px 6px', borderRadius:6, background:`${badgeColor(ev.type)}18`, color:badgeColor(ev.type), fontWeight:700, whiteSpace:'nowrap', flexShrink:0 }}>{badgeLabel(ev.type)}</span>
              </div>
              <div style={{ fontSize:11, color:C.textLight, marginBottom:4 }}>📍 {ev.venue}</div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
                  <span style={{ fontSize:11, color:C.textMid }}>⏰ {ev.date||ev.date_label||'—'}</span>
                  {ev.flexible
                    ? <span style={{ fontSize:9, background:'#FFF8DC', color:'#B8860B', padding:'1px 6px', borderRadius:6, fontWeight:700 }}>🔄 Flexible</span>
                    : <span style={{ fontSize:9, background:C.bgDeep, color:C.textLight, padding:'1px 6px', borderRadius:6, fontWeight:700 }}>📌 Fixe</span>
                  }
                </div>
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  <span style={{ fontSize:12, fontWeight:700, color:badgeColor(ev.type) }}>{ev.price||'—'}</span>
                  <button onClick={()=>shareIt({
                    title: ev.title,
                    text: `${ev.emoji||'📅'} ${ev.title} — ${ev.venue} · ${ev.date||ev.date_label||''} · ${ev.price||''}\n\nVia Clutch Lausanne`,
                    url: APP_URL+'/app'
                  })} style={{ background:'none', border:'none', cursor:'pointer', fontSize:14, padding:'2px 4px' }}>↗</button>
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:4 }}>
                {ev.creator&&<div style={{ fontSize:10, color:C.textLight }}>par {ev.creator.name}</div>}
                <button onClick={e=>{e.stopPropagation();toggleReg(ev.id)}} disabled={regLoading===ev.id}
                  style={{ padding:'4px 10px', borderRadius:10, border:`1.5px solid ${myRegs.has(ev.id)?C.sage:C.primary}`, background:myRegs.has(ev.id)?C.sageLight:C.primaryLight, color:myRegs.has(ev.id)?C.sage:C.primary, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>
                  {regLoading===ev.id?'…':myRegs.has(ev.id)?`✓ Je viens (${registrations[ev.id]||1})`:`Je viens ${registrations[ev.id]?`(${registrations[ev.id]})`:''}`.trim()}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── CREATE EVENT ─────────────────────────────────────────────────────────────
function CreateEvent({ user, go }: { user:any; go:(s:Screen)=>void }) {
  const [type, setType] = useState<'user'|'clutch'|'partner'>('user')
  const [title, setTitle] = useState('')
  const [venue, setVenue] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('Gratuit')
  const [priceCustom, setPriceCustom] = useState('')
  const [spots, setSpots] = useState('6')
  const [dateTime, setDateTime] = useState('')
  const [dateVal, setDateVal] = useState('')
  const [timeVal, setTimeVal] = useState('')
  const [emoji, setEmoji] = useState('📅')
  const [flexible, setFlexible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const finalPrice = priceCustom || price

  const submit = async () => {
    if (!title.trim()||!venue.trim()||!dateTime) return
    setSaving(true)
    const { error } = await supabase.from('events').insert({
      title: title.trim(),
      emoji,
      venue: venue.trim(),
      description: description.trim(),
      price: finalPrice,
      spots: parseInt(spots)||6,
      type,
      flexible,
      date_label: new Date(dateTime).toLocaleDateString('fr-CH',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}),
      status: 'pending',
      created_by: user.id,
    })
    setSaving(false)
    if (!error) setDone(true)
  }

  if (done) return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:`linear-gradient(160deg,${C.bg},${C.sageLight})`, padding:32, gap:20, textAlign:'center' }}>
      <div style={{ fontSize:64 }}>🎉</div>
      <h2 style={{ fontSize:22, fontWeight:800, color:C.text }}>Événement soumis !</h2>
      <div style={{ background:C.card, borderRadius:16, padding:16, width:'100%', border:`1px solid ${C.border}` }}>
        <p style={{ color:C.textMid, lineHeight:1.6, fontSize:14 }}>
          {type==='user'
            ? "✅ Ton événement sera examiné par l'équipe Clutch et publié sous 24h si tout est ok."
            : "✅ Soumis pour validation. Tu seras notifié·e rapidement."}
        </p>
      </div>
      <Btn onClick={()=>go('events')}>← Retour aux événements</Btn>
    </div>
  )

  return (
    <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column', background:C.bg }}>
      <TopBar title="Créer un événement" onBack={()=>go('events')}/>
      <div style={{ flex:1, minHeight:0, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y', padding:'12px 20px', display:'flex', flexDirection:'column', gap:14 }}>
        {/* Type */}
        <div>
          <p style={{ fontWeight:700, color:C.text, marginBottom:8, fontSize:13 }}>Type d'événement</p>
          <div style={{ display:'flex', gap:8 }}>
            {[{t:'user',l:'👥 Mon activité',c:C.peach,allowed:['user','partner','admin']},{t:'partner',l:'🤝 Partenaire',c:C.sage,allowed:['partner','admin']},{t:'clutch',l:'✦ Clutch Officiel',c:C.primary,allowed:['admin']}]
              .filter(opt=>opt.allowed.includes(user?.account_type||'user'))
              .map(opt=>(
              <button key={opt.t} onClick={()=>setType(opt.t as any)} style={{ flex:1, padding:'8px 4px', borderRadius:12, border:`2px solid ${type===opt.t?opt.c:C.border}`, background:type===opt.t?`${opt.c}18`:C.card, color:type===opt.t?opt.c:C.textMid, fontWeight:700, fontSize:11, cursor:'pointer', fontFamily:'inherit', textAlign:'center' }}>{opt.l}</button>
            ))}
          </div>
        </div>

        {/* Emoji */}
        <div>
          <p style={{ fontWeight:700, color:C.text, marginBottom:8, fontSize:13 }}>Emoji</p>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {['📅','☕','🎵','🎨','🏃','🍷','🧘','🎤','🏓','📸','🥾','🌿'].map(e=>(
              <button key={e} onClick={()=>setEmoji(e)} style={{ width:38, height:38, borderRadius:10, border:`2px solid ${emoji===e?C.primary:C.border}`, background:emoji===e?C.primaryLight:C.card, fontSize:20, cursor:'pointer' }}>{e}</button>
            ))}
          </div>
        </div>

        {/* Titre + lieu */}
        {[{label:'Titre *',placeholder:'Ex: Rando Jorat dimanche matin',val:title,set:setTitle},{label:'Lieu *',placeholder:'Ex: Forêt du Jorat, Lausanne',val:venue,set:setVenue}].map(f=>(
          <div key={f.label}>
            <p style={{ fontWeight:700, color:C.text, marginBottom:6, fontSize:13 }}>{f.label}</p>
            <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.placeholder} style={{ width:'100%', padding:'11px 13px', borderRadius:12, border:`1.5px solid ${f.val?C.primary:C.border}`, background:C.card, fontSize:14, color:C.text, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}/>
          </div>
        ))}

        {/* Description */}
        <div>
          <p style={{ fontWeight:700, color:C.text, marginBottom:6, fontSize:13 }}>Description</p>
          <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Décris ton activité, le niveau requis, ce qu'il faut apporter…" rows={3} style={{ width:'100%', border:`1.5px solid ${C.border}`, borderRadius:12, padding:'11px 13px', fontSize:13, fontFamily:'inherit', background:C.card, color:C.text, resize:'none', outline:'none', boxSizing:'border-box' }}/>
        </div>

        {/* Prix */}
        <div>
          <p style={{ fontWeight:700, color:C.text, marginBottom:8, fontSize:13 }}>Prix / participation</p>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
            {['Gratuit','5 CHF','10 CHF','15 CHF','20 CHF','28 CHF'].map(pr=>(
              <button key={pr} onClick={()=>{setPrice(pr);setPriceCustom('')}} style={{ padding:'5px 11px', borderRadius:20, border:`1.5px solid ${price===pr&&!priceCustom?C.primary:C.border}`, background:price===pr&&!priceCustom?C.primaryLight:C.card, color:C.text, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>{pr}</button>
            ))}
          </div>
          <input value={priceCustom} onChange={e=>setPriceCustom(e.target.value)} placeholder="Ou saisir un montant (ex: 12 CHF)" style={{ width:'100%', padding:'9px 13px', borderRadius:12, border:`1.5px solid ${priceCustom?C.primary:C.border}`, background:C.card, fontSize:13, color:C.text, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}/>
        </div>

        {/* Date + Places */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <div>
            <p style={{ fontWeight:700, color:C.text, marginBottom:6, fontSize:13 }}>Date & heure *</p>
            <div style={{ display:'flex', gap:8 }}>
              <input type="date" value={dateVal} onChange={e=>{ setDateVal(e.target.value); if(e.target.value&&timeVal) setDateTime(`${e.target.value}T${timeVal}`) }} style={{ flex:1, padding:'9px 11px', borderRadius:12, border:`1.5px solid ${dateVal?C.primary:C.border}`, background:C.card, fontSize:13, color:C.text, outline:'none', boxSizing:'border-box', fontFamily:'inherit', WebkitAppearance:'none' }}/>
              <input type="time" value={timeVal} onChange={e=>{ setTimeVal(e.target.value); if(dateVal&&e.target.value) setDateTime(`${dateVal}T${e.target.value}`) }} style={{ width:100, padding:'9px 11px', borderRadius:12, border:`1.5px solid ${timeVal?C.primary:C.border}`, background:C.card, fontSize:13, color:C.text, outline:'none', boxSizing:'border-box', fontFamily:'inherit', WebkitAppearance:'none' }}/>
            </div>
          </div>
          <div>
            <p style={{ fontWeight:700, color:C.text, marginBottom:6, fontSize:13 }}>Places</p>
            <input type="number" value={spots} onChange={e=>setSpots(e.target.value)} min={2} max={50} style={{ width:'100%', padding:'9px 11px', borderRadius:12, border:`1.5px solid ${C.border}`, background:C.card, fontSize:13, color:C.text, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}/>
          </div>
        </div>

        {/* Flexible toggle */}
        <button onClick={()=>setFlexible(f=>!f)} style={{ width:'100%', padding:'12px 14px', borderRadius:12, border:`1.5px solid ${flexible?C.gold:C.border}`, background:flexible?'#FFF8DC':C.card, cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', fontFamily:'inherit' }}>
          <div style={{ textAlign:'left' }}>
            <div style={{ fontSize:13, fontWeight:700, color: flexible ? '#7A6020' : C.text }}>
              {flexible ? '🔄 Événement flexible' : '📌 Événement fixe'}
            </div>
            <div style={{ fontSize:11, color:C.textLight, marginTop:2 }}>
              {flexible ? 'Lieu/heure peuvent changer via contre-proposition' : 'Heure et lieu fixes, pas de négociation'}
            </div>
          </div>
          <div style={{ width:40, height:22, borderRadius:11, background:flexible?C.gold:C.border, position:'relative', flexShrink:0, transition:'background 0.2s' }}>
            <div style={{ position:'absolute', top:3, left:flexible?20:3, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
          </div>
        </button>

        {/* Moderation note */}
        <div style={{ padding:'12px 14px', background:'#FFF8DC', borderRadius:12, border:'1px solid #D4A01733', fontSize:12, color:'#7A6020', lineHeight:1.55 }}>
          ⚠️ {type==='user' ? "Ton événement sera examiné par l'équipe Clutch avant publication (sous 24h)." : "Les événements Clutch et Partenaire sont validés en priorité."}
        </div>

        {/* Bouton dans le scroll pour iOS */}
        <button onClick={saving?undefined:submit} disabled={!title||!venue||!dateTime} style={{ borderRadius:14, padding:'16px 20px', fontSize:15, fontWeight:700, cursor:(title&&venue&&dateTime&&!saving)?'pointer':'not-allowed', border:'none', width:'100%', fontFamily:'inherit', background:(title&&venue&&dateTime)?`linear-gradient(135deg,${C.primary},${C.primaryDark})`:C.bgDeep, color:(title&&venue&&dateTime)?'#fff':C.textLight, opacity:saving?.7:1, marginBottom:16 }}>
          {saving?'Envoi…':'Publier l\'événement 🎉'}
        </button>
      </div>
    </div>
  )
}

// ─── MY EVENTS (pending) ──────────────────────────────────────────────────────
function MyEvents({ user, go }: { user:any; go:(s:Screen)=>void }) {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    supabase.from('events').select('*').eq('created_by',user.id).order('created_at',{ascending:false})
      .then(({data})=>{ if(data) setEvents(data); setLoading(false) })
  },[user?.id])

  const statusColor = (s:string) => s==='approved'?C.sage:s==='rejected'?C.red:C.peach
  const statusLabel = (s:string) => s==='approved'?'✓ Publié':s==='rejected'?'✕ Refusé':'⏳ En attente'

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:C.bg }}>
      <TopBar title="Mes événements" onBack={()=>go('events')}/>
      <div style={{ flex:1, minHeight:0, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y', padding:'12px 16px', display:'flex', flexDirection:'column', gap:10 }}>
        {loading&&<p style={{ color:C.textLight, textAlign:'center', marginTop:32 }}>Chargement…</p>}
        {!loading&&events.length===0&&(
          <div style={{ textAlign:'center', marginTop:40 }}>
            <p style={{ fontSize:40 }}>📅</p>
            <p style={{ color:C.textMid, marginTop:12 }}>Aucun événement créé.</p>
          </div>
        )}
        {events.map(ev=>(
          <div key={ev.id} style={{ background:C.card, borderRadius:14, padding:'14px 16px', border:`1.5px solid ${statusColor(ev.status)}33`, boxShadow:`0 1px 6px ${C.shadow}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
              <span style={{ fontWeight:700, color:C.text, fontSize:14 }}>{ev.emoji} {ev.title}</span>
              <span style={{ fontSize:11, padding:'3px 8px', borderRadius:8, background:`${statusColor(ev.status)}18`, color:statusColor(ev.status), fontWeight:700 }}>{statusLabel(ev.status)}</span>
            </div>
            <p style={{ fontSize:12, color:C.textLight }}>📍 {ev.venue} · {ev.price}</p>
            {ev.status==='pending'&&<p style={{ fontSize:11, color:C.peach, marginTop:6 }}>Examiné sous 24h par l'équipe Clutch.</p>}
            {ev.status==='rejected'&&<p style={{ fontSize:11, color:C.red, marginTop:6 }}>Refusé — contacte nous pour plus d'info.</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── INBOX ────────────────────────────────────────────────────────────────────
function Inbox({ clutches, user, go, setSelectedClutch }: any) {
  const open = (c:any) => {
    setSelectedClutch(c)
    if (c.receiver_id === user.id && c.status === 'pending') go('clutch-received')
    else if (c.status === 'counter' && c.sender_id === user.id) go('clutch-received')
    else if (c.status === 'accepted') go('rdv-active')
    else go('chat')
  }

  const now = new Date()

  // Catégoriser
  const urgent = clutches.filter((c:any) => {
    if (c.status === 'pending' && c.receiver_id === user.id && (!c.expires_at || new Date(c.expires_at) > now)) return true
    if (c.status === 'counter' && c.sender_id === user.id) return true
    return false
  })

  const rdvs = clutches.filter((c:any) => {
    if (c.status !== 'accepted') return false
    const t = c.proposed_time ? new Date(c.proposed_time) : null
    // RDV dans les prochaines 24h ou passé depuis moins de 2h
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
    return !t || t > twoHoursAgo
  })

  const chats = clutches.filter((c:any) => {
    if (c.status === 'accepted') {
      const t = c.proposed_time ? new Date(c.proposed_time) : null
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
      return t && t <= twoHoursAgo
    }
    if (c.status === 'pending' && c.sender_id === user.id && (!c.expires_at || new Date(c.expires_at) > now)) return true
    return false
  })

  // RDVs annulés dans les 48h — pour que la victime soit notifiée in-app
  const cancelled = clutches.filter((c:any) => {
    if (c.status !== 'cancelled') return false
    const updated = c.updated_at ? new Date(c.updated_at) : null
    if (!updated) return false
    return (now.getTime() - updated.getTime()) < 48 * 60 * 60 * 1000
  })

  const SectionTitle = ({ label, count }: any) => (
    <div style={{ padding:'10px 20px 6px', display:'flex', alignItems:'center', gap:8 }}>
      <span style={{ fontSize:11, fontWeight:800, color:C.textLight, letterSpacing:'0.08em', textTransform:'uppercase' }}>{label}</span>
      {count > 0 && <span style={{ fontSize:10, fontWeight:800, background:C.primary, color:'#fff', borderRadius:10, padding:'1px 6px' }}>{count}</span>}
    </div>
  )

  const ClutchCard = ({ c, type }: any) => {
    const other = c.sender_id === user.id ? c.receiver : c.sender
    const isCounter = c.status === 'counter' && c.sender_id === user.id
    const displayVenue = isCounter && c.counter_venue ? c.counter_venue : c.venue
    const displayTime = isCounter && c.counter_time ? c.counter_time : c.proposed_time
    const timeLabel = displayTime ? fmtDate(displayTime) : ''
    const expiresLabel = c.expires_at ? fmtDate(c.expires_at) : ''
    const isSentPending = c.status === 'pending' && c.sender_id === user.id

    let badge = null
    if (type === 'urgent' && !isCounter) badge = <span style={{ fontSize:11, fontWeight:800, background:C.primary, color:'#fff', borderRadius:20, padding:'4px 10px', whiteSpace:'nowrap', flexShrink:0 }}>⚡ Répondre</span>
    else if (type === 'urgent' && isCounter) badge = <span style={{ fontSize:11, fontWeight:800, background:C.purple, color:'#fff', borderRadius:20, padding:'4px 10px', whiteSpace:'nowrap', flexShrink:0 }}>🔄 Contre-prop</span>
    else if (type === 'rdv') badge = <span style={{ fontSize:11, fontWeight:700, background:C.sageLight, color:C.sage, borderRadius:20, padding:'4px 10px', whiteSpace:'nowrap', flexShrink:0 }}>✓ RDV</span>
    else if (isSentPending) badge = <span style={{ fontSize:11, fontWeight:700, background:C.bgDeep, color:C.textLight, borderRadius:20, padding:'4px 10px', whiteSpace:'nowrap', flexShrink:0 }}>En attente</span>

    const cardBg = type === 'urgent' && !isCounter ? '#FFF5F7' : isCounter ? C.purpleLight : C.card

    return (
      <button key={c.id} onClick={() => open(c)} style={{ width:'100%', padding:'12px 20px', background:cardBg, border:'none', borderBottom:`1px solid ${C.border}`, display:'flex', gap:12, alignItems:'center', cursor:'pointer', textAlign:'left' }}>
        <div style={{ position:'relative', flexShrink:0 }}>
          <Avatar p={other || {}} size={48}/>
          {type === 'urgent' && <div style={{ position:'absolute', bottom:0, right:0, width:14, height:14, borderRadius:'50%', background:C.primary, border:'2px solid #fff' }}/>}
          {type === 'rdv' && <div style={{ position:'absolute', bottom:0, right:0, width:14, height:14, borderRadius:'50%', background:C.sage, border:'2px solid #fff' }}/>}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
            <span style={{ fontWeight:800, color:C.text, fontSize:14 }}>{other?.name || 'Utilisateur'}</span>
            <span style={{ fontSize:11, color:C.textLight, flexShrink:0 }}>{timeLabel}</span>
          </div>
          <p style={{ fontSize:13, color:C.textMid, marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>📍 {displayVenue}</p>
          {type === 'urgent' && !isCounter && expiresLabel && (
            <p style={{ fontSize:11, color:C.red, marginTop:2, fontWeight:600 }}>⏱ Expire {expiresLabel}</p>
          )}
          {isSentPending && expiresLabel && (
            <p style={{ fontSize:11, color:C.textLight, marginTop:2 }}>⏱ Expire {expiresLabel}</p>
          )}
        </div>
        {badge}
      </button>
    )
  }

  const isEmpty = urgent.length === 0 && rdvs.length === 0 && chats.length === 0 && cancelled.length === 0

  if (isEmpty) return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:C.bg, padding:32, gap:16, textAlign:'center' }}>
      <div style={{ fontSize:56 }}>☕</div>
      <h2 style={{ fontSize:20, fontWeight:800, color:C.text }}>Rien pour l'instant</h2>
      <p style={{ color:C.textMid, fontSize:14, lineHeight:1.6 }}>Clutche quelqu'un depuis Discover !</p>
    </div>
  )

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:C.bg, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y' }}>
      <div style={{ padding:'14px 20px 10px', borderBottom:`1px solid ${C.border}`, position:'sticky', top:0, background:C.bg, zIndex:5 }}>
        <h2 style={{ fontSize:20, fontWeight:800, color:C.text }}>Activité</h2>
      </div>

      {urgent.length > 0 && (
        <div>
          <SectionTitle label="À répondre" count={urgent.length} />
          {urgent.map((c:any) => <ClutchCard key={c.id} c={c} type="urgent" />)}
        </div>
      )}

      {rdvs.length > 0 && (
        <div style={{ marginTop: urgent.length > 0 ? 8 : 0 }}>
          <SectionTitle label="Rendez-vous" count={0} />
          {rdvs.map((c:any) => <ClutchCard key={c.id} c={c} type="rdv" />)}
        </div>
      )}

      {chats.length > 0 && (
        <div style={{ marginTop:8 }}>
          <SectionTitle label="Discussions" count={0} />
          {chats.map((c:any) => <ClutchCard key={c.id} c={c} type="chat" />)}
        </div>
      )}

      {cancelled.length > 0 && (
        <div style={{ marginTop:8 }}>
          <div style={{ padding:'10px 20px 6px', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:11, fontWeight:800, color:C.red, letterSpacing:'0.08em', textTransform:'uppercase' }}>❌ RDV annulé</span>
          </div>
          {cancelled.map((c:any) => {
            const other = c.sender_id === user.id ? c.receiver : c.sender
            const cancelledByMe = c.sender_id === user.id
              ? (c.receiver_id !== user.id)
              : (c.sender_id !== user.id)
            // Qui a annulé ? On ne stocke pas encore ce champ, donc on infère
            return (
              <div key={c.id} style={{ padding:'12px 20px', background:C.redLight, borderBottom:`1px solid ${C.red}22`, display:'flex', gap:12, alignItems:'center' }}>
                <Avatar p={other || {}} size={44}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <span style={{ fontWeight:800, color:C.text, fontSize:14 }}>{other?.name || '?'}</span>
                  <p style={{ fontSize:13, color:C.red, marginTop:2, fontWeight:600 }}>RDV annulé · {c.venue}</p>
                  <p style={{ fontSize:11, color:C.textLight, marginTop:1 }}>Tu peux clutcher à nouveau depuis Discover</p>
                </div>
                <span style={{ fontSize:20 }}>❌</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── MY PROFILE ───────────────────────────────────────────────────────────────
const LAUSANNE_ZONES = ['Centre','Flon','Ouchy','Lausanne-Ouest','Pully','Renens','Prilly','Chailly','Sallaz','Épalinges']
const SWISS_CITIES = ['Genève','Zurich','Berne','Fribourg','Neuchâtel','Sion','Lugano','Basel','Montreux']
const AVAIL_MODES = [
  { id:'professionnel', label:'💼 Pro', desc:'Networking, café pro' },
  { id:'amis', label:'👥 Amis / Activité', desc:'Balade, sport, culture' },
  { id:'rencontre', label:'💖 Rencontre', desc:'Date, romantique' },
]
function genTimeSlotsAvail() {
  const now=new Date(), slots:{label:string;iso:string}[]=[]
  const start=new Date(now); start.setSeconds(0,0)
  const m=start.getMinutes()
  // Round UP to next 15-min mark without double-incrementing
  const rem = 15 - (m % 15)
  start.setMinutes(m + rem, 0, 0) // JS handles overflow automatically
  for(let i=0;i<=72;i++){
    const t=new Date(start.getTime()+i*15*60000)
    const diff=Math.round((t.getTime()-now.getTime())/60000)
    if(diff>18*60) break
    const h=t.getHours(), mn=t.getMinutes()
    const diffLabel=diff<60?`+${diff}min`:`+${Math.floor(diff/60)}h${diff%60>0?String(diff%60).padStart(2,'0'):''}`
    slots.push({label:`${h}h${String(mn).padStart(2,'0')} (${diffLabel})`,iso:t.toISOString()})
  }
  return slots
}
function distKm(lat1:number,lng1:number,lat2:number,lng2:number){
  const R=6371,dLat=(lat2-lat1)*Math.PI/180,dLng=(lng2-lng1)*Math.PI/180
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
}
function fmtDist(km:number){ return km<1?`${Math.round(km*1000)}m`:km<10?`${km.toFixed(1)}km`:`${Math.round(km)}km` }

function fmtIsoTime(iso:string|null, showDate=false){
  if(!iso)return ''
  const d=new Date(iso); if(isNaN(d.getTime()))return ''
  const now=new Date()
  const isToday=d.toDateString()===now.toDateString()
  const tomorrow=new Date(now); tomorrow.setDate(now.getDate()+1)
  const isTomorrow=d.toDateString()===tomorrow.toDateString()
  const time=`${d.getHours()}h${String(d.getMinutes()).padStart(2,'0')}`
  if(!showDate||isToday) return time
  if(isTomorrow) return `Dem. ${time}`
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')} ${time}`
}
function fmtDate(iso:string){
  const d=new Date(iso); if(isNaN(d.getTime()))return ''
  const now=new Date()
  const isToday=d.toDateString()===now.toDateString()
  const tomorrow=new Date(now); tomorrow.setDate(now.getDate()+1)
  const isTomorrow=d.toDateString()===tomorrow.toDateString()
  const time=`${d.getHours()}h${String(d.getMinutes()).padStart(2,'0')}`
  if(isToday) return `Auj. ${time}`
  if(isTomorrow) return `Dem. ${time}`
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')} ${time}`
}

function MyProfile({ user, go, signOut, save }: any) {
  const [editBio,setEditBio]=useState(false); const [bio,setBio]=useState(user?.bio||''); const [saving,setSaving]=useState(false)
  const [premiumLoading,setPremiumLoading]=useState(false)

  const goPremium=async()=>{
    setPremiumLoading(true)
    try{
      const {data:{session}}=await supabase.auth.getSession()
      const res=await fetch(`${SUPABASE_FUNCTIONS_URL}/create-checkout`,{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${session?.access_token}`}
      })
      const data=await res.json()
      if(data.url) window.location.href=data.url
      else alert(data.error||'Erreur Stripe')
    }catch(e:any){alert('Erreur réseau: '+e?.message)}
    setPremiumLoading(false)
  }
  const [isAvailable,setIsAvailable]=useState(user?.is_available||false)
  const [editInterests,setEditInterests]=useState(false)
  const [editProfile,setEditProfile]=useState(true)
  const [selInterests,setSelInterests]=useState<string[]>(user?.interests||[])
  const [editAvail,setEditAvail]=useState(false)
  const [editInfo,setEditInfo]=useState(false)
  const [job,setJob]=useState(user?.job||'')
  const [neighborhood,setNeighborhood]=useState(user?.neighborhood||'')
  const [photoPos,setPhotoPos]=useState<string>(user?.photo_pos||'center center')
  const savePhotoPos=async(pos:string)=>{
    setPhotoPos(pos)
    await supabase.from('profiles').update({photo_pos:pos}).eq('id',user.id)
    save({photo_pos:pos})
  }
  const [uploadingPhoto,setUploadingPhoto]=useState(false)
  const photoRef=useRef<HTMLInputElement>(null)

  const [photoErr,setPhotoErr]=useState('')
  const uploadPhoto=async(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0]; if(!file||!user?.id) return
    if(file.size>5*1024*1024){setPhotoErr('Image trop lourde (max 5MB)');setTimeout(()=>setPhotoErr(''),4000);return}
    setUploadingPhoto(true);setPhotoErr('')
    try{
      const ext=file.name.split('.').pop()||'jpg'
      const path=`${user.id}/avatar.${ext}`
      const {error:upErr}=await supabase.storage.from('avatars').upload(path,file,{upsert:true,contentType:file.type})
      if(upErr){setPhotoErr('Erreur upload: '+upErr.message);setUploadingPhoto(false);return}
      const {data:{publicUrl}}=supabase.storage.from('avatars').getPublicUrl(path)
      const {error:dbErr}=await supabase.from('profiles').update({photo_url:publicUrl+'?t='+Date.now()}).eq('id',user.id)
      if(dbErr){setPhotoErr('Erreur profil: '+dbErr.message);setUploadingPhoto(false);return}
      save({photo_url:publicUrl+'?t='+Date.now()})
      setPhotoErr('✓ Photo mise à jour !')
      setTimeout(()=>setPhotoErr(''),3000)
    }catch(err:any){setPhotoErr('Erreur: '+(err?.message||'inconnue'));console.error(err)}
    setUploadingPhoto(false)
    if(photoRef.current) photoRef.current.value='' // reset pour permettre re-upload
  }

  const saveInfo=async()=>{
    setSaving(true)
    await supabase.from('profiles').update({job:job.trim(),neighborhood:neighborhood.trim()}).eq('id',user.id)
    save({job:job.trim(),neighborhood:neighborhood.trim()})
    setSaving(false);setEditInfo(false)
  }
  const [availZone,setAvailZone]=useState(user?.available_city?.includes('(')?user.available_city.match(/\(([^)]+)\)/)?.[1]||'Centre':'Centre')
  const [availCity,setAvailCity]=useState(user?.available_city?.startsWith('Lausanne')?'Lausanne':user?.available_city||'Lausanne')
  const [availFrom,setAvailFrom]=useState('')  // ISO string from dropdown
  const [availUntil,setAvailUntil]=useState('') // ISO string from dropdown
  const [availModes,setAvailModes]=useState<string[]>(user?.available_modes||[])
  const [locLoading,setLocLoading]=useState(false)
  const [locLabel,setLocLabel]=useState('')
  const timeSlots = genTimeSlotsAvail()
  const toggleMode=(m:string)=>setAvailModes(p=>p.includes(m)?p.filter(x=>x!==m):[...p,m])
  const getGPS=()=>{
    if(!('geolocation' in navigator)){alert('GPS non disponible sur ce navigateur');return}
    setLocLoading(true)
    navigator.geolocation.getCurrentPosition(async pos=>{
      try{
        const {latitude:lat,longitude:lng}=pos.coords
        const res=await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=fr`)
        const data=await res.json()
        const addr=data.address||{}
        const city=addr.city||addr.town||addr.village||'Lausanne'
        const suburb=addr.suburb||addr.neighbourhood||addr.district||''
        setAvailCity(city)
        if(suburb) setAvailZone(suburb)
        setLocLabel(`📍 ${city}${suburb?` · ${suburb}`:''}`)
      }catch{setLocLabel('')}
      setLocLoading(false)
    },()=>{alert('Accès GPS refusé. Active la localisation dans les réglages.');setLocLoading(false)},{timeout:10000,enableHighAccuracy:true})
  }
  const saveBio=async()=>{setSaving(true);await supabase.from('profiles').update({bio}).eq('id',user.id);save({bio});setSaving(false);setEditBio(false)}
  const toggleAvail=async()=>{
    if(isAvailable){
      // Désactivation → effacer toutes les données de dispo
      setIsAvailable(false)
      await supabase.from('profiles').update({is_available:false,available_from:null,available_until:null,available_city:null,available_modes:null}).eq('id',user.id)
      save({is_available:false,available_from:null,available_until:null,available_city:null,available_modes:null})
    } else {
      // Activation → aller sur SetAvail avec la carte GPS (jamais juste toggle sans localisation)
      go('set-avail')
    }
  }
  const saveAvail=async()=>{
    if(availModes.length===0){alert('Choisis au moins un type de rencontre');return}
    setSaving(true)
    const city=availCity==='Lausanne'?`Lausanne (${availZone})`:availCity
    const fromIso = availFrom || new Date().toISOString()
    const maxUntil = new Date(Date.now()+18*60*60*1000).toISOString()
    const untilIso = availUntil && availUntil < maxUntil ? availUntil : maxUntil
    // Géolocalisation GPS
    let geoUpdate: {lat?:number;lng?:number} = {}
    try {
      if (navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition>((res,rej)=>
          navigator.geolocation.getCurrentPosition(res,rej,{timeout:5000,enableHighAccuracy:false})
        )
        geoUpdate = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      }
    } catch {}
    await supabase.from('profiles').update({is_available:true,available_city:city,available_from:fromIso,available_until:untilIso,available_modes:availModes,...geoUpdate}).eq('id',user.id)
    save({is_available:true,available_city:city,available_from:fromIso,available_until:untilIso,available_modes:availModes,...geoUpdate})
    setIsAvailable(true);setSaving(false);setEditAvail(false)
  }
  const saveInterests=async()=>{setSaving(true);await supabase.from('profiles').update({interests:selInterests}).eq('id',user.id);save({interests:selInterests});setSaving(false);setEditInterests(false)}
  const toggleInterest=(i:string)=>setSelInterests(p=>p.includes(i)?p.filter(x=>x!==i):p.length<5?[...p,i]:p)
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:C.bgDeep, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y', minHeight:0 }}>

      {/* ── HEADER PHOTO compact ── */}
      <div style={{ position:'relative', flexShrink:0, height:180 }}>
        {user?.photo_url
          ? <img src={user.photo_url} alt="" style={{ width:'100%', height:180, objectFit:'cover', objectPosition:photoPos, display:'block' }}/>
          : <div style={{ width:'100%', height:180, background:`linear-gradient(160deg,${C.primaryLight},${C.peachLight})`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:56, opacity:0.3 }}>☕</span>
            </div>
        }
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)' }}/>
        <div style={{ position:'absolute', bottom:12, left:14, right:52 }}>
          <p style={{ fontSize:20, fontWeight:900, color:'#fff', letterSpacing:'-0.02em' }}>
            {user?.name||'Mon profil'}{user?.age?`, ${user.age}`:''}
          </p>
          <p style={{ fontSize:11, color:'rgba(255,255,255,0.75)', marginTop:2 }}>
            {user?.neighborhood||''}{user?.job?` · ${user.job}`:''}{!user?.neighborhood&&!user?.job?'Lausanne':''}
          </p>
          <div style={{ marginTop:4 }}><ReliabilityStars score={user?.reliability_score||100} light/></div>
        </div>
        <button onClick={()=>photoRef.current?.click()}
          style={{ position:'absolute', bottom:10, right:10, width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.18)', backdropFilter:'blur(8px)', border:'1.5px solid rgba(255,255,255,0.4)', color:'#fff', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          {uploadingPhoto?'⏳':'📷'}
        </button>
        <input ref={photoRef} type="file" accept="image/*" onChange={uploadPhoto} style={{ display:'none' }}/>
        {photoErr&&<div style={{ position:'absolute', top:10, left:'50%', transform:'translateX(-50%)', whiteSpace:'nowrap', background:photoErr.startsWith('✓')?C.sage:C.red, color:'#fff', fontSize:12, fontWeight:700, padding:'4px 14px', borderRadius:20, zIndex:10 }}>{photoErr}</div>}
      </div>

      <div style={{ padding:'10px 14px 32px', display:'flex', flexDirection:'column', gap:10 }}>

        {/* ── DISPONIBILITÉ ── Toggle SEUL — off→on = SetAvail */}
        <div style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}` }}>
          <button onClick={toggleAvail} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', borderRadius:16, background:'none', border:'none', cursor:'pointer', width:'100%', textAlign:'left' }}>
            {/* Toggle pill */}
            <div style={{ width:48, height:26, borderRadius:13, background:isAvailable?C.sage:C.border, position:'relative', transition:'background 0.25s', flexShrink:0 }}>
              <div style={{ width:22, height:22, borderRadius:'50%', background:'#fff', position:'absolute', top:2, left:isAvailable?24:2, transition:'left 0.25s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }}/>
            </div>
            <div>
              <p style={{ fontSize:15, fontWeight:800, color:isAvailable?C.sage:C.text }}>
                {isAvailable ? '● Je suis disponible' : '○ Pas disponible'}
              </p>
              <p style={{ fontSize:11, color:C.textLight, marginTop:1 }}>
                {isAvailable ? 'Visible dans Discover ✓' : 'Appuie pour te mettre dispo →'}
              </p>
            </div>
          </button>
          {isAvailable && (
            <button onClick={()=>go('set-avail')} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 16px', margin:'0 8px 8px', borderRadius:12, background:C.sageLight, border:`1px solid ${C.sage}33`, cursor:'pointer', width:'calc(100% - 16px)' }}>
              <div>
                <p style={{ fontSize:12, color:C.sage, fontWeight:700 }}>
                  📍 {user?.available_city||'Lausanne'}
                  {user?.available_from&&fmtIsoTime(user.available_from)&&` · ${fmtIsoTime(user.available_from)}`}
                  {user?.available_until&&fmtIsoTime(user.available_until)&&` → ${fmtIsoTime(user.available_until)}`}
                </p>
                {(user?.available_modes||[]).length>0&&<p style={{ fontSize:11, color:C.sage, marginTop:1 }}>
                  {(user.available_modes as string[]).map((m:string)=>AVAIL_MODES.find(x=>x.id===m)?.label||m).join(' · ')}
                </p>}
              </div>
              <span style={{ color:C.sage, fontWeight:700, fontSize:13, flexShrink:0, marginLeft:8 }}>Modifier →</span>
            </button>
          )}
        </div>

        {/* ── MODIFIER MON PROFIL — page dédiée ── */}
        <button onClick={()=>go('edit-profile')}
          style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 18px', background:C.card, borderRadius:16, border:`1px solid ${C.border}`, cursor:'pointer', width:'100%', textAlign:'left' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            {user?.photo_url
              ? <img src={user.photo_url} alt="" style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover', objectPosition:photoPos, flexShrink:0 }}/>
              : <div style={{ width:44, height:44, borderRadius:'50%', background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ color:'#fff', fontSize:16, fontWeight:700 }}>{(user?.name||'?').slice(0,1)}</span>
                </div>
            }
            <div>
              <p style={{ fontWeight:800, color:C.text, fontSize:14 }}>Modifier mon profil</p>
              <p style={{ fontSize:12, color:C.textLight, marginTop:1 }}>
                {[user?.bio?'Bio':'', (user?.interests||[]).length>0?`${user.interests.length} passions`:''].filter(Boolean).join(' · ')||'Bio, passions, infos…'}
              </p>
            </div>
          </div>
          <span style={{ color:C.primary, fontSize:20, fontWeight:300 }}>›</span>
        </button>

        {/* ── ACTIONS ── */}
        <button onClick={()=>go('get-certified')}
          style={{ padding:'13px 16px', borderRadius:14, background:user?.certified?C.sageLight:C.bgDeep, border:`1.5px solid ${user?.certified?C.sage:C.border}`, cursor:'pointer', color:user?.certified?C.sage:C.textMid, fontWeight:700, fontSize:13, textAlign:'left', width:'100%' }}>
          {user?.certified?'✅ Profil certifié':'✓ Certifier mon profil'}
          {user?.certif_status==='pending'&&!user?.certified&&<span style={{ color:C.peach, marginLeft:6, fontSize:12 }}>· en attente</span>}
        </button>
        {/* ── PREMIUM (hommes seulement) ── */}
        {user?.gender!=='female' && (
          user?.is_premium ? (
            <div style={{ padding:'13px 16px', borderRadius:14, background:'linear-gradient(135deg,#1a1a2e,#16213e)', border:'1.5px solid #C9A96E', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:20 }}>💎</span>
              <div>
                <p style={{ fontWeight:800, color:'#C9A96E', fontSize:13 }}>Premium actif</p>
                <p style={{ fontSize:11, color:'#888', marginTop:1 }}>
                  {user?.premium_until?`Valide jusqu'au ${new Date(user.premium_until).toLocaleDateString('fr-CH',{day:'numeric',month:'short'})}`:' '}
                </p>
              </div>
              <span style={{ marginLeft:'auto', fontSize:11, color:'#C9A96E', fontWeight:700 }}>✓</span>
            </div>
          ) : (
            <button onClick={goPremium} disabled={premiumLoading}
              style={{ padding:'13px 16px', borderRadius:14, background:'linear-gradient(135deg,#1a1a2e,#2d1b69)', border:'1.5px solid #8B7CB8', cursor:'pointer', width:'100%', textAlign:'left', display:'flex', alignItems:'center', gap:10, opacity:premiumLoading?0.7:1 }}>
              <span style={{ fontSize:20 }}>💎</span>
              <div style={{ flex:1 }}>
                <p style={{ fontWeight:800, color:'#C4B5F4', fontSize:13 }}>{premiumLoading?'Chargement…':'Passer Premium'}</p>
                <p style={{ fontSize:11, color:'#8B7CB8', marginTop:1 }}>CHF 19.90/mois · Clutches illimités</p>
              </div>
              <span style={{ color:'#8B7CB8', fontSize:18 }}>›</span>
            </button>
          )
        )}

        <button onClick={()=>go('sos')}
          style={{ padding:'13px 16px', borderRadius:14, background:C.redLight, border:`1.5px solid ${C.red}22`, cursor:'pointer', color:C.red, fontWeight:700, fontSize:14, textAlign:'left', width:'100%' }}>
          🆘 SOS & Sécurité
        </button>
        <button onClick={signOut}
          style={{ padding:'12px 16px', borderRadius:14, background:'none', border:`1.5px solid ${C.border}`, cursor:'pointer', color:C.textLight, fontSize:13, width:'100%' }}>
          Se déconnecter
        </button>
        <a href="/" style={{ display:'block', textAlign:'center', padding:10, color:C.textLight, fontSize:12, textDecoration:'none' }}>← Retour au site</a>
        <p style={{ textAlign:'center', fontSize:10, color:C.textLight, opacity:0.4, paddingBottom:4 }}>v07.06-AA</p>
      </div>
    </div>
  )
}

// ─── EDIT PROFILE — page dédiée ──────────────────────────────────────────────
function EditProfile({ user, go, save }: any) {
  const [bio,setBio]=useState(user?.bio||'')
  const [job,setJob]=useState(user?.job||'')
  const [neighborhood,setNeighborhood]=useState(user?.neighborhood||'')
  const [selInterests,setSelInterests]=useState<string[]>(user?.interests||[])
  const [photoPos,setPhotoPos]=useState<string>(user?.photo_pos||'center center')
  const [saving,setSaving]=useState(false)
  const [saved,setSaved]=useState('')
  const photoRef=useRef<HTMLInputElement>(null)
  const [uploadingPhoto,setUploadingPhoto]=useState(false)
  const [photoErr,setPhotoErr]=useState('')

  const uploadPhoto=async(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0]; if(!file||!user?.id) return
    if(file.size>5*1024*1024){setPhotoErr('Image trop lourde (max 5MB)');return}
    setUploadingPhoto(true);setPhotoErr('')
    try{
      const ext=file.name.split('.').pop()||'jpg'
      const path=`${user.id}/avatar.${ext}`
      const {error:upErr}=await supabase.storage.from('avatars').upload(path,file,{upsert:true,contentType:file.type})
      if(upErr){setPhotoErr('Erreur upload');setUploadingPhoto(false);return}
      const {data:{publicUrl}}=supabase.storage.from('avatars').getPublicUrl(path)
      const url=publicUrl+'?t='+Date.now()
      await supabase.from('profiles').update({photo_url:url}).eq('id',user.id)
      save({photo_url:url})
      setSaved('✓ Photo mise à jour')
      setTimeout(()=>setSaved(''),3000)
    }catch(err:any){setPhotoErr('Erreur')}
    setUploadingPhoto(false)
    if(photoRef.current) photoRef.current.value=''
  }
  const savePhotoPos=async(pos:string)=>{
    setPhotoPos(pos)
    await supabase.from('profiles').update({photo_pos:pos}).eq('id',user.id)
    save({photo_pos:pos})
  }
  const saveAll=async()=>{
    setSaving(true)
    await supabase.from('profiles').update({bio:bio.trim(),job:job.trim(),neighborhood:neighborhood.trim(),interests:selInterests}).eq('id',user.id)
    save({bio:bio.trim(),job:job.trim(),neighborhood:neighborhood.trim(),interests:selInterests})
    setSaving(false)
    go('myprofile')
  }
  const toggleInterest=(i:string)=>setSelInterests(p=>p.includes(i)?p.filter(x=>x!==i):p.length<5?[...p,i]:p)

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:C.bgDeep, minHeight:0 }}>
      <TopBar title="Mon profil" onBack={()=>go('myprofile')}
        right={saved?<span style={{ fontSize:12, color:C.sage, fontWeight:700 }}>{saved}</span>:undefined}/>

      <div style={{ flex:1, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y', padding:'12px 14px 40px', display:'flex', flexDirection:'column', gap:14 }}>

        {/* Photo */}
        <div style={{ background:C.card, borderRadius:18, overflow:'hidden', border:`1px solid ${C.border}` }}>
          <div style={{ position:'relative', height:200 }}>
            {user?.photo_url
              ? <img src={user.photo_url} alt="" style={{ width:'100%', height:200, objectFit:'cover', objectPosition:photoPos, display:'block' }}/>
              : <div style={{ height:200, background:`linear-gradient(160deg,${C.primaryLight},${C.peachLight})`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontSize:64, opacity:0.3 }}>📷</span>
                </div>
            }
            <button onClick={()=>photoRef.current?.click()}
              style={{ position:'absolute', bottom:12, right:12, padding:'8px 16px', borderRadius:20, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
              {uploadingPhoto?'Envoi…':'📷 Changer la photo'}
            </button>
            <input ref={photoRef} type="file" accept="image/*" onChange={uploadPhoto} style={{ display:'none' }}/>
          </div>
          {user?.photo_url && (
            <div style={{ padding:'12px 14px', display:'flex', gap:8 }}>
              <p style={{ fontSize:11, color:C.textLight, fontWeight:700, letterSpacing:'0.06em', alignSelf:'center', marginRight:4 }}>CADRAGE</p>
              {[{v:'center top',l:'🔝 Haut'},{v:'center center',l:'🎯 Centre'},{v:'center bottom',l:'⬇️ Bas'}].map(opt=>(
                <button key={opt.v} onClick={()=>savePhotoPos(opt.v)}
                  style={{ flex:1, padding:'7px 4px', borderRadius:10, border:`1.5px solid ${photoPos===opt.v?C.primary:C.border}`, background:photoPos===opt.v?C.primaryLight:'transparent', color:photoPos===opt.v?C.primary:C.textMid, fontSize:11, fontWeight:photoPos===opt.v?700:400, cursor:'pointer', fontFamily:'inherit' }}>
                  {opt.l}
                </button>
              ))}
            </div>
          )}
          {photoErr&&<p style={{ padding:'0 14px 10px', color:C.red, fontSize:12 }}>{photoErr}</p>}
        </div>

        {/* Infos de base */}
        <div style={{ background:C.card, borderRadius:18, padding:'16px 16px', border:`1px solid ${C.border}`, display:'flex', flexDirection:'column', gap:12 }}>
          <p style={{ fontSize:11, fontWeight:700, color:C.textLight, letterSpacing:'0.08em' }}>INFOS</p>
          <div>
            <p style={{ fontSize:11, color:C.textLight, marginBottom:6 }}>Prénom · {user?.age?`${user.age} ans`:'âge'}</p>
            <div style={{ padding:'10px 14px', borderRadius:12, background:C.bgDeep, border:`1px solid ${C.border}`, color:C.textMid, fontSize:14 }}>
              {user?.name||'—'}{user?.age?`, ${user.age} ans`:''}
              <span style={{ fontSize:11, color:C.textLight, marginLeft:8 }}>(modifiable depuis les réglages du compte)</span>
            </div>
          </div>
          <div>
            <p style={{ fontSize:11, color:C.textLight, marginBottom:6 }}>Métier</p>
            <input value={job} onChange={e=>setJob(e.target.value)} placeholder="Ex: Designer, Étudiant, Barista…"
              style={{ width:'100%', padding:'10px 14px', borderRadius:12, border:`1.5px solid ${job?C.primary:C.border}`, background:C.bg, fontSize:14, color:C.text, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}/>
          </div>
          <div>
            <p style={{ fontSize:11, color:C.textLight, marginBottom:6 }}>Quartier / Ville</p>
            <input value={neighborhood} onChange={e=>setNeighborhood(e.target.value)} placeholder="Ex: Flon, Lausanne, Genève…"
              style={{ width:'100%', padding:'10px 14px', borderRadius:12, border:`1.5px solid ${neighborhood?C.primary:C.border}`, background:C.bg, fontSize:14, color:C.text, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}/>
          </div>
        </div>

        {/* Bio */}
        <div style={{ background:C.card, borderRadius:18, padding:'16px', border:`1px solid ${C.border}`, display:'flex', flexDirection:'column', gap:10 }}>
          <p style={{ fontSize:11, fontWeight:700, color:C.textLight, letterSpacing:'0.08em' }}>À PROPOS DE MOI</p>
          <textarea value={bio} onChange={e=>setBio(e.target.value.slice(0,140))} rows={4}
            placeholder="Décris-toi en quelques mots. Ce qui te rend unique. Pourquoi tu es sur Clutch."
            style={{ width:'100%', border:`1.5px solid ${bio?C.primary:C.border}`, borderRadius:12, padding:'10px 14px', fontSize:14, fontFamily:'inherit', resize:'none', outline:'none', color:C.text, background:C.bg, boxSizing:'border-box', lineHeight:1.6 }}/>
          <p style={{ fontSize:11, color:C.textLight, textAlign:'right' }}>{bio.length}/140</p>
        </div>

        {/* Passions */}
        <div style={{ background:C.card, borderRadius:18, padding:'16px', border:`1px solid ${C.border}`, display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <p style={{ fontSize:11, fontWeight:700, color:C.textLight, letterSpacing:'0.08em' }}>MES PASSIONS</p>
            <span style={{ fontSize:12, color:selInterests.length>=5?C.primary:C.textLight }}>{selInterests.length}/5 sélectionnées</span>
          </div>
          {selInterests.length>0&&(
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {selInterests.map(i=>(
                <button key={i} onClick={()=>toggleInterest(i)}
                  style={{ padding:'5px 14px', borderRadius:20, fontSize:12, border:`1.5px solid ${C.primary}`, background:C.primaryLight, color:C.primaryDark, cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>
                  {i} ×
                </button>
              ))}
            </div>
          )}
          {INTERESTS_CATS.map(cat=>(
            <div key={cat.label}>
              <p style={{ fontSize:11, fontWeight:700, color:C.textLight, marginBottom:6 }}>{cat.icon} {cat.label}</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {cat.items.map(item=>{
                  const active=selInterests.includes(item)
                  const disabled=!active&&selInterests.length>=5
                  return(
                    <button key={item} onClick={()=>toggleInterest(item)}
                      style={{ padding:'5px 12px', borderRadius:20, fontSize:12, border:'none', cursor:disabled?'not-allowed':'pointer', background:active?C.primary:C.bgDeep, color:active?'#fff':C.textMid, opacity:disabled?.35:1, fontFamily:'inherit' }}>
                      {item}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bouton sauvegarder */}
        <button onClick={saveAll} disabled={saving}
          style={{ padding:'15px', borderRadius:16, border:'none', background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`, color:'#fff', fontWeight:800, fontSize:16, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit', boxShadow:`0 4px 20px ${C.primary}44` }}>
          {saving?'Sauvegarde…':'✓ Sauvegarder mon profil'}
        </button>
      </div>
    </div>
  )
}

// ─── CLUTCH RECEIVED ──────────────────────────────────────────────────────────
function ClutchReceived({ clutch, user, go, refresh, sendPush }: any) {
  const [loading, setLoading] = useState<string|null>(null)
  const [countering, setCountering] = useState(false)
  const [counterTime, setCounterTime] = useState('')
  const [counterVenue, setCounterVenue] = useState('')
  const [counterSlots] = useState(()=>genTimeSlotsAvail())
  if (!clutch) return null

  // Mode counter-reçu : l'expéditeur original voit la contre-proposition
  const isCounterMode = clutch.status === 'counter' && clutch.sender_id === user?.id
  const sender = isCounterMode ? clutch.receiver : clutch.sender
  const displayTime = isCounterMode && clutch.counter_time ? clutch.counter_time : clutch.proposed_time
  const displayVenue = isCounterMode && clutch.counter_venue ? clutch.counter_venue : clutch.venue

  const expires = clutch.expires_at ? new Date(clutch.expires_at) : null
  const msLeft = expires ? expires.getTime() - Date.now() : 0
  const hLeft = Math.max(0, Math.floor(msLeft/3600000))
  const mLeft = Math.max(0, Math.floor((msLeft%3600000)/60000))

  const respond = async (status: 'accepted'|'declined') => {
    setLoading(status)
    const update: any = { status }
    if (status === 'accepted' && isCounterMode && clutch.counter_time) {
      // Accepter la contre-prop → mettre à jour proposed_time avec le counter
      update.proposed_time = clutch.counter_time
      if (clutch.counter_venue) update.venue = clutch.counter_venue
    }
    await supabase.from('clutches').update(update).eq('id', clutch.id)
    refresh()
    if (status === 'accepted') {
      const notifTarget = isCounterMode ? clutch.receiver_id : clutch.sender_id
      const notifName = isCounterMode ? clutch.receiver?.name : clutch.sender?.name
      sendPush?.(notifTarget, `🎯 ${user.name} a dit oui !`, `RDV au ${displayVenue}. C'est confirmé ☕`)
      go('rdv-active')
    } else { go('inbox') }
    setLoading(null)
  }

  const sendCounter = async () => {
    if (!counterTime) return
    setLoading('counter')
    await supabase.from('clutches').update({
      status: 'counter',
      counter_time: counterTime,
      counter_venue: counterVenue || clutch.venue,
      counter_by: user.id,
    }).eq('id', clutch.id)
    sendPush?.(clutch.sender_id, `🔄 Contre-proposition de ${user.name}`, `Nouveau créneau proposé — réponds vite !`)
    refresh()
    go('inbox')
    setLoading(null)
  }

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:C.bg, minHeight:0 }}>
      <TopBar title={isCounterMode ? '🔄 Contre-proposition reçue' : 'Tu as été clutché·e ☕'} onBack={()=>go('inbox')}/>
      <div style={{ flex:1, minHeight:0, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y', padding:'16px 20px', display:'flex', flexDirection:'column', gap:14 }}>
        {/* Sender card */}
        <div style={{ background:`linear-gradient(135deg,${isCounterMode?C.purpleLight:C.primaryLight},${C.peachLight})`, borderRadius:20, padding:20, display:'flex', gap:14, alignItems:'center' }}>
          <Avatar p={sender||{}} size={60}/>
          <div>
            <p style={{ fontWeight:800, fontSize:18, color:C.text }}>{sender?.name||'?'}</p>
            <p style={{ fontSize:13, color:C.textMid }}>📍 {sender?.neighborhood||'Lausanne'}</p>
            {sender?.reliability_score!=null&&<p style={{ fontSize:12, color:C.sage, fontWeight:600 }}>✓ Fiabilité {sender.reliability_score}%</p>}
          </div>
        </div>

        {/* RDV details */}
        <div style={{ background:C.card, borderRadius:16, padding:16, border:`1px solid ${isCounterMode?C.purple:C.border}`, display:'flex', flexDirection:'column', gap:8 }}>
          {isCounterMode && <p style={{ fontSize:12, color:C.purple, fontWeight:700 }}>🔄 Nouveau créneau proposé par {sender?.name}</p>}
          <div style={{ display:'flex', gap:12 }}>
            <span style={{ fontSize:20 }}>📍</span>
            <div><p style={{ fontWeight:700, fontSize:14, color:C.text }}>{displayVenue}</p><SafetyBadge safety={clutch.venue_safety||'safe'}/></div>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <span style={{ fontSize:20 }}>🕐</span>
            <p style={{ fontSize:14, color:C.text, fontWeight:600 }}>{new Date(displayTime).toLocaleString('fr-CH',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</p>
          </div>
          {isCounterMode && clutch.proposed_time !== clutch.counter_time && (
            <p style={{ fontSize:11, color:C.textLight, textDecoration:'line-through' }}>Ancienne heure : {new Date(clutch.proposed_time).toLocaleString('fr-CH',{hour:'2-digit',minute:'2-digit'})}</p>
          )}
        </div>

        {/* Message */}
        {!isCounterMode && (
          <div style={{ background:C.bgDeep, borderRadius:14, padding:'14px 16px', borderLeft:`3px solid ${C.primary}` }}>
            <p style={{ fontSize:12, color:C.textLight, marginBottom:6 }}>Message de {sender?.name}</p>
            <p style={{ fontSize:14, color:C.text, lineHeight:1.6, fontStyle:'italic' }}>"{clutch.message}"</p>
          </div>
        )}

        {/* Countdown */}
        {msLeft > 0 && <div style={{ background:C.primaryLight, borderRadius:12, padding:'10px 14px', textAlign:'center' }}>
          <p style={{ fontSize:12, color:C.primary, fontWeight:700 }}>⏳ Tu as {hLeft}h{String(mLeft).padStart(2,'0')} pour répondre</p>
        </div>}

        {/* Counter-propose panel */}
        {countering && !isCounterMode && (
          <div style={{ background:C.purpleLight, borderRadius:16, padding:16, border:`1px solid ${C.purple}44` }}>
            <p style={{ fontWeight:700, color:C.purple, fontSize:14, marginBottom:12 }}>🔄 Propose une autre heure</p>
            <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:200, overflowY:'scroll', marginBottom:12 }}>
              {counterSlots.map(s=>(
                <button key={s.iso} onClick={()=>setCounterTime(s.iso)} style={{ padding:'10px 14px', borderRadius:10, border:`1.5px solid ${counterTime===s.iso?C.purple:C.border}`, background:counterTime===s.iso?C.purple:'#fff', color:counterTime===s.iso?'#fff':C.text, fontSize:13, fontWeight:counterTime===s.iso?700:400, cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
                  {s.label}
                </button>
              ))}
            </div>
            <input value={counterVenue} onChange={e=>setCounterVenue(e.target.value)} placeholder={`Lieu (défaut: ${clutch.venue})`}
              style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:`1px solid ${C.border}`, background:'#fff', fontSize:13, color:C.text, fontFamily:'inherit', outline:'none', boxSizing:'border-box', marginBottom:10 }}/>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>setCountering(false)} style={{ flex:1, padding:'10px', borderRadius:10, border:`1px solid ${C.border}`, background:'none', color:C.textMid, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Annuler</button>
              <button onClick={sendCounter} disabled={!counterTime||loading==='counter'} style={{ flex:2, padding:'10px', borderRadius:10, border:'none', background:counterTime?C.purple:C.bgDeep, color:counterTime?'#fff':C.textLight, fontWeight:700, fontSize:13, cursor:counterTime?'pointer':'not-allowed', fontFamily:'inherit' }}>
                {loading==='counter'?'…':'Envoyer la contre-prop →'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding:'12px 20px 28px', display:'flex', flexDirection:'column', gap:10 }}>
        <button onClick={()=>respond('accepted')} disabled={!!loading} style={{ padding:'15px', borderRadius:14, border:'none', background:loading?C.bgDeep:`linear-gradient(135deg,${C.sage},#5A8A6A)`, color:loading?C.textLight:'#fff', fontWeight:800, fontSize:16, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit' }}>
          {loading==='accepted'?'…':'✅ Oui, je viens !'}
        </button>
        {!isCounterMode && !countering && (
          <button onClick={()=>setCountering(true)} style={{ padding:'12px', borderRadius:14, border:`1.5px solid ${C.purple}44`, background:C.purpleLight, color:C.purple, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
            🔄 Contre-proposer une heure
          </button>
        )}
        <button onClick={()=>respond('declined')} disabled={!!loading} style={{ padding:'12px', borderRadius:14, border:`1.5px solid ${C.red}33`, background:C.redLight, color:C.red, fontWeight:700, fontSize:14, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit' }}>
          {loading==='declined'?'…':'✕ Refuser'}
        </button>
      </div>
    </div>
  )
}

// ─── CHAT RÉEL ────────────────────────────────────────────────────────────────
function Chat({ clutch, user, go }: any) {
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  // MSG_LIMIT est par conversation (pas par user) — 5 pour tous.
  // Le but : pousser vers le vrai RDV, pas créer de l'app-comfort.
  // Premium = plus de clutches par jour, pas plus de messages.
  const MSG_LIMIT = 5
  if (!clutch) return null
  const other = clutch.sender_id === user.id ? clutch.receiver : clutch.sender

  useEffect(()=>{
    supabase.from('messages').select('*').eq('clutch_id', clutch.id).order('created_at')
      .then(({data})=>{ if(data) setMessages(data) })
    const ch = supabase.channel(`chat-${clutch.id}`)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:`clutch_id=eq.${clutch.id}`},
        payload=>setMessages(prev=>[...prev,payload.new]))
      .subscribe()
    return ()=>{ supabase.removeChannel(ch) }
  },[clutch.id])

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[messages])

  const [inputErr, setInputErr] = useState('')
  const send = async () => {
    if(!input.trim()||messages.length>=MSG_LIMIT) return
    const text=input.trim()
    const lower=text.toLowerCase()
    if(BANNED_WORDS.some(w=>lower.includes(w))){setInputErr('Message inapproprié — merci de rester respectueux·se');setTimeout(()=>setInputErr(''),3000);return}
    setInput('');setInputErr('')
    await supabase.from('messages').insert({clutch_id:clutch.id,sender_id:user.id,content:text})
  }

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:C.bg }}>
      <TopBar title={other?.name||'Chat'} onBack={()=>go('inbox')}/>
      {/* Bandeau limite messages — bien visible pour les deux utilisateurs */}
      <div style={{ padding:'8px 16px', background:messages.length >= MSG_LIMIT ? C.redLight : messages.length >= MSG_LIMIT - 1 ? '#FFF3CD' : C.bgDeep, borderBottom:`1px solid ${messages.length >= MSG_LIMIT ? C.red+'44' : C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <span style={{ fontSize:11, color:C.textMid, fontWeight:500 }}>📍 {clutch.venue}</span>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {messages.length < MSG_LIMIT && (
            <div style={{ display:'flex', gap:3, alignItems:'center' }}>
              {[...Array(MSG_LIMIT)].map((_,i) => (
                <div key={i} style={{ width:8, height:8, borderRadius:'50%', background: i < messages.length ? C.primary : C.border }}/>
              ))}
            </div>
          )}
          <span style={{ fontSize:12, fontWeight:800, color: messages.length >= MSG_LIMIT ? C.red : messages.length >= MSG_LIMIT - 1 ? '#B45309' : C.textMid }}>
            {messages.length >= MSG_LIMIT ? '🚫 Max atteint' : `${Math.max(0, MSG_LIMIT - messages.length)} msg restant${Math.max(0, MSG_LIMIT - messages.length) > 1?'s':''}`}
          </span>
        </div>
      </div>
      <div style={{ flex:1, minHeight:0, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y', padding:'12px 16px', display:'flex', flexDirection:'column', gap:8 }}>
        {messages.map(m=>{
          const isMine = m.sender_id === user.id
          return (
            <div key={m.id} style={{ display:'flex', justifyContent:isMine?'flex-end':'flex-start' }}>
              <div style={{ maxWidth:'78%', padding:'9px 13px', borderRadius:isMine?'16px 16px 4px 16px':'16px 16px 16px 4px', background:isMine?`linear-gradient(135deg,${C.primary},${C.primaryDark})`:'#fff', color:isMine?'#fff':C.text, fontSize:14, lineHeight:1.5, border:isMine?'none':`1px solid ${C.border}` }}>
                {m.content}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef}/>
      </div>
      {messages.length >= MSG_LIMIT
        ? <div style={{ padding:'16px 20px 24px', textAlign:'center', background:C.redLight, borderTop:`1px solid ${C.red}22` }}>
            <p style={{ fontSize:15, fontWeight:800, color:C.red, marginBottom:4 }}>🚫 5 messages max</p>
            <p style={{ fontSize:13, color:C.textMid }}>Clutch limite les messages pour t'encourager à vraiment vous voir ☕</p>
          </div>
        : <div style={{ background:C.bg, borderTop:`1px solid ${C.border}` }}>
            {inputErr&&<p style={{ fontSize:11, color:C.red, padding:'4px 16px 0', textAlign:'center' }}>{inputErr}</p>}
            <div style={{ padding:'10px 16px 24px', display:'flex', gap:8 }}>
              <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Ton message…"
                style={{ flex:1, padding:'11px 14px', borderRadius:20, border:`1.5px solid ${inputErr?C.red:C.border}`, background:C.bgDeep, fontSize:14, outline:'none', color:C.text, fontFamily:'inherit' }}/>
              <button onClick={send} disabled={!input.trim()} style={{ padding:'11px 18px', borderRadius:20, border:'none', background:input.trim()?`linear-gradient(135deg,${C.primary},${C.primaryDark})`:C.bgDeep, color:input.trim()?'#fff':C.textLight, fontWeight:700, fontSize:14, cursor:input.trim()?'pointer':'not-allowed', fontFamily:'inherit' }}>→</button>
            </div>
          </div>
      }
    </div>
  )
}

// ─── RDV ACTIVE ───────────────────────────────────────────────────────────────
function RdvActive({ clutch, user, go, refresh, sendPush }: any) {
  const [countdown, setCountdown] = useState(0)
  const [myPos, setMyPos] = useState<{lat:number;lng:number}|null>(null)
  const [otherPos, setOtherPos] = useState<{lat:number;lng:number}|null>(null)
  const [distance, setDistance] = useState<number|null>(null)
  const [merged, setMerged] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [cancelledByOther, setCancelledByOther] = useState(false)
  if (!clutch) return null

  // Surveillance annulation par l'autre — realtime sur ce clutch précis
  useEffect(() => {
    if (!clutch?.id) return
    const ch = supabase.channel(`rdv-cancel-${clutch.id}`)
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'clutches', filter:`id=eq.${clutch.id}` },
        ({ new: updated }) => {
          if (updated.status === 'cancelled') {
            setCancelledByOther(true)
            refresh()
          }
        })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [clutch.id])
  const other = clutch.sender_id === user.id ? clutch.receiver : clutch.sender
  const meetTime = new Date(clutch.proposed_time)

  // Countdown
  useEffect(()=>{
    const update = () => setCountdown(Math.max(0, meetTime.getTime() - Date.now()))
    update(); const t = setInterval(update, 1000); return ()=>clearInterval(t)
  },[])

  const isNow = countdown <= 0
  const h = Math.floor(countdown/3600000)
  const m = Math.floor((countdown%3600000)/60000)
  const s = Math.floor((countdown%60000)/1000)

  // GPS Realtime — s'active à l'heure du RDV
  useEffect(()=>{
    if (!isNow) return
    const ch = supabase.channel(`prox-${clutch.id}`)
      .on('broadcast',{event:'pos'},({payload})=>{
        if(payload.uid!==user.id) setOtherPos({lat:payload.lat,lng:payload.lng})
      })
      .subscribe()
    const wid = navigator.geolocation?.watchPosition(pos=>{
      const {latitude:lat,longitude:lng} = pos.coords
      setMyPos({lat,lng})
      ch.send({type:'broadcast',event:'pos',payload:{lat,lng,uid:user.id}})
    },null,{enableHighAccuracy:true,maximumAge:8000})
    return ()=>{ supabase.removeChannel(ch); navigator.geolocation?.clearWatch(wid) }
  },[isNow])

  // Haversine distance
  useEffect(()=>{
    if(!myPos||!otherPos) return
    const R=6371000
    const φ1=myPos.lat*Math.PI/180, φ2=otherPos.lat*Math.PI/180
    const Δφ=(otherPos.lat-myPos.lat)*Math.PI/180, Δλ=(otherPos.lng-myPos.lng)*Math.PI/180
    const a=Math.sin(Δφ/2)**2+Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2
    const d=Math.round(2*R*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)))
    setDistance(d)
    if(d<=50&&!merged){
      setMerged(true)
      const field=clutch.sender_id===user.id?'checked_in_sender':'checked_in_receiver'
      supabase.from('clutches').update({[field]:true,status:'completed'}).eq('id',clutch.id)
      refresh()
      setTimeout(()=>setShowFeedback(true),3500)
    }
  },[myPos,otherPos])

  const cancel = async()=>{
    if (!confirm(`Annuler ce RDV avec ${other?.name} ?\n\nCela affectera ton score de fiabilité.`)) return
    await supabase.from('clutches').update({status:'cancelled'}).eq('id',clutch.id)
    // Notifier l'autre personne que le RDV est annulé
    const otherId = clutch.sender_id === user.id ? clutch.receiver_id : clutch.sender_id
    sendPush?.(otherId, `❌ RDV annulé par ${user.name}`, `Votre RDV au ${clutch.venue} a été annulé. Tu peux en proposer un nouveau.`)
    refresh(); go('inbox')
  }
  const manualCheckin = async()=>{
    const field=clutch.sender_id===user.id?'checked_in_sender':'checked_in_receiver'
    await supabase.from('clutches').update({[field]:true,status:'completed'}).eq('id',clutch.id)
    refresh(); go('feedback')
  }

  // Dark theme — "mission mode"
  const D = {bg:'#0A0A0A',card:'#141414',border:'#252525',text:'#FFFFFF',mid:'#9CA3AF',dim:'#6B7280',amber:'#F59E0B',green:'#22C55E'}

  // Si l'autre a annulé → modal bloquant
  if (cancelledByOther) return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#0A0A0A', padding:32, gap:20, textAlign:'center' }}>
      <div style={{ fontSize:64 }}>❌</div>
      <h2 style={{ fontSize:22, fontWeight:800, color:'#fff' }}>RDV annulé</h2>
      <p style={{ color:'#9CA3AF', lineHeight:1.6, fontSize:14 }}>{other?.name} a annulé ce RDV.<br/>Ça arrive — tu peux en proposer un nouveau.</p>
      <button onClick={()=>go('discover')} style={{ padding:'14px 28px', borderRadius:14, border:'none', background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`, color:'#fff', fontWeight:800, fontSize:15, cursor:'pointer', fontFamily:'inherit' }}>
        Retour à Discover ✦
      </button>
    </div>
  )

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',background:D.bg}}>
      {/* TopBar dark avec logo */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px 10px',background:D.bg,borderBottom:`1px solid ${D.border}`,flexShrink:0}}>
        <button onClick={()=>go('inbox')} style={{background:'none',border:'none',cursor:'pointer',fontSize:22,color:D.dim,minWidth:40}}>←</button>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <CclutchLogo size={28}/>
          <span style={{fontWeight:800,fontSize:15,color:D.text,letterSpacing:'-0.02em'}}>C'est parti ! ☕</span>
        </div>
        <div style={{minWidth:40}}/>
      </div>

      <div style={{flex:1,minHeight:0,overflowY:'scroll',WebkitOverflowScrolling:'touch',touchAction:'pan-y',padding:'14px 18px 28px',display:'flex',flexDirection:'column',gap:12}}>

        {/* Carte personne */}
        <div style={{display:'flex',alignItems:'center',gap:14,background:D.card,borderRadius:20,padding:'14px 18px',border:`1px solid ${D.border}`}}>
          <Avatar p={other||{}} size={50}/>
          <div style={{flex:1,minWidth:0}}>
            <p style={{fontWeight:900,fontSize:18,color:D.text}}>{other?.name}</p>
            <p style={{fontSize:12,color:D.mid,marginTop:2}}>📍 {clutch.venue}</p>
            <p style={{fontSize:12,color:D.mid}}>🗓 {meetTime.toLocaleString('fr-CH',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</p>
          </div>
          <ReliabilityStars score={other?.reliability_score||100} light/>
        </div>

        {/* Countdown ou Proximity Meter */}
        {!isNow ? (
          <div style={{background:D.card,border:`1px solid ${D.border}`,borderRadius:24,padding:'28px 20px',textAlign:'center'}}>
            <p style={{fontSize:11,color:D.dim,letterSpacing:'0.12em',fontWeight:700,marginBottom:14,textTransform:'uppercase'}}>Rendez-vous dans</p>
            <div style={{fontSize:54,fontWeight:900,color:D.text,letterSpacing:'-0.04em',lineHeight:1,marginBottom:10}}>
              {h>0&&<><span style={{color:D.amber}}>{h}</span><span style={{fontSize:26,color:D.dim}}>h </span></>}
              <span style={{color:D.amber}}>{String(m).padStart(2,'0')}</span>
              <span style={{fontSize:26,color:D.dim}}>m </span>
              <span style={{color:D.amber}}>{String(s).padStart(2,'0')}</span>
              <span style={{fontSize:26,color:D.dim}}>s</span>
            </div>
            <p style={{fontSize:12,color:D.dim}}>Le proximity meter s'active à l'heure du RDV ↓</p>
          </div>
        ) : (
          <div style={{background:D.card,border:`1px solid ${D.border}`,borderRadius:24,padding:'22px 18px'}}>
            <p style={{fontSize:11,color:D.dim,letterSpacing:'0.12em',fontWeight:700,marginBottom:18,textAlign:'center',textTransform:'uppercase'}}>Proximity Meter</p>
            <ProximityMeter distance={distance} merged={merged}/>
          </div>
        )}

        {/* Prompt feedback auto-déclenché */}
        {showFeedback&&(
          <div style={{background:'#0D2818',border:'1px solid #166534',borderRadius:18,padding:20,textAlign:'center',animation:'slideUp 0.4s ease-out'}}>
            <p style={{color:D.green,fontWeight:900,fontSize:17,marginBottom:6}}>🎉 Vous vous êtes trouvés !</p>
            <p style={{color:D.mid,fontSize:13,marginBottom:16}}>Comment s'est passé votre rencontre ?</p>
            <button onClick={()=>go('feedback')} style={{padding:'12px 28px',borderRadius:14,border:'none',background:D.green,color:'#000',fontWeight:800,fontSize:15,cursor:'pointer',fontFamily:'inherit'}}>
              Donner mon avis →
            </button>
          </div>
        )}

        {/* Actions secondaires */}
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <button onClick={()=>{setSelectedClutch_HACK(clutch);go('chat')}}
            style={{padding:13,borderRadius:14,background:D.card,border:`1px solid ${D.border}`,cursor:'pointer',color:D.mid,fontSize:13,fontWeight:600,fontFamily:'inherit',textAlign:'left'}}>
            💬 Envoyer un message
          </button>
          <button onClick={()=>shareIt({title:'Mon RDV Clutch',text:`Je rencontre quelqu'un via Clutch à ${clutch.venue} !`,url:`https://maps.google.com/?q=${encodeURIComponent(clutch.venue+' Lausanne')}`})}
            style={{padding:12,borderRadius:14,background:D.card,border:`1px solid ${D.border}`,cursor:'pointer',color:D.mid,fontSize:13,fontFamily:'inherit',textAlign:'left'}}>
            📤 Partager ma position avec un proche
          </button>
          <button onClick={()=>go('sos')}
            style={{padding:12,borderRadius:14,background:'#1A0808',border:'1px solid #7F1D1D',cursor:'pointer',color:'#F87171',fontWeight:700,fontSize:13,fontFamily:'inherit',textAlign:'left'}}>
            🆘 SOS · Sécurité
          </button>
        </div>

        {/* Check-in manuel (si GPS indisponible) */}
        {isNow&&!merged&&(
          <button onClick={manualCheckin}
            style={{padding:14,borderRadius:14,border:'none',background:`linear-gradient(135deg,${D.green},#15803D)`,color:'#fff',fontWeight:800,fontSize:15,cursor:'pointer',fontFamily:'inherit'}}>
            ✓ Je suis arrivé·e (check-in manuel)
          </button>
        )}

        <button onClick={cancel}
          style={{padding:10,borderRadius:12,background:'none',border:`1px solid ${D.border}`,color:D.dim,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>
          Annuler le RDV
        </button>
      </div>
    </div>
  )
}
// ─── FEEDBACK APRÈS RDV ───────────────────────────────────────────────────────
function FeedbackRdv({ clutch, user, go }: any) {
  const [rating, setRating] = useState<string|null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const other = clutch ? (clutch.sender_id===user?.id ? clutch.receiver : clutch.sender) : null

  const submit = async () => {
    if (!rating || !clutch?.id) { go('discover'); return }
    setLoading(true)
    await supabase.from('feedback').insert({ clutch_id: clutch.id, given_by: user.id, rating })
    // Mettre à jour le score de fiabilité de l'autre personne
    if (other?.id) {
      const otherId = clutch.sender_id===user.id ? clutch.receiver_id : clutch.sender_id
      if (rating === 'ghost' || rating === 'rabbit') {
        const { data: p } = await supabase.from('profiles').select('reliability_score').eq('id', otherId).single()
        const newScore = Math.max(0, (p?.reliability_score||100) - 15)
        await supabase.from('profiles').update({ reliability_score: newScore }).eq('id', otherId)
      } else if (rating === 'super') {
        const { data: p } = await supabase.from('profiles').select('reliability_score').eq('id', otherId).single()
        const newScore = Math.min(100, (p?.reliability_score||100) + 3)
        await supabase.from('profiles').update({ reliability_score: newScore }).eq('id', otherId)
      }
    }
    setDone(true); setLoading(false)
  }

  if (done) return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:`linear-gradient(160deg,${C.bg},${C.sageLight})`, padding:40, gap:20, textAlign:'center' }}>
      <div style={{ fontSize:64 }}>{rating==='super'?'⭐':rating==='ok'?'😊':rating==='rabbit'?'🐇':'👻'}</div>
      <h2 style={{ fontSize:22, fontWeight:800, color:C.text }}>Merci pour ton retour !</h2>
      <p style={{ color:C.textMid, fontSize:14, lineHeight:1.6 }}>Ça aide à maintenir une communauté de qualité sur Clutch.</p>
      <Btn onClick={()=>go('discover')}>Retour à la liste ✦</Btn>
    </div>
  )

  const opts = [
    { id:'super', emoji:'⭐', label:'Super RDV !', desc:'On s\'est bien vus, c\'était génial', color:C.gold },
    { id:'ok', emoji:'😊', label:'RDV correct', desc:'Rien d\'extraordinaire mais c\'était bien', color:C.sage },
    { id:'rabbit', emoji:'🐇', label:'Lapin partiel', desc:'En retard ou pas tout à fait comme prévu', color:C.peach },
    { id:'ghost', emoji:'👻', label:'Fantôme / No-show', desc:'La personne n\'est pas venue sans prévenir', color:C.red },
  ]

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:C.bg }}>
      <TopBar title="Comment s'est passé le RDV ?" onBack={()=>go('discover')}/>
      <div style={{ flex:1, minHeight:0, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y', padding:'20px 20px' }}>
        {other && (
          <div style={{ display:'flex', alignItems:'center', gap:12, background:C.bgDeep, borderRadius:14, padding:'12px 16px', marginBottom:20 }}>
            <Avatar p={other} size={44}/>
            <div>
              <p style={{ fontWeight:700, color:C.text, fontSize:15 }}>RDV avec {other.name}</p>
              <p style={{ fontSize:12, color:C.textLight }}>📍 {clutch?.venue}</p>
            </div>
          </div>
        )}
        <p style={{ fontWeight:700, color:C.text, fontSize:14, marginBottom:12 }}>Comment s'est passé votre rencontre ?</p>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {opts.map(o => (
            <button key={o.id} onClick={()=>setRating(o.id)} style={{ padding:'14px 16px', borderRadius:14, border:`2px solid ${rating===o.id?o.color:C.border}`, background:rating===o.id?`${o.color}18`:C.card, textAlign:'left', cursor:'pointer', display:'flex', gap:14, alignItems:'center' }}>
              <span style={{ fontSize:28 }}>{o.emoji}</span>
              <div>
                <p style={{ fontWeight:700, color:rating===o.id?o.color:C.text, fontSize:14 }}>{o.label}</p>
                <p style={{ fontSize:12, color:C.textLight, marginTop:2 }}>{o.desc}</p>
              </div>
            </button>
          ))}
        </div>
        <p style={{ fontSize:11, color:C.textLight, textAlign:'center', marginTop:16, lineHeight:1.5 }}>Ton retour est anonyme. Il influe sur le score de fiabilité de l'autre personne.</p>
      </div>
      <div style={{ padding:'12px 20px 28px', display:'flex', flexDirection:'column', gap:10 }}>
        <Btn onClick={submit} loading={loading} disabled={!rating}>Envoyer mon retour →</Btn>
        <button onClick={()=>go('discover')} style={{ background:'none', border:'none', color:C.textLight, fontSize:13, cursor:'pointer' }}>Passer</button>
      </div>
    </div>
  )
}

// ─── PROFIL CERTIFIÉ ──────────────────────────────────────────────────────────
function GetCertified({ user, go, save }: any) {
  const [step, setStep] = useState<'intro'|'selfie'|'done'>(user?.certified?'done':'intro')
  const [preview, setPreview] = useState<string|null>(null)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader(); r.onload = ev => setPreview(ev.target?.result as string); r.readAsDataURL(f)
  }

  const submit = async () => {
    if (!preview || !ref.current?.files?.[0]) return
    setLoading(true)
    try {
      const file = ref.current.files[0]
      const path = `${user.id}/selfie_certif.${file.name.split('.').pop()}`
      await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('profiles').update({ certif_selfie: publicUrl, certif_status: 'pending' }).eq('id', user.id)
      save({ certif_status: 'pending' })
      setStep('done')
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  if (user?.certified) return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:C.bg, padding:40, gap:20, textAlign:'center' }}>
      <div style={{ fontSize:64 }}>✅</div>
      <h2 style={{ fontSize:22, fontWeight:800, color:C.text }}>Profil certifié !</h2>
      <div style={{ background:C.sageLight, borderRadius:16, padding:16 }}><p style={{ color:C.sage, fontWeight:600 }}>✓ Ton badge de certification est actif</p></div>
      <Btn variant="secondary" onClick={()=>go('myprofile')}>← Retour au profil</Btn>
    </div>
  )

  if (step === 'done') return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:`linear-gradient(160deg,${C.bg},${C.sageLight})`, padding:40, gap:20, textAlign:'center' }}>
      <div style={{ fontSize:64 }}>⏳</div>
      <h2 style={{ fontSize:22, fontWeight:800, color:C.text }}>Selfie envoyé !</h2>
      <p style={{ color:C.textMid, fontSize:14, lineHeight:1.7 }}>L'équipe Clutch vérifie ton selfie sous <strong>24h</strong>.<br/>Tu recevras une confirmation par email.</p>
      <div style={{ background:C.card, borderRadius:14, padding:16, width:'100%', border:`1px solid ${C.border}`, fontSize:13, color:C.textMid, lineHeight:1.6 }}>
        ✅ Une fois certifié·e :<br/>
        📌 Badge <strong>✓ Certifié</strong> sur ton profil<br/>
        🔝 Priorité dans la liste de découverte<br/>
        💜 3× plus de clutches reçus
      </div>
      <Btn onClick={()=>go('myprofile')}>← Retour au profil</Btn>
    </div>
  )

  if (step === 'selfie') return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'32px 24px', gap:20, background:C.bg }}>
      <button onClick={()=>setStep('intro')} style={{ background:'none', border:'none', fontSize:22, color:C.textMid, cursor:'pointer', alignSelf:'flex-start' }}>←</button>
      <div>
        <h2 style={{ fontSize:22, fontWeight:800, color:C.text }}>Selfie de vérification</h2>
        <p style={{ color:C.textMid, fontSize:14, marginTop:6 }}>Tiens ton téléphone devant toi, sourire obligatoire 😊</p>
      </div>
      <div style={{ background:C.bgDeep, borderRadius:14, padding:'12px 16px', display:'flex', flexDirection:'column', gap:6 }}>
        <p style={{ fontSize:13, fontWeight:700, color:C.text }}>📋 Instructions :</p>
        {['Prends un selfie clair de ton visage','Pas de filtre, pas de photo de photo','Même visage que ta photo de profil'].map(t=><p key={t} style={{ fontSize:13, color:C.textMid }}>• {t}</p>)}
      </div>
      <input ref={ref} type="file" accept="image/*" capture="user" onChange={onChange} style={{ display:'none' }}/>
      <div onClick={()=>ref.current?.click()} style={{ alignSelf:'center', width:160, height:160, borderRadius:'50%', background:preview?`url(${preview}) center/cover no-repeat`:C.bgDeep, border:`3px dashed ${preview?C.sage:C.border}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, cursor:'pointer', overflow:'hidden' }}>
        {!preview&&<><span style={{ fontSize:44 }}>🤳</span><span style={{ color:C.textLight, fontSize:12 }}>Prendre un selfie</span></>}
      </div>
      {preview&&<p style={{ textAlign:'center', color:C.sage, fontWeight:600 }}>✓ Parfait ! On dirait bien toi 😄</p>}
      <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', gap:10 }}>
        <Btn loading={loading} disabled={!preview} onClick={submit}>Envoyer pour vérification →</Btn>
      </div>
    </div>
  )

  // step = 'intro'
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'32px 24px', gap:20, background:C.bg, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y' }}>
      <button onClick={()=>go('myprofile')} style={{ background:'none', border:'none', fontSize:22, color:C.textMid, cursor:'pointer', alignSelf:'flex-start' }}>←</button>
      <div style={{ textAlign:'center', paddingTop:8 }}>
        <div style={{ fontSize:56, marginBottom:12 }}>✓</div>
        <h2 style={{ fontSize:24, fontWeight:800, color:C.text }}>Fais certifier ton profil</h2>
        <p style={{ color:C.textMid, fontSize:14, marginTop:8, lineHeight:1.7 }}>Un selfie rapide suffit. L'équipe Clutch vérifie que c'est bien toi sous 24h.</p>
      </div>
      {[
        { icon:'🔝', title:'Priorité dans la liste', desc:'Les profils certifiés apparaissent en premier' },
        { icon:'💌', title:'3× plus de clutches', desc:'Les gens font + confiance aux profils vérifiés' },
        { icon:'🛡', title:'Badge visible', desc:'✓ Certifié sur ta fiche — rassurant pour tous' },
      ].map(b=>(
        <div key={b.title} style={{ background:C.card, borderRadius:14, padding:'14px 16px', border:`1px solid ${C.border}`, display:'flex', gap:14, alignItems:'center' }}>
          <span style={{ fontSize:28 }}>{b.icon}</span>
          <div><p style={{ fontWeight:700, color:C.text, fontSize:14 }}>{b.title}</p><p style={{ color:C.textLight, fontSize:12, marginTop:2 }}>{b.desc}</p></div>
        </div>
      ))}
      <div style={{ background:C.bgDeep, borderRadius:12, padding:'12px 16px', fontSize:12, color:C.textLight, lineHeight:1.6 }}>
        🔒 Ton selfie est utilisé uniquement pour la vérification et supprimé après. Jamais partagé publiquement.
      </div>
      <div style={{ marginTop:'auto' }}>
        <Btn onClick={()=>setStep('selfie')}>Commencer la vérification → (30 sec)</Btn>
      </div>
    </div>
  )
}

// hack ref pour chat depuis RdvActive (pas de closure propre sans refactor)
let setSelectedClutch_HACK: (c:any)=>void = ()=>{}

function Sos({ go }: { go:(s:Screen)=>void }) {
  const [gpsStatus,setGpsStatus]=useState<'idle'|'loading'|'active'|'error'>('idle')
  const [gpsCoords,setGpsCoords]=useState<{lat:number;lng:number}|null>(null)
  const [gpsTime,setGpsTime]=useState(0)
  const timerRef=useRef<any>(null)
  const [contacts,setContacts]=useState<{name:string;phone:string}[]>(()=>JSON.parse(typeof window!=='undefined'?localStorage.getItem('sos_contacts')||'[]':'[]'))
  const [addingContact,setAddingContact]=useState(false)
  const [cName,setCName]=useState('')
  const [cPhone,setCPhone]=useState('')
  const saveContact=()=>{if(!cName.trim()||!cPhone.trim())return;const updated=[...contacts,{name:cName.trim(),phone:cPhone.trim()}];setContacts(updated);localStorage.setItem('sos_contacts',JSON.stringify(updated));setCName('');setCPhone('');setAddingContact(false)}
  const removeContact=(i:number)=>{const updated=contacts.filter((_,idx)=>idx!==i);setContacts(updated);localStorage.setItem('sos_contacts',JSON.stringify(updated))}

  const startGps=()=>{
    if(!navigator.geolocation){setGpsStatus('error');return}
    setGpsStatus('loading')
    navigator.geolocation.getCurrentPosition(
      pos=>{
        setGpsCoords({lat:pos.coords.latitude,lng:pos.coords.longitude})
        setGpsStatus('active')
        setGpsTime(0)
        timerRef.current=setInterval(()=>setGpsTime(t=>t+1),1000)
      },
      ()=>setGpsStatus('error'),
      {enableHighAccuracy:true}
    )
  }
  const stopGps=()=>{
    setGpsStatus('idle');setGpsCoords(null)
    if(timerRef.current)clearInterval(timerRef.current)
  }
  const fmtTime=(s:number)=>`${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`
  const mapsUrl=gpsCoords?`https://maps.google.com/?q=${gpsCoords.lat},${gpsCoords.lng}`:''

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:C.bg, minHeight:0 }}>
      <TopBar title="Sécurité" onBack={()=>go('myprofile')}/>
      <div style={{ flex:1, minHeight:0, padding:'12px 20px', display:'flex', flexDirection:'column', gap:14, overflowY:'scroll', WebkitOverflowScrolling:'touch', touchAction:'pan-y' }}>
        <div style={{ padding:16, background:C.redLight, borderRadius:16, border:`1.5px solid ${C.red}33`, textAlign:'center' }}>
          <p style={{ fontSize:32 }}>🆘</p>
          <p style={{ fontWeight:700, color:C.red, fontSize:16 }}>Besoin d'aide ?</p>
        </div>
        <a href="tel:117" style={{ display:'block', padding:18, borderRadius:16, background:`linear-gradient(135deg,${C.red},#B83030)`, color:'#fff', fontWeight:800, fontSize:17, textAlign:'center', textDecoration:'none' }}>📞 Appeler le 117 (Police)</a>
        <a href="tel:144" style={{ display:'block', padding:14, borderRadius:16, background:C.redLight, border:`1.5px solid ${C.red}44`, color:C.red, fontWeight:700, fontSize:15, textAlign:'center', textDecoration:'none' }}>🚑 Appeler le 144 (Urgences)</a>

        {/* GPS position sharing */}
        <div style={{ background:C.card, borderRadius:16, padding:16, border:`1px solid ${C.border}` }}>
          <p style={{ fontWeight:700, color:C.text, marginBottom:10, fontSize:14 }}>📍 Partager ma position GPS</p>
          {gpsStatus==='idle'&&(
            <button onClick={startGps} style={{ width:'100%', padding:12, borderRadius:12, border:'none', background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`, color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>Activer le partage de position</button>
          )}
          {gpsStatus==='loading'&&<p style={{ color:C.textLight, fontSize:13, textAlign:'center' }}>Localisation en cours…</p>}
          {gpsStatus==='error'&&<p style={{ color:C.red, fontSize:13 }}>GPS non disponible. Copie ce lien manuellement.</p>}
          {gpsStatus==='active'&&gpsCoords&&(
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ background:C.sageLight, borderRadius:10, padding:'10px 14px' }}>
                <p style={{ color:C.sage, fontWeight:700, fontSize:13 }}>● Position active depuis {fmtTime(gpsTime)}</p>
                <p style={{ fontSize:11, color:C.textMid, marginTop:4 }}>{gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)}</p>
              </div>
              <a href={mapsUrl} target="_blank" rel="noreferrer" style={{ display:'block', padding:10, borderRadius:10, background:C.bgDeep, border:`1px solid ${C.border}`, color:C.primary, fontWeight:700, fontSize:13, textAlign:'center', textDecoration:'none' }}>Ouvrir dans Google Maps →</a>
              <button onClick={()=>{if(navigator.share){navigator.share({title:'Ma position Clutch',url:mapsUrl})}else{navigator.clipboard?.writeText(mapsUrl)}}} style={{ width:'100%', padding:10, borderRadius:10, border:`1.5px solid ${C.primary}`, background:'transparent', color:C.primary, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>📋 Copier le lien de position</button>
              <button onClick={stopGps} style={{ background:'none', border:'none', color:C.textLight, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>Arrêter le partage</button>
            </div>
          )}
        </div>

        {/* Contacts de confiance */}
        <div style={{ background:C.card, borderRadius:16, padding:16, border:`1px solid ${C.border}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <p style={{ fontWeight:700, color:C.text, fontSize:14 }}>👥 Contacts de confiance</p>
            <button onClick={()=>setAddingContact(!addingContact)} style={{ background:'none', border:'none', color:C.primary, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>{addingContact?'Annuler':'+ Ajouter'}</button>
          </div>
          {addingContact&&(
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:10 }}>
              <input value={cName} onChange={e=>setCName(e.target.value)} placeholder="Prénom (ex: Maman)" style={{ padding:'9px 12px', borderRadius:10, border:`1.5px solid ${C.border}`, background:C.bgDeep, fontSize:13, color:C.text, outline:'none', fontFamily:'inherit' }}/>
              <input value={cPhone} onChange={e=>setCPhone(e.target.value)} placeholder="Numéro (ex: +41 79 000 00 00)" type="tel" style={{ padding:'9px 12px', borderRadius:10, border:`1.5px solid ${C.border}`, background:C.bgDeep, fontSize:13, color:C.text, outline:'none', fontFamily:'inherit' }}/>
              <button onClick={saveContact} style={{ padding:'9px', borderRadius:10, border:'none', background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Sauvegarder</button>
            </div>
          )}
          {contacts.length===0&&!addingContact&&<p style={{ fontSize:12, color:C.textLight }}>Ajoute des proches pour partager ta position en cas de besoin.</p>}
          {contacts.map((c,i)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:`1px solid ${C.border}` }}>
              <div><p style={{ fontWeight:600, fontSize:13, color:C.text }}>{c.name}</p><p style={{ fontSize:11, color:C.textLight }}>{c.phone}</p></div>
              <div style={{ display:'flex', gap:8 }}>
                <a href={`tel:${c.phone}`} style={{ padding:'5px 10px', borderRadius:8, background:C.sageLight, color:C.sage, fontSize:12, fontWeight:700, textDecoration:'none' }}>📞</a>
                <button onClick={()=>removeContact(i)} style={{ padding:'5px 10px', borderRadius:8, background:C.redLight, color:C.red, border:'none', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>✕</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background:C.card, borderRadius:14, padding:16, border:`1px solid ${C.border}` }}>
          <p style={{ fontWeight:700, color:C.text, marginBottom:8 }}>💡 Conseils</p>
          {['Premier RDV = lieu public animé','Dis à un proche où tu vas','Fais confiance à ton instinct','Tu peux partir à tout moment'].map(tip=>(
            <p key={tip} style={{ fontSize:13, color:C.textMid, padding:'4px 0', display:'flex', gap:8 }}><span style={{ color:C.sage }}>✓</span>{tip}</p>
          ))}
        </div>
        <Btn variant="secondary" onClick={()=>go('myprofile')}>← Retour</Btn>
      </div>
    </div>
  )
}


// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>('splash')
  const [user, setUser] = useState<any>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [clutches, setClutches] = useState<any[]>([])
  const [pendingBadge, setPendingBadge] = useState(0)
  const [tab, setTabState] = useState('discover')
  const [loading, setLoading] = useState(true)
  const [selectedProfile, setSelectedProfile] = useState<Profile|null>(null)
  const [selectedClutch, setSelectedClutch] = useState<any>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [frameH, setFrameH] = useState('100dvh')
  useEffect(() => {
    const mobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    setIsMobile(mobile)
    if (mobile) {
      // window.innerHeight = hauteur visible réelle sur iOS Safari (exclut la barre browser)
      const updateH = () => { setFrameH(window.innerHeight + 'px') }
      updateH()
      // Petit délai pour laisser iOS recalculer après rendu initial
      setTimeout(updateH, 150)
      window.addEventListener('resize', updateH)
      window.visualViewport?.addEventListener('resize', updateH)
      return () => {
        window.removeEventListener('resize', updateH)
        window.visualViewport?.removeEventListener('resize', updateH)
      }
    }
  }, [])
  // propose state
  const [venueInput, setVenueInput] = useState('')
  const [selectedVenue, setSelectedVenue] = useState('')
  const [venueSafety, setVenueSafety] = useState<'safe'|'neutral'|'alert'>('safe')
  const [selectedTime, setSelectedTime] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const go = (s: Screen) => setScreen(s)
  const isUserPremium = ['premium','partner','admin'].includes(user?.account_type||'')
  const isUserReallyAvail = (() => {
    if (!user?.is_available) return false
    const until = user?.available_until ? new Date(user.available_until) : null
    return until ? until > new Date() : false
  })()
  const setTab = (t: string) => {
    // Gate : Discover et Événements nécessitent d'être disponible (sauf premium)
    if ((t==='discover'||t==='events') && !isUserReallyAvail && !isUserPremium) {
      setScreen('set-avail')
      return
    }
    setTabState(t); setScreen(t as Screen)
  }
  const save = (patch: any) => setUser((u: any) => ({ ...u, ...patch }))
  // Expose setSelectedClutch for RdvActive → Chat navigation
  useEffect(() => { setSelectedClutch_HACK = setSelectedClutch }, [])
  const refreshClutches = () => supabase.from('clutches').select('*,sender:profiles!clutches_sender_id_fkey(*),receiver:profiles!clutches_receiver_id_fkey(*)')
    .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
    .then(({ data }) => { if (data) { setClutches(data); setPendingBadge(data.filter((c:any) => (c.receiver_id===user?.id&&c.status==='pending')||(c.sender_id===user?.id&&c.status==='counter')).length) } })

  useEffect(() => {
    // Timeout de sécurité : si Supabase ne répond pas en 8s, on affiche quand même l'app
    const timeout = setTimeout(() => setLoading(false), 8000)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(timeout)
      if (session?.user) {
        try {
          const { data: p, error: pErr } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
          console.log('[Clutch] profile fetch:', { p, pErr, userId: session.user.id })
          const u = p || { id: session.user.id, email: session.user.email }
          setUser(u)
          const obKey = 'ob_' + session.user.id
          const obDone = localStorage.getItem(obKey)
          const hasName = p?.name && p.name !== 'Utilisateur'
          console.log('[Clutch] routing:', { hasName, obDone, name: p?.name, hasPhoto: !!p?.photo_url })
          if (hasName) {
            localStorage.setItem(obKey, '1')
            // Gate photo : sans photo on ne peut pas accéder à l'app
            if (!p?.photo_url) { setScreen('ob-photo'); setLoading(false); return }
            const isPremium = ['premium','partner','admin'].includes(p?.account_type||'')
            const now = new Date()
            const until = p?.available_until ? new Date(p.available_until) : null
            const isReallyAvail = p?.is_available && until && until > now
            // Dispo expirée → reset silencieux en base
            if (p?.is_available && (!until || until <= now)) {
              supabase.from('profiles').update({is_available:false,available_from:null,available_until:null}).eq('id', session.user.id)
              u.is_available = false; u.available_from = null; u.available_until = null
            }
            if (!isPremium && !isReallyAvail) setScreen('set-avail')
            else setScreen('discover')
          } else if (obDone) {
            setScreen('discover')
          } else {
            // Nouveau compte → Onboarding
            setScreen('ob-name')
          }
        } catch(e) { console.error('[Clutch] profile load error', e); setScreen('ob-name') }
      }
      setLoading(false)
    }).catch(e => { clearTimeout(timeout); console.error('getSession error', e); setLoading(false) })
  }, [])

  // Auto-expiry check (separate so it doesn't block profile/clutch loading)
  useEffect(() => {
    if (!user?.id || !user?.name) return
    const checkExpiry = () => {
      if (user.is_available && user.available_until) {
        const until = new Date(user.available_until)
        if (!isNaN(until.getTime()) && until < new Date()) {
          supabase.from('profiles').update({is_available:false,available_from:null,available_until:null}).eq('id',user.id)
          save({is_available:false,available_from:null,available_until:null})
        }
      }
    }
    checkExpiry()
    const expiryTimer = setInterval(checkExpiry, 60000)
    return () => clearInterval(expiryTimer)
  }, [user?.id, user?.name, user?.is_available, user?.available_until])

  // ─── ONESIGNAL PUSH NOTIFICATIONS ───────────────────────────────────────────
  const ONESIGNAL_APP_ID = '72f8da44-de01-4ad1-b1d8-6d2fbf33daf4'

  useEffect(() => {
    if (!user?.id || !user?.name) return
    // Lier l'utilisateur Supabase à OneSignal via external_id
    const linkOneSignal = async () => {
      try {
        const win = window as any
        if (!win.OneSignal) return
        const initOneSignal = async (OS: any) => {
          // Login avec l'ID Supabase comme external_id
          await OS.login(user.id)
          console.log('[OneSignal] Linked user:', user.id)
        }
        if (win.OneSignalDeferred) {
          win.OneSignalDeferred.push(initOneSignal)
        }
      } catch(e) { console.warn('[OneSignal] link failed:', e) }
    }
    setTimeout(linkOneSignal, 2000)
  }, [user?.id, user?.name])

  // Envoyer une push notification via OneSignal (Edge Function)
  const sendPushTo = async (userId: string, title: string, body: string) => {
    try {
      const session = (await supabase.auth.getSession()).data.session
      if (!session) return
      await fetch(`${SUPABASE_FUNCTIONS_URL}/send-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ user_id: userId, title, body })
      })
    } catch(e) { console.warn('[Push] send failed:', e) }
  }

  // Load profiles, clutches, setup realtime
  const loadProfiles = () => {
    if (!user?.id) return
    supabase.from('blocks').select('blocker_id,blocked_id').or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`)
      .then(({ data: bdata }) => {
        const blockedIds = (bdata||[]).map((b:any) => b.blocker_id===user.id ? b.blocked_id : b.blocker_id)
        let q = supabase.from('profiles').select('*').neq('id', user.id).neq('is_banned', true)
        blockedIds.forEach((bid:string) => { q = q.neq('id', bid) })
        q.then(({ data }) => { if (data) setProfiles(data) })
      })
  }
  useEffect(() => {
    if (!user?.id || !user?.name) return

    // 1) Load profiles + auto-refresh toutes les 60s
    loadProfiles()
    const refreshInterval = setInterval(loadProfiles, 60000)

    // 2) Realtime: quand quelqu'un change sa dispo → on recharge les profils
    const profileChannel = supabase.channel('profiles-avail')
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'profiles' }, () => {
        loadProfiles()
      })
      .subscribe()

    // 3) Clutches: load + realtime
    const loadClutches = () => supabase.from('clutches').select('*,sender:profiles!clutches_sender_id_fkey(*),receiver:profiles!clutches_receiver_id_fkey(*)')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .then(({ data }) => {
        if (data) { setClutches(data); setPendingBadge(data.filter((c:any) => (c.receiver_id===user.id&&c.status==='pending')||(c.sender_id===user.id&&c.status==='counter')).length) }
      })
    loadClutches()
    const clutchChannel = supabase.channel('notif-'+user.id)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'clutches', filter:`receiver_id=eq.${user.id}` }, () => {
        setPendingBadge(b => b+1)
        loadClutches()
        if ('serviceWorker' in navigator && Notification.permission === 'granted') {
          navigator.serviceWorker.ready.then(sw => sw.showNotification('☕ Nouveau clutch !', {
            body: 'Quelqu\'un te propose un café. Tu as 2h pour répondre.',
            icon: '/icon-192.png', badge: '/icon-192.png' as any,
            tag: 'clutch-new', data: { url: '/app' }
          } as any)).catch(() => {
            if (typeof Notification !== 'undefined') new Notification('☕ Nouveau clutch !', { body: 'Quelqu\'un te propose un café.' })
          })
        }
      })
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'clutches', filter:`sender_id=eq.${user.id}` }, () => loadClutches())
      // ⚠️ CRITICAL: le receiver doit aussi recevoir les UPDATE (ex: annulation par le sender)
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'clutches', filter:`receiver_id=eq.${user.id}` }, () => loadClutches())
      .subscribe()

    return () => {
      clearInterval(refreshInterval)
      supabase.removeChannel(profileChannel)
      supabase.removeChannel(clutchChannel)
    }
  }, [user?.id, user?.name])

  const sendClutch = async () => {
    if (!user?.id || !selectedProfile?.id || !venueInput || !selectedTime || message.trim().length < 10) return
    setSending(true)
    try {
      // Freemium gate : femmes = illimité · admin/partner = illimité · premium = 5/jour · free men = 1/jour
      const isAdmin = ['admin','partner'].includes(user?.account_type||'')
      const isFree = user?.gender !== 'female' && !isAdmin && !user?.is_premium
      const dailyLimit = (user?.gender === 'female' || isAdmin) ? 999 : user?.is_premium ? 5 : 1
      if (isFree || dailyLimit < 999) {
        const today = new Date(); today.setHours(0,0,0,0)
        const { count } = await supabase.from('clutches').select('id',{count:'exact',head:true})
          .eq('sender_id',user.id).gte('created_at',today.toISOString())
        if ((count||0) >= dailyLimit) {
          setSending(false)
          if (isFree) {
            alert(`💎 Tu as utilisé ton clutch gratuit du jour !\n\nPasse Premium pour envoyer jusqu'à 5 clutches par jour — CHF 19.90/mois.\n\nVa dans ton Profil → Passer Premium.`)
          } else {
            alert(`Tu as atteint la limite de ${dailyLimit} clutches aujourd'hui. Reviens demain !`)
          }
          return
        }
      }
      const proposedTime = new Date(selectedTime).toISOString()
      const { error } = await supabase.from('clutches').insert({
        sender_id: user.id, receiver_id: selectedProfile.id,
        venue: venueInput, venue_safety: venueSafety,
        proposed_time: proposedTime, message: message.trim(),
        expires_at: new Date(Date.now() + 2*60*60*1000).toISOString()
      })
      if (error) { alert(`Erreur envoi: ${error.message}`); return }
      // Push notif au destinataire
      sendPushTo(selectedProfile.id, `☕ Nouveau Clutch de ${user.name} !`, `"${message.trim().slice(0,80)}" — Réponds en 2h`)
      setMessage(''); go('sent')
    } catch(e:any) {
      alert(`Erreur réseau: ${e?.message||'réessaie'}`)
    } finally {
      setSending(false)
    }
  }

  const signOut = async () => { await supabase.auth.signOut(); setUser(null); setScreen('splash') }

  const TAB_SCREENS = ['set-avail','discover','events','inbox','myprofile','edit-profile','create-event','my-events','chat','clutch-received','rdv-active']
  const showTabBar = TAB_SCREENS.includes(screen) && !!user?.name

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(160deg,#FDF6F0,${C.primaryLight})`, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:44, fontWeight:900, letterSpacing:'-0.05em', color:C.text }}>CLU<span style={{ color:C.primary }}>TCH</span></div>
        <p style={{ color:C.textLight, marginTop:8 }}>Chargement…</p>
      </div>
    </div>
  )

  // Mobile: position fixed plein écran. Desktop: frame centré.
  const frameStyle: React.CSSProperties = isMobile
    ? { position:'fixed' as const, top:0, left:0, right:0, bottom:0, background:C.bg, display:'flex', flexDirection:'column', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflow:'hidden' }
    : { width:390, maxWidth:'100%', background:C.bg, borderRadius:44, overflow:'hidden', boxShadow:'0 28px 70px rgba(0,0,0,0.18)', display:'flex', flexDirection:'column', height:'min(844px,85vh)', position:'relative' as const }

  return (
    <div style={{ minHeight:'100vh', background:isMobile?C.bg:`linear-gradient(135deg,#F5E6DC,#EDE0F0,#DCE8F5)`, display:'flex', alignItems:'center', justifyContent:'center', padding:isMobile?0:'60px 16px 16px', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', boxSizing:'border-box' }}>
      {/* Top nav — desktop only */}
      {!isMobile&&<div style={{ position:'fixed', top:14, left:'50%', transform:'translateX(-50%)', zIndex:100, display:'flex', gap:8, alignItems:'center' }}>
        <a href="/" style={{ background:'rgba(255,255,255,0.88)', backdropFilter:'blur(8px)', padding:'6px 14px', borderRadius:20, fontSize:12, color:C.text, textDecoration:'none', fontWeight:600, border:`1px solid ${C.border}` }}>← Accueil</a>
        <div style={{ background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`, borderRadius:20, padding:'5px 12px', fontSize:11, fontWeight:800, color:'#fff', letterSpacing:'0.05em' }}>✦ APP v07.06-AA</div>
        <a href="/demo" style={{ background:'rgba(255,255,255,0.88)', backdropFilter:'blur(8px)', padding:'6px 14px', borderRadius:20, fontSize:12, color:C.textMid, textDecoration:'none', fontWeight:500, border:`1px solid ${C.border}` }}>🎬 Démo</a>
      </div>}

      {/* Frame : phone sur desktop, plein écran sur mobile */}
      <div style={frameStyle}>
        {/* Notch desktop seulement */}
        {!isMobile&&<div style={{ height:40, background:C.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <div style={{ width:110, height:28, background:C.text, borderRadius:20, opacity:0.06 }}/>
        </div>}

        {/* Content */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', position:'relative', minHeight:0 }}>
          {screen==='splash' && <Splash go={go}/>}
          {screen==='login' && <Login go={go} setUser={setUser}/>}
          {screen==='register' && <Register go={go} setUser={setUser}/>}
          {screen==='forgot-password' && <ForgotPassword go={go}/>}
          {screen==='ob-name' && <ObName go={go} user={user} save={save}/>}
          {screen==='ob-gender' && <ObGender go={go} user={user} save={save}/>}
          {screen==='ob-age' && <ObAge go={go} user={user} save={save}/>}
          {screen==='ob-photo' && <ObPhoto go={go} user={user} save={save}/>}
          {screen==='ob-interests' && <ObInterests go={go} user={user} save={save}/>}
          {screen==='ob-done' && <ObDone go={go} user={user}/>}
          {screen==='set-avail' && <SetAvail user={user} go={go} save={save} fromProfile={tab==='myprofile'||isUserReallyAvail}/>}
          {screen==='discover' && <Discover profiles={profiles} user={user} onSelect={(p:Profile)=>setSelectedProfile(p)} go={go} refresh={loadProfiles}/>}
          {screen==='profile-detail' && <ProfileDetail profile={selectedProfile} go={go} currentUser={user}/>}
          {screen==='events' && <Events user={user} go={go}/>}
          {screen==='create-event' && <CreateEvent user={user} go={go}/>}
          {screen==='my-events' && <MyEvents user={user} go={go}/>}
          {screen==='inbox' && <Inbox clutches={clutches} user={user} go={go} setSelectedClutch={setSelectedClutch}/>}
          {screen==='myprofile' && <MyProfile user={user} go={go} signOut={signOut} save={save}/>}
          {screen==='edit-profile' && <EditProfile user={user} go={go} save={save}/>}
          {screen==='sos' && <Sos go={go}/>}
          {screen==='propose' && <Propose profile={selectedProfile} go={go} setVenue={setSelectedVenue} setVenueInput={setVenueInput} venueInput={venueInput} selectedVenue={selectedVenue} venueSafety={venueSafety} setVenueSafety={setVenueSafety}/>}
          {screen==='propose2' && <Propose2 profile={selectedProfile} go={go} selectedTime={selectedTime} setSelectedTime={setSelectedTime} venueInput={venueInput}/>}
          {screen==='propose3' && <Propose3 profile={selectedProfile} go={go} venueInput={venueInput} selectedTime={selectedTime} message={message} setMessage={setMessage} onSend={sendClutch} sending={sending}/>}
          {screen==='sent' && <Sent profile={selectedProfile} go={go} venueInput={venueInput} selectedTime={selectedTime}/>}
          {screen==='chat' && <Chat clutch={selectedClutch} user={user} go={go}/>}
          {screen==='clutch-received' && <ClutchReceived clutch={selectedClutch} user={user} go={go} refresh={refreshClutches} sendPush={sendPushTo}/>}
          {screen==='rdv-active' && <RdvActive clutch={selectedClutch} user={user} go={go} refresh={refreshClutches} sendPush={sendPushTo}/>}
          {screen==='feedback' && <FeedbackRdv clutch={selectedClutch} user={user} go={go}/>}
          {screen==='get-certified' && <GetCertified user={user} go={go} save={save}/>}
          {showTabBar && <TabBar tab={tab} setTab={setTab} badge={pendingBadge}/>}
        </div>

        {/* Home bar desktop seulement */}
        {!isMobile&&<div style={{ height:24, display:'flex', alignItems:'center', justifyContent:'center', background:C.bg, flexShrink:0 }}>
          <div style={{ width:90, height:4, background:C.text, borderRadius:2, opacity:0.1 }}/>
        </div>}
      </div>
    </div>
  )
}
