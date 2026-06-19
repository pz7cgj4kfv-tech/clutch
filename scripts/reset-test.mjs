// Reset test local — annule les clutchs actifs + débloque le Verrou du compte connecté.
// N'agit QUE sur les données de l'utilisateur authentifié (RLS). Aucune clé secrète requise.
// Usage : RESET_EMAIL=... RESET_PW=... node scripts/reset-test.mjs
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

// Lit URL + clé publishable depuis .env.local (déjà présent localement)
const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').filter(Boolean).map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim()] })
)
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL
const KEY  = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const EMAIL = process.env.RESET_EMAIL
const PW    = process.env.RESET_PW
if (!EMAIL || !PW) { console.error('❌ Manque RESET_EMAIL / RESET_PW'); process.exit(1) }

const sb = createClient(URL_, KEY)
const { data: auth, error: e1 } = await sb.auth.signInWithPassword({ email: EMAIL, password: PW })
if (e1) { console.error('❌ Login échoué :', e1.message); process.exit(1) }
const uid = auth.user.id
console.log('✅ Connecté en', EMAIL, '(', uid, ')')

// 1) Annule mes clutchs actifs (sender OU receiver)
const { error: e2, count: c2 } = await sb.from('clutches')
  .update({ status: 'cancelled', expires_at: new Date().toISOString() }, { count: 'exact' })
  .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
  .in('status', ['pending','accepted','confirmed','checked_in'])
if (e2) console.error('⚠️ clutches:', e2.message); else console.log('✅ Clutchs annulés :', c2 ?? '?')

// 2) Débloque mon Verrou (SANS me mettre hors-ligne — je reste dispo)
const { error: e3 } = await sb.from('profiles')
  .update({ rdv_locked_until: null, rdv_locked_from: null })
  .eq('id', uid)
if (e3) console.error('⚠️ profile:', e3.message); else console.log('✅ Verrou débloqué (dispo conservée)')

// 2b) Nettoie les clutchs DECLINED récents → débloque le cooldown 48h (pour re-tester l'envoi)
const { data: d2b } = await sb.from('clutches')
  .update({ status: 'cancelled' }).eq('status','declined')
  .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`).select('id')
console.log('✅ Declined nettoyés (cooldown levé) :', d2b?.length ?? 0)

// 3) Neutralise le piège "retard refusé" (cause du Verrou fantôme)
const { data: d4, error: e4 } = await sb.from('clutches')
  .update({ retard_accepted: true }).eq('retard_by', uid).eq('retard_accepted', false).select('id')
if (e4) console.error('⚠️ retard:', e4.message); else console.log('✅ Pièges "retard refusé" neutralisés :', d4?.length ?? 0)

// 4) Efface MES contacts (keep_contact=false) — pour re-tester proprement avec Mel
const { data: d5, error: e5 } = await sb.from('rdv_feedbacks')
  .update({ keep_contact: false }).eq('from_id', uid).eq('keep_contact', true).select('rdv_id')
if (e5) console.error('⚠️ contacts:', e5.message); else console.log('✅ Contacts effacés (keep_contact remis à false) :', d5?.length ?? 0)

console.log('🎉 Reset terminé — recharge l\'app.')
process.exit(0)
