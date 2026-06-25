// ─────────────────────────────────────────────────────────────────────────────
// CLUTCH CONFIG — TOUS les paramètres réglables de Clutch, en UN seul endroit.
// Règle permanente (David 25.06) : aucun « nombre magique » dispersé dans le code.
// Pour changer une durée / un délai / un cooldown → on le change ICI, et toute la
// logique suit, SANS rien casser. (cf. lesson-parametres-configurables-architecture-evolutive)
//
// 👉 Pour Mel / non-dev : chaque ligne = un réglage. Le commentaire dit à quoi il sert
//    et son unité (min = minutes, h = heures). Changer le nombre suffit.
// ─────────────────────────────────────────────────────────────────────────────

export const CLUTCH_CONFIG = {
  // ── Durées d'un rendez-vous (combien de temps il « occupe » l'agenda) ──
  rdvDurationDefaultMin: 120, // RDV normal = 2h. (col. duration_minutes NULL → cette valeur)
  rdvDurationQuickMin:   60,  // Quick Clutch = 1h. (is_quick_date → duration_minutes=60)

  // ── Fenêtre anti-conflit (la « forteresse ») ──
  prepBufferMin:         60,  // On ne peut plus verrouiller dès 1h AVANT le RDV (trajet/prépa).
                              //   → un RDV bloque [début − 1h, début + durée].

  // ── Fenêtre de réponse ──
  clutchReplyWindowH:    2,   // Un clutch reçu non répondu EXPIRE tout seul après 2h (expires_at).

  // ── Cooldown après un REFUS (anti-harcèlement) — modèle PALIERS (validé GPT 26.06) ──
  refuseCooldownTiersH:  [48, 168, 720, 4320], // 1er refus=48h · 2e=7j · 3e=30j · 4e+=180j (paliers humains, PAS doublement)
  refuseWindowDays:      90,  // Les refus comptent dans cette fenêtre glissante (3 le même jour ≠ 3 sur 6 mois).
  refuseDeprioritizeAfter: 3, // Après N refus dans la fenêtre → l'algo PROPOSE MOINS ces 2 personnes (jamais ne bloque tout seul).
  expiredNeedsCooldown:  false, // Un clutch EXPIRÉ (pas vu) ≠ refus → pas de cooldown (V1).
  // ⚠️ Le blocage TOTAL (invisibilité mutuelle) = DÉCISION de l'utilisateur, jamais automatique. Réversible (liste « masqués »).

  // ── Contrainte structurelle Clutch ──
  maxHorizonH:           18,  // Tout se joue dans une fenêtre de 18h max (ADN du produit).

  // ── Disponibilité & taxonomie d'événements (décidé 26.06, validé GPT) ──
  availabilityHorizonH:  18,  // Jusqu'où on peut poser un créneau de dispo (= horizon spontané, glissant).
  maxActiveSlots:        3,   // Nombre de créneaux de dispo actifs simultanés (gratuit).
  slotsCanOverlap:       false, // Les créneaux ne peuvent pas se chevaucher dans le temps (1 lieu à la fois).
  eventPlannedHorizonDays: 7, // Un événement PLANIFIÉ (partenaire) peut être annoncé jusqu'à 7j avant.
  // Règle : event SPONTANÉ (host_type ≠ partner) → doit tomber dans une dispo active + horizon 18h.
  //         event PLANIFIÉ (partenaire) → libre de dispo, horizon 7j. Les DEUX créent une occupation.
} as const

// Helpers dérivés (pour ne pas refaire le calcul partout)
export const MS_PER_MIN = 60_000
export const rdvDurationMin = (isQuick: boolean) =>
  isQuick ? CLUTCH_CONFIG.rdvDurationQuickMin : CLUTCH_CONFIG.rdvDurationDefaultMin
// Cooldown effectif (heures) après le n-ième refus dans la fenêtre : paliers 48h·7j·30j·180j (plafonné).
export const refuseCooldownH = (refusalCount: number) => {
  const t = CLUTCH_CONFIG.refuseCooldownTiersH
  if (refusalCount <= 0) return 0
  return t[Math.min(refusalCount, t.length) - 1]
}
