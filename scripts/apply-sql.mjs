// Applique un fichier SQL (DDL inclus : CREATE POLICY, ALTER, etc.) sur Supabase
// via la Management API + un Personal Access Token (PAT).
// Usage : node scripts/apply-sql.mjs supabase/migrations/xxx.sql
//
// Pré-requis : ajouter dans .env.local (gitignoré) :
//   SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxx   (créé sur https://supabase.com/dashboard/account/tokens)
// Le project ref est lu depuis NEXT_PUBLIC_SUPABASE_URL.
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').filter(Boolean)
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const token = env.SUPABASE_ACCESS_TOKEN
if (!token) { console.error('❌ SUPABASE_ACCESS_TOKEN manquant dans .env.local'); process.exit(1) }
const ref = (env.NEXT_PUBLIC_SUPABASE_URL || '').match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]
if (!ref) { console.error('❌ project ref introuvable dans NEXT_PUBLIC_SUPABASE_URL'); process.exit(1) }

const file = process.argv[2]
if (!file) { console.error('Usage : node scripts/apply-sql.mjs <fichier.sql>'); process.exit(1) }
const sql = readFileSync(file, 'utf8')

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: sql }),
})
const text = await res.text()
if (!res.ok) { console.error(`❌ ${res.status} ${res.statusText}\n${text}`); process.exit(1) }
console.log(`✅ SQL appliquée (${file})`)
console.log(text.slice(0, 500))
