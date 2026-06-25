-- ============================================================================
-- FORTERESSE ANTI-CONFLIT — occupations temporelles (CLUTCHS)
-- Un humain ≠ 2 endroits à la fois. Spec : docs/architecture-engagements.md
-- Validé 25.06 (David + Claude + challenge GPT). Schéma RÉEL vérifié via diag.
--
-- ⚠️ DÉPLOIEMENT EN 2 TEMPS (sûr) — coller dans Supabase → SQL Editor → Run :
--   • BLOC 1 (SHADOW)  : crée la projection + le trigger. ZÉRO blocage, pure
--                        observation. On regarde la table `occupancies` se
--                        remplir quand on verrouille des clutchs.
--   • BLOC 2 (ENFORCE) : ajoute la contrainte EXCLUDE → le chevauchement devient
--                        IMPOSSIBLE. À coller seulement après avoir validé le BLOC 1.
--
-- Statut « occupe un créneau » = accepted | confirmed | checked_in
-- Heure de début = coalesce(counter_time, proposed_time)  (contre-proposition prioritaire)
-- Durée          = coalesce(duration_minutes, 120)        (2h défaut clutch normal ;
--                  Quick Clutch pose duration_minutes=60 → 1h)
-- Events : PAS encore (ils n'ont pas de vrai horodatage) → Phase 2.
-- ============================================================================


-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░ BLOC 1 — SHADOW (sans risque) ░░░░░░░░░░░░░░░░░░░░░

-- 1) Table des occupations (projection DÉRIVÉE — jamais écrite à la main par l'app)
create table if not exists public.occupancies (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  start_at    timestamptz not null,
  end_at      timestamptz not null,
  source_type text not null,            -- 'clutch' (plus tard : 'event')
  source_id   uuid not null,
  created_at  timestamptz default now(),
  constraint occ_time_valid check (start_at < end_at)
);
create index if not exists occ_user_idx on public.occupancies (user_id);

-- 2) Confidentialité : chacun ne voit QUE ses propres occupations (anti-sonde d'agenda).
--    Aucune policy d'écriture → seul le trigger SECURITY DEFINER écrit.
alter table public.occupancies enable row level security;
drop policy if exists occ_select_own on public.occupancies;
create policy occ_select_own on public.occupancies
  for select to authenticated using (user_id = auth.uid());

-- 3) Le trigger qui maintient la projection à partir de TOUT changement de statut,
--    d'où qu'il vienne dans l'app (donc rien à réécrire côté client).
create or replace function public.sync_clutch_occupancy()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_start timestamptz;
  s timestamptz;
  e timestamptz;
begin
  if (tg_op = 'DELETE') then
    delete from public.occupancies where source_type = 'clutch' and source_id = old.id;
    return old;
  end if;

  -- reconstruit l'occupation de CE clutch (idempotent)
  delete from public.occupancies where source_type = 'clutch' and source_id = new.id;

  if new.status in ('accepted', 'confirmed', 'checked_in') then
    v_start := coalesce(new.counter_time, new.proposed_time);
    s := v_start - interval '60 minutes';                                      -- buffer prépa : bloque dès 1h avant
    e := v_start + (coalesce(new.duration_minutes, 120) || ' minutes')::interval;
    if v_start is not null and e > s then
      insert into public.occupancies (user_id, start_at, end_at, source_type, source_id)
      values (new.sender_id,   s, e, 'clutch', new.id),
             (new.receiver_id, s, e, 'clutch', new.id);
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_clutch_occupancy on public.clutches;
create trigger trg_clutch_occupancy
  after insert or update or delete on public.clutches
  for each row execute function public.sync_clutch_occupancy();

-- 4) Backfill des clutchs déjà verrouillés (re-exécutable sans doublon)
insert into public.occupancies (user_id, start_at, end_at, source_type, source_id)
select u.uid,
       coalesce(c.counter_time, c.proposed_time) - interval '60 minutes',
       coalesce(c.counter_time, c.proposed_time) + (coalesce(c.duration_minutes, 120) || ' minutes')::interval,
       'clutch', c.id
from public.clutches c
cross join lateral (values (c.sender_id), (c.receiver_id)) as u(uid)
where c.status in ('accepted', 'confirmed', 'checked_in')
  and coalesce(c.counter_time, c.proposed_time) is not null
  and not exists (
    select 1 from public.occupancies o
    where o.source_type = 'clutch' and o.source_id = c.id
  );

-- → Vérifier le shadow : select * from public.occupancies;
--   (verrouille 1-2 clutchs dans l'app, reviens ici, relance ce select : ça se remplit)


-- ░░░░░░░░░░░░░░░░░░░░░░░░░░ BLOC 2 — ENFORCE (à coller APRÈS) ░░░░░░░░░░░░░░░░░░
-- Ne coller ce bloc qu'une fois le BLOC 1 validé. À partir de là, deux RDV
-- confirmés qui se chevauchent pour le même user = REFUSÉS par Postgres.
--
-- create extension if not exists btree_gist;
--
-- alter table public.occupancies
--   add constraint occ_no_overlap
--   exclude using gist (
--     user_id with =,
--     tstzrange(start_at, end_at, '[)') with &&   -- demi-ouvert : RDV bout-à-bout OK
--   );


-- ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ROLLBACK (si besoin) ░░░░░░░░░░░░░░░░░░░░░░░░░░░
-- alter table public.occupancies drop constraint if exists occ_no_overlap;
-- drop trigger if exists trg_clutch_occupancy on public.clutches;
-- drop function if exists public.sync_clutch_occupancy();
-- drop table if exists public.occupancies;
