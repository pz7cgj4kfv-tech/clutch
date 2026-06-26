// Preuve du moteur de faisabilité. Lancer : node scripts/test-feasibility.mts
import { subtract, intersect, freeWindows, candidateSlots, classifySlot, travelMs } from '../lib/feasibility.ts'

let ok = 0, ko = 0
const C = (n: string, c: boolean) => { if (c) { ok++; console.log('  ✓', n) } else { ko++; console.log('  ✗ ÉCHEC :', n) } }
const h = (n: number) => n * 3_600_000  // n heures en ms (epoch relatif à 0)
const m = (n: number) => n * 60_000

console.log('── Soustraction d\'intervalles ──')
C('un trou au milieu coupe en deux', JSON.stringify(subtract([{start:h(10),end:h(14)}],[{start:h(11),end:h(12)}]))===JSON.stringify([{start:h(10),end:h(11)},{start:h(12),end:h(14)}]))
C('un trou qui couvre tout → rien', subtract([{start:h(10),end:h(12)}],[{start:h(9),end:h(13)}]).length===0)
C('trou hors zone → inchangé', subtract([{start:h(10),end:h(12)}],[{start:h(14),end:h(15)}]).length===1)

console.log('── Intersection ──')
C('12-14 ∩ 13-18 = 13-14', JSON.stringify(intersect([{start:h(12),end:h(14)}],[{start:h(13),end:h(18)}]))===JSON.stringify([{start:h(13),end:h(14)}]))
C('aucun croisement → vide', intersect([{start:h(12),end:h(14)}],[{start:h(18),end:h(23)}]).length===0)

console.log('── Fenêtres libres (occupation élargie du buffer 1h) ──')
const free = freeWindows([{start:h(12),end:h(22)}],[{start:h(19),end:h(21)}],60)
// occupation 19-21 + buffer 1h → 18-22 retiré → libre = 12-18
C('libre = 12h-18h (RDV 19-21 + buffer)', JSON.stringify(free)===JSON.stringify([{start:h(12),end:h(18)}]))

console.log('── 🔑 Cas David : event 19h Lausanne, moi à Morges (trajet 20min) ──')
// Je suis dispo 16-22, elle 13-22. Mon engagement = event 19h. Lieu clutch = Morges → trajet 20min vers Lausanne.
const myFree = freeWindows([{start:h(16),end:h(22)}],[],60)
const theirFree = [{start:h(13),end:h(22)}]
const slots = candidateSlots({ myFree, theirFree, now:h(15), minDurationMin:30, nextEngagement:{ start:h(19), travelToMs:m(20) } })
// dernier départ = 19h − 20min = 18h40. Donc créneau 16-18h40, durée max au début (16h) = 160min.
C('un créneau proposé', slots.length===1)
C('le créneau commence à 16h (now)', slots[0].start===h(16))
C('durée max = jusqu\'à 18h40 (160 min)', slots[0].maxDurationMin===160)

console.log('── Classement d\'un créneau précis ──')
// Clutch 18h40 Morges, 1h, puis event 19h Lausanne (trajet 20min) → arrivée 20h40 >> 19h → IMPOSSIBLE
C('18h40 + 1h + trajet → impossible (event 19h)', classifySlot({start:h(18)+m(40),durationMin:60,nextStart:h(19),travelToNextMs:m(20)})==='impossible')
// Clutch 17h, 1h, trajet 20min → arrivée 18h20, event 19h → marge 40min → ok
C('17h + 1h + trajet → ok (marge 40min)', classifySlot({start:h(17),durationMin:60,nextStart:h(19),travelToNextMs:m(20)})==='ok')
// Clutch 17h40, 1h, trajet 20min → arrivée 19h00 pile → marge 0 < 5min → tendu
C('arrivée pile à l\'heure → tendu', classifySlot({start:h(17)+m(40),durationMin:60,nextStart:h(19),travelToNextMs:m(20)})==='tense')
C('pas d\'engagement après → toujours ok', classifySlot({start:h(20),durationMin:120,nextStart:null})==='ok')

console.log('── Trajet ──')
C('10 km ≈ 27 min', Math.abs(travelMs(10)/60000 - 27) < 1)

console.log(`\n── Résultat : ${ok} OK, ${ko} échec(s) ──`)
if (ko > 0) process.exit(1)
