// 🏰 COQUE FORTERESSE — énumère TOUTES les configs et prouve les invariants. node scripts/test-forteresse.mts
import {
  evaluate, reachKm, haversineKm, earliestStart, latestStart, clampStart, maxRadiusFor,
  MIN_LEAD_MIN, DEFAULT_LEAD_MIN, MIN_DURATION_MIN, HORIZON_H,
} from '../lib/forteresse-engine.ts'

let ok = 0, ko = 0
const C = (n: string, c: boolean) => { if (c) { ok++; console.log('  ✓', n) } else { ko++; console.log('  ✗ ÉCHEC :', n) } }
const MIN = 60_000, now = 0
const ME: [number, number] = [46.5, 6.58]                 // Morges-ish
// pins à distance D (km) ~est de moi : 1° lng ≈ 76 km à cette latitude
const pinAt = (km: number): [number, number] => [ME[0], ME[1] + km / 76]

console.log('── portée(Δt) : croissante, cohérente avec le moteur trajet ──')
C('portée(0) = 0', reachKm(0) === 0)
C('portée(15min) ≈ 1.7 km', Math.abs(reachKm(15) - 1.74) < 0.4)
C('portée(60min) ≈ 28 km', Math.abs(reachKm(60) - 27.8) < 1.5)
C('portée croît avec Δt', reachKm(15) < reachKm(30) && reachKm(30) < reachKm(60) && reachKm(60) < reachKm(180))

console.log('── haversine : pinAt(D) est bien à ~D km ──')
for (const d of [1, 3, 10, 30]) C(`pinAt(${d}) ≈ ${d} km`, Math.abs(haversineKm(ME[0], ME[1], ...pinAt(d)) - d) < 0.5)

const LEADS = [MIN_LEAD_MIN, 30, 60, 120, 300, 600, HORIZON_H * 60 - MIN_DURATION_MIN]
const DISTS = [0, 1, 3, 10, 30]
const RADII = [0, 1, 5, 10, 30, 50]

console.log('── DEUX PORTES : (1) pin atteignable, PUIS (2) rayon ≤ plafond — issues du même moteur ──')
// Porte 1 : si le pin est trop loin → la config est BLOQUÉE quel que soit le rayon (ok=false partout).
let g1 = true
for (const lead of LEADS) for (const D of DISTS) for (const R of RADII) {
  const start = now + lead * MIN, pin = pinAt(D)
  const e = evaluate({ now, gps: ME, pin, start, end: start + MIN_DURATION_MIN * MIN, radiusKm: R })
  if (e.pinTooFar && e.ok) g1 = false
}
C('pin trop loin ⟹ toujours bloqué (ok=false)', g1)

// Porte 2 : quand le pin est OK, poser le rayon AU plafond reste faisable (le curseur ne ment jamais).
let inv1 = true
for (const lead of LEADS) for (const D of DISTS) {
  const start = now + lead * MIN, pin = pinAt(D)
  const e0 = evaluate({ now, gps: ME, pin, start, end: start + MIN_DURATION_MIN * MIN, radiusKm: 0 })
  if (e0.pinTooFar) continue
  const e = evaluate({ now, gps: ME, pin, start, end: start + MIN_DURATION_MIN * MIN, radiusKm: e0.maxRadiusKm })
  if (!e.feasible) { inv1 = false; console.log(`    drift lead=${lead} D=${D} cap=${e0.maxRadiusKm.toFixed(1)}`) }
}
C('pin OK + rayon = plafond ⟹ toujours faisable', inv1)

console.log('── COHÉRENCE (pin OK) : faisable(R) ⟺ R ≤ plafond (curseur = bandeau = Suivant = confirm) ──')
let inv2 = true
for (const lead of LEADS) for (const D of DISTS) for (const R of RADII) {
  const start = now + lead * MIN, pin = pinAt(D)
  const e = evaluate({ now, gps: ME, pin, start, end: start + MIN_DURATION_MIN * MIN, radiusKm: R })
  if (e.pinTooFar) continue
  const underCap = R <= e.maxRadiusKm + 0.16
  if (e.feasible !== underCap) { inv2 = false; console.log(`    incohérent lead=${lead} D=${D} R=${R} feasible=${e.feasible} cap=${e.maxRadiusKm.toFixed(1)}`) }
}
C('faisabilité ⟺ sous le plafond (zéro contradiction)', inv2)

console.log('── MONOTONIE : plus de temps ⟹ plafond plus grand (pin fixe) ──')
let inv3 = true
for (const D of DISTS) for (let k = 1; k < LEADS.length; k++) {
  const s1 = now + LEADS[k - 1] * MIN, s2 = now + LEADS[k] * MIN, pin = pinAt(D)
  const m1 = evaluate({ now, gps: ME, pin, start: s1, end: s1 + MIN_DURATION_MIN * MIN, radiusKm: 0 }).maxRadiusKm
  const m2 = evaluate({ now, gps: ME, pin, start: s2, end: s2 + MIN_DURATION_MIN * MIN, radiusKm: 0 }).maxRadiusKm
  if (m2 < m1 - 0.01) inv3 = false
}
C('plafond croît avec le lead', inv3)

