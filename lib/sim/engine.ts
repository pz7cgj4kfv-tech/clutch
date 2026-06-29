// ─────────────────────────────────────────────────────────────────────────────
// 🏙️ CLUTCH CITY — MOTEUR PARTAGÉ (canonique : le cockpit /clutch-city ET le CLI scripts/clutch-city
//    l'appellent → zéro duplication, zéro divergence). PUR. RNG seedé → rejouable (le "film").
//    Les agents agissent sur la VRAIE forteresse (forteresse-engine) + le VRAI algo (clutch-algo).
//    Le reducer applique la PERMISSIVITÉ ACTUELLE de l'app → le COQ révèle les trous (docs/clutch-city-trous).
// ─────────────────────────────────────────────────────────────────────────────
import { evaluateSchedule, type SchedResult } from '@/lib/forteresse-engine'
import { scoreProfile, thermostat } from '@/lib/clutch-algo'

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

const MIN = 60_000, H = 18, HORIZON = H * 60 * MIN
export const T0 = 0
export const LAUSANNE: [number, number] = [46.519, 6.633]
const CITY_R = 6
const DEFAULT_RDV_MIN = 120

export type Gender = 'F' | 'M'
type SeekG = 'all' | 'man' | 'woman'
export type Code = 'CHAINING' | 'EXCLUSION' | 'REACH' | 'CAP_RECEIVED' | 'FILTER' | 'EVENT_SEATS' | 'HORIZON' | 'COOLDOWN'
export interface Alert { code: Code; tick: number; at: number; from: string; to?: string; msg: string }
export interface AgentMeta { id: string; name: string; gender: Gender; age: number; premium: boolean; seekGender: SeekG; interests: string[] }
export interface Frame { now: number; pos: number[]; online: number; sent: number; accept: number; refuse: number; alerts: number } // pos = [lat,lng,flag] aligné sur meta (flag 0 off,1 on,2 rdv)
// 🎬 Le « vécu » d'un agent (pour les cartes de suivi POV). Une ligne = un événement de SA vie.
export interface LifeEvent { tick: number; at: number; kind: 'sent' | 'received' | 'locked' | 'declined' | 'event'; otherIdx?: number; msg: string }
export interface SimResult {
  meta: AgentMeta[]; frames: Frame[]; alerts: Alert[]
  life: Record<number, LifeEvent[]>          // index agent → sa timeline (capée) pour les cartes de suivi
  byCode: Record<string, number>
  stats: { n: number; seed: number; ticks: number; slots: number; sent: number; accept: number; refuse: number; events: number; joins: number; peakOnline: number; thermoLabel: string; blocked: number }
}

// 👤 Profil créé À LA MAIN par David, injecté dans la ville (toujours suivi). Vit comme tout le monde.
export interface CustomSpec { name: string; gender: Gender; age: number; seekGender: SeekG; lat?: number; lng?: number }
// enforce = la forteresse CORRIGÉE (evaluateSchedule) refuse les RDV infaisables (B1/B2/REACH/horizon).
//           false = permissivité actuelle de l'app → le COQ révèle les trous.
export interface SimConfig { n: number; seed: number; pctFemale: number; captureFrames?: boolean; enforce?: boolean; custom?: CustomSpec[] }

