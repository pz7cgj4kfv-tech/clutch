// Preuve du moteur d'événements. Lancer : node scripts/test-events-engine.mts
import { onRegister, isHardHold, isSoftHold, waitlistMax, canRequest, responseDeadlineMs, sweepExpired, defaultEventMode } from '../lib/events-engine.ts'

let ok = 0, ko = 0
const check = (n: string, c: boolean) => { if (c) { ok++; console.log('  ✓', n) } else { ko++; console.log('  ✗ ÉCHEC :', n) } }
const NOW = 1_000_000_000_000, MIN = 60_000

console.log('── Mode OPEN : auto-accept si places, sinon liste d\'attente ──')
check('open + places → accepted', onRegister({mode:'open',placesLeft:3,waitlistCount:0,places:8}).state==='accepted')
check('open + complet → waitlisted', onRegister({mode:'open',placesLeft:0,waitlistCount:2,places:8}).state==='waitlisted')
check('open + complet + waitlist pleine → declined', onRegister({mode:'open',placesLeft:0,waitlistCount:16,places:8}).state==='declined')

console.log('── Mode CURATED : toujours une demande (l\'orga tranche) ──')
check('curated même avec places → requested', onRegister({mode:'curated',placesLeft:5,waitlistCount:0,places:8}).state==='requested')

console.log('── 🔑 Soft hold vs Hard hold ──')
check('requested = soft (n\'occupe pas)', isSoftHold('requested') && !isHardHold('requested'))
check('waitlisted = soft', isSoftHold('waitlisted') && !isHardHold('waitlisted'))
check('accepted = hard (occupe la forteresse)', isHardHold('accepted') && !isSoftHold('accepted'))

console.log('── Liste d\'attente = max(places×2, 10) ──')
check('8 places → 16 en attente', waitlistMax(8)===16)
check('3 places → 10 (plancher)', waitlistMax(3)===10)

console.log('── Anti-spam participant (généreux au lancement) ──')
check('sous les limites → ok', canRequest({activeRequests:2,acceptedFuture:1}).ok===true)
check('trop de demandes → bloqué', canRequest({activeRequests:5,acceptedFuture:0}).ok===false)
check('trop d\'acceptés futurs → bloqué', canRequest({activeRequests:0,acceptedFuture:5}).ok===false)

console.log('── Délai de réponse ──')
const dPlan = responseDeadlineMs({spontaneous:false,eventStart:NOW+10*24*3600*1000,now:NOW})
check('planifié = 6h', dPlan===360*MIN)
const dSponFar = responseDeadlineMs({spontaneous:true,eventStart:NOW+5*3600*1000,now:NOW}) // event loin → 1h plein
check('spontané (event loin) = 1h', dSponFar===60*MIN)
const dSponSoon = responseDeadlineMs({spontaneous:true,eventStart:NOW+40*MIN,now:NOW}) // event dans 40min → début-30min = 10min
check('spontané (event proche) = début−30min (10min)', dSponSoon===10*MIN)

console.log('── Expiration → expired (jamais declined) ──')
check('demande dépassée → expired', sweepExpired({state:'requested',createdAt:NOW,deadlineMs:60*MIN,now:NOW+61*MIN})==='expired')
check('demande encore dans les temps → inchangée', sweepExpired({state:'requested',createdAt:NOW,deadlineMs:60*MIN,now:NOW+10*MIN})==='requested')
check('un accepté n\'expire pas', sweepExpired({state:'accepted',createdAt:NOW,deadlineMs:60*MIN,now:NOW+99*MIN})==='accepted')

console.log('── Défaut de mode ──')
check('individu → curated', defaultEventMode('individual')==='curated')
check('partenaire → open', defaultEventMode('partner')==='open')

console.log(`\n── Résultat : ${ok} OK, ${ko} échec(s) ──`)
if (ko > 0) process.exit(1)
