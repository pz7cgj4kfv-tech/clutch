-- Permet à David/Mel (admin) de créer des events AU NOM d'un bot (test onglet Events + badge 🔒)
DROP POLICY IF EXISTS events_bot_admin ON events;
CREATE POLICY events_bot_admin ON events FOR ALL TO authenticated
  USING (auth.uid() IN (
      'bad38f3e-87df-40e0-a2d2-75c03b58d72b','409e83dc-dda8-42c3-bb98-3ea900857d35','9626a0ba-037f-49dd-9957-ebd37e58a864')
    AND created_by IN (SELECT id FROM profiles WHERE is_bot))
  WITH CHECK (auth.uid() IN (
      'bad38f3e-87df-40e0-a2d2-75c03b58d72b','409e83dc-dda8-42c3-bb98-3ea900857d35','9626a0ba-037f-49dd-9957-ebd37e58a864')
    AND created_by IN (SELECT id FROM profiles WHERE is_bot));
