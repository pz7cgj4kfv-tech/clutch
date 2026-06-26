-- ============================================================================
-- MODÈLE D'INSCRIPTION AUX ÉVÉNEMENTS (validé GPT + David 27.06)
-- Moteur pur prouvé : lib/events-engine.ts (20/20). Ici = la projection DB.
--
-- ⚠️ PRÉPARÉ, À APPLIQUER AVEC DAVID. Additif & RÉTRO-COMPATIBLE :
--    • les inscriptions existantes prennent state='accepted' par défaut → elles GARDENT
--      leur occupation (aucun comportement existant cassé).
--    • Le changement clé : SEUL un participant 'accepted' occupe la forteresse (hard hold).
--      'requested'/'waitlisted' = SOFT hold (n'occupe PAS) → on peut être en attente sur
--      plusieurs plans sans bloquer son agenda.
-- ============================================================================

-- 1) Mode de l'événement : 'open' (auto-accept→liste d'attente) | 'curated' (demande→orga tranche).
--    Défaut 'curated' (sécurité : domicile, petits groupes). Les events partenaires : l'app posera 'open'.
alter table public.events add column if not exists mode text not null default 'curated';
do $$ begin
  alter table public.events add constraint events_mode_chk check (mode in ('open','curated'));
exception when duplicate_object then null; end $$;

-- 2) État d'une inscription. Défaut 'accepted' → les lignes existantes restent acceptées (occupent comme avant).
alter table public.event_participants add column if not exists state        text not null default 'accepted';
alter table public.event_participants add column if not exists requested_at timestamptz default now();
alter table public.event_participants add column if not exists responded_at timestamptz;
do $$ begin
  alter table public.event_participants add constraint evpart_state_chk
    check (state in ('requested','waitlisted','accepted','declined','expired','cancelled'));
exception when duplicate_object then null; end $$;

-- 3) 🔑 SOFT vs HARD HOLD : on ré-émet la projection d'occupation pour qu'elle ne se crée
--    QUE pour un participant 'accepted'. (requested/waitlisted/declined/expired/cancelled → aucune occupation.)
create or replace function public.sync_event_occupancy()
returns trigger language plpgsql security definer set search_path = public as $$
declare ev record; s timestamptz; e timestamptz; st text;
begin
  if (tg_op = 'DELETE') then
    delete from public.occupancies where source_type='event' and source_id=old.event_id and user_id=old.user_id;
    return old;
  end if;
  st := coalesce(new.state, 'accepted');
  -- idempotent : on retire toujours l'occupation existante de ce (user, event) d'abord
  delete from public.occupancies where source_type='event' and source_id=new.event_id and user_id=new.user_id;
  if st = 'accepted' then
    select starts_at, coalesce(duration_minutes,180) as dur into ev from public.events where id=new.event_id;
    if ev.starts_at is not null then
      s := ev.starts_at - interval '60 minutes';                 -- buffer prépa 1h
      e := ev.starts_at + (ev.dur || ' minutes')::interval;
      insert into public.occupancies (user_id, start_at, end_at, source_type, source_id)
        values (new.user_id, s, e, 'event', new.event_id);       -- chevauche un RDV → EXCLUDE rejette l'acceptation
    end if;
  end if;
  return new;
end; $$;

-- 4) Le trigger doit aussi réagir aux UPDATE (changement d'état requested→accepted, etc.)
drop trigger if exists trg_event_occupancy on public.event_participants;
create trigger trg_event_occupancy
  after insert or update or delete on public.event_participants
  for each row execute function public.sync_event_occupancy();