interface Slot { center: [number, number]; start: number; end: number }
interface Eng { place: [number, number]; start: number; end: number; kind: 'clutch' | 'event' }
interface Pending { from: string; to: string; place: [number, number]; start: number; end: number; born: number }
interface Agent {
  id: string; idx: number; name: string; gender: Gender; age: number; interests: string[]; lat: number; lng: number; premium: boolean
  seekGender: SeekG; recepPause: boolean; online: boolean; slots: Slot[]; agenda: Eng[]
  cooldownUntil: Record<string, number>; receivedToday: number; reliability: number
  pOnline: number; pSend: number; pAccept: number; pRefuse: number; pMove: number; pEvent: number; nSlots: number
}
interface Ev { id: string; host: string; place: [number, number]; start: number; end: number; maxSeats: number; joined: string[] }
const genderAllowed = (s: SeekG, g: Gender) => s === 'all' || (s === 'man' && g === 'M') || (s === 'woman' && g === 'F')
const schedMsg = (r: SchedResult) =>
  r.reason === 'EXCLUSION' ? `double-booking (B2)`
    : r.reason === 'CHAINING' ? `enchaînement : ${Math.round(r.needMin || 0)} min de trajet nécessaires, ${Math.round(r.haveMin || 0)} min dispo (B1) 🎯`
      : r.reason === 'REACH' ? `RDV inatteignable : ${Math.round(r.needMin || 0)} min nécessaires, ${Math.round(r.haveMin || 0)} min avant (forteresse)`
        : `horizon 18h dépassé`
