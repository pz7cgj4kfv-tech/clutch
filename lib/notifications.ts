// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS — moteur PUR (validé comme prochain grand levier, GPT round 2 + David 27.06).
// Aucune dépendance, aucun I/O → testable + prouvable (le « Coq » des notifs). Branchement = ensuite.
//
// Philosophie : si l'app « disparaît », la NOTIF EST le produit. Donc ce n'est pas « envoyer des push »,
// c'est un SYSTÈME : fusion · expiration · supersession · priorité · et surtout un BUDGET DE SILENCE.
//
// Décisions gravées :
//  • On ne notifie QUE de l'ACTIONNABLE (tu peux dire oui/non → un vrai RDV). Le reste attend ou meurt en silence.
//  • Le SILENCE SE MÉRITE : le seuil de pertinence MONTE à chaque notif récente (anti-spam auto).
//  • La SÉCURITÉ / l'urgent (priorité haute) PASSE OUTRE le silence (RDV imminent, arrivée, SOS).
//  • FUSION : N infos d'un même groupe → 1 seule notif (« 3 personnes dispo près de toi »), pas 3 buzz.
//  • SUPERSESSION : dans un groupe, la plus récente remplace les anciennes.
// ─────────────────────────────────────────────────────────────────────────────

// Constantes LOCALES (auto-suffisant pour node, comme clutch-states.ts). Miroir app = CLUTCH_CONFIG.notifications.
const CFG = {
  relevanceBase:        0.45, // seuil de pertinence de base pour notifier (0..1)
  relevancePerRecent:   0.12, // +0.12 au seuil PAR notif récente déjà envoyée (le silence se mérite)
  recentWindowMin:      90,   // fenêtre « récente » pour compter les envois (min)
  highPriorityBypass:   0.85, // priorité ≥ ce seuil → passe outre silence + actionnable (sécurité/urgent)
}

export interface Notif {
  id: string
  groupKey: string      // clé de fusion/supersession (ex: 'avail-near', 'clutch:42')
  priority: number      // 0..1 (sécurité≈1, nouveau clutch≈0.6, nudge≈0.2)
  relevance: number     // 0..1 : à quel point c'est pertinent MAINTENANT
  actionable: boolean   // l'utilisateur peut AGIR (oui/non → un vrai RDV) ?
  createdAt: number     // epoch ms
  expiresAt: number     // epoch ms — au-delà, la notif est périmée (meurt en silence)
}

export interface NotifDecision {
  toSend: (Notif & { mergedCount: number })[]   // à envoyer (fusionnées, triées par priorité)
  held:   { notif: Notif; reason: 'not_actionable' | 'below_silence_threshold' }[]
  expired: Notif[]
  superseded: Notif[]
  threshold: number     // seuil de silence effectif au moment du calcul (debug/cockpit)
}

type Cfg = typeof CFG

// Orchestrateur : file de candidates + horodatages des envois récents + maintenant → quoi envoyer / retenir / jeter.
export function planNotifications(
  queue: Notif[], recentSends: number[], now: number, cfg: Cfg = CFG
): NotifDecision {
  // 1) EXPIRATION : une notif périmée meurt, jamais envoyée.
  const alive = queue.filter(n => n.expiresAt > now)
  const expired = queue.filter(n => n.expiresAt <= now)

  // 2) FUSION + SUPERSESSION par groupe : on garde la plus RÉCENTE et on compte combien ont fusionné.
  const latest = new Map<string, Notif>()
  const count = new Map<string, number>()
  for (const n of alive) {
    count.set(n.groupKey, (count.get(n.groupKey) ?? 0) + 1)
    const cur = latest.get(n.groupKey)
    if (!cur || n.createdAt > cur.createdAt) latest.set(n.groupKey, n)
  }
  const winners = [...latest.values()]
  const superseded = alive.filter(n => latest.get(n.groupKey) !== n)

  // 3) BUDGET DE SILENCE : le seuil monte avec le nb d'envois récents (anti-spam auto).
  const recentCount = recentSends.filter(t => t > now - cfg.recentWindowMin * 60000).length
  const threshold = cfg.relevanceBase + cfg.relevancePerRecent * recentCount

  const toSend: (Notif & { mergedCount: number })[] = []
  const held: NotifDecision['held'] = []
  for (const n of winners) {
    const bypass = n.priority >= cfg.highPriorityBypass // sécurité/urgent : toujours
    if (!n.actionable && !bypass) { held.push({ notif: n, reason: 'not_actionable' }); continue }
    if (bypass || n.relevance >= threshold) toSend.push({ ...n, mergedCount: count.get(n.groupKey) ?? 1 })
    else held.push({ notif: n, reason: 'below_silence_threshold' })
  }
  // priorité décroissante (la sécurité d'abord)
  toSend.sort((a, b) => b.priority - a.priority)
  return { toSend, held, expired, superseded, threshold }
}
