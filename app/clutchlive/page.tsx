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
  gold: '#532943', mid: 'rgba(26,8,16,0.78)', dim: 'rgba(26,8,16,0.45)', pink: '#EB6BAF',
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

function ClutchLiveSimV1() {
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

        {/* Mode d'emploi */}
        <div style={{ background: night ? 'rgba(255,255,255,.05)' : '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: panelDim, lineHeight: 1.65 }}>
          <b style={{ color: panelInk }}>Comment ça marche : </b>tu te balades dans la ville et <b style={{ color: C.pink }}>les opportunités s'allument autour de toi</b> — événements (épingles) et gens (en <b>densité floue</b>, jamais leur position exacte). Appuie sur <b style={{ color: panelInk }}>« Je me balade »</b> : ton point bouge comme ton vrai GPS et les distances (🚶/🚗) se recalculent. Le but : voir, en un coup d'œil, ce qu'il peut se passer <b>maintenant</b>, près de toi.
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

// ─────────────────────────────────────────────────────────────────────────────
// IMMERSION V2 — « écran Tesla » + boussole façon PeakFinder.
// Tu tournes ton téléphone (ou tu glisses) → la scène pivote et tu vois ce qu'il y a
// AUTOUR de toi dans la direction où tu regardes, dans un horizon de 500 m. En bas,
// un radar top-down (Tesla) qui tourne avec ton cap. Jamais la position exacte d'une
// personne (densité floue). Boussole = magnétomètre du téléphone (azimut).
// ─────────────────────────────────────────────────────────────────────────────
const CENTER: [number, number] = [46.5197, 6.6323]
// Présences « solo » (gens seuls qui veulent faire un truc) — floues, jamais exactes.
type Solo = { id: string; emoji: string; label: string; lat: number; lng: number; night?: boolean }
const SOLOS: Solo[] = [
  { id: 's1', emoji: '🃏', label: 'Quelqu’un · cartes', lat: 46.5188, lng: 6.6300 },
  { id: 's2', emoji: '☕', label: 'Quelqu’un · café', lat: 46.5210, lng: 6.6345 },
  { id: 's3', emoji: '🚶', label: 'Quelqu’un · balade', lat: 46.5179, lng: 6.6338, night: true },
  { id: 's4', emoji: '🎸', label: 'Quelqu’un · jam', lat: 46.5224, lng: 6.6290, night: true },
]
// Relèvement (bearing) de A vers B : 0 = Nord, sens horaire, en radians.
function bearing(aLat: number, aLng: number, bLat: number, bLng: number) {
  const φ1 = aLat * Math.PI / 180, φ2 = bLat * Math.PI / 180, Δλ = (bLng - aLng) * Math.PI / 180
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  return Math.atan2(y, x)
}
const norm = (a: number) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a }

// Pools pour la génération PROCÉDURALE : quand tu avances, la ville se repeuple devant toi
// (sinon tu laisses tous les events derrière). Prototype — un jour branché sur les vrais events.
const POI_POOL: [string, string][] = [
  ['🎷', 'Cave à jazz'], ['🎸', 'Concert'], ['🍷', 'Apéro'], ['🍻', 'Afterwork'], ['🎨', 'Atelier peinture'],
  ['🛼', 'Roller'], ['🏓', 'Ping-pong'], ['🧘', 'Yoga'], ['☕', 'Café perché'], ['🌃', 'Rooftop'], ['🍕', 'Pizza party'],
]
const SOLO_POOL: [string, string][] = [
  ['🃏', 'Quelqu’un · cartes'], ['☕', 'Quelqu’un · café'], ['🚶', 'Quelqu’un · balade'], ['🎸', 'Quelqu’un · jam'],
  ['📷', 'Quelqu’un · photo'], ['🍺', 'Quelqu’un · verre'], ['🐕', 'Quelqu’un · chien'],
]
type Poi = { id: string; emoji: string; label: string; lat: number; lng: number; solo: boolean }
let _pid = 0
function spawnPoi(lat: number, lng: number, headRad: number, ahead: boolean): Poi {
  const solo = Math.random() < 0.4
  const pool = solo ? SOLO_POOL : POI_POOL
  const [emoji, label] = pool[Math.floor(Math.random() * pool.length)]
  const dist = 0.2 + Math.random() * 1.3                                   // 200 m … 1.5 km
  const b = ahead ? headRad + (Math.random() - 0.5) * Math.PI : Math.random() * 2 * Math.PI  // devant toi si tu avances
  const dLat = (dist / 111) * Math.cos(b)
  const dLng = (dist / (111 * Math.cos(lat * Math.PI / 180))) * Math.sin(b)
  return { id: 'p' + (_pid++), emoji, label, lat: lat + dLat, lng: lng + dLng, solo }
}

const SPEEDS: { id: number; label: string; m: number }[] = [
  { id: 1, label: '🐢 Lent', m: 4 }, { id: 2, label: '🚶 Marche', m: 10 }, { id: 3, label: '🚀 Rapide', m: 22 },
]

function ClutchLiveImmersionV2() {
  const cvRef = useRef<HTMLCanvasElement | null>(null)
  const headingRef = useRef(0)          // cap regardé (rad, 0 = Nord)
  const posRef = useRef<[number, number]>([...CENTER])
  const nightRef = useRef(false)
  const walkRef = useRef(false)
  const dragRef = useRef<{ x: number; h: number } | null>(null)
  const poisRef = useRef<Poi[]>([])
  const speedRef = useRef(2)
  const [night, setNight] = useState(false)
  const [walking, setWalking] = useState(false)
  const [sensor, setSensor] = useState(false)
  const [speed, setSpeed] = useState(2)
  const [headDeg, setHeadDeg] = useState(0)
  nightRef.current = night; walkRef.current = walking; speedRef.current = speed

  // semis initial de POI autour de toi
  useEffect(() => {
    const [la, ln] = posRef.current
    poisRef.current = Array.from({ length: 13 }, () => spawnPoi(la, ln, headingRef.current, false))
  }, [])

  // capteur d'orientation (boussole) — iOS demande une permission explicite.
  const onOrient = (e: any) => {
    const h = (e.webkitCompassHeading != null) ? e.webkitCompassHeading
      : (e.alpha != null ? 360 - e.alpha : null)
    if (h != null) headingRef.current = h * Math.PI / 180
  }
  const enableSensor = async () => {
    const D: any = typeof window !== 'undefined' ? (window as any).DeviceOrientationEvent : null
    try {
      if (D && typeof D.requestPermission === 'function') {
        const r = await D.requestPermission(); if (r !== 'granted') return
      }
      window.addEventListener('deviceorientation', onOrient, true)
      setSensor(true)
    } catch { /* refusé → on garde le drag */ }
  }
  useEffect(() => () => window.removeEventListener('deviceorientation', onOrient, true), [])

  // marche simulée : on avance dans le cap regardé, à la VITESSE choisie, et la ville se
  // REPEUPLE devant toi (on retire ce qui est trop loin derrière, on respawn devant).
  useEffect(() => {
    const iv = setInterval(() => {
      if (!walkRef.current) return
      const [la, ln] = posRef.current
      const m = (SPEEDS.find(s => s.id === speedRef.current) || SPEEDS[1]).m
      const km = m / 1000
      const dLat = (km / 111) * Math.cos(headingRef.current)
      const dLng = (km / (111 * Math.cos(la * Math.PI / 180))) * Math.sin(headingRef.current)
      const nl: [number, number] = [la + dLat, ln + dLng]
      posRef.current = nl
      const keep = poisRef.current.filter(p => hav(nl[0], nl[1], p.lat, p.lng) < 1.7)
      while (keep.length < 13) keep.push(spawnPoi(nl[0], nl[1], headingRef.current, true))
      poisRef.current = keep
    }, 200)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    const cv = cvRef.current; if (!cv) return
    const ctx = cv.getContext('2d'); if (!ctx) return
    let raf = 0, alive = true, t0 = 0
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize(); const onR = () => resize(); window.addEventListener('resize', onR)

    const draw = (ts: number) => {
      if (!alive) return
      if (!t0) t0 = ts
      const time = (ts - t0) / 1000
      // auto-rotation douce si pas de capteur ni de drag (pour que ça vive)
      if (!sensor && !dragRef.current) headingRef.current += 0.0016
      const W = cv.clientWidth, H = cv.clientHeight
      const ngt = nightRef.current
      const horizonY = H * 0.52
      const cx = W / 2

      // ── CIEL / FOND ──
      const sky = ctx.createLinearGradient(0, 0, 0, horizonY)
      if (ngt) { sky.addColorStop(0, '#0a0616'); sky.addColorStop(1, '#241436') }
      else { sky.addColorStop(0, '#FFE7D6'); sky.addColorStop(1, '#FFF6EF') }
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, horizonY)
      // sol
      const grd = ctx.createLinearGradient(0, horizonY, 0, H)
      if (ngt) { grd.addColorStop(0, '#160a24'); grd.addColorStop(1, '#0b0512') }
      else { grd.addColorStop(0, '#F3E5DC'); grd.addColorStop(1, '#E7D6CB') }
      ctx.fillStyle = grd; ctx.fillRect(0, horizonY, W, H - horizonY)

      // étoiles la nuit
      if (ngt) for (let i = 0; i < 50; i++) {
        const sx = (i * 89.7 % W), sy = (i * 41.3 % (horizonY - 10))
        const tw = 0.3 + 0.3 * Math.sin(time * 1.6 + i)
        ctx.fillStyle = `rgba(255,235,250,${0.15 + tw * 0.25})`; ctx.fillRect(sx, sy, 1.5, 1.5)
      }

      const pos = posRef.current, head = headingRef.current
      const FOV = 1.25 // demi-champ visible (~72°)

      // ── SILHOUETTES D'IMMEUBLES (parallaxe selon le cap) ──
      ctx.fillStyle = ngt ? 'rgba(124,92,208,.16)' : 'rgba(83,41,67,.10)'
      for (let i = 0; i < 26; i++) {
        const a = norm((i / 26) * 2 * Math.PI - head)
        if (Math.abs(a) > FOV) continue
        const x = cx + Math.sin(a) * (W * 0.62)
        const bw = 26 + (i % 4) * 12, bh = 30 + (i * 53 % 70)
        ctx.fillRect(x - bw / 2, horizonY - bh, bw, bh)
      }
      // ligne d'horizon
      ctx.strokeStyle = ngt ? 'rgba(201,182,255,.4)' : 'rgba(83,41,67,.25)'
      ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, horizonY); ctx.lineTo(W, horizonY); ctx.stroke()

      // ── POI (events + présences solo) dans l'horizon (façon PeakFinder) ──
      const live = poisRef.current.map(o => {
        const km = hav(pos[0], pos[1], o.lat, o.lng)
        const rel = norm(bearing(pos[0], pos[1], o.lat, o.lng) - head)
        return { kind: o.solo ? 'solo' as const : 'ev' as const, emoji: o.emoji, label: o.label, km, rel }
      }).filter(o => Math.abs(o.rel) < FOV).sort((a, b) => b.km - a.km)

      for (const o of live) {
        const x = cx + Math.sin(o.rel) * (W * 0.52)
        const near = Math.max(0, 1 - o.km / 1.6)           // 0 loin … 1 tout près
        const y = horizonY - 26 - near * (H * 0.20)        // plus près = plus bas/grand
        const sz = 16 + near * 16
        const isSolo = o.kind === 'solo'
        const col = isSolo ? (ngt ? '#9b7bff' : '#7c5cd0') : (ngt ? '#c9b6ff' : '#EB6BAF')
        // halo
        ctx.beginPath(); ctx.arc(x, y, sz * 0.9, 0, 6.28)
        ctx.fillStyle = isSolo ? 'rgba(124,92,208,.16)' : 'rgba(235,107,175,.16)'; ctx.fill()
        // pastille
        ctx.beginPath(); ctx.arc(x, y, sz * 0.62, 0, 6.28); ctx.fillStyle = col; ctx.fill()
        ctx.font = `${Math.round(sz * 0.7)}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(o.emoji, x, y + 1)
        // étiquette (titre + distance)
        const dist = o.km < 1 ? `${Math.round(o.km * 1000)} m` : `${o.km.toFixed(1)} km`
        ctx.font = '700 11px system-ui'; ctx.textBaseline = 'alphabetic'
        const tw = ctx.measureText(o.label).width + 16
        const ly = y - sz * 0.62 - 16
        ctx.fillStyle = ngt ? 'rgba(20,10,30,.82)' : 'rgba(255,255,255,.92)'
        ctx.beginPath(); (ctx as any).roundRect(x - tw / 2, ly - 13, tw, 18, 9); ctx.fill()
        ctx.fillStyle = ngt ? '#ECE6F5' : '#1a0810'; ctx.fillText(o.label, x, ly)
        ctx.fillStyle = col; ctx.font = '800 10px system-ui'; ctx.fillText(dist, x, ly + 12)
        // trait vers le sol
        ctx.strokeStyle = isSolo ? 'rgba(124,92,208,.35)' : 'rgba(235,107,175,.35)'
        ctx.beginPath(); ctx.moveTo(x, y + sz * 0.62); ctx.lineTo(x, horizonY); ctx.stroke()
      }

      // ── BANDE BOUSSOLE (haut) ──
      const cardinals: [number, string][] = [[0, 'N'], [Math.PI / 2, 'E'], [Math.PI, 'S'], [-Math.PI / 2, 'O']]
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      for (const [ang, lab] of cardinals) {
        const rel = norm(ang - head); if (Math.abs(rel) > FOV) continue
        const x = cx + Math.sin(rel) * (W * 0.52)
        ctx.fillStyle = ngt ? 'rgba(201,182,255,.85)' : 'rgba(83,41,67,.8)'
        ctx.font = `${lab === 'N' ? '900 16px' : '700 13px'} system-ui`
        ctx.fillText(lab, x, 18)
      }
      ctx.strokeStyle = ngt ? 'rgba(201,182,255,.25)' : 'rgba(83,41,67,.18)'
      ctx.beginPath(); ctx.moveTo(0, 32); ctx.lineTo(W, 32); ctx.stroke()
      // viseur central
      ctx.strokeStyle = ngt ? 'rgba(201,182,255,.5)' : 'rgba(235,107,175,.6)'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(cx, 6); ctx.lineTo(cx, 28); ctx.stroke()

      // ── RADAR TESLA (bas, top-down, tourne avec le cap) ──
      const rcx = cx, rcy = H - 78, R = 62
      ctx.fillStyle = ngt ? 'rgba(12,6,20,.7)' : 'rgba(255,255,255,.75)'
      ctx.beginPath(); ctx.arc(rcx, rcy, R + 6, 0, 6.28); ctx.fill()
      for (const rr of [0.5, 1]) {
        ctx.strokeStyle = ngt ? 'rgba(201,182,255,.22)' : 'rgba(83,41,67,.14)'; ctx.lineWidth = 1
        ctx.beginPath(); ctx.arc(rcx, rcy, R * rr, 0, 6.28); ctx.stroke()
      }
      // balayage
      const sweep = time * 1.1
      const sg = ('createConicGradient' in ctx) ? (ctx as any).createConicGradient(sweep, rcx, rcy) : null
      if (sg) { sg.addColorStop(0, 'rgba(235,107,175,.30)'); sg.addColorStop(0.12, 'rgba(235,107,175,0)'); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(rcx, rcy, R, 0, 6.28); ctx.fill() }
      // blips (POI) sur le radar — orientés « cap en haut »
      for (const o of poisRef.current) {
        const km = hav(pos[0], pos[1], o.lat, o.lng)
        const rel = norm(bearing(pos[0], pos[1], o.lat, o.lng) - head)
        const rr = Math.min(1, km / 1.6) * R
        const bx = rcx + Math.sin(rel) * rr, by = rcy - Math.cos(rel) * rr
        ctx.beginPath(); ctx.arc(bx, by, o.solo ? 2.6 : 3.4, 0, 6.28)
        ctx.fillStyle = o.solo ? '#7c5cd0' : '#EB6BAF'; ctx.fill()
      }
      // toi au centre (chevron pointant en haut = direction regardée)
      ctx.fillStyle = ngt ? '#FFBF9E' : '#532943'
      ctx.beginPath(); ctx.moveTo(rcx, rcy - 8); ctx.lineTo(rcx - 5, rcy + 5); ctx.lineTo(rcx, rcy + 2); ctx.lineTo(rcx + 5, rcy + 5); ctx.closePath(); ctx.fill()
      ctx.font = '700 9px system-ui'; ctx.fillStyle = ngt ? 'rgba(201,182,255,.7)' : 'rgba(83,41,67,.6)'; ctx.textAlign = 'center'
      ctx.fillText('500 m', rcx, rcy + R + 14)

      setHeadDeg(Math.round(((head * 180 / Math.PI) % 360 + 360) % 360))
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { alive = false; cancelAnimationFrame(raf); window.removeEventListener('resize', onR) }
  }, [sensor])

  // drag pour pivoter (fallback desktop / sans capteur)
  const onDown = (e: React.PointerEvent) => { dragRef.current = { x: e.clientX, h: headingRef.current }; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) }
  const onMove = (e: React.PointerEvent) => { if (!dragRef.current) return; const dx = e.clientX - dragRef.current.x; headingRef.current = dragRef.current.h + dx * 0.006 }
  const onUp = () => { dragRef.current = null }

  const cardinal = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'][Math.round(headDeg / 45) % 8]
  const ink = night ? '#ECE6F5' : '#1a0810', dim = night ? 'rgba(236,230,245,.55)' : 'rgba(26,8,16,.5)'

  return (
    <div style={{ background: night ? '#0C0818' : '#FAF6F0', transition: 'background .5s' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '6px 14px 36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 21, fontWeight: 900, color: night ? '#c9b6ff' : '#532943' }}>⚡ Clutch Live · Immersion</span>
          <span style={{ fontSize: 12, color: dim }}>tourne ton tél, regarde autour</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={() => setWalking(w => !w)} style={{ fontSize: 12.5, fontWeight: 800, padding: '6px 13px', borderRadius: 9, cursor: 'pointer', border: 'none', background: walking ? '#EB6BAF' : '#532943', color: '#fff' }}>{walking ? '⏸ Stop' : '▶ J’avance'}</button>
            <button onClick={() => setNight(n => !n)} style={{ fontSize: 12.5, fontWeight: 700, padding: '6px 12px', borderRadius: 9, cursor: 'pointer', border: `1px solid rgba(42,16,32,.14)`, background: night ? '#1c1530' : '#fff', color: ink }}>{night ? '☀️ Jour' : '🌙 Nuit'}</button>
          </div>
        </div>

        {/* Vitesse de marche (David : « on avance beaucoup trop vite ») */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11.5, color: dim, fontWeight: 700 }}>Vitesse</span>
          {SPEEDS.map(s => (
            <button key={s.id} onClick={() => setSpeed(s.id)} style={{
              fontSize: 12, fontWeight: 800, padding: '5px 12px', borderRadius: 999, cursor: 'pointer',
              border: `1.5px solid ${speed === s.id ? '#EB6BAF' : 'rgba(42,16,32,.14)'}`,
              background: speed === s.id ? '#EB6BAF' : (night ? '#1c1530' : '#fff'), color: speed === s.id ? '#fff' : ink,
            }}>{s.label}</button>
          ))}
        </div>

        <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', border: `1px solid rgba(42,16,32,.14)`, boxShadow: '0 14px 40px -16px rgba(42,16,32,.45)' }}>
          <canvas ref={cvRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
            style={{ width: '100%', height: '64vh', minHeight: 440, display: 'block', cursor: 'grab', touchAction: 'none' }} />
          {/* cap */}
          <div style={{ position: 'absolute', top: 40, left: 12, fontSize: 12, fontWeight: 800, color: night ? '#c9b6ff' : '#532943', background: night ? 'rgba(12,6,20,.6)' : 'rgba(255,255,255,.8)', borderRadius: 8, padding: '3px 9px' }}>{cardinal} · {headDeg}°</div>
          {/* activer boussole */}
          {!sensor && (
            <button onClick={enableSensor} style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', fontSize: 12, fontWeight: 800, padding: '8px 16px', borderRadius: 999, cursor: 'pointer', border: 'none', background: '#EB6BAF', color: '#fff', boxShadow: '0 4px 14px rgba(235,107,175,.45)' }}>🧭 Activer la boussole</button>
          )}
        </div>
        <div style={{ fontSize: 11.5, color: dim, marginTop: 8, textAlign: 'center', lineHeight: 1.5 }}>
          Sur le téléphone : appuie sur <b style={{ color: ink }}>« Activer la boussole »</b> puis tourne sur toi-même — la scène pivote en vrai. Sur ordi : <b>glisse</b> pour pivoter. <b>« J’avance »</b> simule la marche (les distances fondent).
        </div>

        <ScienceImmersion night={night} />
      </div>
    </div>
  )
}

// Explication scientifique — claire ET profonde (David : « beaucoup plus claire et profonde »).
function ScienceImmersion({ night }: { night: boolean }) {
  const [open, setOpen] = useState(false)
  const ink = night ? '#ECE6F5' : '#1a0810', dim = night ? 'rgba(236,230,245,.7)' : 'rgba(26,8,16,.7)'
  const card = night ? 'rgba(255,255,255,.05)' : '#fff', border = 'rgba(42,16,32,.14)'
  const Item = ({ icon, t, children }: any) => (
    <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
      <div style={{ fontSize: 13.5, fontWeight: 800, color: ink, marginBottom: 3 }}>{icon} {t}</div>
      <div style={{ fontSize: 12.5, color: dim, lineHeight: 1.6 }}>{children}</div>
    </div>
  )
  return (
    <div style={{ marginTop: 18 }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', textAlign: 'left', fontSize: 14, fontWeight: 800, color: ink, background: card, border: `1px solid ${border}`, borderRadius: 12, padding: '12px 14px', cursor: 'pointer' }}>
        🔬 La science derrière — {open ? 'masquer' : 'comment ça marche vraiment'}
      </button>
      {open && (
        <div style={{ marginTop: 8 }}>
          <Item icon="📡" t="Te localiser : le GNSS (GPS & co)">
            Ton téléphone écoute plusieurs constellations de satellites (GPS américain, Galileo européen, GLONASS…).
            Chaque satellite envoie l’heure exacte de son horloge atomique ; en mesurant le <b>retard</b> de 4 signaux ou
            plus, le tél résout sa position par <b>trilatération</b> (intersection de sphères). En ville, précision ~5-10 m
            — d’où une marge de sécurité dans nos calculs, jamais une fausse certitude.
          </Item>
          <Item icon="🧭" t="Savoir où tu regardes : le magnétomètre">
            La boussole lit le <b>champ magnétique terrestre</b> (~50 µT) pour trouver le Nord, et le combine avec le
            <b> gyroscope</b> (vitesse de rotation) et l’<b>accéléromètre</b> (gravité) — c’est la <b>fusion de capteurs</b>.
            Résultat : un <b>azimut</b> stable (l’angle entre le Nord et la direction où pointe ton tél). C’est lui qui fait
            pivoter la scène quand tu tournes sur toi-même, comme dans PeakFinder.
          </Item>
          <Item icon="📐" t="Placer ce qui t’entoure : le relèvement">
            Pour chaque lieu, on calcule son <b>relèvement</b> (bearing) : l’angle Nord→lieu, par trigonométrie sphérique.
            On le compare à ton azimut → un angle <b>relatif</b>. S’il est dans ton champ de vision (~±72°), on l’affiche
            devant toi ; sinon il est « derrière ». La distance (formule de <b>Haversine</b>) règle sa taille : plus c’est
            proche, plus c’est gros et bas dans l’horizon.
          </Item>
          <Item icon="🌫️" t="Protéger les gens : la densité floue">
            On ne montre <b>jamais</b> la position exacte d’une personne — seulement une <b>densité</b> (« ≈ 8 dans le coin »).
            Tout le calcul reste <b>sur ton téléphone</b> ou côté serveur, et ne renvoie qu’un résultat agrégé. Ça rend la
            <b> triangulation</b> d’un individu impossible (sécurité, surtout pour les femmes).
          </Item>
          <Item icon="🎯" t="Pourquoi 500 m ?">
            500 m ≈ <b>6 minutes à pied</b> : l’échelle de la vraie spontanéité. Au-delà, ce n’est plus « maintenant, tout
            de suite » — ça bascule dans le Cône (la Forteresse) qui vérifie que tu peux y arriver à temps.
          </Item>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SHELL — onglets de VERSIONS. Fenêtre principale = la plus récente (v2). On garde
// les anciennes simulations accessibles (David : « voir les anciennes »).
// ─────────────────────────────────────────────────────────────────────────────
const VERSIONS: { id: string; label: string; tag: string }[] = [
  { id: 'v2', label: 'Immersion', tag: 'nouveau' },
  { id: 'v1', label: 'Carte', tag: 'v1' },
]
export default function ClutchLivePage() {
  const [ver, setVer] = useState('v2')
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#fff', borderBottom: '1px solid rgba(42,16,32,.1)', position: 'sticky', top: 0, zIndex: 50, overflowX: 'auto' }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(26,8,16,.45)', flexShrink: 0 }}>VERSIONS</span>
        {VERSIONS.map(v => (
          <button key={v.id} onClick={() => setVer(v.id)} style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 800, cursor: 'pointer',
            padding: '6px 12px', borderRadius: 999, border: `1.5px solid ${ver === v.id ? '#EB6BAF' : 'rgba(42,16,32,.14)'}`,
            background: ver === v.id ? '#EB6BAF' : '#fff', color: ver === v.id ? '#fff' : '#532943',
          }}>{v.label}<span style={{ fontSize: 9, fontWeight: 700, opacity: .8, background: ver === v.id ? 'rgba(255,255,255,.25)' : 'rgba(42,16,32,.08)', borderRadius: 6, padding: '1px 5px' }}>{v.tag}</span></button>
        ))}
        <a href="/clutchnight" style={{ marginLeft: 'auto', flexShrink: 0, fontSize: 11.5, fontWeight: 700, textDecoration: 'none', color: '#532943' }}>🌙 Clutch Night →</a>
      </div>
      {ver === 'v2' ? <ClutchLiveImmersionV2 /> : <ClutchLiveSimV1 />}
    </div>
  )
}
