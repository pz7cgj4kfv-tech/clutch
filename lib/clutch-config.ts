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

  // ── Plafond de clutchs REÇUS simultanés (anti-saturation, protection — décidé David 26.06) ──
  maxReceivedClutchs:    5,   // Boîte de réception plafonnée à N clutchs actifs EN TOTAL (pas par créneau).
                              //   → au-delà, le 6e expéditeur reçoit le MÊME message générique « non disponible »
                              //     que pour un cooldown/blocage (anti-sonde : il ne peut pas déduire qu'elle est pleine).
                              //   Réglable par utilisateur (col. profiles.max_received_clutchs ; cette valeur = défaut).
                              //   File d'attente auto-promue (le 6e « passe » quand une place se libère) = V2 (cf. anti-sonde).

  // ── Disponibilité & taxonomie d'événements (décidé 26.06, validé GPT) ──
  availabilityHorizonH:  18,  // Jusqu'où on peut poser un créneau de dispo (= horizon spontané, glissant).
  maxActiveSlots:        3,   // Nombre de créneaux de dispo actifs simultanés (gratuit).
  slotsCanOverlap:       true,  // PIVOT 27.06 : la dispo = INTENTION (ouvert à plusieurs plans) → chevauchement OK. La forteresse ne verrouille qu'au RDV CONFIRMÉ.
  eventPlannedHorizonDays: 7, // Un événement PLANIFIÉ (partenaire) peut être annoncé jusqu'à 7j avant.

  // ── Aide aux sous-exposés (point 3, validé GPT 26.06) — JAMAIS « impopularité » ──
  underExposedMinDaysActive: 14, // on n'aide qu'après 14j d'activité réelle (pas les nouveaux comptes)
  boostMaxPct:               20, // boost de visibilité plafonné à +20% (ordre/fréquence SEULEMENT, dans le pool compatible)
  boostDecayDays:            30, // dégressif sur 30 jours
  coachingMaxPerWeek:        1,  // 1 nudge doux max / semaine, JAMAIS de push, jamais culpabilisant
  // Règle : event SPONTANÉ (host_type ≠ partner) → doit tomber dans une dispo active + horizon 18h.
  //         event PLANIFIÉ (partenaire) → libre de dispo, horizon 7j. Les DEUX créent une occupation.

  // ── Visibilité / ranking (validé 2 rounds GPT 27.06) — Visibilité = Compat × Fiabilité × Besoin × Fatigue ──
  //   ⚠️ Branchement LIVE = bloqué par l'upgrade Supabase (logging d'impressions = écritures). Logique pure + prouvée d'abord.
  ranking: {
    exposureFatigueK:  0.15, // amortissement par impression RÉCENTE (disjoncteur anti-superstar : + tu es montré, - tu pèses)
    exposureNeedMax:   1.20, // boost « sous-exposé » plafonné à +20% (jamais une élite, jamais un quota)
    coldStartNeutral:  0.5,  // un profil sans historique vaut « neutre » (ni bonus ni malus)
    confidenceObsHalf: 8,    // nb d'observations pour atteindre 50% de confiance (cold start bayésien)
  },
  // ── Fiabilité COMPOSITE multi-familles (anti-gaming « 2 potes qui se notent ») ──
  reliability: {
    weights: { presence: 0.35, cancels: 0.25, crossFeedback: 0.20, seniority: 0.10, systemSignal: 0.10 },
    crossFeedbackReciprocityPenalty: 0.6, // escompte jusqu'à -60% du feedback croisé s'il vient d'une boucle fermée
  },
  // ── Événements : modèle d'inscription (validé GPT + David 27.06) — moteur pur dans lib/events-engine.ts ──
  events: {
    responseDeadlineSpontaneousMin: 60,   // spontané : 1h pour répondre (ou début−30min, le + court)
    responseDeadlinePlannedMin:     360,  // planifié : 6h
    spontaneousLeadMin:             30,
    waitlistMultiplier:             2,    // liste d'attente max = max(places×2, plancher)
    waitlistMin:                    10,
    promoteWindowMin:               20,   // place libérée → 20 min pour accepter, sinon suivant
    maxActiveRequests:              5,    // GÉNÉREUX au lancement (réseau froid) → resserrer plus tard
    maxAcceptedFuture:              5,
  },
  // ── Notifications (le prochain grand levier — « la notif EST le produit ») ──
  //   On ne notifie QUE l'actionnable. Le SILENCE se mérite (seuil ↑ par notif récente). Sécurité = passe outre.
  notifications: {
    relevanceBase:      0.45, // seuil de pertinence de base pour notifier (0..1)
    relevancePerRecent: 0.12, // +0.12 au seuil PAR notif récente (anti-spam auto : le silence se mérite)
    recentWindowMin:    90,   // fenêtre « récente » pour compter les envois (min)
    highPriorityBypass: 0.85, // priorité ≥ ce seuil → passe outre silence + actionnable (sécurité/RDV imminent/SOS)
  },
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
