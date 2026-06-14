/**
 * CLUTCH — Brand Design Tokens officiels
 * Source de vérité pour toutes les couleurs.
 * NE JAMAIS utiliser #ef4444, #000, #0a0a0a, etc. dans le code UI.
 * Toujours importer depuis ce fichier.
 *
 * Palette extraite du logo officiel Clutch (fond prune, icône pêche, texte or)
 */

export const brand = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  /** Fond principal : bordeaux/prune foncé */
  bgBase:    '#2a1020',
  /** Fond légèrement plus clair (sections, cartes) */
  bgCard:    'rgba(255,191,158,0.05)',
  /** Fond input / champ texte */
  bgInput:   'rgba(255,191,158,0.07)',
  /** Fond nav (avec opacité pour blur) */
  bgNav:     'rgba(42,16,32,0.92)',
  /** Fond section alternée */
  bgSection: 'rgba(20,8,16,0.7)',

  // ── Accents ───────────────────────────────────────────────────────────────
  /** Or/orange — couleur principale des boutons CTA et highlights (= "TCH" du logo) */
  gold:      '#C8860A',
  /** Or foncé (hover bouton) */
  goldDark:  '#a06d08',
  /** Pêche/saumon clair — texte secondaire, bordures, icônes (= "CLU" du logo) */
  peach:     '#FFBF9E',

  // ── Texte ─────────────────────────────────────────────────────────────────
  /** Texte principal */
  textPrimary:   '#f5e8de',
  /** Texte secondaire (opacity 60%) */
  textSecondary: 'rgba(245,232,222,0.6)',
  /** Texte tertiaire (labels, meta) */
  textTertiary:  'rgba(245,232,222,0.35)',
  /** Texte très discret (footer, version) */
  textGhost:     'rgba(245,232,222,0.2)',

  // ── Bordures ──────────────────────────────────────────────────────────────
  borderSubtle:  'rgba(255,191,158,0.08)',
  borderLight:   'rgba(255,191,158,0.12)',
  borderMedium:  'rgba(255,191,158,0.2)',
  borderAccent:  'rgba(200,134,10,0.3)',

  // ── États ─────────────────────────────────────────────────────────────────
  /** Succès (waitlist confirmée, etc.) */
  success:       '#22c55e',
  /** Erreur (validation formulaire) */
  error:         '#FFBF9E',  // pêche, pas rouge vif
} as const

export type BrandColor = typeof brand[keyof typeof brand]
