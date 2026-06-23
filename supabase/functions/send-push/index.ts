// send-push — Edge Function Clutch
// Envoie une push via OneSignal REST API (API v16 : api.onesignal.com).
// Version BLINDÉE : ne crash jamais, et renvoie clairement la réponse de OneSignal
// (recipients / errors) pour qu'on voie EXACTEMENT ce qui se passe.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ONESIGNAL_APP_ID = '72f8da44-de01-4ad1-b1d8-6d2fbf33daf4'

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const payload_in = await req.json().catch(() => ({}))
    const { user_id, title, body, data } = payload_in as any
    if (!user_id || !title) {
      return json({ ok: false, error: 'user_id et title requis', got: payload_in }, 400)
    }

    const apiKey = Deno.env.get('ONESIGNAL_API_KEY')
    if (!apiKey) {
      return json({ ok: false, error: 'ONESIGNAL_API_KEY ABSENT des secrets Supabase' }, 200)
    }

    const payload = {
      app_id: ONESIGNAL_APP_ID,
      include_aliases: { external_id: [String(user_id)] },
      target_channel: 'push',
      headings: { en: title, fr: title },
      contents: { en: body || ' ', fr: body || ' ' },
      data: data || {},
      ttl: 3600,
    }

    const res = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const raw = await res.text()
    let result: any
    try { result = JSON.parse(raw) } catch { result = { raw } }

    const out = {
      ok: res.ok && !result?.errors,
      onesignal_status: res.status,
      recipients: result?.recipients ?? null,
      errors: result?.errors ?? null,
      notification_id: result?.id ?? null,
    }
    // Visible dans l'onglet Logs
    console.log('[send-push]', JSON.stringify(out))
    return json(out, 200)

  } catch (e) {
    console.error('[send-push] Exception:', e)
    return json({ ok: false, error: String(e) }, 200)
  }
})
