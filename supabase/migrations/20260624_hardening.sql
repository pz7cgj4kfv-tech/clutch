-- ════════════════════════════════════════════════════════════════════════
-- CLUTCH — DURCISSEMENT SÉCURITÉ (RLS + triggers + contraintes) — 24.06.2026
-- Issu de l'audit adversarial. Objectif : passer les invariants critiques de
-- 🟡 JS-only (contournable via l'API REST) à 🟢 forcé en base (incassable).
--
-- ⚠️ NE PAS LANCER EN AVEUGLE EN PROD.
--   1) Lancer d'abord le DIAGNOSTIC (section 0) et lire le résultat.
--   2) Tester sur un projet/branche STAGING, rejouer TOUS les flows
--      (login, dispo, clutch, verrou, feedback, events, blocage).
--   3) Adapter les NOMS DE COLONNES aux vrais noms de la DB
--      (rdv_feedbacks: from_id/to_id · blocks: blocker_id/blocked_id · etc.).
--   4) Adapter les UUID admin si besoin.
-- ════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- 0) DIAGNOSTIC (lire AVANT — ne modifie rien)
-- ───────────────────────────────────────────────────────────────
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public';
-- SELECT tablename, policyname, cmd, qual, with_check
--   FROM pg_policies WHERE schemaname='public' ORDER BY tablename, cmd;
-- SELECT conname FROM pg_constraint WHERE conrelid='clutches'::regclass;

-- ───────────────────────────────────────────────────────────────
-- 1) ACTIVER RLS PARTOUT (sans policy = tout refusé = sûr par défaut)
-- ───────────────────────────────────────────────────────────────
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE clutches       ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE rdv_feedbacks  ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE feedback       ENABLE ROW LEVEL SECURITY;   -- décommenter si la table existe
-- ALTER TABLE user_feedbacks ENABLE ROW LEVEL SECURITY;   -- idem
ALTER TABLE blocks         ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE favorites      ENABLE ROW LEVEL SECURITY;   -- idem

-- ───────────────────────────────────────────────────────────────
-- 2) PROFILES — invariants 2 (score), 3 (position), 12 (premium), 15 (mineurs)
-- ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS profiles_select ON profiles;
CREATE POLICY profiles_select ON profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS profiles_insert ON profiles;
CREATE POLICY profiles_insert ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS profiles_update ON profiles;
CREATE POLICY profiles_update ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS profiles_delete ON profiles;
CREATE POLICY profiles_delete ON profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- 2b) TRIGGER anti-élévation : l'user ne peut PAS modifier score/premium/type/stripe/ban.
--     Seul le service_role (webhook Stripe, Edge Function) passe.
CREATE OR REPLACE FUNCTION protect_sensitive_profile_cols()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role' THEN
    RETURN NEW;
  END IF;
  NEW.reliability_score      := OLD.reliability_score;
  NEW.account_type           := OLD.account_type;
  NEW.is_premium             := OLD.is_premium;
  NEW.premium_until          := OLD.premium_until;
  NEW.stripe_customer_id     := OLD.stripe_customer_id;
  NEW.stripe_subscription_id := OLD.stripe_subscription_id;
  NEW.is_banned              := OLD.is_banned;
  NEW.is_bot                 := OLD.is_bot;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_protect_profile ON profiles;
CREATE TRIGGER trg_protect_profile BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_sensitive_profile_cols();

-- 2c) Mineurs : refuser tout âge < 18 (filet ; la vraie vérif = identité)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='profiles_age_18plus') THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_age_18plus CHECK (age IS NULL OR age >= 18);
  END IF;
END $$;

-- 2d) Fermer la fuite des colonnes sensibles (position exacte, stripe…) au client.
--     → REVOKE les colonnes géo/paiement, puis lire une VUE floutée côté app.
REVOKE SELECT (center_lat, center_lng) ON profiles FROM authenticated, anon;
-- (décommenter selon colonnes réelles)
-- REVOKE SELECT (stripe_customer_id, stripe_subscription_id, premium_until) ON profiles FROM authenticated, anon;

CREATE OR REPLACE VIEW public_profiles AS
SELECT id, name, gender, age, photo_url, interests, bio,
       account_type, looking_for, available_modes,
       is_available, available_from, available_until, available_radius_km,
       reliability_score,
       round(center_lat::numeric, 2) AS center_lat,   -- ~1 km : pas de point exact (anti-triangulation)
       round(center_lng::numeric, 2) AS center_lng,
       quick_clutch, intent_pinned, current_activity
FROM profiles
WHERE is_banned IS NOT TRUE AND deleted_at IS NULL;
GRANT SELECT ON public_profiles TO authenticated;

-- ───────────────────────────────────────────────────────────────
-- 3) CLUTCHES — invariants 5 (cooldown), 7 (transitions), 9 (banni), 10 (blocage)
-- ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS clutches_select ON clutches;
CREATE POLICY clutches_select ON clutches FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
DROP POLICY IF EXISTS clutches_insert ON clutches;
CREATE POLICY clutches_insert ON clutches FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
DROP POLICY IF EXISTS clutches_update ON clutches;
CREATE POLICY clutches_update ON clutches FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='no_self_clutch') THEN
    ALTER TABLE clutches ADD CONSTRAINT no_self_clutch CHECK (sender_id <> receiver_id);
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS clutch_pair_unique
  ON clutches(sender_id, receiver_id) WHERE status IN ('pending','confirmed','accepted');

