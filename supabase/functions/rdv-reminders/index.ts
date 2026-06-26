// rdv-reminders — Edge Function Clutch
// Pousse un rappel « ton RDV approche » (~30 min avant) aux DEUX personnes d'un Verrou, même app fermée.
// Appelée par cron (*/10 min). Idempotent via clutches.reminded.
//
// Secrets requis (déjà là pour les autres fonctions) : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ONESIGNAL_API_KEY.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const ONESIGNAL_APP_ID = '72f8da44-de01-4ad1-b1d8-6d2fbf33daf4'
const REMIND_WITHIN_MIN = 35   // fenêtre : RDV dans les ~35 min → on rappelle (cron */10 → un seul tir par RDV)

async function pushToUser(apiKey: string, userId: string, title: string, body: string, data: unknown) {
  try {
    const res = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: { 'Authorization': `Key ${apiKey}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_aliases: { external_id: [String(userId)] },
        target_channel: 'push',
        headings: { en: title, fr: title },
        contents: { en: body || ' ', fr: body || ' ' },
        data: data || {},
        ttl: 1800,
      }),
    })
    return await res.json().catch(() => ({}))
  } catch (e) { return { error: String(e) } }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const apiKey = Deno.env.get('ONESIGNAL_API_KEY')
    const now = Date.now()
    const soon = new Date(now + REMIND_WITHIN_MIN * 60_000).toISOString()
    const nowIso = new Date(now).toISOString()

    // Verrous confirmés dont le RDV est dans les ~35 min, pas encore rappelés.
    const { data: rdvs } = await supabase
      .from('clutches')
      .select('id,sender_id,receiver_id,venue,proposed_time')
      .in('status', ['confirmed', 'accepted', 'checked_in'])
      .eq('reminded', false)
      .gt('proposed_time', nowIso)
      .lte('proposed_time', soon)

    let sent = 0
    for (const c of (rdvs || [])) {
      const when = new Date((c as any).proposed_time).getTime()
      const minLeft = Math.max(1, Math.round((when - now) / 60000))
      const venue = (c as any).venue ? ` · ${String((c as any).venue).split('·')[0].trim()}` : ''
      const title = '⏰ Ton RDV approche'
      const body = `Dans ~${minLeft} min${venue}. Prépare-toi !`
      if (apiKey) {
        await pushToUser(apiKey, (c as any).sender_id, title, body, { type: 'rdv_reminder', clutch_id: (c as any).id })
        await pushToUser(apiKey, (c as any).receiver_id, title, body, { type: 'rdv_reminder', clutch_id: (c as any).id })
      }
      // Marque rappelé (même si pas d'apiKey → évite de boucler ; on log).
      await supabase.from('clutches').update({ reminded: true }).eq('id', (c as any).id)
      sent++
    }

    return new Response(JSON.stringify({ ok: true, reminded: sent, hasKey: !!apiKey }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
