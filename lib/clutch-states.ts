// ─────────────────────────────────────────────────────────────────────────────
// CLUTCH STATES — la "forteresse" anti-conflit (machine à états + invariants)
// Source de vérité UNIQUE des états d'un Clutch + de l'occupation temporelle.
// 100% pur (aucune dépendance DB/UI) → testable hors-ligne par le fuzzer.
// Principe : un humain ≠ 2 endroits à la fois. Clutch verrouillé ET event accepté
//            = même moteur d'occupation. Le chevauchement est IMPOSSIBLE par règle.
// Spec : docs/architecture-engagements.md · mémoire : project-architecture-engagements
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. États ────────────────────────────────────────────────────────────────
// État RELATIONNEL (l'engagement)
export type RelState =
  | 'pending' | 'locked' | 'completed'      // vie normale
  | 'refused' | 'expired' | 'cancelled' | 'no_show' // terminaux

// État de PRÉSENCE (l'observation physique — séparé, n'a rien à voir avec l'engagement)
export type PresState = 'none' | 'arrived' | 'both_arrived'

export const TERMINAL: readonly RelState[] = ['completed', 'refused', 'expired', 'cancelled', 'no_show']
export function isTerminal(s: RelState): boolean { return TERMINAL.includes(s) }

// Transitions autorisées (INV7 : monotonie — un terminal ne renaît jamais)
export const ALLOWED_REL: Record<RelState, RelState[]> = {
  pending:   ['locked', 'refused', 'expired', 'cancelled'],
  locked:    ['completed', 'no_show', 'cancelled'],
  completed: [], refused: [], expired: [], cancelled: [], no_show: [],
}
export function canTransition(from: RelState, to: RelState): boolean {
  return ALLOWED_REL[from].includes(to)
}

// ── 2. Constantes produit ────────────────────────────────────────────────────
// ⚠️ Source canonique de ces valeurs = lib/clutch-config.ts (CLUTCH_CONFIG). On les duplique
// ici en littéral car ce moteur est lu par le fuzzer Node (qui exige l'extension .ts à l'import,
// que Next interdit) → pas d'import possible. Garder synchronisé avec clutch-config.ts.
export const DEFAULT_DURATION_MIN = 120 // = CLUTCH_CONFIG.rdvDurationDefaultMin (2h)
export const PREP_BUFFER_MIN = 60       // = CLUTCH_CONFIG.prepBufferMin (1h avant le RDV)
const MIN = 60_000

// ── 3. Modèle de données (pur) ───────────────────────────────────────────────
export interface Clutch {
  id: string
  sender: string
  receiver: string
  startAt: number   // epoch ms — heure proposée
  endAt: number     // = startAt + durée
  rel: RelState
  pres: PresState
}

export interface EventAccept {
  id: string
  user: string
  eventId: string
  startAt: number
  endAt: number
  status: 'active' | 'released'
}

export interface World {
  clutches: Clutch[]
  events: EventAccept[]
}

export function emptyWorld(): World { return { clutches: [], events: [] } }

// ── 4. Occupation : PROJECTION DÉRIVÉE (jamais saisie à la main) ──────────────
// Un Clutch n'occupe QUE lorsqu'il est 'locked'. Un event QUE s'il est 'active'.
// → terminal = occupation libérée automatiquement (rien à écrire). C'est ça la "revive".
export interface Occupancy { user: string; startAt: number; endAt: number; source: string }

// Plage qu'un Clutch OCCUPE réellement = [début − buffer prépa, fin]. Source de vérité unique,
// utilisée AUSSI bien pour créer l'occupation que pour la GARDE au verrouillage (sinon faille).
export function clutchOccRange(c: Clutch): [number, number] {
  return [c.startAt - PREP_BUFFER_MIN * MIN, c.endAt]
}

export function activeOccupancies(w: World): Occupancy[] {
  const occ: Occupancy[] = []
  for (const c of w.clutches) {
    if (c.rel === 'locked') {
      const [s, e] = clutchOccRange(c)
      occ.push({ user: c.sender,   startAt: s, endAt: e, source: 'clutch:' + c.id })
      occ.push({ user: c.receiver, startAt: s, endAt: e, source: 'clutch:' + c.id })
    }
  }
  for (const e of w.events) {
    if (e.status === 'active') occ.push({ user: e.user, startAt: e.startAt, endAt: e.endAt, source: 'event:' + e.id })
  }
  return occ
}

