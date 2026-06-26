// ─────────────────────────────────────────────────────────────────────────────
// EVENTS ENGINE — moteur PUR du modèle d'inscription aux événements (validé GPT + David 27.06).
// Pur, sans I/O → testable/prouvable comme la forteresse et le ranking. Branchement (DB + UI) = ensuite.
//
// Décisions gravées (cf. project-test-session2-cockpit) :
//  • DEUX modes : 'open' (auto-accept jusqu'aux places, sinon liste d'attente) · 'curated' (demande → orga accepte).
//  • États : requested · waitlisted · accepted · declined · expired · cancelled.
//  • 🔑 SOFT HOLD (requested/waitlisted) = N'OCCUPE PAS la forteresse · HARD HOLD (accepted) = crée une occupation.
//  • Délai : spontané = min(1h, début−30min) · planifié = 6h. Pas de réponse → 'expired' (jamais 'declined').
//  • Anti-spam : max N demandes en attente + M events acceptés futurs (généreux au lancement). Waitlist = max(places×2, 10).
// ─────────────────────────────────────────────────────────────────────────────

// Constantes LOCALES (auto-suffisant pour node). Miroir app = CLUTCH_CONFIG.events.
const EVT = {
  responseDeadlineSpontaneousMin: 60,  // 1h
  responseDeadlinePlannedMin: 360,     // 6h
  spontaneousLeadMin: 30,              // ... ou début−30min, le plus court des deux
  waitlistMultiplier: 2,
  waitlistMin: 10,
  promoteWindowMin: 20,
  maxActiveRequests: 5,                // GÉNÉREUX au lancement (réseau froid) ; resserrer plus tard
  maxAcceptedFuture: 5,
}
const MIN = 60_000

export type EventMode = 'open' | 'curated'
export type Inscription = 'requested' | 'waitlisted' | 'accepted' | 'declined' | 'expired' | 'cancelled'

export const defaultEventMode = (host: 'individual' | 'partner'): EventMode => host === 'partner' ? 'open' : 'curated'

// Liste d'attente max selon le nombre de places.
export function waitlistMax(places: number, cfg = EVT): number {
  return Math.max(places * cfg.waitlistMultiplier, cfg.waitlistMin)
}

// 🔑 La pierre angulaire : un état occupe-t-il la forteresse (hard) ou pas (soft) ?
export function isHardHold(s: Inscription): boolean { return s === 'accepted' }
export function isSoftHold(s: Inscription): boolean { return s === 'requested' || s === 'waitlisted' }

// Que devient une inscription quand quelqu'un clique « rejoindre » ?
export function onRegister(o: {
  mode: EventMode; placesLeft: number; waitlistCount: number; places: number; cfg?: typeof EVT
}): { state: Inscription; reason?: string } {
  const cfg = o.cfg ?? EVT
  if (o.placesLeft <= 0 && o.waitlistCount >= waitlistMax(o.places, cfg)) return { state: 'declined', reason: 'full_closed' }
  if (o.mode === 'open') return o.placesLeft > 0 ? { state: 'accepted' } : { state: 'waitlisted' }
  // curated : toujours une demande (l'orga tranche), même s'il reste des places
  return { state: 'requested' }
}

// Anti-spam côté participant : peut-il faire une nouvelle demande ?
export function canRequest(o: { activeRequests: number; acceptedFuture: number; cfg?: typeof EVT }): { ok: boolean; reason?: string } {
  const cfg = o.cfg ?? EVT
  if (o.activeRequests >= cfg.maxActiveRequests) return { ok: false, reason: 'too_many_requests' }
  if (o.acceptedFuture >= cfg.maxAcceptedFuture) return { ok: false, reason: 'too_many_accepted' }
  return { ok: true }
}

// Délai de réponse de l'organisateur (ms). Spontané = min(1h, début−30min) ; planifié = 6h.
export function responseDeadlineMs(o: { spontaneous: boolean; eventStart: number; now: number; cfg?: typeof EVT }): number {
  const cfg = o.cfg ?? EVT
  if (!o.spontaneous) return cfg.responseDeadlinePlannedMin * MIN
  const untilLead = Math.max(0, (o.eventStart - cfg.spontaneousLeadMin * MIN) - o.now)
  return Math.min(cfg.responseDeadlineSpontaneousMin * MIN, untilLead)
}

// Une demande non traitée à temps → 'expired' (PAS 'declined' — dignité/anti-sonde).
export function sweepExpired(o: { state: Inscription; createdAt: number; deadlineMs: number; now: number }): Inscription {
  if ((o.state === 'requested' || o.state === 'waitlisted') && o.now >= o.createdAt + o.deadlineMs) return 'expired'
  return o.state
}
