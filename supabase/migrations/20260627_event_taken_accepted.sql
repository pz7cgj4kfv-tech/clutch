-- ============================================================================
-- EVENTS — `taken` = nombre de participants ACCEPTÉS (pas les demandes en attente)
--
-- Contexte : avec le modèle « inscription = DEMANDE → l'orga confirme » (curated), une demande
-- 'requested'/'waitlisted' NE doit PAS occuper une place. L'ancien trigger comptait TOUTES les lignes
-- → une demande gonflait `taken` à tort. On recompte sur state='accepted', et on déclenche aussi sur
-- UPDATE (quand l'orga passe une demande à 'accepted', la place se prend ; refus → la place se libère).
--
-- ⚠️ À APPLIQUER AVEC DAVID (SQL Editor). Idempotent.
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_event_taken() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE events SET taken = (
    SELECT count(*) FROM event_participants
    WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)
      AND coalesce(state,'accepted') = 'accepted'
  )
  WHERE id = COALESCE(NEW.event_id, OLD.event_id);
  RETURN NULL;
END; $$;

-- Doit aussi réagir aux UPDATE (changement d'état requested→accepted/declined).
DROP TRIGGER IF EXISTS trg_event_taken ON event_participants;
CREATE TRIGGER trg_event_taken AFTER INSERT OR UPDATE OR DELETE ON event_participants
  FOR EACH ROW EXECUTE FUNCTION refresh_event_taken();

-- Resync immédiat de tous les events (corrige les compteurs déjà gonflés par d'anciennes demandes).
UPDATE events e SET taken = (
  SELECT count(*) FROM event_participants ep
  WHERE ep.event_id = e.id AND coalesce(ep.state,'accepted') = 'accepted'
);
