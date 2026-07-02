// Preuve du moteur GRAAL 2 de Dom (lib/travel-estimate.ts) — les 6 cas du CODEX, portés au style projet.
// Lancer : node scripts/test-travel-estimate.mts
import { estimateTravelMax, haversineDistance, isSwitzerland, type LatLng } from '../lib/travel-estimate.ts'

let ok = 0, ko = 0
const C = (n: string, c: boolean, got?: unknown) => {
  if (c) { ok++; console.log('  ✓', n) }
  else { ko++; console.log('  ✗ ÉCHEC :', n, got !== undefined ? `→ reçu ${JSON.stringify(got)}` : '') }
}

const lausanneGare: LatLng = { lat: 46.5197, lng: 6.6323 }
const lausanneFlon: LatLng = { lat: 46.5208, lng: 6.6295 } // ~180 m
const lutry: LatLng = { lat: 46.5023, lng: 6.6853 }        // ~5 km
const sionGare: LatLng = { lat: 46.2294, lng: 7.3608 }      // ~66 km
const parisGare: LatLng = { lat: 48.8768, lng: 2.3592 }     // hors-CH
const parisNord: LatLng = { lat: 48.8809, lng: 2.3553 }
const now = new Date('2026-07-02T18:00:00Z') // fixe (pas de Date.now → déterministe)

console.log('── Sanity distance/CH ──')
C('Haversine Gare→Flon ≈ 0.18 km', Math.abs(haversineDistance(lausanneGare, lausanneFlon) - 0.18) < 0.1, haversineDistance(lausanneGare, lausanneFlon))
C('Lausanne est en Suisse', isSwitzerland(lausanneGare))
C('Paris n\'est pas en Suisse', !isSwitzerland(parisGare))

console.log('── Cas 1 : distance quasi-nulle ──')
const t1 = estimateTravelMax(lausanneFlon, lausanneFlon, now)
C('minutes 1..2', t1.minutes >= 1 && t1.minutes <= 2, t1.minutes)
C('confidence high', t1.confidence === 'high', t1.confidence)

console.log('── Cas 2 : intra-Lausanne (~180 m) ──')
const t2 = estimateTravelMax(lausanneGare, lausanneFlon, now)
C('minutes ≤ 5', t2.minutes <= 5, t2.minutes)
C('confidence medium', t2.confidence === 'medium', t2.confidence)

console.log('── Cas 3 : bord de rayon urbain (~5 km) ──')
const t3 = estimateTravelMax(lausanneGare, lutry, now)
C('minutes 10..30', t3.minutes >= 10 && t3.minutes <= 30, t3.minutes)
C('confidence medium', t3.confidence === 'medium', t3.confidence)

console.log('── Cas 4 : Lausanne → Sion (~66 km) ──')
const t4 = estimateTravelMax(lausanneGare, sionGare, now)
C('minutes 55..95', t4.minutes >= 55 && t4.minutes <= 95, t4.minutes)
C('confidence medium', t4.confidence === 'medium', t4.confidence)

console.log('── Cas 5 : Lausanne → Sion à pied seul ──')
const t5 = estimateTravelMax(lausanneGare, sionGare, now, ['walk'])
C('minutes > 1000 (fallback marche)', t5.minutes > 1000, t5.minutes)
C('modeUsed walk', t5.modeUsed === 'walk', t5.modeUsed)

console.log('── Cas 6 : hors-Suisse (Paris) ──')
const t6 = estimateTravelMax(parisGare, parisNord, now)
C('confidence low', t6.confidence === 'low', t6.confidence)
C('minutes ≥ 2', t6.minutes >= 2, t6.minutes)

console.log(`\n${ko === 0 ? '✅' : '❌'} ${ok} OK · ${ko} KO`)
if (ko > 0) process.exit(1)
