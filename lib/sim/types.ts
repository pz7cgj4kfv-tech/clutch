// ─────────────────────────────────────────────────────────────────────────────
// 🏙️ CLUTCH CITY — la GRAMMAIRE des agents (traduction directe du catalogue de comportement,
//    docs/clutch-city-comportements.md). Un agent = un humain qui pioche dans `Action`.
//    PUR (types + constantes), aucune I/O. Le moteur de pas (lib/sim/step) appliquera ces actions
//    via la VRAIE logique forteresse (lib/forteresse-engine) → zéro divergence test/prod.
// ─────────────────────────────────────────────────────────────────────────────
import type { ForteresseEval } from '@/lib/forteresse-engine'

export type Gender = 'F' | 'M' | 'NB'
export type Plan = 'free' | 'premium'
export type Mode = 'romantic' | 'friend' | 'pro' | 'parent'
export type LatLng = [number, number]

// ── Engagements (l'agenda d'un agent) ───────────────────────────────────────
// Une DISPO = intention (peut chevaucher). Une OCCUPATION (RDV/event confirmé) = exclusive.
export interface Slot {            // un créneau de dispo (max 3)
  id: string
  center: LatLng                   // le pin (lieu proposé)
  radiusKm: number                 // 1..50
  start: number; end: number       // epoch ms, dans l'horizon 18h
  modes: Mode[]
}
export type EngagementKind = 'clutch' | 'event'
export interface Engagement {      // un RDV/event CONFIRMÉ → occupe l'agenda (exclusif)
  id: string
  kind: EngagementKind
  place: LatLng
  start: number; end: number       // durée RDV défaut 2h si non spécifiée
  withId?: string                  // l'autre agent (clutch) ou organisateur (event)
}

// ── Clutch (invitation) ─────────────────────────────────────────────────────
export type ClutchState = 'pending' | 'accepted' | 'refused' | 'expired' | 'cancelled' | 'counter'
export interface Clutch {
  id: string
  fromId: string; toId: string
  place: LatLng
  start: number; end: number
  state: ClutchState
  createdAt: number
}

// ── Event ───────────────────────────────────────────────────────────────────
export interface CityEvent {
  id: string
  hostId: string
  place: LatLng; fixed: boolean
  start: number; end: number
  cat: string                      // catégorie (icônes Mel)
  minSeats: number; maxSeats: number; takenSeats: number   // paliers : l'event a lieu si ≥ minSeats
  priceChf: number
  joinedIds: string[]; waitlistIds: string[]
}

// ── L'AGENT (un "humain" de la ville) ───────────────────────────────────────
export interface AgentState {
  id: string
  gender: Gender; age: number; plan: Plan
  home: LatLng; gps: LatLng        // gps bouge si l'agent se déplace
  online: boolean
  slots: Slot[]                    // 0..3 dispos ouvertes
  agenda: Engagement[]             // RDV/events confirmés (exclusifs)
  inbox: Clutch[]                  // clutchs reçus pending
  outbox: Clutch[]                 // clutchs envoyés actifs
  cooldownsUntil: Record<string, number>   // toId -> epoch (48h après refus)
  receivedToday: number            // ♀ : plafond 5/j
  trust: number                    // fiabilité
  // "Caractère" (probas de comportement, tirées du panel statistique du simulateur)
  traits: AgentTraits
}

export interface AgentTraits {
  pOnlinePerHour: number           // tendance à se mettre en ligne
  pGoOffline: number
  nSlots: 0 | 1 | 2 | 3            // combien de créneaux il aime ouvrir
  pElsewhere: number               // proba d'ouvrir AILLEURS que sa position
  pMoves: number                   // proba de se déplacer
  radiusBiasKm: number             // rayon préféré
  pSendClutchPerHour: number
  pAccept: number; pRefuse: number; pCounter: number   // (le reste = ignore/expire)
  responseDelayMin: number
  pCreateEventPerDay: number
  honesty: { onTime: number; late: number; noShow: number }  // somme = 1
}

