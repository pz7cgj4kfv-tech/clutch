-- ============================================================
-- Liste d'attente événements — CROSS-UTILISATEURS (en base, pas en local)
-- À coller dans Supabase → SQL Editor → Run.
--
-- Pourquoi : la liste d'attente était stockée en localStorage (par téléphone) → impossible
-- de notifier une AUTRE personne quand une place se libère. On la met en base.
--
-- Archi (compatible RLS, sécurisée) : on NE promeut PAS automatiquement quelqu'un (un user
-- ne peut pas inscrire un autre user — RLS event_participants WITH CHECK auth.uid()=user_id).
-- À la place : quand une place se libère, l'app notifie les gens en attente « place libérée,
-- viens la prendre » et le premier qui tape gagne (course équitable, anti-ghost).
-- ============================================================

CREATE TABLE IF NOT EXISTS event_waitlist (
  event_id  uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

ALTER TABLE event_waitlist ENABLE ROW LEVEL SECURITY;

-- Lecture : tous les authentifiés (pour afficher « X en attente » + notifier).
DROP POLICY IF EXISTS ewl_select ON event_waitlist;
CREATE POLICY ewl_select ON event_waitlist FOR SELECT TO authenticated USING (true);

-- Insert / delete : uniquement MA propre ligne d'attente.
DROP POLICY IF EXISTS ewl_insert ON event_waitlist;
CREATE POLICY ewl_insert ON event_waitlist FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS ewl_delete ON event_waitlist;
CREATE POLICY ewl_delete ON event_waitlist FOR DELETE TO authenticated USING (auth.uid() = user_id);
