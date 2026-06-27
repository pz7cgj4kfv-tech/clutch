-- ============================================================================
-- TEST LAB FIDÈLE — Phase 2 : RPC events gardées (dispo↔event + dates réelles).
-- join_event() applique la VRAIE règle côté SERVEUR : on ne rejoint un event QUE si on a un
-- créneau de dispo compatible (couvre l'heure de l'event). Fini « je rejoins un truc où je
-- ne suis même pas dispo ». Marche pour les vrais users (auth.uid()) ET les bots (actor admin).
-- admin_create_event() : un bot crée un event avec une heure RÉELLE (zéro date en dur).
--
-- ⚠️ À APPLIQUER AVEC DAVID (SQL Editor). Renvoie le contrat { ok, code, message }.
-- ============================================================================

-- ── join_event : inscription GARDÉE (dispo↔event + places + liste d'attente) ─────────────
create or replace function public.join_event(p_event_id uuid, p_actor uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare actor uuid; ev record; has_avail boolean; taken int; cap int;
begin
  -- Acteur : moi par défaut ; un autre (bot) UNIQUEMENT si je suis admin.
  actor := case when p_actor is not null and public.qa_is_admin() then p_actor else auth.uid() end;
  if actor is null then return jsonb_build_object('ok',false,'code','RLS_FORBIDDEN','message','Non connecté'); end if;

  select id, starts_at, coalesce(spots,8) as spots, coalesce(active,true) as active, created_by
    into ev from public.events where id = p_event_id;
  if ev.id is null then return jsonb_build_object('ok',false,'code','NOT_FOUND','message','Événement introuvable'); end if;
  if not ev.active then return jsonb_build_object('ok',false,'code','NOT_EVENT_VISIBLE','message','Événement non actif'); end if;

  -- L'organisateur n'a pas à s'inscrire à son propre event.
  if ev.created_by = actor then return jsonb_build_object('ok',false,'code','OWN_EVENT','message','C''est ton événement'); end if;

  -- Déjà inscrit ?
  if exists (select 1 from public.event_participants where event_id=p_event_id and user_id=actor) then
    return jsonb_build_object('ok',true,'code','ALREADY','message','Déjà inscrit'); end if;

  -- 🔑 RÈGLE DISPO↔EVENT : un créneau (availabilities) OU la fenêtre de dispo du profil doit couvrir l'heure de l'event.
  select exists(
    select 1 from public.availabilities a
      where a.user_id=actor and a.active and a.start_at <= ev.starts_at and a.end_at >= ev.starts_at
    union all
    select 1 from public.profiles p
      where p.id=actor and p.is_available and p.available_from is not null and p.available_until is not null
        and p.available_from <= ev.starts_at and p.available_until >= ev.starts_at
  ) into has_avail;
  if ev.starts_at is not null and not has_avail then
    return jsonb_build_object('ok',false,'code','NO_COMPATIBLE_AVAILABILITY','message','Tu n''es pas disponible à ce créneau — ajoute une dispo qui couvre cette heure');
  end if;

  -- Places : sous la limite → participant ; sinon → liste d'attente.
  select count(*) into taken from public.event_participants where event_id=p_event_id;
  cap := ev.spots;
  if taken < cap then
    insert into public.event_participants(event_id, user_id) values (p_event_id, actor) on conflict do nothing;
    return jsonb_build_object('ok',true,'code','JOINED','message','Inscrit ('||(taken+1)||'/'||cap||')');
  else
    insert into public.event_waitlist(event_id, user_id) values (p_event_id, actor) on conflict do nothing;
    return jsonb_build_object('ok',true,'code','WAITLISTED','message','Complet → liste d''attente');
  end if;
end; $$;

-- ── admin_create_event : un bot crée un event à une heure RÉELLE ─────────────────────────
create or replace function public.admin_create_event(
  p_actor uuid, p_title text, p_starts_at timestamptz,
  p_lat double precision default 46.5197, p_lng double precision default 6.6323, p_spots int default 8
) returns jsonb language plpgsql security definer set search_path = public as $$
declare new_id uuid; nm text;
begin
  if not public.qa_is_admin() then return jsonb_build_object('ok',false,'code','RLS_FORBIDDEN','message','Admin uniquement'); end if;
  if p_starts_at is null or p_starts_at < now() - interval '5 min' then
    return jsonb_build_object('ok',false,'code','INVALID_TIME','message','Heure d''event dans le passé'); end if;
  select name into nm from public.profiles where id=p_actor;
  insert into public.events (title, emoji, lieu, event_time, event_date, starts_at, duration_minutes, spots, taken,
                             description, tags, ev_gender, type, status, active, created_by, creator, venue_lat, venue_lng)
  values (p_title, '🎟️', 'Lausanne', to_char(p_starts_at,'HH24:MI'), to_char(p_starts_at,'TMDy DD/MM'),
          p_starts_at, 120, greatest(p_spots,2), 0, '(test lab)', array['test'], 'X', 'user', 'pending', true,
          p_actor, coalesce(nm,'Bot'), p_lat, p_lng)
  returning id into new_id;
  return jsonb_build_object('ok',true,'code','OK','event_id',new_id,'message','Event créé à '||to_char(p_starts_at,'HH24:MI'));
end; $$;

grant execute on function public.join_event(uuid,uuid) to authenticated;
grant execute on function public.admin_create_event(uuid,text,timestamptz,double precision,double precision,int) to authenticated;
