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

  // ── Cooldown après un REFUS (anti-harcèlement, auto-apprenant) ──
  refuseCooldownH:       48,  // Après un refus, on ne peut PAS re-clutcher la personne pendant 48h.
  refuseCooldownFactor:  2,   // À chaque nouveau refus, le cooldown est MULTIPLIÉ par 2 (48h→96h→…).
  refuseStopAfter:       3,   // Au-delà de N refus, l'algo ne propose PLUS cette personne du tout.
  expiredNeedsCooldown:  false, // Un clutch EXPIRÉ (pas vu) ≠ refus → pas de cooldown. (à challenger GPT)

  // ── Contrainte structurelle Clutch ──
  maxHorizonH:           18,  // Tout se joue dans une fenêtre de 18h max (ADN du produit).
} as const

// Helpers dérivés (pour ne pas refaire le calcul partout)
export const MS_PER_MIN = 60_000
export const rdvDurationMin = (isQuick: boolean) =>
  isQuick ? CLUTCH_CONFIG.rdvDurationQuickMin : CLUTCH_CONFIG.rdvDurationDefaultMin
// Cooldown effectif après le n-ième refus (n commence à 1) : 48h, 96h, 192h…
export const refuseCooldownH = (refusalCount: number) =>
  CLUTCH_CONFIG.refuseCooldownH * Math.pow(CLUTCH_CONFIG.refuseCooldownFactor, Math.max(0, refusalCount - 1))
