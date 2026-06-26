-- ============================================================================
-- RAPPEL DE RDV (push « ton RDV approche », même app fermée) — David 28.06
-- Flag d'idempotence : un seul rappel ~30 min avant le RDV, pour ne pas spammer.
-- L'Edge Function `rdv-reminders` (cron */10) lit les RDV proches non encore rappelés, pousse aux 2 personnes, marque.
--
-- ⚠️ À APPLIQUER AVEC DAVID (SQL Editor). Additif.
-- ============================================================================

alter table public.clutches add column if not exists reminded boolean not null default false;

-- Index léger pour la requête du cron (RDV confirmés proches non rappelés).
create index if not exists clutches_reminder_idx on public.clutches (proposed_time) where (reminded = false);
