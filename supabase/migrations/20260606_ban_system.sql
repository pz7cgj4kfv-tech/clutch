-- Système de bannissement
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false;

-- Index pour lookup rapide
CREATE INDEX IF NOT EXISTS idx_profiles_banned ON profiles(is_banned) WHERE is_banned = true;
