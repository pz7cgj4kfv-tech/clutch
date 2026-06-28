// ─────────────────────────────────────────────────────────────────────────────
// LE CÔNE — couplage RAYON ↔ HEURE (Problème 1) + tension 0→10.
// Modèle validé après challenge GPT + Grok (28.06.2026). Cf. project-forteresse-espacetemps.
//
// Idée : ma dispo {rayon R · heure de départ} doit être CRÉDIBLE vis-à-vis de l'espace-temps.
// Si quelqu'un me clutche au BORD de mon rayon (R km), il me faut travelMs(R) pour y être.
// Donc plus R est grand, plus l'heure de départ crédible recule. C'est le « cône de causalité ».
//
// GRADIENT, JAMAIS UN MUR (règle David) : on ne bloque pas, on calcule une TENSION 0→10 qui
// fait monter la friction (côté propriétaire UNIQUEMENT — jamais exposé aux autres, anti-sonde).
//
// Pur (entrée → sortie, zéro I/O) → testable. Self-contained (pas d'import) pour rester un module pur.
// ⚠️ V1 = couplage local avec une estimation grossière du trajet (vol d'oiseau × 1.35 ÷ 47 ≈ 35 km/h effectif).
//    Quand le moteur de Dom (estimateTravelMax) arrive, on remplace travelMs ici → tout le Cône en profite.
//    Le dynamique GPS (Problème 2) viendra avec ce moteur (Phase 2).
// 📌 RECALIBRAGE 28.06 (test terrain David) : 22 km/h était trop lent → 18 km marqué « impossible » à 1h
//    alors qu'en voiture c'est ~25 min. Vitesse effective remontée à ~35 km/h (base 30→47, détour ×1.35 gardé),
//    marge 15→12 min, bande 60→50. Modèle LINÉAIRE conservé (inverses analytiques du slider intacts).
// ─────────────────────────────────────────────────────────────────────────────

const MIN = 60_000

// Trajet estimé (ms) depuis une distance km : vol d'oiseau × 1.35 ÷ 47 (≈ 35 km/h effectif).
// ⚠️ DOIT rester aligné sur feasibility.travelMs (même formule) — drift testé dans test-cone.
// Remplacé par le moteur de Dom (multimodal) en Phase 2.
export function travelMs(km: number): number { return Math.round((km * 1.35) / 47 * 3_600_000) }

// Marge de sécurité (imprévus : trouver l'adresse, se garer…). Ajoutée au trajet pur.
export const CONE_BUFFER_MIN = 12
// Largeur de la bande de confort pour le gradient de tension (formule GPT, validée).
// slack ≥ BAND → tension 0 (large) · slack = 0 → tension 10 (au bord).
export const CONE_TENSION_BAND_MIN = 50

// Temps (ms) pour atteindre le BORD d'un rayon R km : trajet + marge sécurité.
export function edgeTravelMs(radiusKm: number, bufferMin = CONE_BUFFER_MIN): number {
  return travelMs(radiusKm) + bufferMin * MIN
}

// Heure de départ/RDV la plus tôt CRÉDIBLE pour couvrir tout le rayon R, depuis `now` (epoch ms).
// En-dessous de cette heure, on ne pourrait pas honorer un RDV au bord du rayon.
export function earliestCredibleStart(now: number, radiusKm: number, bufferMin = CONE_BUFFER_MIN): number {
  return now + edgeTravelMs(radiusKm, bufferMin)
}

// Inverse : rayon crédible MAX (km) si le RDV est à `startAt`. On ne couvre que ce qu'on atteint à temps.
// Inverse de travelMs : km = (ms / 3.6e6) × 47 / 1.35.
export function credibleRadiusKm(now: number, startAt: number, bufferMin = CONE_BUFFER_MIN): number {
  const availMs = startAt - now - bufferMin * MIN
  if (availMs <= 0) return 0
  return (availMs / 3_600_000) * 47 / 1.35
}

// TENSION 0→10 d'une config {rayon, heure} : à quel point on touche le bord du cône.
// slack = temps_restant − trajet_au_bord − marge. slack < 0 → 10 (hors cône). Sinon gradient.
export function coneTension(o: { now: number; startAt: number; radiusKm: number; bufferMin?: number }): number {
  const buffer = o.bufferMin ?? CONE_BUFFER_MIN
  const slackMin = (o.startAt - o.now - travelMs(o.radiusKm) - buffer * MIN) / MIN
  if (slackMin < 0) return 10
  const t = 10 * (1 - slackMin / CONE_TENSION_BAND_MIN)
  return Math.max(0, Math.min(10, Math.round(t * 10) / 10))
}

// Facteur km→minutes de trajet (inverse de travelMs en minutes) : 1 km = 1.35/47 h ≈ 1.72 min.
const KM_TO_TRAVEL_MIN = (1.35 / 47) * 60

// Rayon (km) qui atteint une `tension` donnée pour une fenêtre de `windowMin` minutes (de now à la fin).
// Sert à colorer le slider par zones (vert < t4 · orange t4-7 · bordeaux t7-10 · au-delà = hors fenêtre).
// Inverse de coneTension à startAt = now + windowMin. La tension monte avec le rayon → bornes croissantes.
export function radiusAtTension(windowMin: number, tension: number, bufferMin = CONE_BUFFER_MIN): number {
  const slackMin = CONE_TENSION_BAND_MIN * (1 - tension / 10)
  const travelMin = windowMin - slackMin - bufferMin
  if (travelMin <= 0) return 0
  return travelMin / KM_TO_TRAVEL_MIN
}

// Niveau qualitatif + message doux (côté propriétaire). Bornes alignées sur le modèle validé :
//   0-3 confortable (aucun message) · 4-6 serré · 7-9 très tendu · 10 hors cône.
export type ConeLevel = 'ok' | 'tight' | 'high' | 'impossible'
export function coneLevel(tension: number): ConeLevel {
  if (tension >= 10) return 'impossible'
  if (tension >= 7) return 'high'
  if (tension >= 4) return 'tight'
  return 'ok'
}

// Message bienveillant à afficher au propriétaire (jamais aux autres). null = rien (config large).
export function coneHint(tension: number, lang: 'fr' | 'en' = 'fr'): string | null {
  const lvl = coneLevel(tension)
  const M: Record<ConeLevel, { fr: string | null; en: string | null }> = {
    ok:         { fr: null, en: null },
    tight:      { fr: 'Avec ce rayon, prévois un peu de temps pour t’y rendre.',
                  en: 'With this radius, leave a little time to get there.' },
    high:       { fr: 'Rayon large pour ce départ — un Clutch au bord serait juste.',
                  en: 'Wide radius for this start — a Clutch at the edge would be tight.' },
    impossible: { fr: 'Trop loin pour ce départ : réduis le rayon ou décale l’heure.',
                  en: 'Too far for this start: shrink the radius or push the time.' },
  }
  return M[lvl][lang]
}
