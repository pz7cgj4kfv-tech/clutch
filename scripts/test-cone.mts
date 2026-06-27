// Preuve du Cône (couplage rayon↔heure + tension). Lancer : node scripts/test-cone.mts
import { travelMs as travelMsFeas } from '../lib/feasibility.ts'
import {
  travelMs, edgeTravelMs, earliestCredibleStart, credibleRadiusKm, coneTension, coneLevel, coneHint,
  radiusAtTension, CONE_BUFFER_MIN,
} from '../lib/cone.ts'

let ok = 0, ko = 0
const C = (n: string, c: boolean) => { if (c) { ok++; console.log('  ✓', n) } else { ko++; console.log('  ✗ ÉCHEC :', n) } }
const MIN = 60_000
const near = (a: number, b: number, tol = 0.5) => Math.abs(a - b) <= tol

console.log('── travelMs : sanity + pas de drift vs feasibility ──')
C('10 km ≈ 27 min', near(travelMs(10) / MIN, 27, 1))
C('5 km ≈ 13.5 min', near(travelMs(5) / MIN, 13.5, 1))
C('cone.travelMs === feasibility.travelMs (aucun drift)',
  [0, 1, 5, 10, 20, 100].every(km => travelMs(km) === travelMsFeas(km)))

console.log('── edgeTravelMs = trajet + marge 15 min ──')
C('bord de 10 km ≈ 27 + 15 = 42 min', near(edgeTravelMs(10) / MIN, 42, 1))

console.log('── earliestCredibleStart : l\'exemple terrain (now 11h30, rayon 10 km) ──')
const now = 0
const earliest = earliestCredibleStart(now, 10)
C('départ crédible repoussé ~42 min plus tard', near((earliest - now) / MIN, 42, 1))
C('rayon plus grand → départ repoussé plus loin', earliestCredibleStart(now, 20) > earliestCredibleStart(now, 5))
C('rayon 0 → seulement la marge (15 min)', near((earliestCredibleStart(now, 0) - now) / MIN, CONE_BUFFER_MIN, 0.5))

console.log('── credibleRadiusKm : inverse cohérent ──')
// si je pars dans 42 min, je devrais pouvoir couvrir ~10 km
C('startAt = now+42min → rayon ≈ 10 km', near(credibleRadiusKm(now, now + 42 * MIN, 15), 10, 0.5))
C('startAt = now (immédiat) → rayon 0', credibleRadiusKm(now, now, 15) === 0)
C('inverse de earliest : round-trip cohérent', near(
  credibleRadiusKm(now, earliestCredibleStart(now, 8), 15), 8, 0.3))

console.log('── coneTension : gradient 0→10 (formule GPT validée) ──')
// slack = startAt - now - travel(R) - buffer ; tension = clamp(10*(1 - slack/60),0,10)
C('config très large → tension 0', coneTension({ now, startAt: now + 5 * 3_600_000, radiusKm: 2 }) === 0)
C('config au bord exact → tension ~10', coneTension({ now, startAt: earliestCredibleStart(now, 10), radiusKm: 10 }) >= 9.9)
C('config hors cône (départ trop tôt) → 10', coneTension({ now, startAt: now + 5 * MIN, radiusKm: 10 }) === 10)
const tMid = coneTension({ now, startAt: now + (42 + 30) * MIN, radiusKm: 10 }) // slack 30 min → tension 5
C('slack 30 min → tension ~5', near(tMid, 5, 0.6))
C('tension toujours dans [0,10]', [0, 1, 2, 5, 10, 50].every(km => {
  const t = coneTension({ now, startAt: now + 20 * MIN, radiusKm: km }); return t >= 0 && t <= 10
}))

console.log('── radiusAtTension : seuils de zones du slider (cohérents avec coneTension) ──')
// fenêtre 180 min : le rayon à tension T doit redonner ~T quand on le repasse dans coneTension.
const win = 180
for (const T of [0, 4, 7, 10]) {
  const r = radiusAtTension(win, T)
  const back = coneTension({ now, startAt: now + win * MIN, radiusKm: r })
  C(`tension ${T} ↔ rayon ${r.toFixed(1)}km (round-trip)`, near(back, T, 0.3) || (T === 0 && back === 0))
}
C('zones croissantes : r(4) < r(7) < r(10)', radiusAtTension(win, 4) < radiusAtTension(win, 7) && radiusAtTension(win, 7) < radiusAtTension(win, 10))
C('r(10) == credibleRadius (la limite)', near(radiusAtTension(win, 10), credibleRadiusKm(now, now + win * MIN), 0.1))
C('fenêtre minuscule → rayon 0 (rien d\'atteignable)', radiusAtTension(10, 4) === 0)

console.log('── coneLevel + coneHint : bornes & messages ──')
C('0-3 → ok (aucun message)', coneLevel(2) === 'ok' && coneHint(2) === null)
C('4-6 → tight (message doux)', coneLevel(5) === 'tight' && !!coneHint(5))
C('7-9 → high', coneLevel(8) === 'high')
C('10 → impossible', coneLevel(10) === 'impossible')
C('hint EN existe aussi', !!coneHint(10, 'en'))

console.log(`\n${ko === 0 ? '✅' : '❌'}  ${ok} OK · ${ko} KO`)
process.exit(ko === 0 ? 0 : 1)
