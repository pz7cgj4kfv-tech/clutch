-- ============================================================================
-- CLUTCH TEST LAB — reset_total_qa() : LE reset à 1 bouton du panneau de test.
-- Remet à zéro (a) TOUTES mes interactions avec n'importe qui (bots ET vraies
-- personnes comme Mel → débloque les cooldowns qui coinçaient) ET (b) tout le
-- MONDE DES BOTS (leurs clutchs, events, inscriptions, dispos, occupations).
-- Renvoie le COMPTE des lignes effacées (pour le journal « X lignes effacées »).
--
-- SECURITY DEFINER → contourne RLS (efface aussi les lignes des autres me concernant).
-- Admin-only (même allowlist que isAdmin / qa_test_clutch).
-- ⚠️ OUTIL DE TEST. À retirer / verrouiller avant lancement public.
-- ⚠️ À APPLIQUER AVEC DAVID (SQL Editor).
-- ============================================================================

create or replace function public.reset_total_qa()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  admin_ids uuid[] := array[
    'bad38f3e-87df-40e0-a2d2-75c03b58d72b',
    '409e83dc-dda8-42c3-bb98-3ea900857d35',
    '9626a0ba-037f-49dd-9957-ebd37e58a864'
  ]::uuid[];
  n_events int := 0; n_part int := 0; n_wait int := 0; n_fb int := 0;
  n_clutch int := 0; n_occ int := 0; n_pair int := 0; n_avail int := 0; n_botprof int := 0;
begin
  if me is null or not (me = any(admin_ids)) then
    return jsonb_build_object('error','forbidden');
  end if;

  -- Prédicat « bot ou moi » réutilisé partout : sous-requête (select id from bots) ∪ {me}.
  -- Ordre FK-safe : enfants d'abord, parents ensuite.

  -- 1) Events créés par des bots → DELETE cascade leurs participants + waitlist.
  with d as (delete from public.events
             where created_by in (select id from public.profiles where is_bot) returning 1)
  select count(*) into n_events from d;

  -- 2) Inscriptions (à de VRAIS events) d'un bot OU de moi.
  with d as (delete from public.event_participants
             where user_id = me or user_id in (select id from public.profiles where is_bot) returning 1)
  select count(*) into n_part from d;
  with d as (delete from public.event_waitlist
             where user_id = me or user_id in (select id from public.profiles where is_bot) returning 1)
  select count(*) into n_wait from d;

  -- 3) Feedbacks post-RDV (lapins/absents) me concernant ou concernant un bot (enlève masquage 48h).
  with d as (delete from public.rdv_feedbacks
             where from_id = me or to_id = me
                or from_id in (select id from public.profiles where is_bot)
                or to_id   in (select id from public.profiles where is_bot) returning 1)
  select count(*) into n_fb from d;

  -- 4) Clutchs (les 2 sens) me concernant ou concernant un bot (trigger nettoie les occupations liées).
  with d as (delete from public.clutches
             where sender_id = me or receiver_id = me
                or sender_id   in (select id from public.profiles where is_bot)
                or receiver_id in (select id from public.profiles where is_bot) returning 1)
  select count(*) into n_clutch from d;

  -- 5) Occupations forteresse résiduelles (moi + bots).
  with d as (delete from public.occupancies
             where user_id = me or user_id in (select id from public.profiles where is_bot) returning 1)
  select count(*) into n_occ from d;

  -- 6) 🔑 Cooldown de refus (paliers 48h/7j/30j/180j) : moi↔n'importe qui + bots. C'est CE qui coinçait avec Mel.
  with d as (delete from public.clutch_pairs
             where actor_id = me or target_id = me
                or actor_id  in (select id from public.profiles where is_bot)
                or target_id in (select id from public.profiles where is_bot) returning 1)
  select count(*) into n_pair from d;

  -- 7) Dispos multi-créneaux des bots → effacées (ils repassent hors-ligne).
  begin
    with d as (delete from public.availabilities
               where user_id in (select id from public.profiles where is_bot) returning 1)
    select count(*) into n_avail from d;
  exception when undefined_table then n_avail := 0; end;

  -- 8) Profils : bots remis hors-ligne + déverrouillés ; MOI juste déverrouillé (fenêtre RDV).
  with u as (update public.profiles
             set is_available = false, available_from = null, available_until = null,
                 rdv_locked_until = null, rdv_locked_from = null
             where is_bot returning 1)
  select count(*) into n_botprof from u;
  update public.profiles set rdv_locked_until = null, rdv_locked_from = null where id = me;

  return jsonb_build_object(
    'ok', true,
    'events', n_events, 'inscriptions', n_part, 'waitlist', n_wait, 'feedbacks', n_fb,
    'clutchs', n_clutch, 'occupations', n_occ, 'cooldowns', n_pair,
    'dispos_bots', n_avail, 'bots_reset', n_botprof,
    'total', n_events + n_part + n_wait + n_fb + n_clutch + n_occ + n_pair + n_avail + n_botprof
  );
end; $$;

grant execute on function public.reset_total_qa() to authenticated;