// Chevauchement en demi-ouvert [start, end) → deux RDV bout-à-bout (18-19h puis 19-20h) NE
// se chevauchent PAS (réaliste). ⚠️ Côté SQL : utiliser tstzrange(..,'[)') et non '[]'.
export function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd
}

// Un user est-il déjà occupé sur [startAt,endAt] ? (ignoreSource = ne pas se compter soi-même)
export function userOccupied(w: World, user: string, startAt: number, endAt: number, ignoreSource?: string): boolean {
  return activeOccupancies(w).some(o =>
    o.user === user && o.source !== ignoreSource && overlaps(startAt, endAt, o.startAt, o.endAt))
}

// Clé canonique d'une paire (INV3 : indépendant du sens A→B / B→A)
export function pairKey(a: string, b: string): string {
  return a < b ? a + '|' + b : b + '|' + a
}

// "En pause" = propriété CALCULÉE (jamais un état stocké → pas de ping-pong, monotonie préservée).
// Un pending est en pause si l'un de ses 2 participants a déjà un engagement actif qui le chevauche.
// Le Verrou bloquant disparaît → la pause disparaît toute seule → le clutch "revit".
export function isPaused(w: World, c: Clutch): boolean {
  if (c.rel !== 'pending') return false
  const src = 'clutch:' + c.id
  const [os, oe] = clutchOccRange(c) // « en pause » si, une fois verrouillé (buffer inclus), il chevaucherait un RDV
  return userOccupied(w, c.sender, os, oe, src)
      || userOccupied(w, c.receiver, os, oe, src)
}

// ── 5. Actions (transitions) ─────────────────────────────────────────────────
export type Action =
  | { t: 'create_clutch'; id: string; sender: string; receiver: string; startAt: number; durationMin?: number }
  | { t: 'lock'; id: string }
  | { t: 'refuse'; id: string }
  | { t: 'expire'; id: string }
  | { t: 'cancel'; id: string }
  | { t: 'complete'; id: string }
  | { t: 'no_show'; id: string }
  | { t: 'counter_propose'; id: string; startAt: number; durationMin?: number }
  | { t: 'accept_event'; id: string; user: string; eventId: string; startAt: number; durationMin?: number }
  | { t: 'release_event'; id: string }
  | { t: 'checkin'; id: string }

export interface ApplyResult { world: World; ok: boolean; reason?: string }

function findC(w: World, id: string): Clutch | undefined { return w.clutches.find(c => c.id === id) }

function trans(nw: World, w: World, id: string, to: RelState): ApplyResult {
  const c = findC(nw, id)
  if (!c) return { world: w, ok: false, reason: 'not_found' }
  if (!canTransition(c.rel, to)) return { world: w, ok: false, reason: 'bad_transition' } // garde INV5/INV7
  c.rel = to
  return { world: nw, ok: true }
}

