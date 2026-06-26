'use client'
import { useRef, useState } from 'react'

// 🗺️ MAQUETTE « Dessine ta zone » (démo pour Mel + Dom). Pas la vraie carte Leaflet — un prototype léger
// pour tester l'IDÉE : tracer au doigt/souris les régions où tu es prêt·e à te déplacer (et éviter la France, le lac…).
const C = { bg:'#2a1020', card:'#3a1830', border:'rgba(255,191,158,0.25)', orange:'#E27C00', salmon:'#FFBF9E', text:'#f5e8de', lake:'#1c2f47', france:'#5a2440' }
const W = 1000, H = 640
// Villes de l'arc lémanique (positions stylisées)
const CITIES = [
  { n:'Genève', x:120, y:430 }, { n:'Nyon', x:300, y:360 }, { n:'Morges', x:470, y:300 },
  { n:'Lausanne', x:560, y:255 }, { n:'Vevey', x:720, y:300 }, { n:'Montreux', x:790, y:340 },
  { n:'Yverdon', x:470, y:130 }, { n:'Évian (FR)', x:560, y:470 },
]

export default function CarteDemo() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [zones, setZones] = useState<{ x:number; y:number }[][]>([])
  const [cur, setCur] = useState<{ x:number; y:number }[]>([])
  const drawing = useRef(false)

  const toSvg = (e: React.PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect()
    return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }
  }
  const down = (e: React.PointerEvent) => { drawing.current = true; setCur([toSvg(e)]); try{(e.target as any).setPointerCapture(e.pointerId)}catch{} }
  const move = (e: React.PointerEvent) => { if (!drawing.current) return; setCur(p => [...p, toSvg(e)]) }
  const up = () => { if (!drawing.current) return; drawing.current = false; setCur(c => { if (c.length > 3) setZones(z => [...z, c]); return [] }) }
  const path = (pts: { x:number; y:number }[]) => pts.map((p,i)=> (i?'L':'M')+p.x.toFixed(0)+' '+p.y.toFixed(0)).join(' ')

  return (
    <div style={{ minHeight:'100vh', background:C.bg, color:C.text, fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif', padding:'18px 16px 40px', maxWidth:760, margin:'0 auto' }}>
      <div style={{ fontSize:22, fontWeight:900, letterSpacing:'-.02em', marginBottom:4 }}>🗺️ Dessine ta zone</div>
      <div style={{ fontSize:13, color:C.salmon, marginBottom:14, lineHeight:1.5 }}>
        Maquette. <b>Trace au doigt</b> les régions où tu es prêt·e à aller. Évite le lac, la France, le quartier qui te saoule — n'importe quelle forme. (Démo de l'idée pour la réunion.)
      </div>

      <div style={{ position:'relative', borderRadius:16, overflow:'hidden', border:`1px solid ${C.border}`, touchAction:'none', boxShadow:'0 10px 30px rgba(0,0,0,.35)' }}>
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', display:'block', background:'linear-gradient(160deg,#34503a,#2a4030)' }}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}>
          {/* France (au sud du lac) */}
          <path d={`M0 ${H} L0 470 Q300 560 620 540 Q820 525 ${W} 470 L${W} ${H} Z`} fill={C.france} opacity={0.55} />
          <text x={170} y={H-30} fill={C.salmon} fontSize={20} opacity={0.6} fontWeight={700}>FRANCE</text>
          {/* Lac Léman (croissant) */}
          <path d="M110 430 Q330 300 560 260 Q740 280 800 345 Q700 410 560 420 Q330 470 130 470 Z" fill={C.lake} opacity={0.95} />
          <text x={420} y={385} fill="#9fc4ff" fontSize={20} opacity={0.7} fontStyle="italic">Lac Léman</text>
          {/* Zones dessinées (validées) */}
          {zones.map((z,i)=>(<path key={i} d={path(z)+' Z'} fill={C.orange} fillOpacity={0.28} stroke={C.orange} strokeWidth={3} strokeLinejoin="round" />))}
          {/* Zone en cours */}
          {cur.length>1 && <path d={path(cur)} fill="none" stroke={C.salmon} strokeWidth={3} strokeDasharray="6 5" strokeLinecap="round" />}
          {/* Villes */}
          {CITIES.map(c=>(<g key={c.n}>
            <circle cx={c.x} cy={c.y} r={5} fill={C.salmon} />
            <text x={c.x+9} y={c.y+5} fill={C.text} fontSize={15} fontWeight={700}>{c.n}</text>
          </g>))}
        </svg>
      </div>

      <div style={{ display:'flex', gap:8, marginTop:12 }}>
        <button onClick={()=>{ setZones([]); setCur([]) }}
          style={{ flex:1, padding:'12px', borderRadius:12, border:`1px solid ${C.border}`, background:C.card, color:C.text, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>🧹 Effacer</button>
        <div style={{ flex:2, padding:'12px', borderRadius:12, background:C.card, border:`1px solid ${C.border}`, fontSize:12.5, color:C.salmon, textAlign:'center' }}>
          {zones.length ? `✓ ${zones.length} zone${zones.length>1?'s':''} tracée${zones.length>1?'s':''}` : '✏️ Trace une zone sur la carte'}
        </div>
      </div>

      <div style={{ fontSize:11.5, color:'rgba(245,232,222,.55)', marginTop:14, lineHeight:1.5 }}>
        💡 L'idée finale : ces formes deviennent ta <b>zone de rencontre réelle</b> (multi-régions, sans traverser le lac, par quartier/ville/canton). La vraie version posera ça sur une carte interactive — ici c'est juste pour <b>sentir le geste</b>.
      </div>
    </div>
  )
}
