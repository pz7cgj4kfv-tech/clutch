-- ═══════════════════════════════════════════════════════════════
-- CLUTCH — Table messages (chat post-Verrou)
-- v11.06-M
-- Exécuter dans Supabase SQL Editor : https://supabase.com/dashboard
-- ═══════════════════════════════════════════════════════════════

-- Table messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clutch_id UUID REFERENCES clutches(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ
);

-- RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_see_own_messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "users_insert_own_messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "users_update_own_messages" ON messages
  FOR UPDATE USING (auth.uid() = receiver_id); -- pour marquer comme lu

-- Index pour performance
CREATE INDEX IF NOT EXISTS messages_clutch_id_idx ON messages(clutch_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);
