// ─────────────────────────────────────────────────────────────────────────────
// FEASIBILITY — moteur PUR de faisabilité temporelle d'un Clutch (validé GPT + David 27.06).
// Pur, sans I/O ni géo → testable/prouvable. Le géo (km→trajet) est fourni par l'appelant.
//
// Décisions gravées (cf. project-test-session2-cockpit) :
//  • Un créneau proposable = (mes_dispos ∩ ses_dispos) − engagements_confirmés − buffers_trajet.
//  • durée_max = min(longueur du créneau, prochain_engagement − trajet − début_clutch).
//  • impossible → bloqué · tendu (marge < 5 min) → warning · ok → normal.
//  • ⚠️ Le calcul DÉFINITIF doit tourner CÔTÉ SERVEUR (anti-sonde : ne jamais renvoyer la RAISON,
//    seulement les créneaux possibles). Ce moteur = la logique partagée (client preview + RPC serveur).
// ─────────────────────────────────────────────────────────────────────────────

export interface Interval { start: number; end: number } // epoch ms
const MIN = 60_000

// Trajet estimé (ms) depuis une distance km : vol d'oiseau × 1.35 ÷ 30 km/h (cohérent avec l'alerte trajet).
export function travelMs(km: number): number { return Math.round((km * 1.35) / 30 * 3_600_000) }

// Soustraction d'intervalles : base − holes.
export function subtract(base: Interval[], holes: Interval[]): Interval[] {
  const out: Interval[] = []
  for (const b of base) {
    let segs: Interval[] = [{ start: b.start, end: b.end }]
    for (const h of holes) {
      const next: Interval[] = []
      for (const s of segs) {
        if (h.end <= s.start || h.start >= s.end) { next.push(s); continue } // pas de chevauchement
        if (h.start > s.start) next.push({ start: s.start, end: Math.min(h.start, s.end) })
        if (h.end < s.end) next.push({ start: Math.max(h.end, s.start), end: s.end })
      }
      segs = next
    }
    out.push(...segs)
  }
  return out.filter(s => s.end > s.start)
}

// Intersection de deux ensembles d'intervalles.
export function intersect(a: Interval[], b: Interval[]): Interval[] {
  const out: Interval[] = []
  for (const x of a) for (const y of b) {
    const s = Math.max(x.start, y.start), e = Math.min(x.end, y.end)
    if (e > s) out.push({ start: s, end: e })
  }
  return out
}

// Fenêtres libres = disponibilités − (occupations élargies du buffer de prépa/trajet).
export function freeWindows(avail: Interval[], occupancies: Interval[], bufferMin = 60): Interval[] {
  const buf = bufferMin * MIN
  const expanded = occupancies.map(o => ({ start: o.start - buf, end: o.end + buf }))
  return subtract(avail, expanded)
}

// Créneaux candidats = fenêtres où LES DEUX sont dispo (mutuel). C'est la SEULE contrainte dure
// (l'autre doit être dispo). Mes propres engagements ne sont PAS un mur ici (cf. classifySlot, gradient doux).
export function candidateSlots(o: {
  myFree: Interval[]; theirFree: Interval[]; now: number; minDurationMin: number;
}): { start: number; maxDurationMin: number }[] {
  const mutual = intersect(o.myFree, o.theirFree)
  const minMs = o.minDurationMin * MIN
  const res: { start: number; maxDurationMin: number }[] = []
  for (const iv of mutual) {
    const startMin = Math.max(iv.start, o.now)
    if (iv.end - startMin < minMs) continue
    res.push({ start: startMin, maxDurationMin: Math.floor((iv.end - startMin) / MIN) })
  }
  return res
}

// Classer un créneau choisi vs MON prochain engagement (event/RDV) + trajet. GRADIENT, PAS un mur :
// on ne bloque jamais — on PRÉVIENT proportionnellement (David). L'user peut toujours décider (annuler son
// truc, prendre le malus de fiabilité) si un meilleur plan apparaît.
//   severity 0 = ok (aucun message) · 1 = tendu (doux) · 2 = risqué (faut courir) · 3 = il faudra annuler.
//   requiresCancel = j'arriverais EN RETARD à mon engagement → décision (annuler / être en retard / renoncer).
export function classifySlot(o: {
  start: number; durationMin: number; nextStart?: number | null; travelToNextMs?: number;
}): { severity: 0 | 1 | 2 | 3; marginMin: number; requiresCancel: boolean } {
  if (o.nextStart == null) return { severity: 0, marginMin: Infinity, requiresCancel: false }
  const arrival = o.start + o.durationMin * MIN + (o.travelToNextMs || 0)
  const marginMin = Math.round((o.nextStart - arrival) / MIN)
  if (marginMin >= 15) return { severity: 0, marginMin, requiresCancel: false }   // large
  if (marginMin >= 0)  return { severity: 1, marginMin, requiresCancel: false }   // tendu mais ça passe
  if (marginMin >= -20) return { severity: 2, marginMin, requiresCancel: true }   // léger dépassement → risqué
  return { severity: 3, marginMin, requiresCancel: true }                         // gros dépassement → faut annuler
}
