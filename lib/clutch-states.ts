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
// Durée d'occupation d'un Clutch : 2h par défaut (Clutch normal), 1h pour un Quick Clutch
// (is_quick_date → duration_minutes=60). Décision David 25.06, alignée sur le code app.
export const DEFAULT_DURATION_MIN = 120
// Buffer de prépa AVANT le RDV : on ne peut plus verrouiller dans [RDV−1h, RDV+durée] (David 25.06).
// → l'occupation commence 1h avant l'heure proposée.
export const PREP_BUFFER_MIN = 60
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