console.log('── BUG DAVID : les premiers km ne bloquent JAMAIS au défaut (+1h) ──')
{
  const start = now + DEFAULT_LEAD_MIN * MIN
  const onMe = evaluate({ now, gps: ME, pin: ME, start, end: start + MIN_DURATION_MIN * MIN, radiusKm: 8 })
  C('défaut +1h, pin sur moi, R=8 km → FAISABLE (plus de blocage à 8 km)', onMe.feasible && onMe.tension < 5)
  C('défaut +1h → plafond ≥ 25 km', onMe.maxRadiusKm >= 25)
}

console.log('── BUG DAVID : RDV à 2h20 (lead ~61min), pin à 3 km, R=1 → PAS « trop loin » ──')
{
  const start = now + 61 * MIN, pin = pinAt(3)
  const e = evaluate({ now, gps: ME, pin, start, end: start + MIN_DURATION_MIN * MIN, radiusKm: 1 })
  C('faisable & pas pinTooFar', e.feasible && !e.pinTooFar)
  C('tension basse (config large)', e.tension < 4)
}

console.log('── pin trop loin ⟺ plafond ≈ 0 (le pin seul dépasse la portée) ──')
let inv4 = true
for (const lead of LEADS) for (const D of DISTS) {
  const start = now + lead * MIN, pin = pinAt(D)
  const e = evaluate({ now, gps: ME, pin, start, end: start + MIN_DURATION_MIN * MIN, radiusKm: 0 })
  if (e.pinTooFar !== (e.maxRadiusKm <= 0.0001)) inv4 = false
}
C('pinTooFar ⟺ plafond nul', inv4)

console.log('── tension ∈ [0,10] partout · 10 = pile la limite ──')
let inv5 = true, inv5b = true
for (const lead of LEADS) for (const D of DISTS) for (const R of RADII) {
  const start = now + lead * MIN, pin = pinAt(D)
  const e = evaluate({ now, gps: ME, pin, start, end: start + MIN_DURATION_MIN * MIN, radiusKm: R })
  if (e.tension < 0 || e.tension > 10) inv5 = false
}
{
  const start = now + 60 * MIN
  const cap = evaluate({ now, gps: ME, pin: ME, start, end: start + MIN_DURATION_MIN * MIN, radiusKm: 0 }).maxRadiusKm
  const e = evaluate({ now, gps: ME, pin: ME, start, end: start + MIN_DURATION_MIN * MIN, radiusKm: cap })
  inv5b = Math.abs(e.tension - 10) < 0.2
}
C('tension toujours dans [0,10]', inv5)
C('rayon = plafond → tension ≈ 10', inv5b)

console.log('── HORIZON 18h + durée : bornes respectées ──')
C('début clampé ≥ maintenant + marge', clampStart(now, now - 999 * MIN) === earliestStart(now))
C('début clampé ≤ dernier départ possible', clampStart(now, now + 999 * 60 * MIN) === latestStart(now))
{
  const start = now + 60 * MIN
  C('fin > +18h → horizon KO', !evaluate({ now, gps: ME, pin: ME, start, end: now + 19 * 60 * MIN, radiusKm: 1 }).horizonOk)
  C('durée < 30min → horizon KO', !evaluate({ now, gps: ME, pin: ME, start, end: start + 10 * MIN, radiusKm: 1 }).horizonOk)
  C('créneau valide 1h→3h → horizon OK', evaluate({ now, gps: ME, pin: ME, start, end: start + 2 * 60 * MIN, radiusKm: 1 }).horizonOk)
}

console.log('── maxRadiusFor (UI) : borné 1..50, jamais < 1 (on peut toujours poser 1 km) ──')
let inv6 = true
for (const lead of LEADS) for (const D of DISTS) {
  const m = maxRadiusFor(now, ME, pinAt(D), now + lead * MIN)
  if (m < 1 || m > 50) inv6 = false
}
C('plafond UI ∈ [1,50] toujours', inv6)

console.log('── sans GPS : on ne contraint pas par le pin (D=0) ──')
{
  const start = now + 60 * MIN
  const e = evaluate({ now, gps: null, pin: pinAt(999), start, end: start + MIN_DURATION_MIN * MIN, radiusKm: 10 })
  C('GPS inconnu → pinDist=0, pas pinTooFar', e.pinDistKm === 0 && !e.pinTooFar)
}

console.log(`\n${ko === 0 ? '✅' : '❌'}  ${ok} OK · ${ko} KO`)
process.exit(ko === 0 ? 0 : 1)
