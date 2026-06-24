'use client'
// ─────────────────────────────────────────────────────────────────────────────
// CLUTCH NIGHT (simulation) — /clutchnight. Le mode SORTIES : fond noir, étoiles,
// les lieux qui bougent CE SOIR s'allument et pulsent. Fait pour donner envie de
// sortir. Gens en densité floue (jamais leur position). Page isolée, démo.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useRef, useState } from 'react'

const C = {
  ink: '#ECE6F5', dim: 'rgba(236,230,245,.55)', gold: '#FFBF9E',
  pink: '#EB6BAF', purple: '#9B7CF0', border: 'rgba(155,124,240,.25)', panel: '#16101F',
}
const LINKS: [string, string][] = [
  ['/clutchnight', '🌙 Clutch Night'], ['/clutchlive', '⚡ Clutch Live'], ['/cockpit', '🛰️ Cockpit'],
  ['/eventsmap', '🗺️ Carte events'], ['/vision2', '📖 Vision 2'], ['/hq', '🔒 QG'],
]
function hav(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371, dLat = (bLat - aLat) * Math.PI / 180, dLng = (bLng - aLng) * Math.PI / 180
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * Math.PI / 180) * Math.cos(bLat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}

type Ev = { id: string; emoji: string; title: string; lat: number; lng: number; lieu: string; time: string; vibe: string; now?: boolean; hot?: boolean }
const NIGHT: Ev[] = [
  { id: 'n1', emoji: '🎷', title: 'Open mic jazz', lat: 46.5212, lng: 6.6275, lieu: 'MAD Club', time: '21:00', vibe: 'Ambiance feutrée · bières locales', now: true, hot: true },
  { id: 'n2', emoji: '🌃', title: 'Clutch Night — rooftop', lat: 46.5205, lng: 6.6295, lieu: 'Rooftop du Flon', time: '22:30', vibe: 'DJ set · vue sur la ville', hot: true },
  { id: 'n3', emoji: '🍻', title: 'Afterwork', lat: 46.5219, lng: 6.6308, lieu: 'Le Flon', time: '18:30', vibe: 'Networking décontracté', now: true },
  { id: 'n4', emoji: '🍷', title: 'Apéro littéraire', lat: 46.5232, lng: 6.6353, lieu: 'Vieille Ville', time: '19:30', vibe: 'On refait le monde, un verre à la main' },
  { id: 'n5', emoji: '🎨', title: 'Peinture & vin', lat: 46.5198, lng: 6.6330, lieu: 'St-François', time: '20:00', vibe: 'Un verre, un pinceau, ta toile' },
  { id: 'n6', emoji: '🎶', title: 'Concert indie', lat: 46.5172, lng: 6.6290, lieu: 'Les Docks', time: '21:30', vibe: 'Groupe montant · scène intime', hot: true },
  { id: 'n7', emoji: '🍸', title: 'Cocktails & rencontres', lat: 46.5225, lng: 6.6285, lieu: 'Great Escape', time: '20:30', vibe: 'Spontané · on se parle vraiment' },
]
const CROWDS = [{ lat: 46.5210, lng: 6.6300, n: 14 }, { lat: 46.5205, lng: 6.6280, n: 9 }, { lat: 46.5230, lng: 6.6350, n: 6 }]