// Réducteur PUR : (world, action) → nouveau world. Ne mute jamais l'entrée.
export function apply(w: World, a: Action): ApplyResult {
  const nw: World = structuredClone(w)
  switch (a.t) {
    case 'create_clutch': {
      if (a.sender === a.receiver) return { world: w, ok: false, reason: 'self_clutch' } // INV2
      const dur = (a.durationMin ?? DEFAULT_DURATION_MIN) * MIN
      // INV3 : pas 2 conversations actives (non terminales) entre la même paire
      const busy = nw.clutches.some(c => !isTerminal(c.rel) && pairKey(c.sender, c.receiver) === pairKey(a.sender, a.receiver))
      if (busy) return { world: w, ok: false, reason: 'pair_busy' }
      nw.clutches.push({ id: a.id, sender: a.sender, receiver: a.receiver, startAt: a.startAt, endAt: a.startAt + dur, rel: 'pending', pres: 'none' })
      return { world: nw, ok: true }
    }
    case 'lock': {
      const c = findC(nw, a.id)
      if (!c) return { world: w, ok: false, reason: 'not_found' }
      if (!canTransition(c.rel, 'locked')) return { world: w, ok: false, reason: 'bad_transition' }
      // GARDE INV1 (= ce que la contrainte EXCLUDE gist fera côté Postgres) :
      // les DEUX participants doivent être libres sur la plage OCCUPÉE (buffer prépa inclus).
      {
        const [os, oe] = clutchOccRange(c)
        if (userOccupied(nw, c.sender, os, oe) || userOccupied(nw, c.receiver, os, oe))
          return { world: w, ok: false, reason: 'conflict' }
      }
      c.rel = 'locked'
      return { world: nw, ok: true }
    }
    case 'refuse':   return trans(nw, w, a.id, 'refused')
    case 'expire':   return trans(nw, w, a.id, 'expired')
    case 'cancel':   return trans(nw, w, a.id, 'cancelled')
    case 'complete': return trans(nw, w, a.id, 'completed')
    case 'no_show':  return trans(nw, w, a.id, 'no_show')
    case 'counter_propose': {
      const c = findC(nw, a.id)
      if (!c) return { world: w, ok: false, reason: 'not_found' }
      if (c.rel !== 'pending') return { world: w, ok: false, reason: 'bad_transition' } // négocie tant que pending
      const dur = (a.durationMin ?? DEFAULT_DURATION_MIN) * MIN
      c.startAt = a.startAt
      c.endAt = a.startAt + dur
      return { world: nw, ok: true }
    }
    case 'accept_event': {
      const dur = (a.durationMin ?? DEFAULT_DURATION_MIN) * MIN
      const end = a.startAt + dur
      if (userOccupied(nw, a.user, a.startAt, end)) return { world: w, ok: false, reason: 'conflict' } // INV1
      nw.events.push({ id: a.id, user: a.user, eventId: a.eventId, startAt: a.startAt, endAt: end, status: 'active' })
      return { world: nw, ok: true }
    }
    case 'release_event': {
      const e = nw.events.find(x => x.id === a.id)
      if (!e) return { world: w, ok: false, reason: 'not_found' }
      e.status = 'released'
      return { world: nw, ok: true }
    }
    case 'checkin': {
      const c = findC(nw, a.id)
      if (!c) return { world: w, ok: false, reason: 'not_found' }
      if (c.rel !== 'locked') return { world: w, ok: false, reason: 'not_locked' }
      c.pres = c.pres === 'none' ? 'arrived' : 'both_arrived'
      return { world: nw, ok: true }
    }
  }
}

// ── 6. Vérification des invariants (utilisé par le fuzzer + assertions runtime) ─
export interface Violation { inv: string; detail: string }

export function checkInvariants(w: World): Violation[] {
  const v: Violation[] = []

  // INV1 — aucun chevauchement entre occupations actives d'un même user (clutch + event confondus)
  const byUser: Record<string, Occupancy[]> = {}
  for (const o of activeOccupancies(w)) (byUser[o.user] ??= []).push(o)
  for (const u of Object.keys(byUser)) {
    const list = byUser[u]
    for (let i = 0; i < list.length; i++)
      for (let j = i + 1; j < list.length; j++)
        if (list[i].source !== list[j].source && overlaps(list[i].startAt, list[i].endAt, list[j].startAt, list[j].endAt))
          v.push({ inv: 'INV1', detail: `${u}: ${list[i].source} ∩ ${list[j].source}` })
  }

  // INV2 — jamais sender == receiver
  for (const c of w.clutches) if (c.sender === c.receiver) v.push({ inv: 'INV2', detail: c.id })

  // INV3 — pas 2 clutchs actifs (non terminaux) entre la même paire
  const seen: Record<string, string> = {}
  for (const c of w.clutches) if (!isTerminal(c.rel)) {
    const k = pairKey(c.sender, c.receiver)
    if (seen[k]) v.push({ inv: 'INV3', detail: `${k}: ${seen[k]} & ${c.id}` })
    else seen[k] = c.id
  }

  // INV6 — start < end partout
  for (const c of w.clutches) if (!(c.startAt < c.endAt)) v.push({ inv: 'INV6', detail: 'clutch ' + c.id })
  for (const e of w.events) if (!(e.startAt < e.endAt)) v.push({ inv: 'INV6', detail: 'event ' + e.id })

  // INV5 / INV7 (monotonie & terminaux irréversibles) sont garantis par le réducteur (canTransition).
  // Le fuzzer les re-vérifie en comparant les snapshots successifs.
  return v
}

// ── 7. Taxonomie d'événements & gating par disponibilité (décidé 26.06) ────────
// Un event PARTENAIRE est « planifié » (libre de dispo, jusqu'à 7j) ; sinon « spontané »
// (doit tomber dans une dispo active, dans les 18h). Les deux créent une occupation (géré ailleurs).
export type EventMode = 'spontaneous' | 'planned'
export function eventMode(hostType: string | null | undefined): EventMode {
  return hostType === 'partner' ? 'planned' : 'spontaneous'
}

