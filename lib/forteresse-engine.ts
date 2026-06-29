// ─────────────────────────────────────────────────────────────────────────────
// 🏰 FORTERESSE — MOTEUR UNIQUE (source de vérité unique, David 29.06).
// Tout le démarrage (curseur rayon, pin↔GPS, Suivant, confirmation, créneaux) appelle CE moteur.
// Plus de calculs concurrents qui se contredisent : UNE inégalité, dérivée partout.
//
//   INVARIANT CAUSALITÉ (Graal 2) :   D + R ≤ portée(Δt)
//     D  = distance GPS→pin (km)         · R = rayon (km)
//     Δt = début − maintenant (min)      · portée(Δt) = km parcourables en Δt (moteur trajet)
//
//   INVARIANTS HORIZON/DURÉE :
//     début ≥ maintenant + MARGE_MIN     · fin ≤ maintenant + 18h     · DURÉE ∈ [30min, 18h]
//
//   ÉCHELLE 0→10 : tension = 10·(D+R)/portée. 10 = la limite (le curseur s'y arrête, jamais au-delà).
//
// PUR (zéro I/O, zéro import) → prouvable. Portée = modèle trajet recalibré ~35 km/h (⚠️ DOIT rester
// aligné sur cone.ts/feasibility.ts : base 47, détour 1.35, marge 12 min). Futur moteur Dom = multimodal.
// ─────────────────────────────────────────────────────────────────────────────

// Modèle trajet (aligné cone.ts) : vitesse effective 47/1.35 ≈ 34.8 km/h, marge 12 min.
const TRAVEL_BASE = 47, DETOUR = 1.35
export const CONE_BUFFER_MIN = 12

export const HORIZON_H = 18           // fenêtre structurelle Clutch (fin ≤ maintenant + 18h)
export const MIN_LEAD_MIN = 15        // marge mini avant le début (jamais Δt = 0 → jamais portée = 0)
export const DEFAULT_LEAD_MIN = 60    // défaut « dans 1h » (David : laisse le temps d'y aller)
export const MIN_DURATION_MIN = 30    // durée mini d'un créneau
export const MAX_DURATION_MIN = HORIZON_H * 60
const MIN = 60_000

// Haversine (km) — inline pour rester un module pur, testable hors React.
export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371, dLat = (bLat - aLat) * Math.PI / 180, dLng = (bLng - aLng) * Math.PI / 180
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * Math.PI / 180) * Math.cos(bLat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)))
}

// Portée (km) atteignable depuis ma position en Δt minutes : (Δt − marge) heures × vitesse effective.
//   = ((leadMin − 12)/60) × (47/1.35).  Inverse exact de cone.travelMs → cohérent avec tout le Cône.
export function reachKm(leadMin: number): number {
  const availMin = leadMin - CONE_BUFFER_MIN
  if (availMin <= 0) return 0
  return (availMin / 60) * (TRAVEL_BASE / DETOUR)
}

export interface ForteresseInput {
  now: number                          // epoch ms
  gps: [number, number] | null         // ma position réelle (null = inconnue → on ne contraint pas par le pin)
  pin: [number, number]                // centre de ma zone (le lieu)
  start: number; end: number           // créneau (epoch ms)
  radiusKm: number
}
export interface ForteresseEval {
  leadMin: number; budgetKm: number; pinDistKm: number; usedKm: number
  maxRadiusKm: number                  // ✅ LE plafond du curseur (= ce qui reste après le pin)
  pinTooFar: boolean                   // le pin seul dépasse la portée → on n'atteint même pas sa zone
  feasible: boolean                    // D + R ≤ portée
  tension: number                      // 0→10 (10 = pile la limite)
  durationMin: number
  horizonOk: boolean                   // début ≥ maintenant, fin ≤ +18h, durée ∈ [30min,18h]
  ok: boolean                          // feasible && !pinTooFar && horizonOk
}

const TOL = 0.15                       // tolérance km (imprécision géocodage/GPS)

export function evaluate(i: ForteresseInput): ForteresseEval {
  const leadMin = Math.max(0, (i.start - i.now) / MIN)
  const budgetKm = reachKm(leadMin)
  const pinDistKm = i.gps ? haversineKm(i.gps[0], i.gps[1], i.pin[0], i.pin[1]) : 0
  const usedKm = pinDistKm + Math.max(0, i.radiusKm)
  const maxRadiusKm = Math.max(0, budgetKm - pinDistKm)
  const pinTooFar = pinDistKm > budgetKm + TOL
  const feasible = usedKm <= budgetKm + TOL
  const tension = budgetKm <= 0 ? 10 : Math.max(0, Math.min(10, 10 * usedKm / budgetKm))
  const durationMin = (i.end - i.start) / MIN
  const horizonOk =
    i.start >= i.now - MIN &&
    i.end <= i.now + HORIZON_H * 60 * MIN + MIN &&
    durationMin >= MIN_DURATION_MIN - 0.5 &&
    durationMin <= MAX_DURATION_MIN + 0.5
  return {
    leadMin, budgetKm, pinDistKm, usedKm, maxRadiusKm, pinTooFar, feasible, tension,
    durationMin, horizonOk, ok: feasible && !pinTooFar && horizonOk,
  }
}

