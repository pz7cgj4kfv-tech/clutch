// ─────────────────────────────────────────────────────────────────────────────
// RANKING — moteur PUR de visibilité + fiabilité composite (validé 2 rounds GPT 27.06).
// Aucune dépendance, aucun I/O → testable + prouvable comme la machine à états (le « Coq »).
// ⚠️ Branchement live = après l'upgrade Supabase (logging d'impressions). Ici = la logique seule.
//
// Décisions gravées (cf. project-braindump-26jun-soir) :
//  • Visibilité = Compatibilité × Fiabilité × Besoin_de_visibilité × Fatigue_d'exposition.
//    → La LARGEUR de dispo agit à la couche ÉLIGIBILITÉ (dans + de pools), PAS comme poids par impression
//      (sinon effet superstar). Le disjoncteur anti-superstar = la FATIGUE (rendements décroissants).
//  • Fiabilité = score COMPOSITE multi-familles + escompte du feedback croisé réciproque (anti « 2 potes »).
//  • Cold start = neutre (0.5) avec rétrécissement bayésien selon la confiance (peu d'obs → reste neutre).
// ─────────────────────────────────────────────────────────────────────────────
// Constantes LOCALES (auto-suffisant pour node/fuzzer, comme clutch-states.ts). Miroir app = RANK/.reliability.
const RANK = { exposureFatigueK: 0.15, exposureNeedMax: 1.20, coldStartNeutral: 0.5, confidenceObsHalf: 8 }
const REL = {
  weights: { presence: 0.35, cancels: 0.25, crossFeedback: 0.20, seniority: 0.10, systemSignal: 0.10 },
  crossFeedbackReciprocityPenalty: 0.6,
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x))

// ── VISIBILITÉ (poids PAR IMPRESSION) ───────────────────────────────────────
export function visibilityWeight(o: {
  compatibility: number          // 0..1 (le CD score existant)
  reliability: number            // 0..1 (cf. reliabilityScore — cold start = 0.5)
  exposureNeed?: number          // 1..1.2 (boost sous-exposé ; 1 = pas de boost)
  recentImpressions?: number     // nb de fois montré récemment (→ fatigue)
}): number {
  const R = RANK
  const need = clamp(o.exposureNeed ?? 1, 1, R.exposureNeedMax)
  const fatigue = 1 / (1 + R.exposureFatigueK * Math.max(0, o.recentImpressions ?? 0))
  return clamp01(o.compatibility) * clamp01(o.reliability) * need * fatigue
}

// ── FIABILITÉ COMPOSITE ──────────────────────────────────────────────────────
// Chaque famille ∈ [0,1]. `observations` pilote le cold start (peu d'obs → score tiré vers le neutre).
// `crossFeedbackReciprocity` ∈ [0,1] = part du feedback croisé venant d'une boucle fermée (2 potes) → escompté.
export function reliabilityScore(f: {
  presence?: number
  cancels?: number
  crossFeedback?: number
  crossFeedbackReciprocity?: number
  seniority?: number
  systemSignal?: number
  observations?: number
}): { score: number; confidence: number } {
  const R = REL
  const N = RANK
  const neutral = N.coldStartNeutral
  // anti-gaming : escompte le feedback croisé selon sa réciprocité (boucle fermée = peu crédible)
  const recip = clamp01(f.crossFeedbackReciprocity ?? 0)
  const crossAdj = clamp01(f.crossFeedback ?? neutral) * (1 - R.crossFeedbackReciprocityPenalty * recip)
  const w = R.weights
  const raw =
    w.presence     * clamp01(f.presence     ?? neutral) +
    w.cancels      * clamp01(f.cancels      ?? neutral) +
    w.crossFeedback* crossAdj +
    w.seniority    * clamp01(f.seniority    ?? 0) +
    w.systemSignal * clamp01(f.systemSignal ?? neutral)
  // cold start bayésien : peu d'observations → on reste proche du neutre (on mesure aussi notre CONFIANCE)
  const obs = Math.max(0, f.observations ?? 0)
  const confidence = obs / (obs + N.confidenceObsHalf)
  const score = neutral + (raw - neutral) * confidence
  return { score: clamp01(score), confidence }
}
