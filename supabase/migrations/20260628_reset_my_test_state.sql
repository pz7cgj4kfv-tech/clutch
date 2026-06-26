-- ============================================================================
-- OUTIL DE TEST — reset_my_test_state() : remet à zéro TOUTES mes interactions (bots ET vraies personnes)
-- pour re-tester de zéro. SECURITY DEFINER → contourne RLS (efface aussi les lignes des autres me concernant,
-- ex : cooldown d'une vraie personne envers moi). David teste seul → il lui faut un reset total à 1 bouton.
--
-- ⚠️ OUTIL DE TEST. À retirer / verrouiller admin avant lancement public.
-- ⚠️ À APPLIQUER AVEC DAVID (SQL Editor).
-- ============================================================================

create or replace function public.reset_my_test_state()
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then return; end if;
  -- Clutchs (les deux sens) → supprimés (enlève masquage, cooldown lié, occupations via trigger)
  delete from public.clutches        where sender_id = me or receiver_id = me;
  -- Feedbacks (lapins/absents) → supprimés (enlève le masquage 48h des deux côtés)
  delete from public.rdv_feedbacks   where from_id   = me or to_id       = me;
  -- 🔑 Cooldown de refus (paliers 48h/7j/30j/180j) → vidé (c'est CE qui empêchait de re-clutcher)
  delete from public.clutch_pairs    where actor_id  = me or target_id   = me;
  -- Occupations forteresse résiduelles
  delete from public.occupancies     where user_id   = me;
  -- Mes inscriptions events
  delete from public.event_participants where user_id = me;
  -- Déverrouillage fenêtre RDV
  update public.profiles set rdv_locked_until = null, rdv_locked_from = null where id = me;
end; $$;

grant execute on function public.reset_my_test_state() to authenticated;
