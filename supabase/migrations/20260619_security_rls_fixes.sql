-- ============================================================
-- 20260619 — Correctifs sécurité (DB-04 fuite LPD + DB-05 anti-doublon)
-- Repérés par l'audit 16.06 (/rapport, /audit). Aucune migration repo
-- ne les appliquait → préparés ici le 19.06. À exécuter dans le
-- SQL Editor Supabase (projet fnucdicfcjoxbozpfdau).
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- DB-04 🔴 — user_feedbacks lisible sans authentification (fuite nLPD)
-- Colonnes réelles : user_id, user_name, text, audio_url, created_at
-- Effets de bord gérés :
--   1) INSERT doit rester possible (app2 envoie un feedback) → policy INSERT
--   2) /hq lit TOUT en .select('*') → policy SELECT réservée aux admins
--      (David + Mel). ⚠️ Conséquence : /hq devra être CONNECTÉ en tant que
--      David ou Mel pour voir les feedbacks (le QuickResetPanel a déjà un login).
-- ─────────────────────────────────────────────────────────────
ALTER TABLE user_feedbacks ENABLE ROW LEVEL SECURITY;

-- Un utilisateur authentifié peut envoyer SON feedback
DROP POLICY IF EXISTS user_feedbacks_insert ON user_feedbacks;
CREATE POLICY user_feedbacks_insert ON user_feedbacks
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Lecture réservée aux admins (David + Mel). Plus aucune lecture publique.
DROP POLICY IF EXISTS user_feedbacks_select_admin ON user_feedbacks;
CREATE POLICY user_feedbacks_select_admin ON user_feedbacks
  FOR SELECT TO authenticated
  USING (auth.uid() IN (
    'bad38f3e-87df-40e0-a2d2-75c03b58d72b',  -- David
    '9626a0ba-037f-49dd-9957-ebd37e58a864'   -- Mel
  ));

-- ─────────────────────────────────────────────────────────────
-- DB-05 🟡 — anti-doublon + self-Clutch enforced en JS seulement
-- (contournable via appel API direct). On verrouille en base.
-- ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'no_self_clutch') THEN
    ALTER TABLE clutches ADD CONSTRAINT no_self_clutch CHECK (sender_id != receiver_id);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS clutch_pair_unique
  ON clutches(sender_id, receiver_id)
  WHERE status IN ('pending','confirmed','accepted');

-- ─────────────────────────────────────────────────────────────
-- DB-06 (NON inclus ici) — reliability_score recalculé côté JS = manipulable.
-- Fix = Edge Function qui recalcule le delta après INSERT dans rdv_feedbacks.
-- Plus gros chantier, à faire séparément.
-- ─────────────────────────────────────────────────────────────
