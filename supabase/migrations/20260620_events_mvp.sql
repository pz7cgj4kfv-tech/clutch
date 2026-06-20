-- ============================================================
-- MVP Événements verrouillés — colonnes + RLS
-- À coller dans Supabase → SQL Editor → Run
-- ============================================================

-- 1) Colonnes pour les events créés par les users
ALTER TABLE events ADD COLUMN IF NOT EXISTS locked boolean NOT NULL DEFAULT true;
ALTER TABLE events ADD COLUMN IF NOT EXISTS min_participants int NOT NULL DEFAULT 2;
ALTER TABLE events ADD COLUMN IF NOT EXISTS min_age int;          -- NULL = pas de minimum
ALTER TABLE events ADD COLUMN IF NOT EXISTS max_age int;          -- NULL = pas de maximum
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_lat double precision;  -- pour la carte (Phase 2)
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_lng double precision;

-- 2) Table des participants (qui a rejoint quel event) — intégrité du compteur "3/6"
CREATE TABLE IF NOT EXISTS event_participants (
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

-- 3) RLS events : lecture pour tous les authentifiés, écriture = uniquement le créateur
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS events_select ON events;
CREATE POLICY events_select ON events FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS events_insert ON events;
CREATE POLICY events_insert ON events FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS events_update ON events;
CREATE POLICY events_update ON events FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS events_delete ON events;
CREATE POLICY events_delete ON events FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- 4) RLS participants : je vois les participants des events, je gère seulement MA participation
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ep_select ON event_participants;
CREATE POLICY ep_select ON event_participants FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS ep_insert ON event_participants;
CREATE POLICY ep_insert ON event_participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS ep_delete ON event_participants;
CREATE POLICY ep_delete ON event_participants FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 5) Compteur 'taken' auto-maintenu via trigger (évite la triche client)
CREATE OR REPLACE FUNCTION refresh_event_taken() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE events SET taken = (SELECT count(*) FROM event_participants WHERE event_id = COALESCE(NEW.event_id, OLD.event_id))
  WHERE id = COALESCE(NEW.event_id, OLD.event_id);
  RETURN NULL;
END; $$;
DROP TRIGGER IF EXISTS trg_event_taken ON event_participants;
CREATE TRIGGER trg_event_taken AFTER INSERT OR DELETE ON event_participants
  FOR EACH ROW EXECUTE FUNCTION refresh_event_taken();
