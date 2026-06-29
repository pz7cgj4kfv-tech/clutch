// ─────────────────────────────────────────────────────────────────────────────
// 🏙️ CLUTCH CITY — simulateur grandeur nature (v0.1) + LE COQ (validateur logique).
//   `node scripts/clutch-city.mts [N] [seed]`  (ex: node scripts/clutch-city.mts 1000 7)
//
//   N agents vivent 18h dans Lausanne, AGISSENT (dispo, clutch, accept/refuse, events, déplacements)
//   en appelant la VRAIE logique forteresse (lib/forteresse-engine) + le VRAI algo (lib/clutch-algo).
//   À CHAQUE décision, le COQ vérifie les invariants (cf. docs/clutch-city-trous.md) et lève une ALERTE
//   horodatée + rejouable (seed + tick) dès qu'un trou s'ouvre — comme 1000 testeurs sous surveillance.
//
//   ⚠️ v0.1 : le "reducer" applique les actions avec la PERMISSIVITÉ ACTUELLE de l'app (il ACCEPTE des
//   configs que l'app accepte aujourd'hui). Le COQ révèle alors les trous (enchaînement, exclusion, caps,
//   filtres asymétriques…). L'écart reducer↔COQ = la liste des bugs à corriger, CHIFFRÉE.
// ─────────────────────────────────────────────────────────────────────────────
import { evaluate, reachKm, haversineKm } from '../lib/forteresse-engine.ts'
import { scoreProfile, thermostat } from '../lib/clutch-algo.ts'

// ── RNG seedé (mulberry32) → déterministe, rejouable (le "film" de David) ────
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

const MIN = 60_000, H = 18, HORIZON = H * 60 * MIN
const T0 = 0                                   // origine fixe (déterminisme)
const LAUSANNE: [number, number] = [46.519, 6.633]
const CITY_R = 6                               // km
// inverse de reachKm : minutes nécessaires pour parcourir distKm (modèle trajet aligné forteresse)
const travelMin = (distKm: number) => distKm * 60 * 1.35 / 47 + 12
const DEFAULT_RDV_MIN = 120                    // durée RDV défaut = 2h

type Gender = 'F' | 'M'
type SeekG = 'all' | 'man' | 'woman'
interface Slot { center: [number, number]; radiusKm: number; start: number; end: number }
interface Eng { id: string; place: [number, number]; start: number; end: number; with?: string; kind: 'clutch' | 'event' }
interface Pending { id: string; from: string; to: string; place: [number, number]; start: number; end: number; born: number }
interface Agent {
  id: string; gender: Gender; age: number; interests: string[]
  lat: number; lng: number; premium: boolean
  seekGender: SeekG; recepPause: boolean
  online: boolean; slots: Slot[]; agenda: Eng[]
  cooldownUntil: Record<string, number>; receivedToday: number; reliability: number
  // traits
  pOnline: number; pSend: number; pAccept: number; pRefuse: number; pMove: number; pEvent: number; nSlots: number
}
interface Ev { id: string; host: string; place: [number, number]; start: number; end: number; minSeats: number; maxSeats: number; joined: string[] }

const genderAllowed = (seek: SeekG, g: Gender) => seek === 'all' || (seek === 'man' && g === 'M') || (seek === 'woman' && g === 'F')

// ── Le COQ : invariants → alertes ───────────────────────────────────────────
type Code = 'REACH' | 'CHAINING' | 'EXCLUSION' | 'HORIZON' | 'CAP_RECEIVED' | 'FILTER' | 'EVENT_SEATS' | 'COOLDOWN'
interface Alert { code: Code; tick: number; at: number; from: string; to?: string; msg: string }
const overlaps = (a: Eng, s: number, e: number) => s < a.end && a.start < e