export interface Slot { start: number; end: number } // epoch ms
// HORIZON par défaut : 18h pour le spontané, 7j pour le planifié (en minutes).
export function canRegisterEvent(o: {
  mode: EventMode; eventStart: number; eventEnd: number; now: number;
  availSlots: Slot[]; horizonSpontaneousMin?: number; horizonPlannedMin?: number;
}): { ok: boolean; reason?: string } {
  const HSPON = (o.horizonSpontaneousMin ?? 18 * 60) * MIN
  const HPLAN = (o.horizonPlannedMin ?? 7 * 24 * 60) * MIN
  if (o.mode === 'planned') {
    return o.eventStart > o.now + HPLAN ? { ok: false, reason: 'too_far' } : { ok: true }
  }
  // spontané : dans l'horizon 18h ET chevauche un créneau actif (overlap suffit — règle « marge volontaire »)
  if (o.eventStart > o.now + HSPON) return { ok: false, reason: 'beyond_horizon' }
  const covered = o.availSlots.some(s => s.start < o.eventEnd && o.eventStart < s.end)
  return covered ? { ok: true } : { ok: false, reason: 'no_availability' }
}

// ── 8. Cooldown de refus (anti-harcèlement) — logique pure (paliers, validé GPT 26.06) ──
// PAS de blocage auto : après N refus l'algo DÉ-PRIORISE (ranking, ailleurs) ; le blocage total = décision user.
const COOLDOWN_TIERS_H = [48, 168, 720, 4320] // 48h · 7j · 30j · 180j
// Le palier dépend du nombre de refus DANS LA FENÊTRE glissante (3 le même jour ≠ 3 sur 6 mois).
export function clutchCooldownMs(refusalsInWindow: number, tiersH: number[] = COOLDOWN_TIERS_H): number {
  if (refusalsInWindow <= 0) return 0
  const idx = Math.min(refusalsInWindow, tiersH.length) - 1
  return tiersH[idx] * 60 * MIN
}
// Peut-on envoyer un clutch A→B ? (pur ; côté serveur = la RPC create_clutch). Le cooldown bloque
// temporairement ; hardBlocked = décision volontaire de B (réversible). La dé-priorisation ne bloque PAS.
export function canSendClutch(o: { now: number; hardBlocked?: boolean; cooldownUntil?: number | null }): { ok: boolean; reason?: string } {
  if (o.hardBlocked) return { ok: false, reason: 'blocked' }
  if (o.cooldownUntil && o.cooldownUntil > o.now) return { ok: false, reason: 'cooldown' }
  return { ok: true }
}

// ── 9. Aide aux SOUS-EXPOSÉS (forteresse bienveillante) — pur (validé GPT 26.06) ──
// On détecte la SOUS-EXPOSITION (peu vu/proposé malgré activité), JAMAIS « l'impopularité ».
// Dignité absolue : aucun score/message ne doit révéler qu'une personne est « aidée ».
export interface ExposureStats {
  accountAgeDays: number; activeRecently: boolean;
  clutchsReceived: number; eventsJoined: number; profileComplete: boolean;
  impressions?: number; // fois où le profil a été montré (tracking Phase 2 ; optionnel)
}
// Slice 1 (sans tracking) : qui orienter DOUCEMENT vers un événement de groupe (= la meilleure aide) ?
export function shouldNudgeGroupEvent(s: ExposureStats, minDaysActive = 14): boolean {
  if (s.accountAgeDays < minDaysActive || !s.activeRecently) return false // pas les nouveaux comptes
  if (s.eventsJoined > 0) return false        // déjà dans la dynamique events
  return s.clutchsReceived <= 1               // peu de connexions → un event de groupe est plus facile
}
// Slice 2 (avec impressions) : score de sous-exposition (0..1). Lié à « peu VU », jamais « peu AIMÉ ».
export function underExposureScore(s: ExposureStats, seenFloor = 50): number {
  if (s.impressions === undefined) return 0   // pas de tracking → on s'abstient
  if (s.accountAgeDays < 14 || !s.activeRecently || !s.profileComplete) return 0
  return s.impressions >= seenFloor ? 0 : (seenFloor - s.impressions) / seenFloor
}
