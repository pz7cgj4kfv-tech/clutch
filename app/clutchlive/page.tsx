'use client'
// ─────────────────────────────────────────────────────────────────────────────
// CLUTCH LIVE (simulation) — /clutchlive. Tu te balades dans la ville, ton point
// GPS se déplace, les ÉVÉNEMENTS s'allument autour de toi avec les distances
// (à pied / transport / voiture), et les GENS apparaissent en DENSITÉ FLOUE
// (jamais leur position exacte — anti-triangulation). Mode Jour / Nuit (sorties).
// Page isolée, simulation pour montrer la vision. Zéro risque pour l'app.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useRef, useState } from 'react'

const C = {
  bg: '#FAF6F0', card: '#FFFFFF', border: 'rgba(42,16,32,0.14)', ink: '#1a0810',
  gold: '#A06808', mid: 'rgba(26,8,16,0.78)', dim: 'rgba(26,8,16,0.45)', pink: '#EB6BAF',
}
const LINKS: [string, string][] = [
  ['/clutchlive', '⚡ Clutch Live'], ['/eventsmap', '🗺️ Carte events'], ['/vision2', '📖 Vision 2'],
  ['/sim', '🧪 Simulateur'], ['/animation', '✨ Animations'], ['/hq', '🔒 QG'],
]

function hav(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371, dLat = (bLat - aLat) * Math.PI / 180, dLng = (bLng - aLng) * Math.PI / 180
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * Math.PI / 180) * Math.cos(bLat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}
const mins = (km: number, kmh: number) => Math.max(1, Math.round(km / kmh * 60))

type Ev = { id: string; emoji: string; title: string; lat: number; lng: number; lieu: string; time: string; taken: number; spots: number; night?: boolean }
const EVENTS: Ev[] = [
  { id: 'e1', emoji: '🧘', title: 'Yoga + Brunch', lat: 46.5168, lng: 6.5975, lieu: 'Plage de Vidy', time: '08:00', taken: 7, spots: 12 },
  { id: 'e2', emoji: '🍷', title: 'Apéro littéraire', lat: 46.5232, lng: 6.6353, lieu: 'Vieille Ville', time: '19:30', taken: 3, spots: 8, night: true },
  { id: 'e3', emoji: '🎷', title: 'Open mic jazz', lat: 46.5212, lng: 6.6275, lieu: 'MAD Club', time: '21:00', taken: 22, spots: 40, night: true },
  { id: 'e4', emoji: '🛼', title: 'Roller au lac', lat: 46.5075, lng: 6.6258, lieu: 'Ouchy', time: '15:00', taken: 11, spots: 20 },
  { id: 'e5', emoji: '🍻', title: 'Afterwork startup', lat: 46.5219, lng: 6.6308, lieu: 'Le Flon', time: '18:30', taken: 19, spots: 30, night: true },
  { id: 'e6', emoji: '🎨', title: 'Peinture & vin', lat: 46.5198, lng: 6.6330, lieu: 'St-François', time: '20:00', taken: 8, spots: 10, night: true },
  { id: 'e7', emoji: '🏓', title: 'Ping-pong EPFL', lat: 46.5191, lng: 6.5668, lieu: 'Esplanade EPFL', time: '17:00', taken: 9, spots: 16 },
  { id: 'e8', emoji: '🌃', title: 'Clutch Night rooftop', lat: 46.5205, lng: 6.6295, lieu: 'Rooftop Flon', time: '22:30', taken: 17, spots: 25, night: true },
]
// Zones de densité de GENS (floues — on ne sait JAMAIS où ils sont exactement)
const CROWDS = [
  { lat: 46.5210, lng: 6.6310, n: 8 }, { lat: 46.5185, lng: 6.6250, n: 5 },
  { lat: 46.5230, lng: 6.6360, n: 12 }, { lat: 46.5090, lng: 6.6270, n: 4 },
]

