-- ============================================================================
-- FORTERESSE — PHASE 2 : les ÉVÉNEMENTS rejoignent l'anti-conflit
-- Un event accepté occupe un créneau, comme un Verrou. Même table `occupancies`.
-- Spec : docs/architecture-engagements.md · prérequis : 20260625_occupancies.sql appliqué.
--
-- ⚠️ ADDITIF & SÛR : les events SANS `starts_at` ne créent AUCUNE occupation
--    → aucun event existant n'est affecté. Seuls les NOUVEAUX events (dont l'app
--    écrira `starts_at`) participeront. À coller dans Supabase → SQL Editor → Run.
--
-- Occupation d'un participant = [starts_at − 1h (prépa), starts_at + durée].
-- Durée event : coalesce(duration_minutes, 180) = 3h par défaut (soirée type).
-- ============================================================================

-- 1) Colonnes horodatage réelles sur les events (l'app les remplira à la création)
alter table public.events add column if not exists starts_at        timestamptz;
alter table public.events add column if not exists duration_minutes int;

-- 2) Quand un user REJOINT / QUITTE un event → maintenir SON occupation
create or replace function public.sync_event_occupancy()
returns trigger language plpgsql security definer set search_path = public as $$
declare ev record; s timestamptz; e timestamptz;
begin
  if (tg_op = 'DELETE') then
    delete from public.occupancies
      where source_type='event' and source_id=old.event_id and user_id=old.user_id;
    return old;
  end if;
  select starts_at, coalesce(duration_minutes,180) as dur into ev from public.events where id=new.event_id;
  delete from public.occupancies
    where source_type='event' and source_id=new.event_id and user_id=new.user_id;
  if ev.starts_at is not null then
    s := ev.starts_at - interval '60 minutes';                  -- buffer prépa 1h
    e := ev.starts_at + (ev.dur || ' minutes')::interval;
    insert into public.occupancies (user_id, start_at, end_at, source_type, source_id)
      values (new.user_id, s, e, 'event', new.event_id);        -- ⚠️ si chevauche un RDV → EXCLUDE rejette l'inscription
  end if;
  return new;
end; $$;

drop trigger if exists trg_event_occupancy on public.event_participants;
create trigger trg_event_occupancy
  after insert or delete on public.event_participants
  for each row execute function public.sync_event_occupancy();

-- 3) Si l'heure/durée d'un event change → resynchroniser TOUS ses participants
create or replace function public.resync_event_participants()
returns trigger language plpgsql security definer set search_path = public as $$
declare p record; s timestamptz; e timestamptz;
begin
  delete from public.occupancies where source_type='event' and source_id=new.id;
  if new.starts_at is not null then
    s := new.starts_at - interval '60 minutes';
    e := new.starts_at + (coalesce(new.duration_minutes,180) || ' minutes')::interval;
    for p in select user_id from public.event_participants where event_id=new.id loop
      insert into public.occupancies (user_id, start_at, end_at, source_type, source_id)
        values (p.user_id, s, e, 'event', new.id);
    end loop;
  end if;
  return new;
end; $$;

drop trigger if exists trg_event_resync on public.events;
create trigger trg_event_resync
  after update of starts_at, duration_minutes on public.events
  for each row execute function public.resync_event_participants();

-- ── ROLLBACK ────────────────────────────────────────────────────────────────
-- drop trigger if exists trg_event_resync on public.events;
-- drop trigger if exists trg_event_occupancy on public.event_participants;
-- drop function if exists public.resync_event_participants();
-- drop function if exists public.sync_event_occupancy();
-- (les colonnes starts_at / duration_minutes peuvent rester, inoffensives)
