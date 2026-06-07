// send-push — Edge Function Clutch
// Envoie une push notification via OneSignal REST API
// Appelée depuis le client avec le JWT Supabase

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ONESIGNAL_APP_ID = '72f8da44-de01-4ad1-b1d8-6d2fbf33daf4'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { user_id, title, body, data } = await req.json()
    if (!user_id || !title) {
      return new Response(JSON.stringify({ error: 'user_id et title requis' }), { status: 400, headers: corsHeaders })
    }

    const apiKey = Deno.env.get('ONESIGNAL_API_KEY')!

    const payload = {
      app_id: ONESIGNAL_APP_ID,
      include_aliases: { external_id: [user_id] },
      target_channel: 'push',
      headings: { en: title, fr: title },
      contents: { en: body || '', fr: body || '' },
      data: data || {},
      url: 'https://pz7cgj4kfv-tech.github.io/app',
      chrome_web_icon: 'https://pz7cgj4kfv-tech.github.io/icon-192.png',
      ttl: 3600,
    }

    const res = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const result = await res.json()
    console.log('[OneSignal] Push sent:', result)

    return new Response(JSON.stringify({ ok: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (e) {
    console.error('[send-push] Error:', e)
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: corsHeaders
    })
  }
})
