-- Inscriptions aux événements
CREATE TABLE IF NOT EXISTS event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- RLS
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tout le monde peut voir" ON event_registrations FOR SELECT USING (true);
CREATE POLICY "User peut s'inscrire" ON event_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User peut se désinscrire" ON event_registrations FOR DELETE USING (auth.uid() = user_id);
