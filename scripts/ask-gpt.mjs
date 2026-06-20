// Pont Claude → GPT. Pose une question à GPT (API OpenAI) pour le challenger.
// Lit OPENAI_API_KEY depuis .env.local (gitignoré, jamais déployé).
// Usage : node scripts/ask-gpt.mjs scripts/gpt-prompt.txt   (ou passe le texte en argument direct)
import { readFileSync, existsSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').filter(Boolean).map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim()] })
)
const KEY = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY
if (!KEY) { console.error('❌ Manque OPENAI_API_KEY dans .env.local'); process.exit(1) }

const arg = process.argv[2] || ''
const prompt = arg && existsSync(arg) ? readFileSync(arg, 'utf8') : arg
if (!prompt) { console.error('❌ Donne un prompt (fichier ou texte)'); process.exit(1) }

const SYSTEM = `Tu es un conseiller produit/tech/légal senior, expert en apps sociales, sécurité des femmes, droit suisse (LPD/FINMA) et psychologie sociale. Ton rôle : CHALLENGER de façon adversariale, pas flatter. Trouve les failles, risques légaux, problèmes UX, angles de malveillance, et dis clairement où tu n'es PAS d'accord. Sois concret, structuré, honnête. Réponds en français.`

const res = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gpt-4o',
    messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }],
    temperature: 0.7,
  }),
})
const data = await res.json()
if (data.error) { console.error('❌ GPT:', data.error.message); process.exit(1) }
console.log('\n========== RÉPONSE GPT-4o ==========\n')
console.log(data.choices[0].message.content)
console.log('\n========== fin · coût ~', JSON.stringify(data.usage), '==========')
process.exit(0)
