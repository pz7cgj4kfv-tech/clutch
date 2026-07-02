// 🧱 Lit le MUR D'ÉQUIPE (table collab_log) — à lancer par Claude en DÉBUT de session
// pour voir ce que Dom / David ont posté avant de commencer.  Usage : node scripts/collab-read.mjs
// Clé publishable (protégée par RLS — collab_log est en lecture ouverte à l'équipe). Aucun secret ici.
const URL = 'https://fnucdicfcjoxbozpfdau.supabase.co/rest/v1/collab_log?select=*&order=created_at.desc&limit=50'
const KEY = 'sb_publishable_TXWkldkILlJ5G9OTOfiCLg_NYZLVMTZ'
try {
  const r = await fetch(URL, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } })
  const rows = await r.json()
  if (!Array.isArray(rows)) { console.log('⚠️ Mur indisponible (migration 20260702_collab_wall appliquée ?) →', JSON.stringify(rows)); process.exit(0) }
  if (!rows.length) { console.log('🧱 Mur vide — rien de nouveau côté Dom/David.'); process.exit(0) }
  console.log(`🧱 MUR D'ÉQUIPE — ${rows.length} message(s), le plus récent en premier :\n`)
  for (const m of rows) {
    const ic = m.role === 'dom' ? '🛠️' : m.role === 'david' ? '👑' : m.role === 'claude' ? '🤖' : '💬'
    console.log(`${ic} [${m.created_at}] ${m.author}:\n   ${String(m.message).replace(/\n/g, '\n   ')}${m.file_url ? `\n   📎 ${m.file_url}` : ''}\n`)
  }
} catch (e) { console.log('⚠️ Erreur lecture mur :', e.message) }
