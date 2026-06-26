-- ============================================================================
-- FORTERESSE — ACTIVATION DU BLOCAGE (EXCLUDE). David 27.06 : « tout doit marcher avec les bots,
-- comme des vraies personnes : si un valide, les autres clutchs qui chevauchent ne peuvent plus avoir lieu ».
--
-- Le trigger sync_clutch_occupancy (déjà actif) REMPLIT la table occupancies à chaque verrou — y compris
-- quand un BOT accepte. Mais sans la contrainte EXCLUDE ci-dessous, rien n'EMPÊCHE deux RDV qui se chevauchent.
-- Cette contrainte = la forteresse qui MORD : un 2e verrou qui chevauche un 1er (même user) est REJETÉ par Postgres
-- → le clutch reste 'pending' (vu « ⏸ en pause » côté app). Vaut pour bots ET vraies personnes, identiquement.
--
-- ⚠️ À APPLIQUER AVEC DAVID (SQL Editor). Conseil : faire un « 🧹 Reset bots » dans le cockpit AVANT,
--   pour repartir d'occupations propres. Le DELETE ci-dessous nettoie les chevauchements résiduels par sécurité.
-- ============================================================================

create extension if not exists btree_gist;

-- Nettoyage défensif : retire les occupations qui se chevauchent pour un même user (garde la plus ANCIENNE
-- du couple). Sinon l'ajout de la contrainte échouerait sur des données de test déjà en conflit.
delete from public.occupancies a
using public.occupancies b
where a.user_id = b.user_id
  and a.id <> b.id
  and tstzrange(a.start_at, a.end_at, '[)') && tstzrange(b.start_at, b.end_at, '[)')
  and (a.created_at, a.id) > (b.created_at, b.id);   -- vire la plus récente du couple en conflit

-- La contrainte d'exclusion : pour un même user, deux intervalles ne peuvent PAS se chevaucher.
-- Demi-ouvert '[)' → deux RDV bout-à-bout (fin = début) restent autorisés.
alter table public.occupancies drop constraint if exists occ_no_overlap;
alter table public.occupancies
  add constraint occ_no_overlap
  exclude using gist (
    user_id with =,
    tstzrange(start_at, end_at, '[)') with &&
  );
