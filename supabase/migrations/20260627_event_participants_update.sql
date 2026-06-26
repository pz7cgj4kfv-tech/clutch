-- ============================================================================
-- EVENT_PARTICIPANTS — politiques UPDATE manquantes (events = clutchs, David 27.06)
--
-- Contexte : ep_select/insert/delete existaient, mais AUCUNE politique UPDATE
-- → impossible de changer l'état d'une inscription (requested → accepted/declined).
-- Le modèle « inscription = DEMANDE → l'organisateur confirme » (events-engine.ts, validé GPT)
-- a besoin que l'ORGANISATEUR puisse mettre à jour la ligne d'un AUTRE participant.
--
-- ⚠️ À APPLIQUER AVEC DAVID (SQL Editor). Additif, rétro-compatible (aucune politique existante touchée).
-- ============================================================================

-- 1) Le participant peut mettre à jour SA propre ligne (ex : se désister → 'cancelled').
DROP POLICY IF EXISTS "evpart_update_self" ON event_participants;
CREATE POLICY "evpart_update_self" ON event_participants
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2) 🔑 L'ORGANISATEUR de l'événement peut mettre à jour les inscriptions de SON event
--    (accepter / refuser une demande). C'est le cœur du modèle « l'orga tranche ».
DROP POLICY IF EXISTS "evpart_update_organizer" ON event_participants;
CREATE POLICY "evpart_update_organizer" ON event_participants
  FOR UPDATE TO authenticated
  USING      (EXISTS (SELECT 1 FROM events e WHERE e.id = event_participants.event_id AND e.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM events e WHERE e.id = event_participants.event_id AND e.created_by = auth.uid()));

-- 3) ADMIN bot-admin : peut mettre à jour les lignes des BOTS (pour tester accept/refuse au cockpit).
DROP POLICY IF EXISTS "evpart_update_bot_admin" ON event_participants;
CREATE POLICY "evpart_update_bot_admin" ON event_participants
  FOR UPDATE TO authenticated
  USING (
    auth.uid() IN (
      'bad38f3e-87df-40e0-a2d2-75c03b58d72b',
      '409e83dc-dda8-42c3-bb98-3ea900857d35',
      '9626a0ba-037f-49dd-9957-ebd37e58a864'
    )
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = event_participants.user_id AND p.is_bot = true)
  )
  WITH CHECK (
    auth.uid() IN (
      'bad38f3e-87df-40e0-a2d2-75c03b58d72b',
      '409e83dc-dda8-42c3-bb98-3ea900857d35',
      '9626a0ba-037f-49dd-9957-ebd37e58a864'
    )
  );
