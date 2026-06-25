// Preuve du moteur de notifications. Lancer : node scripts/test-notifications.mts
import { planNotifications, type Notif } from '../lib/notifications.ts'

let ok = 0, ko = 0
const check = (name: string, cond: boolean) => { if (cond) { ok++; console.log('  ✓', name) } else { ko++; console.log('  ✗ ÉCHEC :', name) } }
const NOW = 1_000_000_000_000
const mk = (o: Partial<Notif>): Notif => ({ id:'n', groupKey:'g', priority:0.6, relevance:0.9, actionable:true, createdAt:NOW-1000, expiresAt:NOW+3600_000, ...o })

console.log('── Actionnable : on ne notifie QUE ce sur quoi on peut agir ──')
const r1 = planNotifications([mk({ id:'a', actionable:false, priority:0.5 })], [], NOW)
check('notif non-actionnable → retenue (pas envoyée)', r1.toSend.length===0 && r1.held[0]?.reason==='not_actionable')

console.log('── Silence : le seuil MONTE avec les envois récents ──')
const borderline = [mk({ id:'b', relevance:0.5, priority:0.5 })]
const calm  = planNotifications(borderline, [], NOW)                                   // 0 envoi récent
const noisy = planNotifications(borderline, Array(5).fill(NOW-60_000), NOW)            // 5 envois récents
check('au calme → envoyée', calm.toSend.length===1)
check('après 5 notifs récentes → retenue (silence mérité)', noisy.toSend.length===0 && noisy.held[0]?.reason==='below_silence_threshold')
check('le seuil de silence a augmenté', noisy.threshold > calm.threshold)

console.log('── Sécurité : la priorité haute PASSE OUTRE le silence ──')
const safety = planNotifications([mk({ id:'sos', priority:0.95, relevance:0.1, actionable:false })], Array(9).fill(NOW-60_000), NOW)
check('SOS/urgent envoyé malgré spam récent ET non-actionnable', safety.toSend.length===1)

console.log('── Fusion : N infos d\'un même groupe → 1 seule notif (avec compte) ──')
const fused = planNotifications([
  mk({ id:'x1', groupKey:'avail-near', createdAt:NOW-3000 }),
  mk({ id:'x2', groupKey:'avail-near', createdAt:NOW-2000 }),
  mk({ id:'x3', groupKey:'avail-near', createdAt:NOW-1000 }),
], [], NOW)
check('3 du même groupe → 1 envoyée', fused.toSend.length===1)
check('la fusionnée porte le compte (3)', fused.toSend[0]?.mergedCount===3)
check('la plus récente gagne (supersession)', fused.toSend[0]?.id==='x3')
check('les 2 anciennes sont marquées superseded', fused.superseded.length===2)

console.log('── Expiration : une notif périmée meurt en silence ──')
const exp = planNotifications([mk({ id:'old', expiresAt:NOW-1 })], [], NOW)
check('périmée → jamais envoyée', exp.toSend.length===0 && exp.expired.length===1)

console.log('── Calme absolu : rien d\'actionnable → zéro buzz ──')
const quiet = planNotifications([mk({ id:'q', actionable:false, priority:0.3 })], [], NOW)
check('rien à dire → 0 envoi', quiet.toSend.length===0)

console.log('── Tri : la priorité la plus haute en premier ──')
const sorted = planNotifications([
  mk({ id:'low', groupKey:'g1', priority:0.4 }),
  mk({ id:'high', groupKey:'g2', priority:0.9 }),
], [], NOW)
check('envoyées triées par priorité décroissante', sorted.toSend[0]?.id==='high')

console.log(`\n── Résultat : ${ok} OK, ${ko} échec(s) ──`)
if (ko > 0) process.exit(1)
