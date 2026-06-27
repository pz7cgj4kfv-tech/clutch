-- ============================================================================
-- LE CÔNE CÔTÉ SERVEUR — check_cone_feasibility() (Phase 3 de la forteresse).
-- Déplace le Cône (rayon↔heure / atteignabilité) du client vers la BASE, pour qu'il soit
-- appliqué par les RPC gardées (create_clutch, join_event) comme une vraie règle, pas du JS contournable.
-- Même formule que lib/cone.ts : trajet ≈ vol d'oiseau ×1.35 ÷ 30 km/h, marge 15 min, tension 0→10.
-- ⚠️ V1 grossier (distance × vitesse). Remplacé par le moteur multimodal de Dom (lib/travel-estimate) en Phase 2.
--
-- ⚠️ PRÉPARÉ — fonction PURE, n'est encore appelée par RIEN (à brancher dans create_clutch/join_event quand
--    David peut tester). À APPLIQUER quand on veut activer le Cône serveur.
-- ============================================================================

-- Distance vol d'oiseau (km) — Haversine.
create or replace function public.hav_km(a_lat double precision, a_lng double precision, b_lat double precision, b_lng double precision)
returns double precision language sql immutable as $$
  select 6371 * 2 * asin(sqrt(
    power(sin(radians(b_lat - a_lat)/2), 2) +
    cos(radians(a_lat)) * cos(radians(b_lat)) * power(sin(radians(b_lng - a_lng)/2), 2)
  ));
$$;

-- Faisabilité du Cône : depuis la zone de l'acteur (profiles.center_lat/lng) vers le lieu de RDV, à l'heure p_rdv_time.
-- Renvoie { feasible, tension(0-10), code, message }. Dégradé NON bloquant si position inconnue (privacy : on ne ment pas).
create or replace function public.check_cone_feasibility(
  p_actor uuid, p_to_lat double precision, p_to_lng double precision, p_rdv_time timestamptz
) returns jsonb language plpgsql stable set search_path = public as $$
declare flat double precision; flng double precision; km double precision; travel_min double precision; slack_min double precision; tension numeric;
begin
  select center_lat, center_lng into flat, flng from public.profiles where id = p_actor;
  if flat is null or p_to_lat is null or p_rdv_time is null then
    return jsonb_build_object('feasible', true, 'tension', 0, 'code', 'UNKNOWN', 'message', 'Position inconnue — non bloqué');
  end if;
  km := public.hav_km(flat, flng, p_to_lat, p_to_lng);
  travel_min := km * 1.35 / 30 * 60;                                   -- même que lib/cone.ts
  slack_min := extract(epoch from (p_rdv_time - now())) / 60 - travel_min - 15;   -- marge sécurité 15 min
  if slack_min < 0 then
    return jsonb_build_object('feasible', false, 'tension', 10, 'code', 'OUT_OF_CONE',
      'message', 'Hors du cône : ~' || round(travel_min) || ' min de trajet, pas le temps d''y être');
  end if;
  tension := greatest(0, least(10, round((10 * (1 - slack_min / 60))::numeric, 1)));
  return jsonb_build_object('feasible', true, 'tension', tension, 'code', 'OK', 'message', 'Atteignable');
end; $$;

grant execute on function public.hav_km(double precision,double precision,double precision,double precision) to authenticated;
grant execute on function public.check_cone_feasibility(uuid,double precision,double precision,timestamptz) to authenticated;
