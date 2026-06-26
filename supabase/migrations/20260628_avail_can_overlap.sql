-- ============================================================================
-- CRÉNEAUX DE DISPO : ILS PEUVENT SE CHEVAUCHER (PIVOT David 27.06, re-confirmé 28.06)
--
-- L'ancienne migration (20260626_availabilities) posait `avail_no_overlap` = « 1 lieu à la fois ».
-- David a PIVOTÉ : une dispo = une INTENTION (« je suis OUVERT à plusieurs plans / plusieurs endroits »).
-- Tant que rien n'est VERROUILLÉ (RDV confirmé), on peut être ouvert à Morges 16-20h ET Lausanne 16h-minuit.
-- → On RETIRE la contrainte de non-chevauchement sur les dispos.
--
-- ⚠️ La FORTERESSE reste intacte : seules les OCCUPATIONS (occ_no_overlap sur `occupancies`, = RDV confirmés)
--    restent exclusives. Un humain ≠ 2 RDV en même temps. Mais ouvert à 2 plans = OK (un seul se concrétisera).
--
-- ⚠️ À APPLIQUER AVEC DAVID (SQL Editor). Idempotent.
-- ============================================================================

alter table public.availabilities drop constraint if exists avail_no_overlap;