// ── L'ACTION — TOUT ce qu'un humain peut faire (l'espace d'actions complet) ──
//    Chaque variante = un bouton/option réel de l'app (cf. catalogue). Si ça manque ici, l'agent
//    ne peut pas le faire → on complète AVANT de coder le moteur.
export type Action =
  // 2. Dispo
  | { t: 'goOnline' }
  | { t: 'goOffline' }
  | { t: 'openSlot'; slot: Omit<Slot, 'id'> }
  | { t: 'editSlot'; slotId: string; patch: Partial<Slot> }
  | { t: 'closeSlot'; slotId: string }
  | { t: 'move'; to: LatLng }                       // se déplacer (GPS) → dérive
  // 3. Découvrir
  | { t: 'favorite'; otherId: string }
  | { t: 'block'; otherId: string }
  | { t: 'report'; otherId: string }
  // 4. Clutcher
  | { t: 'sendClutch'; toId: string; place: LatLng; start: number; end: number; intention?: string }
  // 5. Recevoir
  | { t: 'acceptClutch'; clutchId: string }
  | { t: 'refuseClutch'; clutchId: string }
  | { t: 'counterClutch'; clutchId: string; place: LatLng; start: number; end: number }
  | { t: 'ignoreClutch'; clutchId: string }
  // 6. Verrou → RDV
  | { t: 'checkin'; engagementId: string }          // J'y suis (GPS)
  | { t: 'editRdvPlace'; engagementId: string; place: LatLng }
  | { t: 'cancelRdv'; engagementId: string }
  | { t: 'finishRdv'; engagementId: string; outcome: 'onTime' | 'present' | 'noShow'; keepFavorite: boolean }
  // 7. Events
  | { t: 'createEvent'; ev: Omit<CityEvent, 'id' | 'joinedIds' | 'waitlistIds' | 'takenSeats'> }
  | { t: 'joinEvent'; eventId: string }
  | { t: 'leaveEvent'; eventId: string }
  | { t: 'cancelEvent'; eventId: string }
  // 8. Sécurité
  | { t: 'sos' }

// ── LE MONDE ────────────────────────────────────────────────────────────────
export interface World {
  now: number
  agents: Record<string, AgentState>
  events: Record<string, CityEvent>
  rngSeed: number                  // déterminisme : même seed → même film (rejouable)
  tick: number
}

// ── LES CURSEURS (panel statistique du cockpit) ─────────────────────────────
export interface SimConfig {
  cityCenter: LatLng; cityRadiusKm: number          // Lausanne d'abord
  population: number                                // N online visés
  pctFemale: number; pctPremium: number
  ageRange: [number, number]
  massTrend: 'flat' | 'rising' | 'falling'          // dynamique de la masse locale
  clockSpeed: number                                // ×1 .. ×3600
  seed: number
  // bornes des traits (le simulateur tire chaque agent dans ces fourchettes)
  traitRanges: Partial<Record<keyof AgentTraits, [number, number]>>
}

// ── LE COQ — alertes du validateur logique ─────────────────────────────────
export type InvariantCode =
  | 'HORIZON' | 'REACH' | 'CHAINING' | 'EXCLUSION'
  | 'CAP_SLOTS' | 'CAP_CLUTCHES' | 'CAP_RECEIVED' | 'COOLDOWN'
  | 'SELF_CLUTCH' | 'BLOCKED' | 'INBOX_FULL' | 'EVENT_SEATS'
export interface CoqAlert {
  code: InvariantCode
  tick: number; at: number; seed: number            // état rejouable
  agentId: string; otherId?: string
  message: string                                   // explication humaine
  evidence?: ForteresseEval                         // le verdict moteur qui prouve la violation
}

// Caps réels (alignés sur app2/page.tsx — source unique côté sim).
export const CAPS = {
  MAX_SLOTS: 3,
  MAX_ACTIVE_CLUTCHES: { F: 20, M_free: 3, premium: 5 } as const,
  MAX_RECEIVED_PER_DAY_F: 5,
  COOLDOWN_MS: 48 * 3600 * 1000,
  DEFAULT_RDV_DURATION_MIN: 120,
} as const
