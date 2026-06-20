-- ─────────────────────────────────────────────────────────────────────────────
-- 20260620_event_participants_bot_admin.sql
-- Permet aux comptes ADMIN (uids bot-admin) d'inscrire/désinscrire des BOTS
-- à un événement, pour TESTER la logique de groupe seul :
--   - remplissage (taken/spots, min_participants atteint → "démarre")
--   - créateur qui flake → inscrits bloqués
--   - inscrit qui veut clutcher / créer un autre event (règles à définir)
-- Sans ça, .insert sur event_participants pour un user_id = bot est bloqué par RLS.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- Un user peut voir les participations (lecture large — données de test, non sensibles)
DROP POLICY IF EXISTS "evpart_select" ON event_participants;
CREATE POLICY "evpart_select" ON event_participants
  FOR SELECT TO authenticated USING (true);

-- Un user s'inscrit/désinscrit lui-même
DROP POLICY IF EXISTS "evpart_insert_self" ON event_participants;
CREATE POLICY "evpart_insert_self" ON event_participants
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "evpart_delete_self" ON event_participants;
CREATE POLICY "evpart_delete_self" ON event_participants
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ADMIN bot-admin : inscrire/désinscrire des BOTS (user_id pointant un profil is_bot)
DROP POLICY IF EXISTS "evpart_insert_bot_admin" ON event_participants;
CREATE POLICY "evpart_insert_bot_admin" ON event_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IN (
      'bad38f3e-87df-40e0-a2d2-75c03b58d72b',
      '409e83dc-dda8-42c3-bb98-3ea900857d35',
      '9626a0ba-037f-49dd-9957-ebd37e58a864'
    )
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = event_participants.user_id AND p.is_bot = true)
  );

DROP POLICY IF EXISTS "evpart_delete_bot_admin" ON event_participants;
CREATE POLICY "evpart_delete_bot_admin" ON event_participants
  FOR DELETE TO authenticated
  USING (
    auth.uid() IN (
      'bad38f3e-87df-40e0-a2d2-75c03b58d72b',
      '409e83dc-dda8-42c3-bb98-3ea900857d35',
      '9626a0ba-037f-49dd-9957-ebd37e58a864'
    )
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = event_participants.user_id AND p.is_bot = true)
  );
