// Scan des strings FRANÇAISES codées en dur (hors t()) dans l'app. node scripts/i18n-hardcoded.mts
// Heuristique : littéraux contenant des accents FR, hors bloc TR, hors commentaires, hors console/note/log.
// But : mesurer le chantier i18n et localiser les pires fichiers. NE corrige rien (read-only).
import { readFileSync } from 'node:fs'

const FILES = ['app/app2/page.tsx']
const FR_ACCENTS = /[éèêëàâäçùûüôöîïœÉÈÀ]/
const STRLIT = /(['"`])((?:[^'"`\\]|\\.)*?)\1/g

let grandTotal = 0
for (const f of FILES) {
  const lines = readFileSync(f, 'utf8').split('\n')
  // Repère le bloc TR (à ignorer : ce sont les traductions elles-mêmes).
  let trStart = -1, trEnd = -1
  lines.forEach((l, i) => { if (l.includes('const TR') && trStart < 0) trStart = i })
  if (trStart >= 0) { for (let i = trStart; i < lines.length; i++) { if (/^function useT/.test(lines[i])) { trEnd = i; break } } }

  // Indices qu'une ligne est DÉJÀ bilingue autrement que par t() (ternaire isFr / EN? / lang===).
  const BILINGUAL = /\bisFr\b|\bEN\s*\?|lang\s*===\s*'en'|lang\s*===\s*'fr'|\?\s*'[^']*'\s*:\s*'[^']*'/
  const real: { line: number; text: string }[] = []   // vrai gap (à migrer)
  const ternary: { line: number; text: string }[] = [] // déjà bilingue via ternaire
  lines.forEach((raw, idx) => {
    if (trStart >= 0 && idx >= trStart && idx <= trEnd) return         // bloc TR
    const tl = raw.trim()
    if (tl.startsWith('//') || tl.startsWith('*') || tl.startsWith('/*')) return // commentaires
    if (/console\.(log|warn|error)/.test(raw)) return                  // logs dev
    let m: RegExpExecArray | null; STRLIT.lastIndex = 0
    while ((m = STRLIT.exec(raw))) {
      const s = m[2]
      if (s.length < 3 || !FR_ACCENTS.test(s)) continue
      const before = raw.slice(Math.max(0, m.index - 3), m.index)
      if (/t\(\s*$/.test(before)) continue                             // déjà via t('…')
      if (BILINGUAL.test(raw)) ternary.push({ line: idx + 1, text: s.slice(0, 50) })
      else real.push({ line: idx + 1, text: s.slice(0, 50) })
    }
  })
  grandTotal += real.length
  console.log(`\n── ${f} ──`)
  console.log(`  ✅ déjà bilingue via ternaire (isFr/EN?/lang===) : ${ternary.length} (OK, marche dans les 2 langues)`)
  console.log(`  ❌ VRAI gap (FR seul, à migrer vers t()) : ${real.length}`)
  real.slice(0, 24).forEach(h => console.log(`     L${h.line}  « ${h.text} »`))
  if (real.length > 24) console.log(`     … +${real.length - 24} autres`)
}
console.log(`\nVRAI GAP ≈ ${grandTotal} strings FR uniquement (le reste est déjà bilingue ou via t()).`)
console.log('NB : heuristique — inclut des outils admin/test (à migrer en dernier).')
