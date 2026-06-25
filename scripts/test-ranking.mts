// Preuve des propriétés du moteur de ranking (validé GPT). Lancer : node scripts/test-ranking.mts
import { visibilityWeight, reliabilityScore } from '../lib/ranking.ts'

let ok = 0, ko = 0
const check = (name: string, cond: boolean) => { if (cond) { ok++; console.log('  ✓', name) } else { ko++; console.log('  ✗ ÉCHEC :', name) } }

console.log('── Visibilité : anti-superstar (fatigue d\'exposition) ──')
const base = { compatibility: 0.9, reliability: 0.9, exposureNeed: 1 }
const fresh   = visibilityWeight({ ...base, recentImpressions: 0 })
const seen10  = visibilityWeight({ ...base, recentImpressions: 10 })
const seen50  = visibilityWeight({ ...base, recentImpressions: 50 })
check('plus montré → pèse moins (0 > 10 > 50)', fresh > seen10 && seen10 > seen50)
check('un profil égal mais frais bat le sur-exposé', fresh > seen50)

console.log('── Visibilité : la fiabilité FILTRE ──')
const reliable   = visibilityWeight({ compatibility: 0.8, reliability: 0.9, recentImpressions: 0 })
const flaky      = visibilityWeight({ compatibility: 0.8, reliability: 0.2, recentImpressions: 0 })
check('compatible mais peu fiable → écrasé par le fiable', reliable > flaky * 3)

console.log('── Visibilité : boost sous-exposé BORNÉ à +20% ──')
const noBoost = visibilityWeight({ compatibility: 0.7, reliability: 0.7, exposureNeed: 1, recentImpressions: 0 })
const maxBoost= visibilityWeight({ compatibility: 0.7, reliability: 0.7, exposureNeed: 5, recentImpressions: 0 }) // 5 doit être clampé à 1.2
check('le besoin est plafonné (boost ≤ +20%)', Math.abs(maxBoost / noBoost - 1.20) < 1e-9)

console.log('── Fiabilité : gaming « 2 potes » (feedback réciproque escompté) ──')
const honest = reliabilityScore({ presence: 0.8, cancels: 0.8, crossFeedback: 1, crossFeedbackReciprocity: 0, seniority: 0.5, systemSignal: 0.7, observations: 50 })
const gamed  = reliabilityScore({ presence: 0.8, cancels: 0.8, crossFeedback: 1, crossFeedbackReciprocity: 1, seniority: 0.5, systemSignal: 0.7, observations: 50 })
check('boucle fermée → score plus bas que feedback diversifié', gamed.score < honest.score)

console.log('── Fiabilité : cold start neutre (pas 0, pas 100) ──')
const newbie = reliabilityScore({ presence: 1, cancels: 1, crossFeedback: 1, seniority: 0, systemSignal: 1, observations: 0 })
const newbieBad = reliabilityScore({ presence: 0, cancels: 0, crossFeedback: 0, seniority: 0, systemSignal: 0, observations: 0 })
check('0 observation → score ≈ neutre (0.5) même avec familles parfaites', Math.abs(newbie.score - 0.5) < 1e-9)
check('0 observation → score ≈ neutre (0.5) même avec familles nulles', Math.abs(newbieBad.score - 0.5) < 1e-9)
check('0 observation → confiance = 0', newbie.confidence === 0)

console.log('── Fiabilité : la confiance monte avec les observations ──')
const c1 = reliabilityScore({ presence: 0.9, observations: 4 }).confidence
const c2 = reliabilityScore({ presence: 0.9, observations: 40 }).confidence
check('plus d\'observations → plus de confiance', c2 > c1 && c2 < 1)

console.log(`\n── Résultat : ${ok} OK, ${ko} échec(s) ──`)
if (ko > 0) process.exit(1)
