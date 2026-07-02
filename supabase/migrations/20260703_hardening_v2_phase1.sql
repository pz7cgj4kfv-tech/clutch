-- ============================================================================
-- HARDENING V2 — PHASE 1 (03.07.2026) — SANS RISQUE pour l'app (n'enlève rien,
-- ajoute les protections). Construit SUR MESURE d'après le diagnostic du 03.07 :
--   · RLS actif partout ✅ MAIS vue floutée absente ❌ et center_lat lisible ❌.
-- Phase 1 = créer la protection. Phase 2 = l'app lit la vue. Phase 3 = REVOKE final.
-- ============================================================================

-- ── 1) VUE FLOUTÉE public_profiles ──────────────────────────────────────────
-- Ma propre ligne = position exacte (l'app en a besoin pour MA zone).
-- Les autres = arrondi ~1 km (protection de la localisation, ADN ProximityRadar).
-- Liste de colonnes construite DYNAMIQUEMENT depuis le vrai schéma (zéro risque
-- de nom de colonne faux) en excluant les sensibles.
do $$
declare cols text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position) into cols
  from information_schema.columns
  where table_schema='public' and table_name='profiles'
    and column_name not in ('center_lat','center_lng','stripe_customer_id','stripe_subscription_id');
  execute format($f$
    create or replace view public.public_profiles as
    select %s,
      case when id = auth.uid() then center_lat
           else round(center_lat::numeric, 2)::double precision end as center_lat,
      case when id = auth.uid() then center_lng
           else round(center_lng::numeric, 2)::double precision end as center_lng
    from public.profiles
    where coalesce(is_banned, false) is not true and deleted_at is null
  $f$, cols);
end $$;

revoke all on public.public_profiles from anon;
grant select on public.public_profiles to authenticated;

-- ── 2) ANTI-ÉLÉVATION (adapté) ──────────────────────────────────────────────
-- Un utilisateur ne peut pas se donner premium / changer son type / se dé-bannir /
-- se marquer "vérifié". ⚠️ reliability_score N'EST PAS bloqué (l'app le met à jour
-- légitimement au feedback — à migrer vers un RPC après le 14.07).
create or replace function public.protect_sensitive_profile_cols()
returns trigger language plpgsql security definer set search_path = public as $$
declare j_old jsonb := to_jsonb(old); j_new jsonb := to_jsonb(new); c text;
begin
  if current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role' then
    return new;
  end if;
  foreach c in array array['account_type','is_premium','premium_until',
                           'stripe_customer_id','stripe_subscription_id','is_banned','verified'] loop
    if j_old ? c and (j_new->c) is distinct from (j_old->c) then
      j_new := jsonb_set(j_new, array[c], j_old->c);   -- on remet l'ancienne valeur, silencieux
    end if;
  end loop;
  return jsonb_populate_record(new, j_new);
end $$;

drop trigger if exists trg_protect_profile_cols on public.profiles;
create trigger trg_protect_profile_cols
  before update on public.profiles
  for each row execute function public.protect_sensitive_profile_cols();

-- ── 3) CONTRAINTE 18+ (dure, en base) ───────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_constraint where conname='profiles_age_18plus') then
    alter table public.profiles add constraint profiles_age_18plus
      check (age is null or age >= 18) not valid;
  end if;
exception when others then raise notice '18plus: %', sqlerrm; end $$;
do $$ begin
  alter table public.profiles validate constraint profiles_age_18plus;
exception when others then raise notice '18plus validate (une ligne existante <18 ?): %', sqlerrm; end $$;

-- ── 4) PAS D'AUTO-CLUTCH (dure, en base) ────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_constraint where conname='no_self_clutch') then
    alter table public.clutches add constraint no_self_clutch check (sender_id <> receiver_id);
  end if;
exception when others then raise notice 'no_self_clutch: %', sqlerrm; end $$;

-- ── VÉRIF (à lire après le run) ─────────────────────────────────────────────
select 'vue public_profiles' as objet,
       (select count(*) from information_schema.views
        where table_schema='public' and table_name='public_profiles')::text as ok
union all
select 'trigger anti-élévation',
       (select count(*) from pg_trigger where tgname='trg_protect_profile_cols')::text
union all
select 'contrainte 18+',
       (select count(*) from pg_constraint where conname='profiles_age_18plus')::text
union all
select 'contrainte no_self_clutch',
       (select count(*) from pg_constraint where conname='no_self_clutch')::text;

-- PHASE 3 (NE PAS LANCER MAINTENANT — seulement après la bascule de l'app, build 250+) :
-- revoke select (center_lat, center_lng) on public.profiles from authenticated, anon;
