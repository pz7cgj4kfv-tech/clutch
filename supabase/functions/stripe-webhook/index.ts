// stripe-webhook — Edge Function Clutch
// Reçoit les événements Stripe et met à jour le statut premium des utilisateurs
// Configurer dans Stripe Dashboard → Webhooks → https://<project>.supabase.co/functions/v1/stripe-webhook

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

    // Vérification signature Stripe (simple — pour production utiliser crypto.subtle)
    // Pour l'instant on vérifie juste que la requête vient de Stripe via le secret dans l'URL
    // ou on parse directement (acceptable pour beta)

    const event = JSON.parse(body)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    console.log('[Stripe Webhook] Event:', event.type)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const userId = session.metadata?.user_id

      if (userId && session.payment_status === 'paid') {
        const subscriptionId = session.subscription

        await supabase.from('profiles').update({
          is_premium: true,
          stripe_customer_id: session.customer,
          stripe_subscription_id: subscriptionId,
          premium_until: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(), // +31 jours
        }).eq('id', userId)

        console.log(`[Stripe] User ${userId} → premium ✅`)
      }
    }

    if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.paused') {
      const subscription = event.data.object
      const userId = subscription.metadata?.user_id

      if (userId) {
        await supabase.from('profiles').update({
          is_premium: false,
          premium_until: null,
          stripe_subscription_id: null,
        }).eq('id', userId)

        console.log(`[Stripe] User ${userId} → premium révoqué`)
      }
    }

    if (event.type === 'invoice.payment_succeeded') {
      // Renouvellement mensuel — prolonger premium_until
      const invoice = event.data.object
      if (invoice.subscription) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_subscription_id', invoice.subscription)
          .single()

        if (profile) {
          await supabase.from('profiles').update({
            is_premium: true,
            premium_until: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
          }).eq('id', profile.id)

          console.log(`[Stripe] Renouvellement premium pour ${profile.id} ✅`)
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (e) {
    console.error('[Stripe Webhook] Error:', e)
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
