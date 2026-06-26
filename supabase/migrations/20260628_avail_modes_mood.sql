-- ============================================================================
-- CRÉNEAU × MODE × MOOD (décidé 28.06, GPT challengé). Modèle HYBRIDE :
--   profil = défauts (available_modes existant) · CRÉNEAU = vérité active.
-- On ajoute les modes + le mood PAR CRÉNEAU. Le matching filtre sur les modes DU CRÉNEAU (dur) ;
-- le mood est du contexte (soft : affichage/tri, jamais exclure).
--
-- ⚠️ À APPLIQUER AVEC DAVID quand on câble l'UI « Pour quoi ? ». Additif, rétro-compatible (nullable).
-- ============================================================================

alter table public.availabilities add column if not exists modes text[];   -- ['romance','amical','pro','activite','parent']
alter table public.availabilities add column if not exists mood  text;      -- 'cafe' | 'balade' | 'apero' | 'diner' | 'sport' | 'culture'

-- Profil : moods par défaut (les modes par défaut existent déjà = profiles.available_modes).
alter table public.profiles add column if not exists default_moods text[];
