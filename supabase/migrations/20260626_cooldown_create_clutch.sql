-- ============================================================================
-- POINT 2 — Le GARDIEN unique create_clutch() + cooldown de refus (anti-harcèlement)
-- Modèle validé (David ×2 → challenge GPT → tri Claude). Mémoire : project-algorithme-cooldown-refus.
--
-- ⚠️ PRÉPARÉ, PAS APPLIQUÉ. À faire AVEC David (puis on branche l'app sur la RPC, on teste).
-- Principe : refus → cooldown PALIERS (48h·7j·30j·180j), JAMAIS de blocage auto.
--            Blocage total = DÉCISION de l'utilisateur (set_block), réversible, mutuel.
--            Le frontend ne décide jamais : tout passe par create_clutch().
-- ============================================================================

-- 1) État pairwise A→B (JAMAIS exposé au frontend : aucune policy de lecture)
create table if not exists public.clutch_pairs (
  actor_id        uuid not null,   -- A (celui qui veut clutcher)
  target_id       uuid not null,   -- B
  refusals_count  int  not null default 0,
  last_refusal_at timestamptz,
  cooldown_until  timestamptz,
  hard_blocked    boolean not null default false,  -- décision volontaire (invisibilité)
  updated_at      timestamptz default now(),
  primary key (actor_id, target_id)
);
alter table public.clutch_pairs enable row level security; -- aucune policy → seul le serveur (DEFINER) y touche

-- 2) Palier de cooldown selon le nb de refus récents : 48h · 7j · 30j · 180j
create or replace function public.clutch_cooldown_interval(n int)
returns interval language sql immutable as $$
  select (case least(greatest(n,1),4) when 1 then 48 when 2 then 168 when 3 then 720 else 4320 end || ' hours')::interval;
$$;

-- 3) Sur refus (status → declined) → enregistrer le refus + (re)poser le cooldown.
--    Fenêtre glissante 90j : 3 refus le même jour ≠ 3 sur 6 mois (sinon on repart à 1).
create or replace function public.register_clutch_refusal()
returns trigger language plpgsql security definer set search_path = public as $$
declare fresh boolean; n int;
begin
  if new.status = 'declined' and (old.status is distinct from 'declined') then
    select cp.last_refusal_at > now() - interval '90 days', cp.refusals_count
      into fresh, n from public.clutch_pairs cp where cp.actor_id=new.sender_id and cp.target_id=new.receiver_id;
    n := case when fresh then coalesce(n,0) + 1 else 1 end;
    insert into public.clutch_pairs (actor_id, target_id, refusals_count, last_refusal_at, cooldown_until, updated_at)
    values (new.sender_id, new.receiver_id, n, now(), now() + clutch_cooldown_interval(n), now())
    on conflict (actor_id, target_id) do update set
      refusals_count = n, last_refusal_at = now(),
      cooldown_until = now() + clutch_cooldown_interval(n), updated_at = now();
  end if;
  return new;
end; $$;
drop trigger if exists trg_clutch_refusal on public.clutches;
create trigger trg_clutch_refusal after update on public.clutches
  for each row execute function public.register_clutch_refusal();

-- 4) LE GARDIEN : create_clutch() — self-clutch · hard-block (2 sens) · cooldown · doublon pending.
--    (L'overlap est vérifié au VERROUILLAGE — un pending n'occupe pas.) Retourne l'id du clutch.
create or replace function public.create_clutch(
  p_receiver uuid, p_venue text, p_proposed_time timestamptz, p_message text,
  p_duration_minutes int default null, p_is_quick boolean default false,
  p_venue_lat double precision default null, p_venue_lng double precision default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); pair record; new_id uuid;
begin
  if me is null then raise exception 'not_authenticated'; end if;
  if me = p_receiver then raise exception 'self_clutch'; end if;
  select * into pair from public.clutch_pairs where actor_id = me and target_id = p_receiver;
  if pair.hard_blocked then raise exception 'blocked'; end if;
  if exists (select 1 from public.clutch_pairs where actor_id=p_receiver and target_id=me and hard_blocked) then raise exception 'blocked'; end if;
  if pair.cooldown_until is not null and pair.cooldown_until > now() then raise exception 'cooldown'; end if;
  if exists (select 1 from public.clutches where status in ('pending','accepted','confirmed','checked_in')
             and ((sender_id=me and receiver_id=p_receiver) or (sender_id=p_receiver and receiver_id=me))) then
    raise exception 'pair_busy';
  end if;
  insert into public.clutches (sender_id, receiver_id, venue, venue_lat, venue_lng, proposed_time, message, duration_minutes, is_quick_date, status)
  values (me, p_receiver, p_venue, p_venue_lat, p_venue_lng, p_proposed_time, p_message, p_duration_minutes, p_is_quick, 'pending')
  returning id into new_id;
  return new_id;
end; $$;

-- 5) set_block : B masque A → invisibilité MUTUELLE, réversible (p_blocked=false pour ré-afficher).
create or replace function public.set_block(p_target uuid, p_blocked boolean)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'not_authenticated'; end if;
  insert into public.clutch_pairs (actor_id, target_id, hard_blocked, updated_at) values (me, p_target, p_blocked, now())
    on conflict (actor_id, target_id) do update set hard_blocked = p_blocked, updated_at = now();
  insert into public.clutch_pairs (actor_id, target_id, hard_blocked, updated_at) values (p_target, me, p_blocked, now())
    on conflict (actor_id, target_id) do update set hard_blocked = p_blocked, updated_at = now();
end; $$;

-- ── ROLLBACK ────────────────────────────────────────────────────────────────
-- drop trigger if exists trg_clutch_refusal on public.clutches;
-- drop function if exists public.register_clutch_refusal();
-- drop function if exists public.create_clutch(uuid,text,timestamptz,text,int,boolean,double precision,double precision);
-- drop function if exists public.set_block(uuid,boolean);
-- drop function if exists public.clutch_cooldown_interval(int);
-- drop table if exists public.clutch_pairs;