export default function ClutchNight() {
  const divRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const userRef = useRef<any>(null)
  const headingRef = useRef(Math.PI / 3)
  const [ready, setReady] = useState(false)
  const [sel, setSel] = useState<Ev | null>(null)
  const [pos, setPos] = useState<[number, number]>([46.5200, 6.6310])
  const [walking, setWalking] = useState(false)
  const [liveCount, setLiveCount] = useState(29)
  const [stars] = useState(() => Array.from({ length: 90 }, (_, i) => ({ x: (i * 41 % 100), y: (i * 27 % 100), s: (i % 3) + 1, d: (i % 6) * 0.5 })))

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
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map)
      userRef.current = L.marker(pos, { icon: L.divIcon({ className: '', iconSize: [26, 26], iconAnchor: [13, 13], html: `<div class="cn-me"><span class="cn-mering"></span><span class="cn-medot"></span></div>` }), zIndexOffset: 1000 }).addTo(map)
      CROWDS.forEach(cr => L.marker([cr.lat, cr.lng], { icon: L.divIcon({ className: '', iconSize: [80, 80], iconAnchor: [40, 40], html: `<div class="cn-crowd"><span class="cn-cring"></span><span class="cn-clabel">≈${cr.n}</span></div>` }) }).addTo(map))
      NIGHT.forEach(ev => {
        const m = L.marker([ev.lat, ev.lng], { icon: L.divIcon({ className: '', iconSize: [44, 52], iconAnchor: [22, 50], html: `<div class="cn-pin ${ev.hot ? 'cn-hot' : ''}"><span>${ev.emoji}</span>${ev.now ? '<i class="cn-live">●</i>' : ''}</div>` }) }).addTo(map)
        m.bindTooltip(`<b>${ev.title}</b><br>${ev.lieu} · ${ev.time}`, { direction: 'top', offset: [0, -48] })
        m.on('click', () => setSel(ev))
      })
      setReady(true)
    })
    return () => { if (map) { map.remove(); mapRef.current = null } }
  }, [])

  // déplacement : ton point bouge + la carte suit (comme ton GPS en vrai)
  useEffect(() => {
    if (!ready || !userRef.current) return
    userRef.current.setLatLng(pos)
    mapRef.current.panTo(pos, { animate: true, duration: 0.6 })
  }, [pos, ready])

  // auto-balade
  useEffect(() => {
    if (!walking) return
    const iv = setInterval(() => {
      setPos(([la, ln]) => {
        headingRef.current += (Math.random() - 0.5) * 0.8
        if (hav(la, ln, 46.5205, 6.6300) > 1.5) headingRef.current = Math.atan2(6.6300 - ln, 46.5205 - la)
        const step = 0.0008
        return [la + Math.cos(headingRef.current) * step, ln + Math.sin(headingRef.current) * step]
      })
    }, 1400)
    return () => clearInterval(iv)
  }, [walking])

  // dynamisme : le nombre de gens qui sortent pulse
  useEffect(() => {
    const iv = setInterval(() => setLiveCount(c => Math.max(14, Math.min(60, c + Math.round((Math.random() - 0.5) * 4)))), 2200)
    return () => clearInterval(iv)
  }, [])

  const around = useMemo(() => NIGHT.map(e => ({ e, km: hav(pos[0], pos[1], e.lat, e.lng) })).sort((a, b) => (b.e.hot ? 1 : 0) - (a.e.hot ? 1 : 0) || a.km - b.km), [pos])

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(1200px 600px at 50% -10%, #241734, #0A0612 60%)', color: C.ink, fontFamily: 'ui-sans-serif,system-ui,-apple-system,sans-serif' }}>
      <style>{`
        .cn-me{position:relative;width:26px;height:26px;display:grid;place-items:center}
        .cn-me .cn-mering{position:absolute;width:16px;height:16px;border-radius:50%;background:${C.pink};animation:cnp 1.8s infinite ease-out}
        .cn-me .cn-medot{position:relative;width:12px;height:12px;border-radius:50%;background:${C.pink};border:2px solid #fff;box-shadow:0 0 12px ${C.pink}}
        @keyframes cnp{0%{transform:scale(.5);opacity:.8}100%{transform:scale(3.2);opacity:0}}
        .cn-pin{position:relative;width:44px;height:44px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:linear-gradient(135deg,${C.purple},${C.pink});border:2px solid rgba(255,255,255,.85);box-shadow:0 0 16px ${C.purple};display:grid;place-items:center}
        .cn-pin span{transform:rotate(45deg);font-size:19px}
        .cn-hot{animation:cnglow 1.6s infinite alternate ease-in-out}
        @keyframes cnglow{from{box-shadow:0 0 10px ${C.purple}}to{box-shadow:0 0 26px ${C.pink}}}
        .cn-live{position:absolute;top:-6px;right:-6px;transform:rotate(45deg);color:#34D399;font-size:12px;animation:cnp 1.4s infinite}
        .cn-crowd{position:relative;width:80px;height:80px;display:grid;place-items:center}
        .cn-crowd .cn-cring{position:absolute;width:62px;height:62px;border-radius:50%;background:radial-gradient(circle,rgba(235,107,175,.4),rgba(235,107,175,0) 70%);animation:cnc 2.6s infinite ease-out}
        @keyframes cnc{0%{transform:scale(.6);opacity:.8}100%{transform:scale(1.5);opacity:.15}}
        .cn-clabel{position:relative;font-size:11px;font-weight:800;color:#fff;background:rgba(235,107,175,.85);border-radius:10px;padding:1px 7px}
        .leaflet-container{background:#0A0612!important}
      `}</style>

      {/* étoiles */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {stars.map((st, i) => <span key={i} style={{ position: 'absolute', left: `${st.x}%`, top: `${st.y}%`, width: st.s, height: st.s, borderRadius: '50%', background: '#fff', opacity: .6, boxShadow: '0 0 5px #fff', animation: `cnp 3.5s ${st.d}s infinite ease-in-out` }} />)}
      </div>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: '16px 14px 50px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
          {LINKS.map(([href, label], i) => (
            <a key={href} href={href} style={{ fontSize: 11.5, fontWeight: i === 0 ? 800 : 600, textDecoration: 'none', color: i === 0 ? '#0A0612' : C.dim, background: i === 0 ? C.gold : 'rgba(255,255,255,.06)', border: `1px solid ${i === 0 ? C.gold : C.border}`, borderRadius: 9, padding: '5px 11px', whiteSpace: 'nowrap' }}>{label}{i === 0 ? ' · ici' : ''}</a>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 27, fontWeight: 900, letterSpacing: '-.5px', background: `linear-gradient(90deg,${C.pink},${C.purple})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🌙 Clutch Night</div>
          <div style={{ fontSize: 13, color: C.dim, marginTop: 2 }}>Ça bouge ce soir à Lausanne. Sors.</div>
        </div>

        {/* Mode d'emploi */}
        <div style={{ background: 'rgba(255,255,255,.05)', border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: C.dim, lineHeight: 1.65 }}>
          <b style={{ color: C.ink }}>Comment ça marche : </b>Clutch Night te montre, sur une carte, <b style={{ color: C.pink }}>les sorties qui bougent ce soir</b> autour de toi. Les lieux chauds <b style={{ color: C.purple }}>brillent</b>, le badge <b style={{ color: '#34D399' }}>● LIVE</b> = ça se passe maintenant. Appuie sur <b style={{ color: C.ink }}>« Je me balade »</b> : ton point se déplace et les distances se mettent à jour. Le but : te donner envie de sortir, là, maintenant.
        </div>
        {/* Contrôles dynamiques */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <button onClick={() => setWalking(w => !w)} style={{ fontSize: 12.5, fontWeight: 800, padding: '8px 15px', borderRadius: 11, cursor: 'pointer', border: 'none', background: walking ? C.pink : `linear-gradient(135deg,${C.purple},${C.pink})`, color: '#fff' }}>{walking ? '⏸ Stop' : '▶ Je me balade'}</button>
          <span style={{ fontSize: 12.5, color: C.dim }}>🔥 <b style={{ color: C.pink }}>{liveCount}</b> personnes sortent en ce moment</span>
        </div>

        <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', border: `1px solid ${C.border}`, boxShadow: `0 8px 40px rgba(155,124,240,.25)` }}>
          <div ref={divRef} style={{ width: '100%', height: '52vh', minHeight: 340, background: '#0A0612' }} />
          {!ready && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: C.dim }}>Chargement…</div>}
        </div>

        <div style={{ fontSize: 12.5, fontWeight: 800, color: C.gold, margin: '18px 0 8px' }}>✨ Ça bouge ce soir</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 10 }}>
          {around.map(({ e, km }) => (
            <div key={e.id} onClick={() => setSel(e)} style={{ background: e.hot ? 'linear-gradient(135deg,rgba(155,124,240,.16),rgba(235,107,175,.10))' : 'rgba(255,255,255,.04)', border: `1px solid ${e.hot ? 'rgba(235,107,175,.4)' : C.border}`, borderRadius: 14, padding: '12px 14px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 22 }}>{e.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</div>
                  <div style={{ fontSize: 11, color: C.dim }}>{e.lieu} · {km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`}</div>
                </div>
                {e.now ? <span style={{ fontSize: 9.5, fontWeight: 900, color: '#0A0612', background: '#34D399', borderRadius: 6, padding: '2px 6px' }}>● LIVE</span> : <span style={{ fontSize: 11, fontWeight: 800, color: C.gold }}>{e.time}</span>}
              </div>
              <div style={{ fontSize: 11.5, color: C.dim, marginTop: 6, lineHeight: 1.5 }}>{e.vibe}</div>
            </div>
          ))}
        </div>
      </div>

      {sel && (
        <div onClick={() => setSel(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(10,6,18,.7)', backdropFilter: 'blur(3px)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.panel, width: '100%', maxWidth: 520, borderRadius: '20px 20px 0 0', padding: '18px 20px 28px', border: `1px solid ${C.border}`, borderBottom: 'none' }}>
            <div style={{ width: 38, height: 4, borderRadius: 3, background: C.border, margin: '0 auto 14px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 30 }}>{sel.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 900 }}>{sel.title}</div>
                <div style={{ fontSize: 12.5, color: C.dim }}>📍 {sel.lieu} · {sel.time}</div>
              </div>
              {sel.now && <span style={{ fontSize: 10, fontWeight: 800, color: '#0A0612', background: '#34D399', borderRadius: 6, padding: '3px 8px' }}>● LIVE</span>}
            </div>
            <div style={{ fontSize: 13.5, color: C.dim, lineHeight: 1.7, marginBottom: 16 }}>{sel.vibe}. Rejoins les gens qui sortent ce soir — rencontres spontanées garanties.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ flex: 1, background: `linear-gradient(135deg,${C.purple},${C.pink})`, color: '#fff', border: 'none', borderRadius: 12, padding: '12px', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>J'y vais ✦ (démo)</button>
              <button onClick={() => setSel(null)} style={{ background: 'rgba(255,255,255,.06)', color: C.ink, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
