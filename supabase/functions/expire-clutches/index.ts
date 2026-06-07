// expire-clutches — Edge Function Clutch v1
// Appelée toutes les 15min via pg_cron ou Supabase Scheduled Functions
// 1. Expire les clutches dont expires_at est passé (status pending → expired)
// 2. Expire les dispos dont available_until est passé

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const now = new Date().toISOString()

    // 1. Expirer les clutches pending dont expires_at est passé
    const { count: expiredClutches } = await supabase
      .from('clutches')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('expires_at', now)
      .select('id', { count: 'exact', head: true })

    // 2. Désactiver les profils dont available_until est passé
    const { count: expiredProfiles } = await supabase
      .from('profiles')
      .update({ is_available: false, available_from: null, available_until: null })
      .eq('is_available', true)
      .lt('available_until', now)
      .select('id', { count: 'exact', head: true })

    console.log(`[expire-clutches] ${expiredClutches} clutches expirés, ${expiredProfiles} profils désactivés`)

    return new Response(JSON.stringify({
      ok: true,
      expired_clutches: expiredClutches || 0,
      expired_profiles: expiredProfiles || 0,
      run_at: now
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
