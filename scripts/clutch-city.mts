// 🏙️ CLUTCH CITY — rapport CLI (headless). Lance le MÊME moteur que le cockpit /clutch-city.
//   `npx tsx scripts/clutch-city.mts [N] [seed] [pctFemale]`  (ex: npx tsx scripts/clutch-city.mts 1000 7 50)
import { runSim, type Code } from '@/lib/sim/engine'

const N = parseInt(process.argv[2] || '1000')
const SEED = parseInt(process.argv[3] || '7')
const PF = parseInt(process.argv[4] || '50')
const ENFORCE = process.argv[5] === 'enforce'    // forteresse corrigée (evaluateSchedule)
const r = runSim({ n: N, seed: SEED, pctFemale: PF, captureFrames: false, enforce: ENFORCE })
const s = r.stats

console.log(`\n🏙️  CLUTCH CITY — ${N} agents · Lausanne · 18h · seed ${SEED} · ${PF}% ♀ · forteresse ${ENFORCE ? 'CORRIGÉE ✅' : 'permissive (actuelle)'} (${s.ticks} ticks)`)
console.log('─'.repeat(74))
console.log(`Activité : ${s.slots} créneaux · ${s.sent} clutchs envoyés · ${s.accept} acceptés · ${s.refuse} refusés${ENFORCE ? ` · ${s.blocked} bloqués par la forteresse` : ''} · ${s.events} events · ${s.joins} inscriptions`)
console.log(`Densité  : pic ~${s.peakOnline} actifs · thermostat « ${s.thermoLabel} »`)
console.log('─'.repeat(74))

const labels: Record<Code, string> = {
  CHAINING: '🎯 B1 Enchaînement infaisable (RDV sans le temps d’y aller)',
  EXCLUSION: '   B2/F1 Double-booking (2 engagements en même temps)',
  REACH: '   B/Forteresse RDV inatteignable (trop loin pour l’heure)',
  CAP_RECEIVED: '   A6/E1 Boîte ♀ saturée (>5 reçus/jour)',
  FILTER: '   C1/C3 Filtre contourné (genre asymétrique / mode Pause)',
  EVENT_SEATS: '   D8 Places d’event dépassées',
  HORIZON: '   Horizon 18h dépassé',
  COOLDOWN: '   A1 Cooldown contourné',
}
const order: Code[] = ['CHAINING', 'EXCLUSION', 'REACH', 'CAP_RECEIVED', 'FILTER', 'EVENT_SEATS', 'HORIZON', 'COOLDOWN']
console.log(`🐓 LE COQ — ${r.alerts.length} alerte(s) :\n`)
for (const code of order) {
  const n = r.byCode[code] || 0
  console.log(`${n.toString().padStart(6)}  ${labels[code]}`)
  const ex = r.alerts.find(a => a.code === code)
  if (ex) console.log(`        ↳ ex (tick ${ex.tick}, +${(ex.at / 3600000).toFixed(1)}h) ${ex.from}${ex.to ? '→' + ex.to : ''} : ${ex.msg}`)
}
console.log('─'.repeat(74))
console.log(`Total : ${r.alerts.length} trous. Rejouable : seed ${SEED}. Cockpit visuel → /clutch-city\n`)
