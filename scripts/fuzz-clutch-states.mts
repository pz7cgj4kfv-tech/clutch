// ─────────────────────────────────────────────────────────────────────────────
// FUZZER — preuve que la "forteresse" tient (zéro dépendance, Node 24 lit le .ts)
// Lancer :  node scripts/fuzz-clutch-states.mts        (ou : npm run fuzz)
// 1) tests ciblés (preuve lisible) · 2) fuzz aléatoire déterministe (des milliers
//    de séquences) → vérifie les invariants APRÈS CHAQUE pas + la monotonie.
// Échec → affiche la graine + la séquence exacte (reproductible). Sortie ≠ 0.
// ─────────────────────────────────────────────────────────────────────────────
import {
  emptyWorld, apply, checkInvariants, isTerminal, isPaused,
  canRegisterEvent, eventMode,
  type World, type Action, type RelState,
} from '../lib/clutch-states.ts'

const HOUR = 3_600_000
let failures = 0
const log = (s: string) => process.stdout.write(s + '\n')

// ── PRNG déterministe (mulberry32) — reproductible, pas de Math.random ────────
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── 1. TESTS CIBLÉS (la preuve qu'un humain ne peut pas être à 2 endroits) ────
function expect(name: string, cond: boolean) {
  if (cond) log('  ✓ ' + name)
  else { failures++; log('  ✗ ÉCHEC — ' + name) }
}

function targetedTests() {
  log('\n── Tests ciblés ──')

  // (a) Verrou A puis Verrou B chevauchant pour le MÊME user → le 2e est refusé
  {
    let w = emptyWorld()
    w = apply(w, { t: 'create_clutch', id: 'c1', sender: 'me', receiver: 'lea', startAt: 18 * HOUR }).world
    w = apply(w, { t: 'create_clutch', id: 'c2', sender: 'me', receiver: 'jade', startAt: 18 * HOUR + 30 * 60000 }).world
    w = apply(w, { t: 'lock', id: 'c1' }).world
    const r = apply(w, { t: 'lock', id: 'c2' }) // chevauche 18h00–19h00
    expect('Verrou chevauchant refusé (conflict)', r.ok === false && r.reason === 'conflict')
    expect('aucune violation après', checkInvariants(r.world).length === 0)
  }

  // (b) "Suspendre puis revivre" : pending en pause pendant le Verrou, revit après annulation
  {
    let w = emptyWorld()
    w = apply(w, { t: 'create_clutch', id: 'c1', sender: 'me', receiver: 'lea', startAt: 18 * HOUR }).world
    w = apply(w, { t: 'create_clutch', id: 'c2', sender: 'me', receiver: 'jade', startAt: 18 * HOUR + 15 * 60000 }).world
    w = apply(w, { t: 'lock', id: 'c1' }).world
    const c2 = w.clutches.find(c => c.id === 'c2')!
    expect('c2 EN PAUSE pendant le Verrou', isPaused(w, c2) === true)
    w = apply(w, { t: 'cancel', id: 'c1' }).world // j'annule le Verrou
    const c2b = w.clutches.find(c => c.id === 'c2')!
    expect('c2 REVIT après annulation (toujours pending, plus en pause)', c2b.rel === 'pending' && isPaused(w, c2b) === false)
  }

  // (c) Un event accepté bloque aussi un Verrou qui le chevauche (même moteur)
  {
    let w = emptyWorld()
    w = apply(w, { t: 'accept_event', id: 'e1', user: 'me', eventId: 'soiree', startAt: 21 * HOUR, durationMin: 180 }).world
    w = apply(w, { t: 'create_clutch', id: 'c1', sender: 'me', receiver: 'lea', startAt: 22 * HOUR }).world
    const r = apply(w, { t: 'lock', id: 'c1' }) // 22h tombe dans l'event 21h–24h
    expect('Verrou pendant un event accepté refusé', r.ok === false && r.reason === 'conflict')
  }

  // (d) self-clutch & double-pending même paire refusés
  {
    let w = emptyWorld()
    const self = apply(w, { t: 'create_clutch', id: 'x', sender: 'me', receiver: 'me', startAt: 0 })
    expect('self-clutch refusé (INV2)', self.ok === false && self.reason === 'self_clutch')
    w = apply(w, { t: 'create_clutch', id: 'c1', sender: 'me', receiver: 'lea', startAt: 18 * HOUR }).world
    const dup = apply(w, { t: 'create_clutch', id: 'c2', sender: 'lea', receiver: 'me', startAt: 20 * HOUR })
    expect('2e clutch actif même paire refusé (INV3)', dup.ok === false && dup.reason === 'pair_busy')
  }

  // (e) terminal irréversible : impossible de verrouiller un clutch refusé
  {
    let w = emptyWorld()
    w = apply(w, { t: 'create_clutch', id: 'c1', sender: 'me', receiver: 'lea', startAt: 18 * HOUR }).world
    w = apply(w, { t: 'refuse', id: 'c1' }).world
    const r = apply(w, { t: 'lock', id: 'c1' })
    expect('lock sur refusé impossible (INV5/INV7)', r.ok === false && r.reason === 'bad_transition')
  }

  // (f) Taxonomie events : gating spontané/planifié (décidé 26.06)
  {
    const now = 12 * HOUR // midi → horizon 18h = 6h demain (30*HOUR)
    const slot = [{ start: 14 * HOUR, end: 23 * HOUR }]
    expect('spontané DANS dispo → OK', canRegisterEvent({ mode:'spontaneous', eventStart:15*HOUR, eventEnd:16*HOUR, now, availSlots:slot }).ok === true)
    expect('spontané HORS dispo → refusé', canRegisterEvent({ mode:'spontaneous', eventStart:13*HOUR, eventEnd:13.5*HOUR, now, availSlots:slot }).reason === 'no_availability')
    expect('spontané au-delà 18h → refusé', canRegisterEvent({ mode:'spontaneous', eventStart:32*HOUR, eventEnd:33*HOUR, now, availSlots:[{start:30*HOUR,end:36*HOUR}] }).reason === 'beyond_horizon')
    expect('planifié libre de dispo → OK', canRegisterEvent({ mode:'planned', eventStart:now+3*24*HOUR, eventEnd:now+3*24*HOUR+2*HOUR, now, availSlots:[] }).ok === true)
    expect('planifié au-delà 7j → refusé', canRegisterEvent({ mode:'planned', eventStart:now+10*24*HOUR, eventEnd:now+10*24*HOUR+HOUR, now, availSlots:[] }).reason === 'too_far')
    expect('host partner → planned', eventMode('partner') === 'planned')
    expect('host user → spontaneous', eventMode('user') === 'spontaneous')
  }
}

// ── 2. FUZZ ALÉATOIRE ─────────────────────────────────────────────────────────
const USERS = ['u0', 'u1', 'u2', 'u3']
const SLOTS = [16, 17, 18, 19, 20, 21]      // heures de départ possibles
const DURS = [60, 90, 120]                  // durées en minutes (pour les events)

function randomAction(rnd: () => number, w: World, idSeq: () => string): Action {
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)]
  const r = rnd()
  const clutchIds = w.clutches.map(c => c.id)
  const eventIds = w.events.filter(e => e.status === 'active').map(e => e.id)
  // 45% créer, sinon agir sur un clutch existant / events
  if (r < 0.35 || clutchIds.length === 0) {
    const a = pick(USERS); let b = pick(USERS); if (b === a) b = USERS[(USERS.indexOf(a) + 1) % USERS.length]
    return { t: 'create_clutch', id: idSeq(), sender: a, receiver: b, startAt: pick(SLOTS) * HOUR }
  }
  if (r < 0.45) return { t: 'accept_event', id: idSeq(), user: pick(USERS), eventId: 'ev', startAt: pick(SLOTS) * HOUR, durationMin: pick(DURS) }
  if (r < 0.52 && eventIds.length) return { t: 'release_event', id: pick(eventIds) }
  const id = pick(clutchIds)
  const ops: Action['t'][] = ['lock', 'refuse', 'expire', 'cancel', 'complete', 'no_show', 'counter_propose', 'checkin']
  const op = pick(ops)
  if (op === 'counter_propose') return { t: 'counter_propose', id, startAt: pick(SLOTS) * HOUR }
  return { t: op, id } as Action
}

