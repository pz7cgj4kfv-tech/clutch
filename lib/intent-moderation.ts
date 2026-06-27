// 🛡️ Modération du texte d'INTENTION (page 2) — garde-fou éthique (David + GPT/Grok 28.06).
// On NORMALISE (minuscules, accents, leetspeak, espaces parasites) puis on teste une liste noire.
// ⚠️ Le JS est CONTOURNABLE → ceci est la 1re ligne. La VRAIE garantie = un check SERVEUR (RPC/trigger Supabase),
//    à ajouter (cf docs). Ici on bloque le plus gros côté client pour un feedback immédiat et bienveillant.

// Normalisation : casse, accents, leetspeak fréquent, caractères répétés, ponctuation.
function normalize(raw: string): string {
  let s = (raw || '').toLowerCase()
  s = s.normalize('NFD').replace(/[̀-ͯ]/g, '')        // enlève les accents
  // leetspeak fréquent
  s = s.replace(/[@4]/g, 'a').replace(/[3]/g, 'e').replace(/[1!|]/g, 'i')
       .replace(/[0]/g, 'o').replace(/[$5]/g, 's').replace(/[7]/g, 't').replace(/[8]/g, 'b')
  s = s.replace(/[^a-z\s]/g, ' ')                                // ne garde que lettres + espaces
  s = s.replace(/(.)\1{2,}/g, '$1$1')                            // « saaaalut » → « saalut »
  s = s.replace(/\s+/g, ' ').trim()
  return s
}

// Termes interdits — sexuel explicite, prostitution, pédocriminel, violence sexuelle.
// Tokens DISTINCTIFS (peu de faux positifs). Testés sur le texte normalisé ET sa version sans espaces
// (pour attraper « g a n g b a n g » / « g4ng b4ng »).
const BLOCKLIST = [
  // sexuel explicite
  'gangbang', 'gang bang', 'partouze', 'plan cul', 'plancul', 'plan q', 'baise', 'baiser', 'sucer', 'suce',
  'sodomie', 'fellation', 'cunnilingus', 'ejacul', 'penetration', 'bukkake', 'creampie', 'blowjob', 'handjob',
  'orgasme', 'masturb', 'fuck', 'fucking', 'nude', 'nudes', 'sexe rapide', 'sexfriend', 'sexe sans', 'cul rapide',
  // prostitution / transactionnel
  'escort', 'escorte', 'prostit', 'passe tarif', 'tarif horaire', 'paye pour', 'argent contre', 'sugar daddy', 'sugar baby',
  // pédocriminel — tolérance ZÉRO
  'mineur', 'mineure', 'petite fille', 'petit garcon', 'enfant sexe', 'ado sexe', 'lolita', 'jeune vierge',
  // violence sexuelle
  'viol', 'violer', 'force toi', 'sans consentement', 'soumise forcee',
]

const BLOCK_NOSPACE = BLOCKLIST.filter(t => t.includes(' ')).map(t => t.replace(/\s/g, ''))

export type IntentCheck = { ok: true } | { ok: false; reason: 'explicit' | 'tooShort' }

// minLen = nombre minimum de caractères « utiles » (lettres) pour éviter « salut / rien / :) ».
export function checkIntent(raw: string, minLen = 10): IntentCheck {
  const norm = normalize(raw)
  const letters = norm.replace(/\s/g, '')
  if (letters.length < minLen) return { ok: false, reason: 'tooShort' }
  const noSpace = norm.replace(/\s/g, '')
  for (const term of BLOCKLIST) {
    const t = term.replace(/\s/g, ' ')
    if (norm.includes(t)) return { ok: false, reason: 'explicit' }
  }
  for (const term of BLOCK_NOSPACE) {
    if (noSpace.includes(term)) return { ok: false, reason: 'explicit' }
  }
  return { ok: true }
}

// Message de refus — BIENVEILLANT, jamais moralisateur (ton validé GPT/Grok).
export function intentRefusal(reason: 'explicit' | 'tooShort', lang: 'fr' | 'en'): string {
  if (reason === 'tooShort')
    return lang === 'en' ? 'Tell us a bit more about what you’re up for 🙂' : 'Dis-en un peu plus sur ton envie du moment 🙂'
  return lang === 'en'
    ? 'This doesn’t match the spirit of Clutch — try rephrasing it.'
    : 'Cette intention ne colle pas à l’esprit de Clutch — essaie de la reformuler.'
}
