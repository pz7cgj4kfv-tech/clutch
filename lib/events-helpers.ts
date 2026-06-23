// lib/events-helpers.ts — fonctions PURES extraites de app2/page.tsx (refactor 23.06).
// Aucun changement de comportement : code identique, juste déplacé pour alléger le gros fichier.
// Tout est pur (pas de React, pas de state, pas de Supabase) → sûr à extraire.

// Distance haversine (km) entre 2 points GPS.
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371, d2r = Math.PI / 180
  const dLat = (lat2 - lat1) * d2r, dLng = (lng2 - lng1) * d2r
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * d2r) * Math.cos(lat2 * d2r) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// 📡 Distance dispo→événement. SÛR : distance à un LIEU fixe (le café), jamais à une personne
// → aucune triangulation possible. Réel si venue_lat/lng ; sinon démo stable depuis l'id.
export function eventKm(ev: any, myLat: number, myLng: number): number | null {
  const la = ev?.venue_lat, lo = ev?.venue_lng
  if (typeof la === 'number' && typeof lo === 'number') return haversineKm(myLat, myLng, la, lo)
  if (ev?.id) { let h = 0; const s = String(ev.id); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return Math.round((0.4 + (h % 1320) / 100) * 10) / 10 }
  return null
}

// 📸 Photo d'event : la vraie si fournie, sinon une belle photo de secours (pool testé qui charge).
export const EV_PHOTO_POOL = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
  'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&q=80',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
  'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=600&q=80',
  'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=600&q=80',
  'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80',
  'https://images.unsplash.com/photo-1514362453360-8f94243c9996?w=600&q=80',
  'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=600&q=80',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
  'https://images.unsplash.com/photo-1566903451935-7e8835ed3e92?w=600&q=80',
  'https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=600&q=80',
  'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&q=80',
]
export function eventPhotoFor(ev: any): string {
  const d = ev?.eventPhotos?.[0]
  if (d && String(d).startsWith('http')) return d
  let h = 0; const s = String(ev?.id || ev?.title || 'x'); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return EV_PHOTO_POOL[h % EV_PHOTO_POOL.length]
}

// 🎨 Catégorie + couleur d'un event (7 catégories, palette Clutch, pas d'orange/bleu/jaune).
export function eventCat(ev: any): { k: string; l: string; c: string } {
  const t = (((ev?.tags) || []).join(' ') + ' ' + (ev?.title || '') + ' ' + (ev?.lieu || '')).toLowerCase()
  const has = (...ws: string[]) => ws.some(w => t.includes(w))
  if (has('yoga', 'médit', 'medit', 'bien-être', 'bien être', 'respiration', 'kombucha', 'ferment', 'massage', 'spa', 'relax')) return { k: 'bienetre', l: 'Bien-être', c: '#77BC1F' }
  if (has('run', 'running', 'course', 'escalade', 'vélo', 'velo', 'vtt', 'foot', 'basket', 'ping', 'tennis', 'natation', 'fitness', 'sport', 'muscu', 'rando', 'nature', 'montagne', 'plage', 'nautique', 'kayak', 'paddle')) return { k: 'sport', l: 'Sport & Aventure', c: '#1FA890' }
  if (has('apéro', 'apero', 'brunch', 'dîner', 'diner', 'resto', 'gastro', 'cuisine', 'vin', 'dégustation', 'degustation', 'café', 'cafe', 'recettes')) return { k: 'gastro', l: 'Gastronomie', c: '#8E2E5D' }
  if (has('jazz', 'concert', 'musique', 'dj', 'live', 'techno', 'soul', 'rock', 'art', 'aquarelle', 'théâtre', 'theatre', 'lecture', 'camus', 'expo', 'musée', 'musee', 'poterie', 'peinture', 'conférence', 'conference')) return { k: 'culture', l: 'Art & Culture', c: '#532943' }
  if (has('club', 'soirée', 'soiree', 'after', 'clubbing', 'bar', 'rooftop', 'karaoké', 'karaoke', 'open mic', 'impro', 'stand-up', 'jeux', 'games')) return { k: 'nuit', l: 'Soirée', c: '#EB6BAF' }
  if (has('vide-dressing', 'dressing', 'marché', 'marche', 'swap', 'diy', 'déco', 'deco', 'mode', 'beauté', 'beaute', 'artisan')) return { k: 'lifestyle', l: 'Lifestyle', c: '#B5179E' }
  if (has('pro', 'réseau', 'reseau', 'network', 'coworking', 'business', 'boulot', 'startup', 'bénévolat', 'benevolat', 'communauté', 'communaute', 'atelier')) return { k: 'social', l: 'Communauté', c: '#6F6F6E' }
  return { k: 'autre', l: 'Découverte', c: '#8E7CC3' }
}

// 🏠 Affichage du lieu : si « chez moi » (home_private) → quartier seulement, adresse révélée plus tard.
export function evLieuDisplay(ev: any, en: boolean): string {
  const lieu = String(ev?.lieu || '—')
  if (ev?.home_private) {
    const parts = lieu.split(',').map((s: string) => s.trim()).filter(Boolean)
    const area = parts[parts.length - 1] || lieu
    return en ? `Around ${area} · address revealed before` : `Quartier de ${area} · adresse révélée avant`
  }
  return lieu.split(',')[0]
}

// Heat radar (palette Mel) : proche = vert (vas-y), coin = rose, loin = gris estompé.
export function kmHeat(km: number) {
  return km <= 2 ? { c: '#77BC1F', bg: 'rgba(119,188,31,.12)' }
    : km <= 8 ? { c: '#EB6BAF', bg: 'rgba(235,107,175,.12)' }
    : { c: '#B2B2B2', bg: 'rgba(178,178,178,.16)' }
}
