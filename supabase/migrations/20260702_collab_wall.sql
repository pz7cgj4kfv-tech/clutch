-- ============================================================
-- MUR D'ÉQUIPE COLLAB (David ↔ Dom, async) — table isolée + RLS confinée.
-- Objectif sécurité (David 02.07) : Dom/Antigravity (visiteur anonyme, clé publique) ne peuvent
-- écrire QUE sur ce mur, RIEN d'autre. Append-only (pas de modif/suppression).
-- ⚠️ À APPLIQUER en base (Supabase → SQL Editor → Run).
-- ============================================================
create table if not exists public.collab_log (
  id         uuid primary key default gen_random_uuid(),
  author     text not null,                 -- qui poste (nom libre : « Dom », « David »…)
  role       text,                          -- 'dom' | 'david' | 'claude' (optionnel, pour l'icône)
  message    text not null,                 -- le contenu
  file_url   text,                          -- lien de fichier optionnel (Drive/WeTransfer/…)
  created_at timestamptz not null default now()
);
create index if not exists collab_log_created_idx on public.collab_log (created_at desc);

alter table public.collab_log enable row level security;

-- 👁️ LECTURE : ouverte à l'équipe (anon + connecté). Le mur est un tableau d'affichage partagé.
drop policy if exists collab_select on public.collab_log;
create policy collab_select on public.collab_log
  for select to anon, authenticated using (true);

-- ✍️ ÉCRITURE : uniquement AJOUTER (INSERT), avec garde-fous de taille (anti-spam/anti-abus).
--    C'est la SEULE table où l'anonyme peut écrire → ses écritures sont CONFINÉES ici.
drop policy if exists collab_insert on public.collab_log;
create policy collab_insert on public.collab_log
  for insert to anon, authenticated
  with check (
    char_length(coalesce(author,'')) between 1 and 40
    and char_length(coalesce(message,'')) between 1 and 6000
    and char_length(coalesce(file_url,'')) <= 500
  );

-- 🚫 AUCUNE policy UPDATE / DELETE pour anon → personne ne peut MODIFIER ni EFFACER les messages.
--    (Ménage éventuel = via le dashboard Supabase en service_role uniquement.)

-- ⚠️ RAPPEL DE SÉCURITÉ : cette table est la SEULE avec un INSERT autorisé à `anon`. Toutes les autres
--    tables métier (profiles, clutches, events, availabilities, …) exigent auth.uid() = propriétaire dans
--    leur RLS → un visiteur anonyme (Dom/Antigravity via la clé publique) NE PEUT RIEN y écrire. Garanti.

grant select, insert on public.collab_log to anon, authenticated;
