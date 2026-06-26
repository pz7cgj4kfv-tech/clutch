-- ============================================================================
-- EVENTS — limite d'âge OPTIONNELLE (idée David 27.06)
-- L'organisateur peut restreindre son event à une tranche d'âge (ex : « 25-35 », « 18+ »).
-- NULL = aucune limite (comportement actuel). Cas légitime de blocage dur (≠ lieu/faisabilité) :
-- un « 18+ » DOIT exclure les mineurs.
--
-- ⚠️ À APPLIQUER AVEC DAVID (SQL Editor). Additif, rétro-compatible (colonnes nullables).
-- ============================================================================

alter table public.events add column if not exists age_min int;
alter table public.events add column if not exists age_max int;

-- Garde-fou de cohérence (si les deux sont posés, min <= max).
do $$ begin
  alter table public.events add constraint events_age_range_chk
    check (age_min is null or age_max is null or age_min <= age_max);
exception when duplicate_object then null; end $$;
