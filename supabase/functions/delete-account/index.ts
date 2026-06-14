// delete-account — Edge Function Clutch v1
// Appelée par l'utilisateur authentifié pour supprimer son compte COMPLÈTEMENT
// (RGPD / LPD suisse — supprime auth.users + anonymise les données)
//
// Sécurité :
// - Vérifie le JWT de l'utilisateur courant (pas de suppression d'un autre compte)
// - Utilise le service_role key UNIQUEMENT pour supprimer auth.users
// - Anonymise d'abord les données publiques, puis supprime auth.users

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 1. Vérifier l'identité de l'appelant via son JWT (anon key)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non authentifié' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token invalide' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userId = user.id

    // 2. Supprimer les données avec service_role (bypass RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const now = new Date().toISOString()

    // 2a. Anonymiser le profil public (LPD : on ne supprime pas brutalement, on anonymise)
    await supabaseAdmin.from('profiles').update({
      name: 'Compte supprimé',
      bio: null,
      photo_url: null,
      interests: [],
      languages: [],
      job: null,
      neighborhood: null,
      is_available: false,
      available_until: null,
      available_from: null,
      deleted_at: now,
    }).eq('id', userId)

    // 2b. Supprimer les clutches (données personnelles)
    await supabaseAdmin.from('clutches').delete()
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)

    // 2c. Supprimer favoris / blocs / feedbacks liés
    await Promise.all([
      supabaseAdmin.from('favorites').delete().or(`user_id.eq.${userId},profile_id.eq.${userId}`),
      supabaseAdmin.from('blocks').delete().or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`),
      supabaseAdmin.from('feedback').delete().eq('given_by', userId),
      supabaseAdmin.from('messages').delete().eq('sender_id', userId),
    ])

    // 2d. Supprimer le compte auth (irréversible — nécessite service_role)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteError) {
      console.error('[delete-account] Erreur suppression auth:', deleteError)
      return new Response(JSON.stringify({ error: 'Erreur suppression auth', detail: deleteError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`[delete-account] Compte ${userId} supprimé à ${now}`)

    return new Response(JSON.stringify({ ok: true, deleted_at: now }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (e) {
    console.error('[delete-account] Exception:', e)
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
