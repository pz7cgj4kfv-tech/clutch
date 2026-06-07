// create-checkout — Edge Function Clutch
// Crée une session Stripe Checkout pour le plan premium CHF 19.90/mois
// Appelée depuis le client avec le JWT Supabase de l'utilisateur

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Vérifier l'auth Supabase
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'Non authentifié' }), { status: 401, headers: corsHeaders })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return new Response(JSON.stringify({ error: 'Non authentifié' }), { status: 401, headers: corsHeaders })

    // Récupérer le profil pour vérifier le genre
    const { data: profile } = await supabase.from('profiles').select('gender, name, is_premium').eq('id', user.id).single()

    if (profile?.gender === 'female') {
      return new Response(JSON.stringify({ error: 'Les femmes ont accès gratuit à Clutch !' }), { status: 400, headers: corsHeaders })
    }

    if (profile?.is_premium) {
      return new Response(JSON.stringify({ error: 'Tu es déjà premium !' }), { status: 400, headers: corsHeaders })
    }

    const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY')!
    const APP_URL = Deno.env.get('APP_URL') || 'https://pz7cgj4kfv-tech.github.io'
    const PRICE_ID = Deno.env.get('STRIPE_PRICE_ID')! // ex: price_xxx

    // Créer la session Stripe Checkout
    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'subscription',
        'customer_email': user.email || '',
        'line_items[0][price]': PRICE_ID,
        'line_items[0][quantity]': '1',
        'success_url': `${APP_URL}/app?premium=success`,
        'cancel_url': `${APP_URL}/app?premium=cancel`,
        'metadata[user_id]': user.id,
        'metadata[user_name]': profile?.name || '',
        'subscription_data[metadata][user_id]': user.id,
        'allow_promotion_codes': 'true',
        'locale': 'fr',
      })
    })

    const session = await stripeRes.json()

    if (!stripeRes.ok) {
      console.error('[Stripe] Error:', session)
      return new Response(JSON.stringify({ error: session.error?.message || 'Erreur Stripe' }), { status: 500, headers: corsHeaders })
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
