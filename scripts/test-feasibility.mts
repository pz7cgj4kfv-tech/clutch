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

console.log('── Créneaux candidats = fenêtres MUTUELLES (dur : l\'autre doit être dispo) ──')
const myFree = freeWindows([{start:h(16),end:h(22)}],[],60)
const theirFree = [{start:h(13),end:h(22)}]
const slots = candidateSlots({ myFree, theirFree, now:h(15), minDurationMin:30 })
C('un créneau mutuel proposé', slots.length===1)
C('commence à 16h (now)', slots[0].start===h(16))
C('aucun croisement → aucun créneau', candidateSlots({ myFree:[{start:h(12),end:h(14)}], theirFree:[{start:h(18),end:h(23)}], now:h(11), minDurationMin:30 }).length===0)

console.log('── 🔑 GRADIENT (David) : jamais bloqué, on prévient selon la sévérité ──')
// Cas : event 19h Lausanne, je clutche à Morges (trajet 20min vers Lausanne après).
// 18h40 + 1h → arrivée 20h00, event 19h → retard 60min → severity 3, faut annuler.
const s3 = classifySlot({start:h(18)+m(40),durationMin:60,nextStart:h(19),travelToNextMs:m(20)})
C('gros dépassement → severity 3 + requiresCancel', s3.severity===3 && s3.requiresCancel===true)
// 17h40 + 1h → arrivée 19h00 pile → marge 0 → tendu (severity 1)
C('arrivée pile → severity 1 (tendu)', classifySlot({start:h(17)+m(40),durationMin:60,nextStart:h(19),travelToNextMs:m(20)}).severity===1)
// 17h + 1h → arrivée 18h20 → marge 40min → ok (severity 0)
C('large marge → severity 0 (ok)', classifySlot({start:h(17),durationMin:60,nextStart:h(19),travelToNextMs:m(20)}).severity===0)
// 18h25 + 1h → arrivée 19h45 → retard 45min... attends : marge = 19h-19h45 = -45 → severity 3. Prenons -10 :
// 18h10 +1h → arrivée 19h30 → marge -30 → severity 3 ; 18h00+1h → arrivée 19h20 → -20 → severity 2 (risqué)
C('léger dépassement (−20min) → severity 2 (risqué)', classifySlot({start:h(18),durationMin:60,nextStart:h(19),travelToNextMs:m(20)}).severity===2)
C('pas d\'engagement après → severity 0', classifySlot({start:h(20),durationMin:120,nextStart:null}).severity===0)

console.log('── Trajet ──')
C('10 km ≈ 27 min', Math.abs(travelMs(10)/60000 - 27) < 1)

console.log(`\n── Résultat : ${ok} OK, ${ko} échec(s) ──`)
if (ko > 0) process.exit(1)
