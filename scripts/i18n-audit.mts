// Audit i18n de Clutch. Lance : node scripts/i18n-audit.mts
// Vérifie la PARITÉ des clés fr/en du dictionnaire TR (app2/page.tsx) + signale les trous.
// Règle CLAUDE.md : toute clé doit exister en fr ET en en. Une clé manquante → fallback (incohérence langue).
import { readFileSync } from 'node:fs'

const SRC = 'app/app2/page.tsx'
const code = readFileSync(SRC, 'utf8')

// Isole le bloc `nom: {` … `}` par comptage d'accolades (à partir de `const TR`).
function block(label: string): string {
  const trStart = code.indexOf('const TR')
  const start = code.indexOf(`${label}: {`, trStart)
  if (start < 0) return ''
  let i = code.indexOf('{', start), depth = 0, end = i
  for (; i < code.length; i++) {
    if (code[i] === '{') depth++
    else if (code[i] === '}') { depth--; if (depth === 0) { end = i; break } }
  }
  return code.slice(start, end + 1)
}
// Extrait les clés `'xxx':` d'un bloc (gère les apostrophes échappées dans les valeurs en ignorant après ':').
function keys(blk: string): string[] {
  const out: string[] = []
  const re = /(^|[,{\n]\s*)'((?:[^'\\]|\\.)+)'\s*:/g
  let m: RegExpExecArray | null
  while ((m = re.exec(blk))) out.push(m[2])
  return out
}

const fr = keys(block('fr'))
const en = keys(block('en'))
const frSet = new Set(fr), enSet = new Set(en)
const missEn = fr.filter(k => !enSet.has(k))           // en fr mais pas en en
const missFr = en.filter(k => !frSet.has(k))           // en en mais pas en fr
const dupFr = fr.filter((k, i) => fr.indexOf(k) !== i)
const dupEn = en.filter((k, i) => en.indexOf(k) !== i)

console.log('── PARITÉ DU DICTIONNAIRE TR ──')
console.log(`  fr : ${fr.length} clés · en : ${en.length} clés`)
console.log(`  manquantes en EN (présentes en fr) : ${missEn.length}`)
missEn.forEach(k => console.log(`    ✗ en['${k}']`))
console.log(`  manquantes en FR (présentes en en) : ${missFr.length}`)
missFr.forEach(k => console.log(`    ✗ fr['${k}']`))
if (dupFr.length) console.log(`  ⚠️ doublons fr : ${[...new Set(dupFr)].join(', ')}`)
if (dupEn.length) console.log(`  ⚠️ doublons en : ${[...new Set(dupEn)].join(', ')}`)

const ok = missEn.length === 0 && missFr.length === 0 && !dupFr.length && !dupEn.length
console.log(`\n${ok ? '✅ Parité parfaite' : '❌ Parité incomplète — ajoute les clés manquantes (fr ET en)'}`)
process.exit(ok ? 0 : 1)
