// ─────────────────────────────────────────────────────────────────────────────
// SÉCURITÉ DES LIEUX (David 28.06) — classer un lieu de RDV : sécurisant / neutre / attention.
// Pur → testable. Heuristique mots-clés + heure. Sert à PRÉVENIR la receveuse (jamais bloquer) et à
// proposer d'activer « le bouclier » (Profil → Sécurité : contacts SOS). Jamais alarmiste sur un lieu public.
//
// Décisions : un lieu PUBLIC fréquenté (café/bar/gare…) reste sûr même tard. Un lieu INCONNU devient « attention »
// la nuit. Un lieu ISOLÉ (forêt/parc/plage/parking…) la nuit = ALERTE ROUGE (« fortement conseillé »).
// ─────────────────────────────────────────────────────────────────────────────

export type SafetyLevel = 0 | 1 | 2 | 3   // 0 sûr · 1 neutre · 2 attention · 3 rouge
export interface SafetyVerdict { level: SafetyLevel; fr: string; en: string; advise: boolean }

// Lieux publics/fréquentés → rassurants.
const SAFE_KW = /caf[eé]|\bbar\b|resto|restaurant|brasserie|\bpub\b|h[oô]tel|gare|mus[eé]e|cin[eé]ma|th[eé][aâ]tre|\bclub\b|terrasse|march[eé]|mcdo|starbucks|boulanger|biblioth|coworking|piscine|patinoire|bowling|galerie|centre commercial|\bmall\b/i
// Lieux isolés/peu fréquentés → vigilance.
const CAUTION_KW = /for[eê]t|\bbois\b|\bparc\b|plage|\blac\b|rivi[eè]re|sentier|\bchemin\b|parking|sous-bois|montagne|cabane|entrep[oô]t|chantier|ruelle|impasse|tunnel|\bquai\b|berge|\bpont\b|terrain vague|abord/i

export function placeSafety(name: string, hour: number): SafetyVerdict {
  const n = (name || '').toLowerCase()
  const night = hour >= 22 || hour < 6      // nuit profonde
  // ISOLÉ l'emporte sur PUBLIC (on err vers la prudence — le message ne fait que SUGGÉRER, jamais bloquer).
  let base: 0 | 1 | 2 = 1                    // neutre par défaut (lieu inconnu)
  if (CAUTION_KW.test(n)) base = 2
  else if (SAFE_KW.test(n)) base = 0

  let level: SafetyLevel
  if (base === 0) level = 0                          // public → sûr (même tard)
  else if (base === 2) level = night ? 3 : 2         // isolé : nuit → rouge · jour → attention
  else level = night ? 2 : 1                          // inconnu : nuit → attention · jour → neutre

  const labels: Record<SafetyLevel, { fr: string; en: string }> = {
    0: { fr: '', en: '' },
    1: { fr: '', en: '' },
    2: { fr: '🛡️ Lieu peu fréquenté — tu peux activer ton bouclier (Profil → Sécurité).',
         en: '🛡️ Quiet spot — you can turn on your shield (Profile → Safety).' },
    3: { fr: '⚠️ Lieu isolé et tard. Fortement conseillé d\'activer ton bouclier avant d\'y aller.',
         en: '⚠️ Isolated spot, late hour. Strongly recommended to turn on your shield first.' },
  }
  return { level, fr: labels[level].fr, en: labels[level].en, advise: level >= 2 }
}
