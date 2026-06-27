// 🎭 Déduction de MOOD depuis le texte d'intention (page 2) — David + GPT/Grok 28.06.
// Offline, léger : dictionnaire de mots-clés pondérés (pas de LLM, app statique). On rend les ~2 moods dominants.
// IMPORTANT (garde-fou sécurité) : on garde un AXE « nature » (romantique / amical / pro / famille) en plus du « quoi »,
// pour ne pas perdre la distinction romantique≠amical (cf retrait des tuiles mode). Matching = SOUPLE (ambiguïté = large).

export type MoodKey =
  | 'romantique' | 'amical' | 'pro' | 'famille'                    // axe NATURE
  | 'verre' | 'cafe' | 'sport' | 'culture' | 'nature' | 'fun'      // axe QUOI

export const MOOD_LABELS: Record<MoodKey, { fr: string; en: string; e: string }> = {
  romantique: { fr: 'Romantique', en: 'Romantic', e: '💘' },
  amical:     { fr: 'Amical',     en: 'Friendly', e: '🙂' },
  pro:        { fr: 'Pro',        en: 'Pro',      e: '💼' },
  famille:    { fr: 'Famille',    en: 'Family',   e: '👨‍👩‍👧' },
  verre:      { fr: 'Un verre',   en: 'A drink',  e: '🍷' },
  cafe:       { fr: 'Un café',    en: 'A coffee', e: '☕' },
  sport:      { fr: 'Sport',      en: 'Sport',    e: '🏃' },
  culture:    { fr: 'Culturel',   en: 'Culture',  e: '🎨' },
  nature:     { fr: 'Balade',     en: 'Outdoors', e: '🌿' },
  fun:        { fr: 'Fun',        en: 'Fun',      e: '🎉' },
}

// Dictionnaire pondéré : mot-clé (sur texte normalisé sans accents) → mood → poids.
const KEYWORDS: { rx: RegExp; mood: MoodKey; w: number }[] = [
  // nature
  { rx: /\b(date|romantique|romance|amour|seduc|flirt|tinder|en amoureux|tete a tete)\b/, mood: 'romantique', w: 3 },
  { rx: /\b(amical|ami|amie|pote|copain|copine|entre potes|nouvelles personnes|rencontrer du monde)\b/, mood: 'amical', w: 3 },
  { rx: /\b(pro|boulot|business|networking|projet|travail|collab|reseau|startup|entrepreneur)\b/, mood: 'pro', w: 3 },
  { rx: /\b(famille|enfant|enfants|parent|maman|papa|jeux|parc)\b/, mood: 'famille', w: 3 },
  // quoi
  { rx: /\b(verre|biere|biere|apero|cocktail|vin|boire|bar|pinte)\b/, mood: 'verre', w: 2 },
  { rx: /\b(cafe|the|discuter|parler|conversation|echanger|philo)\b/, mood: 'cafe', w: 2 },
  { rx: /\b(sport|courir|course|rando|velo|tennis|foot|gym|grimpe|natation|marche)\b/, mood: 'sport', w: 2 },
  { rx: /\b(expo|musee|concert|cinema|theatre|art|creatif|musique|culture|lecture)\b/, mood: 'culture', w: 2 },
  { rx: /\b(balade|lac|nature|promenade|foret|montagne|coucher de soleil|dehors)\b/, mood: 'nature', w: 2 },
  { rx: /\b(fun|rire|chill|delire|fete|danser|soiree|kiff)\b/, mood: 'fun', w: 2 },
]

function norm(s: string): string {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

// Renvoie les moods dominants (max 2), triés par poids. Vide si rien de reconnu.
export function deriveMoods(text: string, max = 2): MoodKey[] {
  const t = norm(text)
  const scores = new Map<MoodKey, number>()
  for (const { rx, mood, w } of KEYWORDS) {
    if (rx.test(t)) scores.set(mood, (scores.get(mood) || 0) + w)
  }
  return [...scores.entries()].sort((a, b) => b[1] - a[1]).slice(0, max).map(([m]) => m)
}