function fuzz(runs: number, stepsPerRun: number) {
  log(`\n── Fuzz aléatoire : ${runs.toLocaleString('fr')} séquences × ${stepsPerRun} actions ──`)
  let totalActions = 0, accepted = 0
  for (let run = 0; run < runs; run++) {
    const seed = run + 1
    const rnd = mulberry32(seed)
    let n = 0
    const idSeq = () => 'c' + (n++)
    let w = emptyWorld()
    const trace: Action[] = []
    const lastRel: Record<string, RelState> = {} // pour vérifier la monotonie (INV5/INV7)

    for (let step = 0; step < stepsPerRun; step++) {
      const a = randomAction(rnd, w, idSeq)
      trace.push(a)
      const res = apply(w, a)
      totalActions++
      if (res.ok) accepted++
      w = res.world

      // monotonie : un clutch terminal ne doit JAMAIS redevenir non-terminal
      for (const c of w.clutches) {
        const prev = lastRel[c.id]
        if (prev && isTerminal(prev) && prev !== c.rel) {
          fail(seed, step, trace, `MONOTONIE cassée: ${c.id} ${prev} → ${c.rel}`)
          return { totalActions, accepted }
        }
        lastRel[c.id] = c.rel
      }

      const viol = checkInvariants(w)
      if (viol.length) {
        fail(seed, step, trace, viol.map(x => `${x.inv}(${x.detail})`).join(', '))
        return { totalActions, accepted }
      }
    }
  }
  return { totalActions, accepted }
}

function fail(seed: number, step: number, trace: Action[], why: string) {
  failures++
  log(`\n  ✗ VIOLATION — graine=${seed}, pas #${step}`)
  log('    cause : ' + why)
  log('    séquence (reproductible) :')
  trace.forEach((a, i) => log(`      ${i === step ? '→' : ' '} ${i}: ${JSON.stringify(a)}`))
}

// ── RUN ───────────────────────────────────────────────────────────────────────
log('🏰 FORTERESSE CLUTCH — banc d\'essai des états')
targetedTests()
const { totalActions, accepted } = fuzz(20_000, 40)

log('\n── Résultat ──')
log(`  actions jouées : ${totalActions.toLocaleString('fr')} (${accepted.toLocaleString('fr')} acceptées, ${(totalActions - accepted).toLocaleString('fr')} refusées à juste titre)`)
if (failures === 0) {
  log('  ✅ 0 violation. Aucun "humain à 2 endroits", aucun état impossible. La forteresse tient.')
  process.exit(0)
} else {
  log(`  ❌ ${failures} échec(s) — voir la séquence ci-dessus.`)
  process.exit(1)
}
