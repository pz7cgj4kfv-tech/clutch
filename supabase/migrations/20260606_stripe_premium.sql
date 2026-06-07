-- Stripe Premium — Clutch v1
-- Ajoute les colonnes premium au profil

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS premium_until timestamptz;

-- Index pour lookup par subscription_id (webhook)
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_sub ON profiles(stripe_subscription_id);

-- Vue utile : est-ce que le premium est encore valide ?
-- Utilisée côté client via RPC ou directement
CREATE OR REPLACE FUNCTION is_user_premium(uid uuid)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    is_premium AND (premium_until IS NULL OR premium_until > now()),
    false
  )
  FROM profiles WHERE id = uid;
$$;
