-- Permet à David/Mel d'écrire le feedback AU NOM d'un bot (réciprocité "garder le contact" pour tester le chat post-RDV)
DROP POLICY IF EXISTS rdv_feedbacks_bot_admin ON rdv_feedbacks;
CREATE POLICY rdv_feedbacks_bot_admin ON rdv_feedbacks FOR ALL TO authenticated
  USING (auth.uid() IN ('bad38f3e-87df-40e0-a2d2-75c03b58d72b','409e83dc-dda8-42c3-bb98-3ea900857d35','9626a0ba-037f-49dd-9957-ebd37e58a864')
    AND from_id IN (SELECT id FROM profiles WHERE is_bot))
  WITH CHECK (auth.uid() IN ('bad38f3e-87df-40e0-a2d2-75c03b58d72b','409e83dc-dda8-42c3-bb98-3ea900857d35','9626a0ba-037f-49dd-9957-ebd37e58a864')
    AND from_id IN (SELECT id FROM profiles WHERE is_bot));
