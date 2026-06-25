-- ============================================================================
-- MULTI-CRÉNEAUX de disponibilité + taxonomie d'événements (décidé 26.06)
-- Modèle validé (David + challenge GPT) : voir mémoire project-events-taxonomie-dispo.
--
-- ⚠️ ADDITIF. NE PAS appliquer sans David. La logique app (gating + UI 3 créneaux)
--    sera câblée APRÈS cette migration, en une passe propre.
-- ============================================================================

-- 1) Table des créneaux de disponibilité (≥1, max 3 actifs — plafond géré côté app)
--    Un créneau = « je suis OUVERT à des clutchs ici, à cette heure ». ≠ occupation.
create table if not exists public.availabilities (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users(id) on delete cascade,
  start_at  timestamptz not null,
  end_at    timestamptz not null,
  place     text,                          -- libellé du lieu (ex. « Lausanne »)
  lat       double precision,
  lng       double precision,
  radius_km double precision default 5,
  active    boolean not null default true,
  created_at timestamptz default now(),
  constraint avail_time_valid check (start_at < end_at)
);
create index if not exists avail_user_idx on public.availabilities (user_id);

-- 2) Créneaux NON-CHEVAUCHANTS dans le temps (1 lieu à la fois) — décision David.
--    (réutilise btree_gist déjà installé par la forteresse)
do $$ begin
  alter table public.availabilities
    add constraint avail_no_overlap
    exclude using gist (
      user_id WITH =,
      tstzrange(start_at, end_at, '[)') WITH &&
    ) where (active);
exception when duplicate_object then null; end $$;

-- 3) RLS : chacun gère SES créneaux ; lecture publique (les autres voient « dispo »
--    via la zone, jamais l'horaire exact d'autrui — anti-sonde gérée côté requêtes).
alter table public.availabilities enable row level security;
drop policy if exists avail_select on public.availabilities;
create policy avail_select on public.availabilities for select to authenticated using (true);
drop policy if exists avail_cud on public.availabilities;
create policy avail_cud on public.availabilities for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 4) Taxonomie d'événements : mode (spontané/planifié) + approbation.
--    host_type est déjà porté par events.type ∈ {clutch, partner, user}.
alter table public.events add column if not exists event_mode    text default 'spontaneous'
  check (event_mode in ('spontaneous','planned'));
alter table public.events add column if not exists approval_mode text default 'auto'
  check (approval_mode in ('auto','curated'));
-- Backfill cohérent : les events partenaires existants = planifiés.
update public.events set event_mode='planned' where type='partner' and event_mode is distinct from 'planned';

-- ── ROLLBACK ────────────────────────────────────────────────────────────────
-- drop table if exists public.availabilities;
-- alter table public.events drop column if exists event_mode;
-- alter table public.events drop column if exists approval_mode;
