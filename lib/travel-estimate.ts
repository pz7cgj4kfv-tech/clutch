// ─────────────────────────────────────────────────────────────────────────────
// 🚗 MOTEUR GRAAL 2 — estimateur de temps de trajet MAX (Dom · Antigravity, 02.07.2026).
// Livré comme brique AUTONOME (zéro réseau, zéro clé, pur TS) = idéal pour Clutch (export statique).
// Copié verbatim depuis le CODEX de Dom. Testé par scripts/test-travel-estimate.mts (parité prouvée).
// Branché derrière le flag GRAAL2_DOM_LIVE dans app2 (lib/forteresse-engine reste le repli si OFF).
// ⚠️ NE PAS logger de position GPS (règle vie privée). Fonction pure : mêmes entrées → même sortie.
// ─────────────────────────────────────────────────────────────────────────────
export type LatLng = { lat: number; lng: number }
export type TravelMode = 'walk' | 'bike' | 'ebike' | 'car' | 'transit'

export type TravelEstimate = {
  minutes: number            // temps de trajet MAX plausible, en minutes (arrondi sup.)
  modeUsed: TravelMode       // le mode retenu pour ce minutes (le plus rapide raisonnable)
  confidence: 'high' | 'medium' | 'low'  // high = vraie donnée API ; low = fallback distance×vitesse
}

/**
 * Calcule la distance géodésique à vol d'oiseau (Haversine) en kilomètres.
 */
export function haversineDistance(from: LatLng, to: LatLng): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Détermine si des coordonnées GPS se situent dans la région Suisse (CH).
 */
export function isSwitzerland(pos: LatLng): boolean {
  // Limites approximatives de la Suisse
  return (
    pos.lat >= 45.8 && pos.lat <= 47.8 &&
    pos.lng >= 5.9 && pos.lng <= 10.5
  );
}

/**
 * Estime le temps de trajet MAX (conservateur) entre deux points, en partant `now`.
 * @param from   position de départ
 * @param to     destination (lieu de RDV)
 * @param now    instant de départ (Date) — pour trafic/horaires si dispo
 * @param modes  modes autorisés (défaut: tous). Ex: piéton seul si pas de voiture.
 * @returns      estimation conservatrice + niveau de confiance
 */
export function estimateTravelMax(
  from: LatLng,
  to: LatLng,
  now: Date,
  modes?: TravelMode[]
): TravelEstimate {
  const dist = haversineDistance(from, to);

  // Règle de distance quasi-nulle : ~1-2 min (jamais 0)
  if (dist < 0.05) {
    return {
      minutes: 1,
      modeUsed: modes && modes.length ? modes[0] : 'walk',
      confidence: 'high'
    };
  }

  const allowedModes: TravelMode[] = modes && modes.length > 0
    ? modes
    : ['walk', 'bike', 'ebike', 'car', 'transit'];

  const inCH = isSwitzerland(from) && isSwitzerland(to);
  const confidence = inCH ? 'medium' : 'low';

  let bestMinutes = Infinity;
  let bestMode: TravelMode = allowedModes[0];

  // Calcul du temps pour chaque mode de transport éligible
  for (const mode of allowedModes) {
    // a) Validation des seuils de distance
    if (mode === 'walk' && dist >= 5.0) continue;
    if (mode === 'bike' && dist >= 15.0) continue;
    if (mode === 'ebike' && dist >= 20.0) continue;

    let timeMin = Infinity;

    if (inCH) {
      // Modèle Suisse (Lausanne / Romandie)
      const detourFactor = dist < 20.0 ? 1.30 : 1.15;
      const routeDistance = dist * detourFactor;

      let speedKmh = 25.0; // fallback
      switch (mode) {
        case 'walk':
          speedKmh = 4.5;
          break;
        case 'bike':
          speedKmh = 13.0;
          break;
        case 'ebike':
          speedKmh = 18.0;
          break;
        case 'car':
          speedKmh = dist < 20.0 ? 25.0 : 70.0;
          break;
        case 'transit':
          speedKmh = dist < 20.0 ? 8.0 : 70.0;
          break;
      }

      timeMin = Math.ceil((routeDistance / speedKmh) * 60.0);
    } else {
      // Zone inconnue / Hors-Suisse : vitesse mixte prudente 25 km/h + détour 1.3
      const routeDistance = dist * 1.30;
      timeMin = Math.ceil((routeDistance / 25.0) * 60.0);
    }

    // On retient le mode le plus rapide raisonnable
    if (timeMin < bestMinutes) {
      bestMinutes = timeMin;
      bestMode = mode;
    }
  }

  // Si aucun mode n'est éligible (ex: distance de 30 km à pied seul),
  // on applique la vitesse du mode de marche à pied sur la distance totale en tant que garde-fou
  if (bestMinutes === Infinity) {
    const routeDistance = dist * 1.30;
    bestMinutes = Math.ceil((routeDistance / 4.5) * 60.0);
    bestMode = 'walk';
  }

  // S'assurer d'avoir au moins 2 minutes de trajet pour les distances non nulles
  const finalMinutes = Math.max(2, bestMinutes);

  return {
    minutes: finalMinutes,
    modeUsed: bestMode,
    confidence
  };
}
