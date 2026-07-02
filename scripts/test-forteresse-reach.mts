// Double-check de la bascule Graal 2 : le mode OFF reste IDENTIQUE à l'ancien modèle, le mode ON est sain.
// Lancer : node scripts/test-forteresse-reach.mts
import { foReachable } from '../lib/forteresse-reach.ts'
import { reachKm as foReachKm } from '../lib/forteresse-engine.ts'
import { haversineKm } from '../lib/events-helpers.ts'

let ok = 0, ko = 0
const C = (n: string, c: boolean, got?: unknown) => {
  if (c) { ok++; console.log('  ✓', n) }
  else { ko++; console.log('  ✗ ÉCHEC :', n, got !== undefined ? `→ ${JSON.stringify(got)}` : '') }
}
const now = new Date('2026-07-02T18:00:00Z')
const gare = { lat: 46.5197, lng: 6.6323 }      // Lausanne Gare
const flon = { lat: 46.5208, lng: 6.6295 }      // ~180 m
const lutry = { lat: 46.5023, lng: 6.6853 }     // ~5 km
const morges = { lat: 46.5108, lng: 6.4986 }    // ~10 km
const sion = { lat: 46.2294, lng: 7.3608 }      // ~66 km

// Réplique EXACTE de l'ancienne règle (le modèle historique) pour prouver la parité en mode OFF.
const legacy = (from: any, to: any, leadMin: number, radiusKm: number) => {
  const km = haversineKm(from.lat, from.lng, to.lat, to.lng)
  if (km <= radiusKm + 0.1) return true
  if (leadMin <= 0) return false
  return km <= foReachKm(leadMin) + radiusKm
}

console.log('── PARITÉ : mode OFF (useDom=false) === ancien modèle, sur une grille de cas ──')
const froms = [gare]; const tos = [flon, lutry, morges, sion]
const leads = [0, 5, 15, 30, 60, 120, 300]; const radii = [0, 0.5, 2, 5]
let pairs = 0, mism = 0
for (const f of froms) for (const t of tos) for (const lead of leads) for (const rad of radii) {
  pairs++
  const a = foReachable(f, t, lead, rad, false, now)
  const b = legacy(f, t, lead, rad)
  if (a !== b) { mism++; console.log(`    ✗ divergence: to=${t.lat} lead=${lead} rad=${rad} → foReachable=${a} legacy=${b}`) }
}
C(`OFF identique à l'ancien modèle sur ${pairs} combinaisons`, mism === 0, { pairs, mism })

console.log('── SANITÉ mode OFF : cas concrets attendus ──')
C('déjà dans ma zone (Flon, rayon 2km) → joignable', foReachable(gare, flon, 30, 2, false, now))
C('Sion à 15 min d\'avance, rayon 5km → PAS joignable (66km)', !foReachable(gare, sion, 15, 5, false, now))
C('Sion à 5h d\'avance → joignable', foReachable(gare, sion, 300, 5, false, now))
C('créneau déjà commencé (lead 0) et hors zone → PAS joignable', !foReachable(gare, lutry, 0, 0.5, false, now))

console.log('── SANITÉ mode ON (Dom) : plus fin, jamais absurde ──')
C('Flon proche → toujours joignable (ON)', foReachable(gare, flon, 30, 2, true, now))
C('Sion à 5h → joignable (ON)', foReachable(gare, sion, 300, 5, true, now))
C('Sion à 2 min → PAS joignable (ON)', !foReachable(gare, sion, 2, 5, true, now))
// La voiture de Dom (70km/h >20km) est PLUS généreuse que l'isotrope ~35km/h → moins de faux blocages.
const onReach = foReachable(gare, sion, 70, 5, true, now)
const offReach = foReachable(gare, sion, 70, 5, false, now)
C('Sion à 70 min : ON (voiture) joignable là où OFF bloque → moins de faux blocages', onReach && !offReach, { onReach, offReach })

console.log(`\n${ko === 0 ? '✅' : '❌'} ${ok} OK · ${ko} KO`)
if (ko > 0) process.exit(1)
