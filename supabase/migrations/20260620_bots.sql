-- ============================================================
-- PROGRAMMATEUR DE BOTS — fondation
-- Permet à David/Mel (admin) de PILOTER des profils "bot" pour tester
-- tous les scénarios seul (présences, rayons, clutch, verrou, radar, J'y suis).
-- À coller dans Supabase → SQL Editor → Run.
-- ============================================================

-- 1) Flag bot sur les profils
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_bot boolean NOT NULL DEFAULT false;

-- 2) Marquer les profils démo existants comme bots (sans toucher aux vrais comptes)
UPDATE profiles SET is_bot = true
WHERE name IN ('Sophie','Jade','Lucas','Nora','Anaïs TEST')
   OR name ILIKE '%TEST%';

-- 3) Policy admin : David (gmail + Tafit) et Mel peuvent TOUT faire sur les profils bots
--    (uniquement is_bot=true → aucun risque pour les vrais utilisateurs)
DROP POLICY IF EXISTS profiles_bot_admin ON profiles;
CREATE POLICY profiles_bot_admin ON profiles FOR ALL TO authenticated
  USING (is_bot = true AND auth.uid() IN (
    'bad38f3e-87df-40e0-a2d2-75c03b58d72b',  -- David (gmail)
    '409e83dc-dda8-42c3-bb98-3ea900857d35',  -- David (Tafit, compte de test)
    '9626a0ba-037f-49dd-9957-ebd37e58a864'   -- Mel
  ))
  WITH CHECK (is_bot = true AND auth.uid() IN (
    'bad38f3e-87df-40e0-a2d2-75c03b58d72b',
    '409e83dc-dda8-42c3-bb98-3ea900857d35',
    '9626a0ba-037f-49dd-9957-ebd37e58a864'
  ));

-- 4) Policy admin sur les clutchs impliquant un bot : pour accepter/refuser AU NOM du bot
--    (tester le flow Clutch → Verrou seul)
DROP POLICY IF EXISTS clutches_bot_admin ON clutches;
CREATE POLICY clutches_bot_admin ON clutches FOR ALL TO authenticated
  USING (auth.uid() IN (
      'bad38f3e-87df-40e0-a2d2-75c03b58d72b',
      '409e83dc-dda8-42c3-bb98-3ea900857d35',
      '9626a0ba-037f-49dd-9957-ebd37e58a864')
    AND (receiver_id IN (SELECT id FROM profiles WHERE is_bot)
      OR sender_id IN (SELECT id FROM profiles WHERE is_bot)))
  WITH CHECK (auth.uid() IN (
      'bad38f3e-87df-40e0-a2d2-75c03b58d72b',
      '409e83dc-dda8-42c3-bb98-3ea900857d35',
      '9626a0ba-037f-49dd-9957-ebd37e58a864'));
