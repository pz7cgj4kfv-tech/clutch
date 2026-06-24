'use client'
// ─────────────────────────────────────────────────────────────────────────────
// CARTE INTERACTIVE DES ÉVÉNEMENTS — /eventsmap. Leaflet, vraies adresses
// de Lausanne. Survol = mini-résumé · clic = fiche qui s'ouvre/se ferme.
// Page isolée, testable, zéro risque pour l'app. On l'intégrera ensuite dans /app2.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useRef, useState } from 'react'

const C = {
  bg: '#FAF6F0', card: '#FFFFFF', border: 'rgba(42,16,32,0.14)', ink: '#1a0810',
  gold: '#532943', salmon: '#C0603A', mid: 'rgba(26,8,16,0.78)', dim: 'rgba(26,8,16,0.45)',
  pink: '#EB6BAF', prune: '#2a1020', green: '#77BC1F',
}
const LINKS: [string, string, boolean][] = [
  ['/eventsmap', '🗺️ Carte events', true], ['/vision2', '📖 Vision 2', false],
  ['/vision', '🗺 Vision', false], ['/sim', '🧪 Simulateur', false], ['/animation', '✨ Animations', false], ['/hq', '🔒 QG', false],
]

type Ev = {
  id: string; emoji: string; title: string; lat: number; lng: number; lieu: string;
  date: string; time: string; spots: number; taken: number; price: string;
  creator: string; night?: boolean; desc: string;
}
// Vraies adresses / coordonnées de Lausanne
const EVENTS: Ev[] = [
  { id: 'e1', emoji: '🧘', title: 'Yoga lever du soleil + Brunch', lat: 46.5168, lng: 6.5975, lieu: 'Plage de Vidy', date: 'Samedi', time: '08:00', spots: 12, taken: 7, price: 'Libre (~15 CHF)', creator: 'Anaïs', desc: 'Yoga flow au bord du Léman au lever du soleil, suivi d\'un brunch partagé. Débutants bienvenus.' },
  { id: 'e2', emoji: '🍷', title: 'Apéro littéraire — Camus', lat: 46.5232, lng: 6.6353, lieu: 'Café de l\'Évêché, Vieille Ville', date: 'Vendredi', time: '19:30', spots: 8, taken: 3, price: 'Conso sur place', creator: 'Thomas', desc: 'Discussion autour de "L\'Étranger". Ambiance décontractée, on refait le monde avec un verre.' },
  { id: 'e3', emoji: '🎷', title: 'Open mic jazz', lat: 46.5212, lng: 6.6275, lieu: 'MAD Club, Rue de Genève', date: 'Ce soir', time: '21:00', spots: 40, taken: 22, price: 'Entrée libre', creator: 'Clutch Officiel', night: true, desc: 'Open mic jazz & impro. Que tu joues ou écoutes, bienvenue. Ambiance feutrée, bières locales.' },
  { id: 'e4', emoji: '🛼', title: 'Roller au bord du lac', lat: 46.5075, lng: 6.6258, lieu: 'Place du Port, Ouchy', date: 'Dimanche', time: '15:00', spots: 20, taken: 11, price: 'Gratuit', creator: 'Marco', desc: 'Balade roller le long des quais d\'Ouchy. Tous niveaux, protections conseillées.' },
  { id: 'e5', emoji: '🍻', title: 'Afterwork startup', lat: 46.5219, lng: 6.6308, lieu: 'Le Flon, Place de l\'Europe', date: 'Jeudi', time: '18:30', spots: 30, taken: 19, price: 'Conso sur place', creator: 'Nathan', night: true, desc: 'Afterwork networking décontracté entre indépendants et curieux. On parle de tout sauf de slides.' },
  { id: 'e6', emoji: '🥾', title: 'Rando Sauvabelin', lat: 46.5435, lng: 6.6422, lieu: 'Lac de Sauvabelin', date: 'Samedi', time: '10:00', spots: 15, taken: 6, price: 'Gratuit', creator: 'Emma', desc: 'Marche tranquille autour du lac et de la tour. Café à la buvette à l\'arrivée.' },
  { id: 'e7', emoji: '🎨', title: 'Atelier peinture & vin', lat: 46.5198, lng: 6.6330, lieu: 'Place St-François', date: 'Vendredi', time: '20:00', spots: 10, taken: 8, price: '35 CHF', creator: 'Nora', night: true, desc: 'Atelier peinture guidé, un verre à la main. Repars avec ta toile. Aucun niveau requis.' },
  { id: 'e8', emoji: '🏓', title: 'Tournoi ping-pong', lat: 46.5191, lng: 6.5668, lieu: 'Esplanade EPFL', date: 'Mercredi', time: '17:00', spots: 16, taken: 9, price: 'Gratuit', creator: 'Hugo', desc: 'Mini-tournoi amical en double. Raquettes fournies. Ambiance fun, niveau libre.' },
  { id: 'e9', emoji: '🌃', title: 'Clutch Night — rooftop', lat: 46.5205, lng: 6.6295, lieu: 'Rooftop du Flon', date: 'Samedi', time: '22:30', spots: 25, taken: 17, price: '20 CHF', creator: 'Clutch Officiel', night: true, desc: 'Soirée Clutch Night sur les toits. DJ set, vue sur la ville. Rencontres spontanées garanties.' },
]