const POOL =['Café', 'Jazz', 'Rando', 'Yoga', 'Ciné', 'Cuisine', 'Voyage', 'Art', 'Musique', 'Sport', 'Lecture', 'Photo', 'Danse', 'Tech', 'Nature', 'Vin']
const NAMES_F = ['Léa', 'Camille', 'Sofia', 'Emma', 'Nora', 'Anaïs', 'Chloé', 'Inès', 'Manon', 'Eva', 'Julie', 'Sarah', 'Lucie', 'Mila', 'Jade', 'Alice']
const NAMES_M = ['Lucas', 'Thomas', 'Nathan', 'Hugo', 'Yanis', 'Théo', 'Noé', 'Léo', 'Adam', 'Gabriel', 'Sam', 'Max', 'Eliott', 'Marius', 'Noah', 'Liam']
const hm = (ms: number) => { const m = Math.round((ms - T0) / 60000); return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}h${String(m % 60).padStart(2, '0')}` }

export function runSim(cfg: SimConfig): SimResult {
  const N = cfg.n, rng = mulberry32(cfg.seed >>> 0), pick = <T,>(a: T[]) => a[Math.floor(rng() * a.length)]
  const cap = cfg.captureFrames !== false, enforce = !!cfg.enforce
  const agents: Agent[] = []
  for (let i = 0; i < N; i++) {
    const gender: Gender = rng() * 100 < cfg.pctFemale ? 'F' : 'M'
    const ang = rng() * Math.PI * 2, r = Math.sqrt(rng()) * CITY_R
    const lat = LAUSANNE[0] + (r / 111) * Math.cos(ang)
    const lng = LAUSANNE[1] + (r / (111 * Math.cos(LAUSANNE[0] * Math.PI / 180))) * Math.sin(ang)
    const k = 2 + Math.floor(rng() * 4); const ints = new Set<string>(); while (ints.size < k) ints.add(pick(POOL))
    const seekGender = (['all', 'all', 'man', 'woman'] as SeekG[])[Math.floor(rng() * 4)]
    const name = (gender === 'F' ? NAMES_F : NAMES_M)[Math.floor(rng() * 16)]
    agents.push({
      id: 'a' + i, idx: i, name, gender, age: 20 + Math.floor(rng() * 30), interests: [...ints], lat, lng,
      premium: rng() < 0.15, seekGender, recepPause: rng() < 0.08, online: false, slots: [], agenda: [],
      cooldownUntil: {}, receivedToday: 0, reliability: Math.round(40 + rng() * 60),
      pOnline: 0.1 + rng() * 0.5, pSend: 0.15 + rng() * 0.5, pAccept: 0.3 + rng() * 0.5, pRefuse: 0.1 + rng() * 0.3,
      pMove: rng() * 0.2, pEvent: rng() * 0.04, nSlots: 1 + Math.floor(rng() * 3),
    })
  }
  // 👤 Profils créés À LA MAIN par David — injectés dans la ville, vivent comme tout le monde (traits actifs).
  ;(cfg.custom || []).forEach((cs, j) => {
    const i = N + j
    const ang = rng() * Math.PI * 2, r = Math.sqrt(rng()) * CITY_R
    const lat = cs.lat ?? LAUSANNE[0] + (r / 111) * Math.cos(ang)
    const lng = cs.lng ?? LAUSANNE[1] + (r / (111 * Math.cos(LAUSANNE[0] * Math.PI / 180))) * Math.sin(ang)
    const k = 2 + Math.floor(rng() * 4); const ints = new Set<string>(); while (ints.size < k) ints.add(pick(POOL))
    agents.push({
      id: 'a' + i, idx: i, name: cs.name || 'Toi', gender: cs.gender, age: cs.age, interests: [...ints], lat, lng,
      premium: false, seekGender: cs.seekGender, recepPause: false, online: false, slots: [], agenda: [],
      cooldownUntil: {}, receivedToday: 0, reliability: 80,
      pOnline: 0.6, pSend: 0.5, pAccept: 0.5, pRefuse: 0.15, pMove: 0.05, pEvent: 0.03, nSlots: 2,
    })
  })
  const TOT = agents.length
  const byId: Record<string, Agent> = Object.fromEntries(agents.map(a => [a.id, a]))
  const pendings: Pending[] = [], events: Ev[] = [], alerts: Alert[] = [], frames: Frame[] = []
  let nSlots = 0, nSent = 0, nAccept = 0, nRefuse = 0, nEvents = 0, nJoin = 0, egid = 0, peak = 0, nBlocked = 0
  const A = (a: Alert) => { if (alerts.length < 500000) alerts.push(a) }
  // 🎬 Journal de vie par agent (capé) → cartes de suivi POV. Capté pour TOUS (léger), l'UI choisit qui afficher.
  const life: Record<number, LifeEvent[]> = {}, LIFE_CAP = 60
  const logLife = (idx: number, e: LifeEvent) => { (life[idx] ||= []); if (life[idx].length < LIFE_CAP) life[idx].push(e) }
  const STEP = 5 * MIN, TICKS = HORIZON / STEP

  for (let tick = 0; tick < TICKS; tick++) {
    const now = T0 + tick * STEP
    const aBefore = alerts.length
    for (let i = pendings.length - 1; i >= 0; i--) if (now - pendings[i].born > 30 * MIN) pendings.splice(i, 1)
    for (const a of agents) { a.slots = a.slots.filter(s => s.end > now); a.agenda = a.agenda.filter(e => e.end > now); if (a.online && !a.slots.length && rng() < 0.3) a.online = false }

    for (const a of agents) {
      if (!a.online && rng() < a.pOnline / 12) {
        a.online = true; a.slots = []
        for (let s = 0; s < a.nSlots; s++) {
          const lead = (15 + rng() * 300) * MIN, dur = (30 + rng() * 150) * MIN
          const ang = rng() * Math.PI * 2, rr = Math.sqrt(rng()) * CITY_R
          const center: [number, number] = [a.lat + (rr / 111) * Math.cos(ang), a.lng + (rr / (111 * Math.cos(a.lat * Math.PI / 180))) * Math.sin(ang)]
          const start = now + lead, end = start + dur
          if (end <= now + HORIZON) { a.slots.push({ center, start, end }); nSlots++ }
          if (end > now + HORIZON + MIN) A({ code: 'HORIZON', tick, at: now, from: a.id, msg: `créneau >18h` })
        }
      }
      if (!a.online || !a.slots.length) continue
      // envoyer
      if (rng() < a.pSend / 6) {
        const mySlot = pick(a.slots); let best: Agent | null = null, bestSc = -1
        for (let s = 0; s < 8; s++) {
          const b = pick(agents); if (b.id === a.id || !b.online || !b.slots.length) continue
          if (a.cooldownUntil[b.id] > now) continue
          if (!genderAllowed(a.seekGender, b.gender)) continue
          const bs = b.slots[0]; if (!(mySlot.start < bs.end && bs.start < mySlot.end)) continue
          const sc = scoreProfile({ interests: a.interests, lat: a.lat, lng: a.lng }, { id: b.id, name: '', gender: b.gender, age: b.age, interests: b.interests, lat: b.lat, lng: b.lng, reliability: b.reliability, premium: b.premium, capSlots: 5, receivedClutches: b.receivedToday } as any).score
          if (sc > bestSc) { bestSc = sc; best = b }
        }
        if (best) {
          // 🛡️ FORTERESSE CORRIGÉE : on n'envoie pas si le filtre de la cible m'exclut (C1), si elle est en
          //    Pause (C3) ou si sa boîte est pleine (E1 → waitlist, à venir). Permissif : on envoie ET le COQ crie.
          const symOk = genderAllowed(best.seekGender, a.gender) && !best.recepPause
          const capOk = !(best.gender === 'F' && best.receivedToday >= 5)
          if (enforce && (!symOk || !capOk)) { nBlocked++ }
          else {
            const place = mySlot.center, start = Math.max(now + 15 * MIN, mySlot.start), end = start + DEFAULT_RDV_MIN * MIN
            pendings.push({ from: a.id, to: best.id, place, start, end, born: now }); nSent++; best.receivedToday++
            logLife(a.idx, { tick, at: now, kind: 'sent', otherIdx: best.idx, msg: `📤 Tu clutches ${best.name} pour ${hm(start)}` })
            logLife(best.idx, { tick, at: now, kind: 'received', otherIdx: a.idx, msg: `📥 ${a.name} te clutche pour ${hm(start)}` })
            if (!genderAllowed(best.seekGender, a.gender)) A({ code: 'FILTER', tick, at: now, from: a.id, to: best.id, msg: `filtre genre de ${best.id} exclut ${a.id} (C1)` })
            if (best.recepPause) A({ code: 'FILTER', tick, at: now, from: a.id, to: best.id, msg: `${best.id} en mode Pause (C3)` })
            if (best.gender === 'F' && best.receivedToday > 5) A({ code: 'CAP_RECEIVED', tick, at: now, from: best.id, msg: `${best.id} ♀ a ${best.receivedToday} reçus/jour (>5) (A6/E1)` })
          }
        }
      }
      // répondre
      const mine = pendings.find(p => p.to === a.id)
      if (mine) {
        const roll = rng()
        if (roll < a.pAccept) {
          const sender = byId[mine.from]
          const engA: Eng = { place: mine.place, start: mine.start, end: mine.end, kind: 'clutch' }
          const engB: Eng = { place: mine.place, start: mine.start, end: mine.end, kind: 'clutch' }
          // 🗓️ LA FORTERESSE juge l'agenda ENTIER des DEUX personnes (B1/B2/REACH).
          const resA = evaluateSchedule(now, [a.lat, a.lng], a.agenda, engA)
          const resB = evaluateSchedule(now, [sender.lat, sender.lng], sender.agenda, engB)
          const bad = !resA.ok || !resB.ok
          if (enforce && bad) {
            nBlocked++   // ✅ forteresse corrigée : on REFUSE → aucun RDV impossible n'est créé
          } else {
            if (bad) {   // permissif : on accepte ET le COQ crie (détection du trou)
              for (const [self, res, other] of [[a, resA, sender], [sender, resB, a]] as [Agent, SchedResult, Agent][])
                if (!res.ok) A({ code: res.reason as Code, tick, at: now, from: self.id, to: other.id, msg: schedMsg(res) })
            }
            a.agenda.push(engA); sender.agenda.push(engB)
            a.slots = a.slots.filter(s => s.start !== mine.start); nAccept++
            logLife(a.idx, { tick, at: now, kind: 'locked', otherIdx: sender.idx, msg: `🔒 RDV verrouillé avec ${sender.name} à ${hm(mine.start)}` })
            logLife(sender.idx, { tick, at: now, kind: 'locked', otherIdx: a.idx, msg: `🔒 ${a.name} a verrouillé · RDV à ${hm(mine.start)}` })
          }
        } else if (roll < a.pAccept + a.pRefuse) { byId[mine.from].cooldownUntil[a.id] = now + 48 * 3600 * 1000; nRefuse++; logLife(byId[mine.from].idx, { tick, at: now, kind: 'declined', otherIdx: a.idx, msg: `❌ ${a.name} a refusé` }) }
        pendings.splice(pendings.indexOf(mine), 1)
      }
      // events — créer (l'event occupe MON agenda → soumis à la forteresse en mode corrigé)
      if (rng() < a.pEvent / 8) {
        const start = now + (30 + rng() * 240) * MIN, end = start + DEFAULT_RDV_MIN * MIN
        const cand = { place: [a.lat, a.lng] as [number, number], start, end }
        const okSched = !enforce || evaluateSchedule(now, [a.lat, a.lng], a.agenda, cand).ok
        if (end <= now + HORIZON && okSched) { events.push({ id: 'g' + egid++, host: a.id, place: [a.lat, a.lng], start, end, maxSeats: 4 + Math.floor(rng() * 8), joined: [a.id] }); a.agenda.push({ place: [a.lat, a.lng], start, end, kind: 'event' }); nEvents++ }
        else if (!okSched) nBlocked++
      }
      // events — rejoindre : forteresse corrigée = refuse si plus de place (D8) OU si ça casse mon agenda (B1/B2)
      if (events.length && rng() < 0.05) {
        const g = pick(events); if (g.host !== a.id && !g.joined.includes(a.id)) {
          const seatsOk = g.joined.length < g.maxSeats
          const schedOk = !enforce || evaluateSchedule(now, [a.lat, a.lng], a.agenda, { place: g.place, start: g.start, end: g.end }).ok
          if (enforce && (!seatsOk || !schedOk)) { nBlocked++ }
          else {
            g.joined.push(a.id); a.agenda.push({ place: g.place, start: g.start, end: g.end, kind: 'event' }); nJoin++
            if (g.joined.length > g.maxSeats) A({ code: 'EVENT_SEATS', tick, at: now, from: a.id, to: g.id, msg: `event ${g.id}: ${g.joined.length} > ${g.maxSeats} places (D8)` })
          }
        }
      }
      if (rng() < a.pMove / 12) { a.lat += (rng() - 0.5) * 0.05; a.lng += (rng() - 0.5) * 0.05 }
    }

    let onlineN = 0
    const pos: number[] = cap ? new Array(TOT * 3) : []
    for (let i = 0; i < TOT; i++) {
      const a = agents[i]; if (a.online) onlineN++
      if (cap) { const rdv = a.agenda.some(e => e.start <= now && now < e.end); pos[i * 3] = a.lat; pos[i * 3 + 1] = a.lng; pos[i * 3 + 2] = rdv ? 2 : a.online ? 1 : 0 }
    }
    if (onlineN > peak) peak = onlineN
    if (cap) frames.push({ now, pos, online: onlineN, sent: nSent, accept: nAccept, refuse: nRefuse, alerts: alerts.length - aBefore })
  }

  const byCode: Record<string, number> = {}
  for (const al of alerts) byCode[al.code] = (byCode[al.code] || 0) + 1
  return {
    meta: agents.map(a => ({ id: a.id, name: a.name, gender: a.gender, age: a.age, premium: a.premium, seekGender: a.seekGender, interests: a.interests })),
    frames, alerts, life, byCode,
    stats: { n: N, seed: cfg.seed, ticks: TICKS, slots: nSlots, sent: nSent, accept: nAccept, refuse: nRefuse, events: nEvents, joins: nJoin, peakOnline: peak, thermoLabel: thermostat(peak).label, blocked: nBlocked },
  }
}