-- 3c) Garde anti-spam à l'INSERT : ban + blocage (2 sens) + cooldown 48h après refus
CREATE OR REPLACE FUNCTION guard_clutch_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF EXISTS (SELECT 1 FROM profiles WHERE id = NEW.sender_id AND is_banned) THEN
    RAISE EXCEPTION 'sender banned';
  END IF;
  IF EXISTS (
    SELECT 1 FROM blocks
    WHERE (blocker_id = NEW.receiver_id AND blocked_id = NEW.sender_id)
       OR (blocker_id = NEW.sender_id   AND blocked_id = NEW.receiver_id)
  ) THEN
    RAISE EXCEPTION 'blocked';
  END IF;
  IF EXISTS (
    SELECT 1 FROM clutches
    WHERE sender_id = NEW.sender_id AND receiver_id = NEW.receiver_id
      AND status = 'declined' AND created_at > now() - interval '48 hours'
  ) THEN
    RAISE EXCEPTION 'cooldown 48h active';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_guard_clutch_insert ON clutches;
CREATE TRIGGER trg_guard_clutch_insert BEFORE INSERT ON clutches
  FOR EACH ROW EXECUTE FUNCTION guard_clutch_insert();

-- 3d) Transitions valides : un clutch terminal ne se réactive pas
CREATE OR REPLACE FUNCTION guard_clutch_transition()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IN ('expired','declined','cancelled','completed')
     AND NEW.status <> OLD.status THEN
    RAISE EXCEPTION 'clutch terminal (%), transition % interdite', OLD.status, NEW.status;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_guard_clutch_transition ON clutches;
CREATE TRIGGER trg_guard_clutch_transition BEFORE UPDATE ON clutches
  FOR EACH ROW EXECUTE FUNCTION guard_clutch_transition();

-- ───────────────────────────────────────────────────────────────
-- 4) MESSAGES — invariant 6 (pas de contact hors matching)
-- ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS messages_select ON messages;
CREATE POLICY messages_select ON messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM clutches c WHERE c.id = messages.clutch_id
                 AND auth.uid() IN (c.sender_id, c.receiver_id)));
DROP POLICY IF EXISTS messages_insert ON messages;
CREATE POLICY messages_insert ON messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND EXISTS (
    SELECT 1 FROM clutches c WHERE c.id = messages.clutch_id
      AND auth.uid() IN (c.sender_id, c.receiver_id)
      AND c.status IN ('accepted','confirmed')));
DROP POLICY IF EXISTS messages_update ON messages;
CREATE POLICY messages_update ON messages FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM clutches c WHERE c.id = messages.clutch_id
                 AND auth.uid() IN (c.sender_id, c.receiver_id)));

-- ───────────────────────────────────────────────────────────────
-- 5) RDV_FEEDBACKS — invariant 1 (privé / LPD)
--    SELECT seulement auteur + cible. DELETE seulement l'auteur (from_id)
--    → permet de vider SES propres lapins (reset test) sans toucher ceux des autres.
-- ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS rdvfb_select ON rdv_feedbacks;
CREATE POLICY rdvfb_select ON rdv_feedbacks FOR SELECT TO authenticated
  USING (auth.uid() = from_id OR auth.uid() = to_id);
DROP POLICY IF EXISTS rdvfb_insert ON rdv_feedbacks;
CREATE POLICY rdvfb_insert ON rdv_feedbacks FOR INSERT TO authenticated WITH CHECK (auth.uid() = from_id);
DROP POLICY IF EXISTS rdvfb_update ON rdv_feedbacks;
CREATE POLICY rdvfb_update ON rdv_feedbacks FOR UPDATE TO authenticated USING (auth.uid() = from_id) WITH CHECK (auth.uid() = from_id);
DROP POLICY IF EXISTS rdvfb_delete ON rdv_feedbacks;
CREATE POLICY rdvfb_delete ON rdv_feedbacks FOR DELETE TO authenticated USING (auth.uid() = from_id);

-- ───────────────────────────────────────────────────────────────
-- 6) BLOCKS — invariant 10 (+ vie privée)
-- ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS blocks_select ON blocks;
CREATE POLICY blocks_select ON blocks FOR SELECT TO authenticated USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);
DROP POLICY IF EXISTS blocks_insert ON blocks;
CREATE POLICY blocks_insert ON blocks FOR INSERT TO authenticated WITH CHECK (auth.uid() = blocker_id);
DROP POLICY IF EXISTS blocks_delete ON blocks;
CREATE POLICY blocks_delete ON blocks FOR DELETE TO authenticated USING (auth.uid() = blocker_id);

-- FIN. Après application : adapter le code client pour lire `public_profiles`
-- au lieu de `profiles.select('*')` (sinon le SELECT direct des colonnes restantes reste large).
