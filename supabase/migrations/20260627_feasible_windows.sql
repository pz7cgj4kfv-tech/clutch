-- ============================================================================
-- FAISABILITÉ — RPC `feasible_windows()` (anti-sonde, validé GPT + David 27.06)
-- Moteur pur prouvé : lib/feasibility.ts (14/14). Ici = la version SERVEUR (anti-sonde).
--
-- ⚠️ PRÉPARÉ, À APPLIQUER AVEC DAVID. Pourquoi serveur : ne JAMAIS renvoyer l'agenda de l'autre.
--   La RPC calcule (mes_dispos − mes_occupations) ∩ (ses_dispos − ses_occupations) CÔTÉ SERVEUR
--   et ne retourne QUE les fenêtres communes. Impossible de déduire « elle a un RDV à 20h ».
--   Le client affine ensuite avec MON prochain engagement + trajet (MA donnée, pas de fuite) via lib/feasibility.
-- Utilise les multirange (Postgres 14+, Supabase OK) pour l'algèbre d'intervalles.
-- ============================================================================

create or replace function public.feasible_windows(p_receiver uuid, p_horizon_hours int default 18)
returns tstzrange[] language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  hz tstzrange := tstzrange(now(), now() + (p_horizon_hours || ' hours')::interval, '[)');
  buf interval := interval '60 minutes';                 -- buffer prépa/trajet autour des occupations
  my_av tstzmultirange; my_busy tstzmultirange; my_free tstzmultirange;
  th_av tstzmultirange; th_busy tstzmultirange; th_free tstzmultirange;
  mutual tstzmultirange;
begin
  if me is null then raise exception 'not_authenticated'; end if;

  -- Mes disponibilités actives, clippées à l'horizon 18h
  select coalesce(range_agg(tstzrange(greatest(start_at, lower(hz)), least(end_at, upper(hz)), '[)'))
                  filter (where end_at > now() and start_at < upper(hz)), '{}'::tstzmultirange)
    into my_av from public.availabilities where user_id = me and active;
  -- Mes occupations (RDV/events acceptés), élargies du buffer
  select coalesce(range_agg(tstzrange(start_at - buf, end_at + buf, '[)')), '{}'::tstzmultirange)
    into my_busy from public.occupancies where user_id = me;
  my_free := my_av - my_busy;

  -- Ses disponibilités / occupations (JAMAIS renvoyées telles quelles)
  select coalesce(range_agg(tstzrange(greatest(start_at, lower(hz)), least(end_at, upper(hz)), '[)'))
                  filter (where end_at > now() and start_at < upper(hz)), '{}'::tstzmultirange)
    into th_av from public.availabilities where user_id = p_receiver and active;
  select coalesce(range_agg(tstzrange(start_at - buf, end_at + buf, '[)')), '{}'::tstzmultirange)
    into th_busy from public.occupancies where user_id = p_receiver;
  th_free := th_av - th_busy;

  -- Le SEUL résultat exposé : l'intersection (on ne peut pas isoler l'agenda de l'autre).
  mutual := my_free * th_free;
  return (select array_agg(r order by lower(r)) from unnest(mutual) r);
end; $$;
