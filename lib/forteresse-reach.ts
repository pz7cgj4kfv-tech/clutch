// ─────────────────────────────────────────────────────────────────────────────
// 🏰 RÉJOIGNABILITÉ UNIFIÉE DE LA FORTERESSE — un seul point de vérité (02.07).
// « Puis-je atteindre (to) depuis (from) avant `leadMin` minutes, sachant que ma zone a un rayon
//   `radiusKm` (atteindre le BORD suffit) ? »
//   • useDom = false → moteur forteresse actuel foReachKm (isotrope ~35 km/h). Comportement HISTORIQUE.
//   • useDom = true  → moteur de Dom (Graal 2) : trajet réel multi-mode voiture/CFF/vélo.
// Le flag GRAAL2_DOM_LIVE (app2) passe `useDom`. Remettre le flag à false = retour EXACT à l'ancien modèle.
// Prouvé par scripts/test-forteresse-reach.mts (parité OFF + sanité ON).
// ─────────────────────────────────────────────────────────────────────────────
import { haversineKm } from './events-helpers'
import { reachKm as foReachKm } from './forteresse-engine'
import { estimateTravelMax } from './travel-estimate'

export type LL = { lat: number; lng: number }

export function foReachable(
  from: LL,
  to: LL,
  leadMin: number,
  radiusKm: number,
  useDom: boolean,
  now?: Date
): boolean {
  const km = haversineKm(from.lat, from.lng, to.lat, to.lng)
  if (km <= radiusKm + 0.1) return true    // déjà dans / au bord de ma zone → RAS
  if (leadMin <= 0) return false           // le créneau a commencé et je suis dehors → injoignable

  if (useDom) {
    try {
      const base = now ?? new Date()
      const est = estimateTravelMax(from, to, new Date(base.getTime() + leadMin * 60000))
      // Atteindre le BORD de ma zone suffit (radiusKm avant le centre) → on met à l'échelle le temps de trajet.
      const edgeFrac = km > 0 ? Math.max(0, (km - radiusKm) / km) : 0
      return est.minutes * edgeFrac <= leadMin
    } catch {
      // Repli défensif : si l'estimateur de Dom échoue, on retombe sur l'ancien modèle (jamais planter).
      return km <= foReachKm(leadMin) + radiusKm
    }
  }
  // Modèle historique (inchangé) : ce que je peux couvrir en `leadMin` + la marge du rayon.
  return km <= foReachKm(leadMin) + radiusKm
}
