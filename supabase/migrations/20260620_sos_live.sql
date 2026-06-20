-- SOS temps réel : suivi de position live partagé via lien
CREATE TABLE IF NOT EXISTS sos_sessions (
  token uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text,
  lat double precision,
  lng double precision,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE sos_sessions ENABLE ROW LEVEL SECURITY;
-- Lecture publique par token (le token = secret non devinable). ⚠️ Beta : durcir avant lancement (RPC SECURITY DEFINER).
DROP POLICY IF EXISTS sos_select ON sos_sessions;
CREATE POLICY sos_select ON sos_sessions FOR SELECT TO anon, authenticated USING (true);
-- Le propriétaire gère SA session
DROP POLICY IF EXISTS sos_insert ON sos_sessions;
CREATE POLICY sos_insert ON sos_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS sos_update ON sos_sessions;
CREATE POLICY sos_update ON sos_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE sos_sessions;
