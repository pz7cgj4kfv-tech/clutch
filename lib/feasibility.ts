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

// Trajet estimé (ms) depuis une distance km : vol d'oiseau × 1.35 ÷ 47 (≈ 35 km/h effectif).
// 📌 Recalibré 28.06 (22→35 km/h) — DOIT rester identique à cone.travelMs (drift testé dans test-cone).
export function travelMs(km: number): number { return Math.round((km * 1.35) / 47 * 3_600_000) }

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

// ─────────────────────────────────────────────────────────────────────────────
// MOMENTS DE LA JOURNÉE (David 27.06) — boutons « ce matin / cet après-midi / ce soir /
// cette nuit / demain matin / demain après-midi » au lieu de bricoler la molette.
// Calculés DEPUIS maintenant, bornés à l'horizon 18h. Ex : à minuit on peut aller jusqu'à
// « demain après-midi » (fin 18h = 18h pile, dans l'horizon) mais PAS « demain soir » (hors 18h).
//
// PIÈGE évité : la molette publie « HH:MM aujourd'hui » → incapable de dire « 14h DEMAIN ».
// Ici on renvoie des EPOCHS exacts (jour inclus) → le publish utilise ces bornes telles quelles,
// plus aucune ambiguïté de lendemain. Pur → testé (heures locales, comme makeSlots).
//   nuit 0-6 · matin 6-12 · après-midi 12-18 · soir 18-24.
//   La nuit « appartient » au soir précédent pour l'étiquette (à 22h, « cette nuit » = 0-6 du lendemain).
// ─────────────────────────────────────────────────────────────────────────────
export type DayPartKey = 'nuit' | 'matin' | 'aprem' | 'soir'
export interface DayPart {
  key: DayPartKey; dayOffset: number; start: number; end: number; // epoch ms (clampés)
  fr: string; en: string;
}
const DAYPART_DEFS: { key: DayPartKey; from: number; to: number }[] = [
  { key: 'nuit',  from: 0,  to: 6  },
  { key: 'matin', from: 6,  to: 12 },
  { key: 'aprem', from: 12, to: 18 },
  { key: 'soir',  from: 18, to: 24 },
]
const DAYPART_LABELS: Record<DayPartKey, [string, string, string, string]> = {
  //                       fr aujourd'hui     fr demain            en today            en tomorrow
  nuit:  ['cette nuit',       'demain nuit',       'tonight (late)',  'tomorrow night'],
  matin: ['ce matin',         'demain matin',      'this morning',    'tomorrow morning'],
  aprem: ['cet après-midi',   'demain après-midi', 'this afternoon',  'tomorrow afternoon'],
  soir:  ['ce soir',          'demain soir',       'tonight',         'tomorrow evening'],
}
// Minuit local du jour de `now`, décalé de `offset` jours.
function localMidnight(now: number, offset: number): number {
  const d = new Date(now); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + offset); return d.getTime()
}
// leadMin = marge mini AVANT le début (David 30.06 : le moment EN COURS commence à maintenant +1h, pas
//   maintenant). Du coup un moment sans place suffisante après ce +1h disparaît tout seul (ex : « matin » à 11h).
export function dayParts(now: number, horizonH = 18, minMinutes = 20, leadMin = 0): DayPart[] {
  const horizonEnd = now + horizonH * 3_600_000
  const earliest = now + leadMin * 60_000
  const out: DayPart[] = []
  for (let off = 0; off <= 2; off++) {
    const mid = localMidnight(now, off)
    for (const def of DAYPART_DEFS) {
      const start = mid + def.from * 3_600_000
      const end   = mid + def.to   * 3_600_000
      if (end <= now || start >= horizonEnd) continue          // déjà passé ou hors horizon
      const cStart = Math.max(start, earliest), cEnd = Math.min(end, horizonEnd)
      if (cEnd - cStart < minMinutes * 60_000) continue        // pas (plus) assez de place → le moment disparaît
      // Étiquette : la nuit (0-6) se rattache au soir précédent → labelOffset = off - 1.
      let labelOff = def.key === 'nuit' ? off - 1 : off
      if (labelOff < 0) labelOff = 0                            // on est DEDANS (ex : 3h du matin) → « cette nuit »
      const idx = labelOff === 0 ? 0 : 1
      out.push({ key: def.key, dayOffset: off, start: cStart, end: cEnd,
        fr: DAYPART_LABELS[def.key][idx], en: DAYPART_LABELS[def.key][idx + 2] })
    }
  }
  return out.sort((a, b) => a.start - b.start)
}