// ── Aides bornage (utilisées par les molettes pour rester DANS les invariants, par construction) ──

// Le DÉBUT le plus tôt autorisé (jamais Δt=0). Passé/trop proche → maintenant + marge.
export function earliestStart(now: number): number { return now + MIN_LEAD_MIN * MIN }
// Le DÉBUT le plus tard autorisé (il faut au moins MIN_DURATION avant l'horizon +18h).
export function latestStart(now: number): number { return now + (HORIZON_H * 60 - MIN_DURATION_MIN) * MIN }
// Clamp d'un début dans [earliest, latest].
export function clampStart(now: number, start: number): number {
  return Math.min(latestStart(now), Math.max(earliestStart(now), start))
}
// La FIN la plus tard pour un début donné (≤ +18h).
export function latestEnd(now: number, start: number): number { return Math.min(now + HORIZON_H * 60 * MIN, start + MAX_DURATION_MIN * MIN) }
// Plafond rayon prêt à l'emploi pour le curseur (borné MIN..MAX km de l'UI).
export function maxRadiusFor(now: number, gps: [number, number] | null, pin: [number, number], start: number, minKm = 1, maxKm = 50): number {
  const e = evaluate({ now, gps, pin, start, end: start + MIN_DURATION_MIN * MIN, radiusKm: 0 })
  return Math.max(minKm, Math.min(maxKm, e.maxRadiusKm))
}

// ─────────────────────────────────────────────────────────────────────────────
// 🗓️ FAISABILITÉ MULTI-ENGAGEMENTS (le trou logique #1 — David 30.06). La forteresse ne raisonne plus sur
//    UN clutch isolé mais sur TOUT l'agenda : un nouveau RDV est faisable seulement si je peux PHYSIQUEMENT
//    l'atteindre depuis ce que je fais juste avant ET repartir vers ce que je fais juste après.
//      • EXCLUSION : il ne chevauche aucun engagement existant.
//      • REACH     : je peux y arriver depuis ma position actuelle (aucun engagement avant).
//      • CHAINING  : fin(précédent) + trajet ≤ début(nouveau)  ET  fin(nouveau) + trajet ≤ début(suivant).
//    Trajet = même modèle que la portée du Cône (inverse de reachKm) → cohérence totale.
// ─────────────────────────────────────────────────────────────────────────────
const TOL_MIN = 2                     // tolérance minutes (imprécision)
// Minutes nécessaires pour parcourir distKm (inverse exact de reachKm).
export function travelMinKm(distKm: number): number { return distKm * 60 * DETOUR / TRAVEL_BASE + CONE_BUFFER_MIN }

export interface SchedEngagement { place: [number, number]; start: number; end: number }
export type SchedReason = 'HORIZON' | 'EXCLUSION' | 'REACH' | 'CHAINING' | null
export interface SchedResult { ok: boolean; reason: SchedReason; needMin?: number; haveMin?: number }

export function evaluateSchedule(now: number, gps: [number, number] | null, agenda: SchedEngagement[], cand: SchedEngagement): SchedResult {
  if (cand.end > now + HORIZON_H * 60 * MIN + MIN) return { ok: false, reason: 'HORIZON' }
  for (const e of agenda) if (cand.start < e.end && e.start < cand.end) return { ok: false, reason: 'EXCLUSION' }
  const sorted = [...agenda].sort((a, b) => a.start - b.start)
  let prev: SchedEngagement | null = null, next: SchedEngagement | null = null
  for (const e of sorted) { if (e.end <= cand.start) prev = e; if (e.start >= cand.end && !next) next = e }
  // arriver à `cand` depuis l'engagement précédent (ou depuis ma position actuelle s'il n'y en a pas)
  const origin = prev ? prev.place : gps
  const originTime = prev ? prev.end : now
  if (origin) {
    const need = travelMinKm(haversineKm(origin[0], origin[1], cand.place[0], cand.place[1]))
    const have = (cand.start - originTime) / MIN
    if (need > have + TOL_MIN) return { ok: false, reason: prev ? 'CHAINING' : 'REACH', needMin: need, haveMin: have }
  }
  // repartir de `cand` vers l'engagement suivant
  if (next) {
    const need = travelMinKm(haversineKm(cand.place[0], cand.place[1], next.place[0], next.place[1]))
    const have = (next.start - cand.end) / MIN
    if (need > have + TOL_MIN) return { ok: false, reason: 'CHAINING', needMin: need, haveMin: have }
  }
  return { ok: true, reason: null }
}