export default function ClutchLive() {
  const divRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const tileRef = useRef<any>(null)
  const userRef = useRef<any>(null)
  const layersRef = useRef<any[]>([])
  const headingRef = useRef(Math.PI / 4)
  const [pos, setPos] = useState<[number, number]>([46.5197, 6.6323])
  const [night, setNight] = useState(false)
  const [people, setPeople] = useState(true)
  const [walking, setWalking] = useState(false)
  const [ready, setReady] = useState(false)
  const [stars] = useState(() => Array.from({ length: 60 }, (_, i) => ({ x: (i * 53 % 100), y: (i * 37 % 100), s: (i % 3) + 1, d: (i % 5) * 0.4 })))

  // init map
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const lk = document.createElement('link'); lk.id = 'leaflet-css'; lk.rel = 'stylesheet'
      lk.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(lk)
    }
    let map: any
    import('leaflet').then(mod => {
      const L: any = (mod as any).default || mod
      if (!divRef.current || mapRef.current) return
      map = L.map(divRef.current, { center: pos, zoom: 15, zoomControl: true })
      mapRef.current = map
      tileRef.current = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map)
      userRef.current = L.marker(pos, { icon: L.divIcon({ className: '', iconSize: [30, 30], iconAnchor: [15, 15], html: `<div class="cl-user"><span class="cl-ring"></span><span class="cl-ring" style="animation-delay:.8s"></span><span class="cl-dot"></span></div>` }), zIndexOffset: 1000 }).addTo(map)
      setReady(true)
    })
    return () => { if (map) { map.remove(); mapRef.current = null } }
  }, [])

  // swap tiles on night
  useEffect(() => {
    if (!ready) return
    import('leaflet').then(mod => {
      const L: any = (mod as any).default || mod
      const map = mapRef.current
      if (tileRef.current) map.removeLayer(tileRef.current)
      const url = night ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
      tileRef.current = L.tileLayer(url, { maxZoom: 19 }).addTo(map)
      tileRef.current.bringToBack()
    })
  }, [night, ready])

  // (re)draw events + crowds
  useEffect(() => {
    if (!ready) return
    import('leaflet').then(mod => {
      const L: any = (mod as any).default || mod
      const map = mapRef.current
      layersRef.current.forEach(l => map.removeLayer(l)); layersRef.current = []
      // events
      EVENTS.filter(e => !night || e.night).forEach(ev => {
        const m = L.marker([ev.lat, ev.lng], { icon: L.divIcon({ className: '', iconSize: [38, 46], iconAnchor: [19, 44], html: `<div class="cl-pin" style="--c:${ev.night ? '#7c5cd0' : C.pink}"><span>${ev.emoji}</span></div>` }) }).addTo(map)
        m.bindTooltip(`<b>${ev.title}</b><br>${ev.lieu} · ${ev.time}`, { direction: 'top', offset: [0, -42] })
        layersRef.current.push(m)
      })
      // crowds (densité floue de gens)
      if (people) CROWDS.forEach(cr => {
        const blob = L.marker([cr.lat, cr.lng], { icon: L.divIcon({ className: '', iconSize: [70, 70], iconAnchor: [35, 35], html: `<div class="cl-crowd"><span class="cl-cring"></span><span class="cl-clabel">≈${cr.n}</span></div>` }) }).addTo(map)
        layersRef.current.push(blob)
      })
    })
  }, [ready, night, people])

  // move user marker + recenter
  useEffect(() => {
    if (!ready || !userRef.current) return
    userRef.current.setLatLng(pos)
    mapRef.current.panTo(pos, { animate: true, duration: 0.5 })
  }, [pos, ready])

  // auto-walk (déplacement simulé)
  useEffect(() => {
    if (!walking) return
    const iv = setInterval(() => {
      setPos(([la, ln]) => {
        headingRef.current += (Math.random() - 0.5) * 0.7
        // steer back vers le centre si on s'éloigne trop
        const dC = hav(la, ln, 46.5197, 6.6323)
        if (dC > 2.5) headingRef.current = Math.atan2(6.6323 - ln, 46.5197 - la)
        const step = 0.0009 // ~100m
        return [la + Math.cos(headingRef.current) * step, ln + Math.sin(headingRef.current) * step]
      })
    }, 1400)
    return () => clearInterval(iv)
  }, [walking])

  // events autour de toi (live)
  const around = EVENTS.filter(e => !night || e.night)
    .map(e => ({ e, km: hav(pos[0], pos[1], e.lat, e.lng) }))
    .sort((a, b) => a.km - b.km)
  const totalPeople = people ? CROWDS.reduce((n, c) => n + c.n, 0) : 0

  const panelBg = night ? '#15101e' : C.card
  const panelInk = night ? '#ECE6F5' : C.ink
  const panelDim = night ? 'rgba(236,230,245,.5)' : C.dim

  return (
    <div style={{ minHeight: '100vh', background: night ? '#0C0818' : C.bg, color: night ? '#ECE6F5' : C.ink, fontFamily: 'ui-sans-serif,system-ui,-apple-system,sans-serif', transition: 'background .5s' }}>
      <style>{`
        .cl-user{position:relative;width:30px;height:30px;display:grid;place-items:center}
        .cl-user .cl-ring{position:absolute;width:18px;height:18px;border-radius:50%;background:${C.pink};animation:clp 1.8s infinite ease-out}
        .cl-user .cl-dot{position:relative;width:14px;height:14px;border-radius:50%;background:${C.pink};border:2px solid #fff;box-shadow:0 0 10px ${C.pink}}
        @keyframes clp{0%{transform:scale(.5);opacity:.7}100%{transform:scale(3);opacity:0}}
        .cl-pin{width:38px;height:38px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:var(--c);border:2px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,.4);display:grid;place-items:center}
        .cl-pin span{transform:rotate(45deg);font-size:17px}
        .cl-crowd{position:relative;width:70px;height:70px;display:grid;place-items:center}
        .cl-crowd .cl-cring{position:absolute;width:54px;height:54px;border-radius:50%;background:radial-gradient(circle,rgba(124,92,208,.45),rgba(124,92,208,0) 70%);animation:clc 2.4s infinite ease-out}
        @keyframes clc{0%{transform:scale(.6);opacity:.8}100%{transform:scale(1.4);opacity:.2}}
        .cl-clabel{position:relative;font-size:11px;font-weight:800;color:#fff;background:rgba(124,92,208,.9);border-radius:10px;padding:1px 7px;box-shadow:0 1px 4px rgba(0,0,0,.3)}
      `}</style>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: '16px 14px 40px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
          {LINKS.map(([href, label], i) => (
            <a key={href} href={href} style={{ fontSize: 11.5, fontWeight: i === 0 ? 800 : 600, textDecoration: 'none', color: i === 0 ? '#fff' : panelDim, background: i === 0 ? C.gold : (night ? '#1c1530' : C.card), border: `1px solid ${i === 0 ? C.gold : C.border}`, borderRadius: 9, padding: '5px 11px', whiteSpace: 'nowrap' }}>{label}{i === 0 ? ' · ici' : ''}</a>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 23, fontWeight: 900, color: night ? '#c9b6ff' : C.gold }}>⚡ Clutch Live</span>
          <span style={{ fontSize: 12, color: panelDim }}>la ville s'allume autour de toi</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={() => setWalking(w => !w)} style={{ fontSize: 12.5, fontWeight: 800, padding: '6px 13px', borderRadius: 9, cursor: 'pointer', border: 'none', background: walking ? C.pink : C.gold, color: '#fff' }}>{walking ? '⏸ Stop' : '▶ Je me balade'}</button>
            <button onClick={() => setPeople(p => !p)} style={{ fontSize: 12.5, fontWeight: 700, padding: '6px 12px', borderRadius: 9, cursor: 'pointer', border: `1px solid ${C.border}`, background: night ? '#1c1530' : C.card, color: panelInk }}>👥 Gens {people ? '✓' : ''}</button>
            <button onClick={() => setNight(n => !n)} style={{ fontSize: 12.5, fontWeight: 700, padding: '6px 12px', borderRadius: 9, cursor: 'pointer', border: `1px solid ${C.border}`, background: night ? '#1c1530' : C.card, color: panelInk }}>{night ? '☀️ Jour' : '🌙 Nuit'}</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'stretch' }}>
          {/* Carte */}
          <div style={{ flex: '2 1 520px', minWidth: 300, position: 'relative', borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.border}`, boxShadow: '0 6px 24px rgba(42,16,32,.12)' }}>
            <div ref={divRef} style={{ width: '100%', height: '64vh', minHeight: 400, background: night ? '#0C0818' : '#e8e0d8' }} />
            {night && <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 400 }}>
              {stars.map((st, i) => <span key={i} style={{ position: 'absolute', left: `${st.x}%`, top: `${st.y}%`, width: st.s, height: st.s, borderRadius: '50%', background: '#fff', opacity: 0.7, boxShadow: '0 0 4px #fff', animation: `clp 3s ${st.d}s infinite ease-in-out` }} />)}
            </div>}
            {!ready && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: panelDim }}>Chargement…</div>}
          </div>

          {/* Panneau « autour de toi » */}
          <div style={{ flex: '1 1 260px', minWidth: 240, background: panelBg, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14, transition: 'background .5s' }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: panelInk, marginBottom: 3 }}>✨ Autour de toi, maintenant</div>
            {people && <div style={{ fontSize: 12, color: '#7c5cd0', fontWeight: 700, marginBottom: 10 }}>≈ {totalPeople} personnes dans le coin <span style={{ color: panelDim, fontWeight: 400 }}>(jamais leur position exacte)</span></div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {around.slice(0, 6).map(({ e, km }) => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 9, background: night ? '#1c1530' : C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '7px 10px' }}>
                  <span style={{ fontSize: 18 }}>{e.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: panelInk, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</div>
                    <div style={{ fontSize: 10.5, color: panelDim }}>{e.lieu} · {e.time}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: night ? '#c9b6ff' : C.gold }}>{km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`}</div>
                    <div style={{ fontSize: 9.5, color: panelDim }}>🚶{mins(km, 5)}′ · 🚗{mins(km, 30)}′</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10.5, color: panelDim, marginTop: 10, lineHeight: 1.5 }}>▶ « Je me balade » → ton point bouge (comme ton GPS en vrai) et les distances se mettent à jour en direct.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