function main() {
  const N = parseInt(process.argv[2] || '1000')
  const SEED = parseInt(process.argv[3] || '7')
  const rng = mulberry32(SEED)
  const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)]

  const POOL = ['Café', 'Jazz', 'Rando', 'Yoga', 'Ciné', 'Cuisine', 'Voyage', 'Art', 'Musique', 'Sport', 'Lecture', 'Photo', 'Danse', 'Tech', 'Nature', 'Vin']
  const agents: Agent[] = []
  for (let i = 0; i < N; i++) {
    const gender: Gender = rng() < 0.5 ? 'F' : 'M'
    const ang = rng() * Math.PI * 2, r = Math.sqrt(rng()) * CITY_R
    const lat = LAUSANNE[0] + (r / 111) * Math.cos(ang)
    const lng = LAUSANNE[1] + (r / (111 * Math.cos(LAUSANNE[0] * Math.PI / 180))) * Math.sin(ang)
    const k = 2 + Math.floor(rng() * 4); const ints = new Set<string>(); while (ints.size < k) ints.add(pick(POOL))
    const seekGender: SeekG = (['all', 'all', 'man', 'woman'] as SeekG[])[Math.floor(rng() * 4)]
    agents.push({
      id: 'a' + i, gender, age: 20 + Math.floor(rng() * 30), interests: [...ints], lat, lng,
      premium: rng() < 0.15, seekGender, recepPause: rng() < 0.08,
      online: false, slots: [], agenda: [], cooldownUntil: {}, receivedToday: 0, reliability: Math.round(40 + rng() * 60),
      pOnline: 0.1 + rng() * 0.5, pSend: 0.15 + rng() * 0.5, pAccept: 0.3 + rng() * 0.5, pRefuse: 0.1 + rng() * 0.3,
      pMove: rng() * 0.2, pEvent: rng() * 0.04, nSlots: 1 + Math.floor(rng() * 3),
    })
  }
  const byId: Record<string, Agent> = Object.fromEntries(agents.map(a => [a.id, a]))
  const pendings: Pending[] = []
  const events: Ev[] = []
  const alerts: Alert[] = []
  let nSlots = 0, nSent = 0, nAccept = 0, nRefuse = 0, nEvents = 0, nJoin = 0, eid = 0, pid = 0, egid = 0
  const A = (a: Alert) => { if (alerts.length < 200000) alerts.push(a) }

  const STEP = 5 * MIN, TICKS = HORIZON / STEP   // pas de 5 min sur 18h
  for (let tick = 0; tick < TICKS; tick++) {
    const now = T0 + tick * STEP

    // expiry : pendings > 30 min, créneaux finis, agenda fini
    for (let i = pendings.length - 1; i >= 0; i--) if (now - pendings[i].born > 30 * MIN) pendings.splice(i, 1)
    for (const a of agents) { a.slots = a.slots.filter(s => s.end > now); a.agenda = a.agenda.filter(e => e.end > now); if (a.online && a.slots.length === 0 && rng() < 0.3) a.online = false }

    for (const a of agents) {
      // 1) se mettre en ligne + ouvrir des créneaux
      if (!a.online && rng() < a.pOnline / 12) {
        a.online = true; a.slots = []
        for (let s = 0; s < a.nSlots; s++) {
          const lead = (15 + rng() * 300) * MIN                 // début dans 15 min .. 5h
          const dur = (30 + rng() * 150) * MIN                  // 30 min .. 3h
          const ang = rng() * Math.PI * 2, rr = Math.sqrt(rng()) * CITY_R
          const center: [number, number] = [a.lat + (rr / 111) * Math.cos(ang), a.lng + (rr / (111 * Math.cos(a.lat * Math.PI / 180))) * Math.sin(ang)]
          const start = now + lead, end = start + dur
          if (end <= now + HORIZON) { a.slots.push({ center, radiusKm: 1 + rng() * 20, start, end }); nSlots++ }
          // COQ — HORIZON
          if (end > now + HORIZON + MIN) A({ code: 'HORIZON', tick, at: now, from: a.id, msg: `créneau finit à +${((end - now) / 3600000).toFixed(1)}h (>18h)` })
        }
      }
      if (!a.online || a.slots.length === 0) continue

      // 2) envoyer un clutch — choisir une cible VISIBLE (vue de A) puis le COQ checke la symétrie/caps
      if (rng() < a.pSend / 6) {
        const mySlot = pick(a.slots)
        let best: Agent | null = null, bestScore = -1
        for (let s = 0; s < 8; s++) {
          const b = pick(agents); if (b.id === a.id || !b.online || !b.slots.length) continue
          if (a.cooldownUntil[b.id] && a.cooldownUntil[b.id] > now) continue   // cooldown (correct)
          if (!genderAllowed(a.seekGender, b.gender)) continue                 // MES filtres (A voit B)
          const bs = b.slots[0]
          if (!(mySlot.start < bs.end && bs.start < mySlot.end)) continue      // chevauchement temporel
          const sc = scoreProfile({ interests: a.interests, lat: a.lat, lng: a.lng }, { id: b.id, name: '', gender: b.gender, age: b.age, interests: b.interests, lat: b.lat, lng: b.lng, reliability: b.reliability, premium: b.premium, capSlots: 5, receivedClutches: b.receivedToday } as any).score
          if (sc > bestScore) { bestScore = sc; best = b }
        }
        if (best) {
          const place = mySlot.center
          const start = Math.max(now + 15 * MIN, mySlot.start), end = start + DEFAULT_RDV_MIN * MIN
          pendings.push({ id: 'p' + pid++, from: a.id, to: best.id, place, start, end, born: now }); nSent++
          best.receivedToday++
          // COQ — FILTRE symétrique (C1) : B me voit-il aussi ?
          if (!genderAllowed(best.seekGender, a.gender)) A({ code: 'FILTER', tick, at: now, from: a.id, to: best.id, msg: `clutch envoyé alors que le filtre genre de ${best.id} exclut ${a.id} (asymétrie C1)` })
          // COQ — réception en PAUSE (C3)
          if (best.recepPause) A({ code: 'FILTER', tick, at: now, from: a.id, to: best.id, msg: `clutch reçu alors que ${best.id} est en mode Pause (C3)` })
          // COQ — cap reçus/jour ♀ (A6/E1)
          if (best.gender === 'F' && best.receivedToday > 5) A({ code: 'CAP_RECEIVED', tick, at: now, from: best.id, msg: `${best.id} (♀) a reçu ${best.receivedToday} clutchs/jour (>5) — file d'attente ? (A6/E1)` })
        }
      }

      // 3) répondre à un clutch reçu (le 1er pending qui me cible)
      const mine = pendings.find(p => p.to === a.id)
      if (mine) {
        const roll = rng()
        if (roll < a.pAccept) {
          // ACCEPT — le reducer accepte SANS vérifier enchaînement/exclusion (= permissivité actuelle de l'app)
          const sender = byId[mine.from]
          const newEngA: Eng = { id: 'e' + eid++, place: mine.place, start: mine.start, end: mine.end, with: sender.id, kind: 'clutch' }
          const newEngB: Eng = { id: 'e' + eid++, place: mine.place, start: mine.start, end: mine.end, with: a.id, kind: 'clutch' }
          // COQ — sur les DEUX agents : REACH, EXCLUSION, CHAINING
          for (const [self, eng] of [[a, newEngA], [sender, newEngB]] as [Agent, Eng][]) {
            const ev = evaluate({ now, gps: [self.lat, self.lng], pin: eng.place, start: eng.start, end: eng.end, radiusKm: 0 })
            if (ev.pinTooFar || !ev.feasible) A({ code: 'REACH', tick, at: now, from: self.id, to: self === a ? sender.id : a.id, msg: `RDV accepté à ${ev.pinDistKm.toFixed(1)} km pour +${((eng.start - now) / 60000).toFixed(0)} min — INATTEIGNABLE (B/forteresse)` })
            for (const other of self.agenda) {
              if (overlaps(other, eng.start, eng.end)) A({ code: 'EXCLUSION', tick, at: now, from: self.id, msg: `2 engagements qui se chevauchent (${fmt(other.start)}–${fmt(other.end)} ∩ ${fmt(eng.start)}–${fmt(eng.end)}) — double-booking (B2/F1)` })
              // enchaînement : si other AVANT eng, faut-il le temps d'aller de l'un à l'autre ?
              if (other.end <= eng.start) { const need = travelMin(haversineKm(other.place[0], other.place[1], eng.place[0], eng.place[1])); if (other.end + need * MIN > eng.start) A({ code: 'CHAINING', tick, at: now, from: self.id, msg: `enchaînement infaisable : RDV finit à ${fmt(other.end)}, suivant à ${fmt(eng.start)} mais ${need.toFixed(0)} min de trajet nécessaires (B1) 🎯` }) }
              if (eng.end <= other.start) { const need = travelMin(haversineKm(eng.place[0], eng.place[1], other.place[0], other.place[1])); if (eng.end + need * MIN > other.start) A({ code: 'CHAINING', tick, at: now, from: self.id, msg: `enchaînement infaisable (sens inverse) — ${need.toFixed(0)} min de trajet (B1)` }) }
            }
          }
          a.agenda.push(newEngA); sender.agenda.push(newEngB)
          // occupation exclusive : retirer le créneau honoré
          a.slots = a.slots.filter(s => !(s.start === mine.start))
          nAccept++
        } else if (roll < a.pAccept + a.pRefuse) {
          byId[mine.from].cooldownUntil[a.id] = now + 48 * 3600 * 1000   // cooldown 48h (correct)
          nRefuse++
        } // sinon : ignore (laisse expirer)
        pendings.splice(pendings.indexOf(mine), 1)
      }

      // 4) créer / rejoindre un event
      if (rng() < a.pEvent / 8) {
        const start = now + (30 + rng() * 240) * MIN, end = start + DEFAULT_RDV_MIN * MIN
        if (end <= now + HORIZON) { events.push({ id: 'g' + egid++, host: a.id, place: [a.lat, a.lng], start, end, minSeats: 2 + Math.floor(rng() * 3), maxSeats: 4 + Math.floor(rng() * 8), joined: [a.id] }); a.agenda.push({ id: 'e' + eid++, place: [a.lat, a.lng], start, end, kind: 'event' }); nEvents++ }
      }
      if (events.length && rng() < 0.05) {
        const g = pick(events); if (g.host !== a.id && !g.joined.includes(a.id)) {
          g.joined.push(a.id); a.agenda.push({ id: 'e' + eid++, place: g.place, start: g.start, end: g.end, kind: 'event' }); nJoin++
          if (g.joined.length > g.maxSeats) A({ code: 'EVENT_SEATS', tick, at: now, from: a.id, to: g.id, msg: `event ${g.id} : ${g.joined.length} inscrits > ${g.maxSeats} places (D8)` })
        }
      }

      // 5) se déplacer (GPS) → dérive
      if (rng() < a.pMove / 12) { a.lat += (rng() - 0.5) * 0.05; a.lng += (rng() - 0.5) * 0.05 }
    }
  }

  // ── RAPPORT ────────────────────────────────────────────────────────────────
  const onlineMax = agents.filter(a => a.slots.length || a.agenda.length).length
  const byCode: Record<string, Alert[]> = {}
  for (const al of alerts) (byCode[al.code] ||= []).push(al)
  const thermo = thermostat(onlineMax)

  console.log(`\n🏙️  CLUTCH CITY — ${N} agents · Lausanne · 18h · seed ${SEED} · pas 5 min (${TICKS} ticks)`)
  console.log('─'.repeat(74))
  console.log(`Activité : ${nSlots} créneaux ouverts · ${nSent} clutchs envoyés · ${nAccept} acceptés · ${nRefuse} refusés · ${nEvents} events créés · ${nJoin} inscriptions`)
  console.log(`Densité  : pic ~${onlineMax} actifs · thermostat « ${thermo.label} »`)
  console.log('─'.repeat(74))
  const labels: Record<Code, string> = {
    CHAINING: '🎯 B1 Enchaînement infaisable (RDV qui s’enchaînent sans le temps d’y aller)',
    EXCLUSION: '   B2/F1 Double-booking (2 engagements en même temps)',
    REACH: '   B/Forteresse RDV inatteignable (trop loin pour l’heure)',
    HORIZON: '   Horizon 18h dépassé',
    CAP_RECEIVED: '   A6/E1 Boîte ♀ saturée (>5 reçus/jour)',
    FILTER: '   C1/C3 Filtre contourné (asymétrie genre / mode Pause)',
    EVENT_SEATS: '   D8 Places d’event dépassées',
    COOLDOWN: '   A1 Cooldown contourné',
  }
  const order: Code[] = ['CHAINING', 'EXCLUSION', 'REACH', 'CAP_RECEIVED', 'FILTER', 'EVENT_SEATS', 'HORIZON', 'COOLDOWN']
  console.log(`🐓 LE COQ — ${alerts.length} alerte(s) (trous ouverts par la permissivité actuelle) :\n`)
  for (const code of order) {
    const list = byCode[code] || []
    console.log(`${list.length.toString().padStart(6)}  ${labels[code]}`)
    if (list.length) { const ex = list[0]; console.log(`        ↳ ex (tick ${ex.tick}, +${(ex.at / 3600000).toFixed(1)}h) ${ex.from}${ex.to ? '→' + ex.to : ''} : ${ex.msg}`) }
  }
  console.log('─'.repeat(74))
  console.log(`Total trous détectés : ${alerts.length}. Rejouable : seed ${SEED} (même seed = même film).`)
  console.log(`→ Chaque famille = un invariant à câbler dans la forteresse. Priorité : 🎯 B1 (enchaînement) + B2 (exclusion).\n`)
}

function fmt(ms: number) { const m = Math.round((ms - T0) / 60000); return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}` }

main()