export default function EventsMap() {
  const divRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [sel, setSel] = useState<Ev | null>(null)
  const [ready, setReady] = useState(false)
  const [onlyNight, setOnlyNight] = useState(false)

  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const lk = document.createElement('link')
      lk.id = 'leaflet-css'; lk.rel = 'stylesheet'; lk.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(lk)
    }
    let map: any
    import('leaflet').then(mod => {
      const L: any = (mod as any).default || mod
      if (!divRef.current || mapRef.current) return
      map = L.map(divRef.current, { center: [46.5197, 6.6323], zoom: 14, zoomControl: true })
      mapRef.current = map
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19, attribution: '© OpenStreetMap © CARTO',
      }).addTo(map)
      setReady(true)
    })
    return () => { if (map) { map.remove(); mapRef.current = null } }
  }, [])

  // (Re)pose les épingles selon le filtre
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    import('leaflet').then(mod => {
      const L: any = (mod as any).default || mod
      // nettoie les anciens markers
      map.eachLayer((layer: any) => { if (layer instanceof L.Marker) map.removeLayer(layer) })
      EVENTS.filter(e => !onlyNight || e.night).forEach(ev => {
        const color = ev.night ? '#6D4Aa0' : C.pink
        const icon = L.divIcon({
          className: '', iconSize: [40, 48], iconAnchor: [20, 46],
          html: `<div style="position:relative;width:40px;height:48px">
            <div style="width:40px;height:40px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};box-shadow:0 3px 8px rgba(42,16,32,.4);display:grid;place-items:center;border:2px solid #fff">
              <span style="transform:rotate(45deg);font-size:18px">${ev.emoji}</span>
            </div></div>`,
        })
        const m = L.marker([ev.lat, ev.lng], { icon }).addTo(map)
        m.bindTooltip(`<b>${ev.title}</b><br>${ev.date} ${ev.time} · ${ev.taken}/${ev.spots} places`, { direction: 'top', offset: [0, -42], opacity: 1 })
        m.on('click', () => setSel(ev))
      })
    })
  }, [ready, onlyNight])

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'ui-sans-serif,system-ui,-apple-system,sans-serif' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '18px 16px 40px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
          {LINKS.map(([href, label, here]) => (
            <a key={href} href={href} style={{ fontSize: 11.5, fontWeight: here ? 800 : 600, textDecoration: 'none', color: here ? '#fff' : C.mid, background: here ? C.gold : C.card, border: `1px solid ${here ? C.gold : C.border}`, borderRadius: 9, padding: '5px 11px', whiteSpace: 'nowrap' }}>{label}{here ? ' · ici' : ''}</a>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 23, fontWeight: 900, color: C.gold, letterSpacing: '-.5px' }}>🗺️ Carte des événements</span>
          <span style={{ fontSize: 12, color: C.dim }}>Survole une épingle = résumé · clique = fiche</span>
          <button onClick={() => setOnlyNight(n => !n)} style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${onlyNight ? '#6D4Aa0' : C.border}`, background: onlyNight ? '#6D4Aa015' : C.card, color: onlyNight ? '#6D4Aa0' : C.mid }}>🌙 Clutch Night {onlyNight ? '✓' : ''}</button>
        </div>

        <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.border}`, boxShadow: '0 6px 24px rgba(42,16,32,.10)' }}>
          <div ref={divRef} style={{ width: '100%', height: '62vh', minHeight: 380, background: '#e8e0d8' }} />
          {!ready && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: C.dim, fontSize: 13 }}>Chargement de la carte…</div>}
        </div>

        <div style={{ fontSize: 11.5, color: C.dim, marginTop: 8 }}>{EVENTS.filter(e => !onlyNight || e.night).length} événements · vraies adresses de Lausanne · déplace / zoome librement.</div>
      </div>

      {/* Fiche événement (clic) */}
      {sel && (
        <div onClick={() => setSel(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(42,16,32,.35)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.card, width: '100%', maxWidth: 520, borderRadius: '18px 18px 0 0', padding: '18px 20px 28px', boxShadow: '0 -10px 40px rgba(42,16,32,.3)' }}>
            <div style={{ width: 38, height: 4, borderRadius: 3, background: C.border, margin: '0 auto 14px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 30 }}>{sel.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: C.ink }}>{sel.title}</div>
                <div style={{ fontSize: 12.5, color: C.mid }}>📍 {sel.lieu}</div>
              </div>
              {sel.night && <span style={{ fontSize: 10, fontWeight: 800, color: '#6D4Aa0', background: '#6D4Aa015', border: '1px solid #6D4Aa040', borderRadius: 6, padding: '2px 7px' }}>🌙 NIGHT</span>}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '10px 0' }}>
              {[`🗓 ${sel.date} ${sel.time}`, `👥 ${sel.taken}/${sel.spots} places`, `💸 ${sel.price}`, `✦ par ${sel.creator}`].map((t, i) => (
                <span key={i} style={{ fontSize: 11.5, fontWeight: 700, color: C.mid, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '4px 9px' }}>{t}</span>
              ))}
            </div>
            <div style={{ fontSize: 13.5, color: C.mid, lineHeight: 1.7, marginBottom: 16 }}>{sel.desc}</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ flex: 1, background: C.pink, color: '#fff', border: 'none', borderRadius: 12, padding: '12px', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>Je participe (démo)</button>
              <button onClick={() => setSel(null)} style={{ background: C.bg, color: C.mid, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
