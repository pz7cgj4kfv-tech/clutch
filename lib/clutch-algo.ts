// ─────────────────────────────────────────────────────────────────────────────
// CLUTCH ALGO — moteur partagé (simulateur + plus tard l'app réelle)
// Source de vérité unique pour : score de compatibilité, thermostat densité, places.
// 100% pur (aucune dépendance DB) → testable, simulable, sans risque prod.
// Réf produit : project-algo-scaling-architecture · project-constantes-systeme
// ─────────────────────────────────────────────────────────────────────────────

export type Gender = 'M' | 'F'

export type SimPerson = {
  id: string
  name: string
  gender: Gender
  age: number
  interests: string[]
  lat: number
  lng: number
  reliability: number       // 0..100 (score de fiabilité)
  premium: boolean
  capSlots: number          // places choisies (combien de clutchs simultanés acceptés)
  receivedClutches: number  // clutchs en attente déjà reçus
}

export type Weights = { compat: number; proximity: number; reliability: number }
export const DEFAULT_WEIGHTS: Weights = { compat: 0.5, proximity: 0.3, reliability: 0.2 }

// Constantes système (cf. project-constantes-systeme)
export const RADAR_KM = 0.5          // rayon Live
export const DEFAULT_CAP = 10        // places par défaut (à affiner — PAS 5)
export const THERMO_OFF_BELOW = 30   // en dessous : thermostat éteint
export const THERMO_FULL_AT = 2000   // au dessus : filtrage maximal

// ── Distance ────────────────────────────────────────────────────────────────
export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371, dLat = (bLat - aLat) * Math.PI / 180, dLng = (bLng - aLng) * Math.PI / 180
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * Math.PI / 180) * Math.cos(bLat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}

// ── Score d'une personne pour MOI ─────────────────────────────────────────────
export type ScoreBreakdown = {
  score: number          // 0..1 (pondéré)
  pct: number            // 50..100 (affichage)
  compat: number         // 0..1 intérêts communs
  prox: number           // 0..1 proximité
  fiab: number           // 0..1 fiabilité
  shared: string[]       // intérêts partagés
  km: number | null
}

export function scoreProfile(
  me: { interests: string[]; lat: number; lng: number },
  them: SimPerson,
  weights: Weights = DEFAULT_WEIGHTS,
  maxRadiusKm = 25
): ScoreBreakdown {
  const myLC = me.interests.map(x => x.toLowerCase())
  const shared = them.interests.filter(i => myLC.includes(i.toLowerCase()))
  const compat = (them.interests.length && myLC.length)
    ? shared.length / Math.max(them.interests.length, myLC.length) : 0
  const km = haversineKm(me.lat, me.lng, them.lat, them.lng)
  const prox = Math.max(0, 1 - km / Math.max(maxRadiusKm, 0.1))
  const fiab = them.reliability / 100
  const score = compat * weights.compat + prox * weights.proximity + fiab * weights.reliability
  return { score, pct: Math.round(50 + score * 50), compat, prox, fiab, shared, km }
}

// ── Une personne est-elle clutchable ? (places) ───────────────────────────────
export function isClutchable(p: SimPerson): boolean {
  return p.receivedClutches < p.capSlots
}

// ── Thermostat densité → intensité de filtrage (0..1) ─────────────────────────
export type Thermostat = { level: number; label: string }
export function thermostat(availableCount: number): Thermostat {
  const level = Math.max(0, Math.min(1, (availableCount - THERMO_OFF_BELOW) / (THERMO_FULL_AT - THERMO_OFF_BELOW)))
  const label =
    level === 0 ? 'Éteint · peu de monde, tout le monde se voit'
    : level < 0.34 ? 'Doux · léger tri'
    : level < 0.67 ? 'Actif · la compatibilité compte plus'
    : 'Serré · foule, on remonte les meilleures rencontres'
  return { level, label }
}

// Quand c'est la foule, on déplace un peu de poids de la proximité vers la compatibilité
// (en ville bondée, « proche » ne suffit pas, il faut « pertinent »). Jamais on ne CACHE.
export function effectiveWeights(base: Weights, thermoLevel: number): Weights {
  const shift = 0.2 * thermoLevel
  const compat = base.compat + shift
  const proximity = Math.max(0, base.proximity - shift)
  const sum = compat + proximity + base.reliability
  return { compat: compat / sum, proximity: proximity / sum, reliability: base.reliability / sum }
}

// ── Générateur de population factice ──────────────────────────────────────────
export type PopOptions = {
  size: number
  pctWomen: number          // 0..100
  ageMean: number
  ageSpread: number
  interestDiversity: number // nb d'intérêts par personne (1..8)
  cityRadiusKm: number      // dispersion géo autour du centre
  pctReliable: number       // 0..100 (proba d'avoir une bonne fiabilité)
  pctPremium: number        // 0..100
  capDefault: number        // places par défaut
  pctFull: number           // 0..100 : proportion déjà « pleins » (non clutchables)
  centerLat: number
  centerLng: number
}

const INTEREST_POOL = [
  'Café', 'Jazz', 'Randonnée', 'Yoga', 'Cinéma', 'Cuisine', 'Voyage', 'Art', 'Musique',
  'Sport', 'Lecture', 'Photo', 'Danse', 'Tech', 'Nature', 'Vin', 'Théâtre', 'Running',
  'Escalade', 'Gastronomie', 'Mode', 'Histoire', 'Méditation', 'Concerts',
]
const FIRST = ['Léa','Camille','Sofia','Emma','Nora','Anaïs','Lucas','Thomas','Nathan','Hugo','Marie','Julie','Alex','Sam','Chloé','Inès','Yanis','Théo','Manon','Eva']

function pick<T>(arr: T[], rng: () => number): T { return arr[Math.floor(rng() * arr.length)] }
function gauss(mean: number, spread: number, rng: () => number): number {
  return mean + (rng() + rng() + rng() - 1.5) * spread * 1.4
}

export function generatePopulation(o: PopOptions): SimPerson[] {
  const rng = Math.random
  const out: SimPerson[] = []
  for (let i = 0; i < o.size; i++) {
    const gender: Gender = rng() * 100 < o.pctWomen ? 'F' : 'M'
    const k = Math.max(1, Math.min(8, Math.round(o.interestDiversity)))
    const ints = new Set<string>()
    while (ints.size < k) ints.add(pick(INTEREST_POOL, rng))
    // position : disque autour du centre
    const ang = rng() * Math.PI * 2
    const r = Math.sqrt(rng()) * o.cityRadiusKm
    const dLat = (r / 111) * Math.cos(ang)
    const dLng = (r / (111 * Math.cos(o.centerLat * Math.PI / 180))) * Math.sin(ang)
    const reliable = rng() * 100 < o.pctReliable
    const cap = o.capDefault
    const full = rng() * 100 < o.pctFull
    out.push({
      id: 'sim_' + i,
      name: pick(FIRST, rng) + ' ' + String.fromCharCode(65 + Math.floor(rng() * 26)) + '.',
      gender,
      age: Math.max(18, Math.min(75, Math.round(gauss(o.ageMean, o.ageSpread, rng)))),
      interests: Array.from(ints),
      lat: o.centerLat + dLat,
      lng: o.centerLng + dLng,
      reliability: reliable ? Math.round(70 + rng() * 30) : Math.round(rng() * 70),
      premium: rng() * 100 < o.pctPremium,
      capSlots: cap,
      receivedClutches: full ? cap : Math.floor(rng() * cap),
    })
  }
  return out
}
