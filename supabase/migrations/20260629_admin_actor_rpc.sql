-- ============================================================================
-- TEST LAB FIDÈLE — Phase 1 : couche RPC « actor_id admin » (challenge GPT+Grok 29.06).
-- RÈGLE D'OR : aucune action de test ne touche les tables en direct. Tout passe par ces RPC gardées,
-- qui rejouent EXACTEMENT les règles de create_clutch (self/blocked/cooldown/pair_busy/inbox) + l'exclusion
-- forteresse (trigger occ_no_overlap à l'accept) — mais pour un ACTEUR (un bot), si l'appelant est admin.
-- Chaque RPC renvoie un CONTRAT : { ok, code, message } → plus jamais « rien ne se passe ».
--
-- ⚠️ OUTIL DE TEST admin-only. À retirer/verrouiller avant lancement public.
-- ⚠️ À APPLIQUER AVEC DAVID (SQL Editor).
-- ============================================================================

-- Garde admin commune (même allowlist que isAdmin / qa_test_clutch).
create or replace function public.qa_is_admin() returns boolean language sql stable as $$
  select auth.uid() = any(array[
    'bad38f3e-87df-40e0-a2d2-75c03b58d72b',
    '409e83dc-dda8-42c3-bb98-3ea900857d35',
    '9626a0ba-037f-49dd-9957-ebd37e58a864'
  ]::uuid[]);
$$;

-- ── 1) UN ACTEUR (bot) ENVOIE UN CLUTCH ─────────────────────────────────────
create or replace function public.admin_create_clutch(
  p_actor uuid, p_receiver uuid, p_venue text, p_proposed_time timestamptz,
  p_message text default 'Un café ?', p_duration_minutes int default 60,
  p_venue_lat double precision default 46.5197, p_venue_lng double precision default 6.6323
) returns jsonb language plpgsql security definer set search_path = public as $$
declare pair record; rcap int; rcount int; new_id uuid;
begin
  if not public.qa_is_admin() then return jsonb_build_object('ok',false,'code','RLS_FORBIDDEN','message','Admin uniquement'); end if;
  if p_actor = p_receiver then return jsonb_build_object('ok',false,'code','SELF','message','Un bot ne peut pas se clutcher lui-même'); end if;
  if exists (select 1 from public.blocks where (blocker_id=p_actor and blocked_id=p_receiver) or (blocker_id=p_receiver and blocked_id=p_actor)) then
    return jsonb_build_object('ok',false,'code','BLOCKED','message','Bloqué entre ces deux profils'); end if;
  select * into pair from public.clutch_pairs where actor_id=p_actor and target_id=p_receiver;
  if pair.cooldown_until is not null and pair.cooldown_until > now() then
    return jsonb_build_object('ok',false,'code','COOLDOWN_ACTIVE','message','Cooldown actif (refus récent) jusqu''à '||to_char(pair.cooldown_until,'HH24:MI')); end if;
  if exists (select 1 from public.clutches where status in ('pending','accepted','confirmed','checked_in')
             and ((sender_id=p_actor and receiver_id=p_receiver) or (sender_id=p_receiver and receiver_id=p_actor))) then
    return jsonb_build_object('ok',false,'code','PAIR_BUSY','message','Un clutch est déjà actif entre ces deux personnes'); end if;
  select coalesce(max_received_clutchs,5) into rcap from public.profiles where id=p_receiver;
  select count(*) into rcount from public.clutches where receiver_id=p_receiver and status='pending';
  if rcount >= coalesce(rcap,5) then return jsonb_build_object('ok',false,'code','INBOX_FULL','message','Boîte du destinataire pleine ('||rcount||'/'||rcap||')'); end if;
  insert into public.clutches (sender_id, receiver_id, venue, venue_lat, venue_lng, proposed_time, message, duration_minutes, is_quick_date, status)
  values (p_actor, p_receiver, p_venue, p_venue_lat, p_venue_lng, p_proposed_time, p_message, p_duration_minutes, false, 'pending')
  returning id into new_id;
  return jsonb_build_object('ok',true,'code','OK','clutch_id',new_id,'message','Clutch envoyé');
end; $$;

-- ── 2) UN ACTEUR (bot) ACCEPTE le clutch en attente venant de p_counterparty ──
-- L'exclusion forteresse (occ_no_overlap) se déclenche au trigger d'accept → on la capture en OVERLAP_OCCUPANCY.
create or replace function public.admin_accept_clutch(p_actor uuid, p_counterparty uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  if not public.qa_is_admin() then return jsonb_build_object('ok',false,'code','RLS_FORBIDDEN','message','Admin uniquement'); end if;
  select id into cid from public.clutches
    where receiver_id=p_actor and sender_id=p_counterparty and status='pending'
    order by proposed_time asc limit 1;
  if cid is null then return jsonb_build_object('ok',false,'code','NOT_FOUND','message','Aucun clutch en attente à accepter pour ce bot'); end if;
  begin
    update public.clutches set status='accepted' where id=cid;
  exception when others then
    if SQLERRM ~* 'occ_no_overlap|exclusion|overlap|23P01' then
      return jsonb_build_object('ok',false,'code','OVERLAP_OCCUPANCY','message','Refusé par la forteresse : ce RDV chevauche un Verrou déjà confirmé');
    end if;
    return jsonb_build_object('ok',false,'code','ERR','message',SQLERRM);
  end;
  return jsonb_build_object('ok',true,'code','OK','clutch_id',cid,'message','Accepté → Verrou créé');
end; $$;

-- ── 3) UN ACTEUR (bot) REFUSE le clutch en attente de p_counterparty (→ cooldown via trigger) ──
create or replace function public.admin_refuse_clutch(p_actor uuid, p_counterparty uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  if not public.qa_is_admin() then return jsonb_build_object('ok',false,'code','RLS_FORBIDDEN','message','Admin uniquement'); end if;
  select id into cid from public.clutches
    where receiver_id=p_actor and sender_id=p_counterparty and status='pending'
    order by proposed_time asc limit 1;
  if cid is null then return jsonb_build_object('ok',false,'code','NOT_FOUND','message','Aucun clutch en attente à refuser pour ce bot'); end if;
  update public.clutches set status='declined' where id=cid;
  return jsonb_build_object('ok',true,'code','REFUSED','message','Refusé (cooldown enclenché côté expéditeur)');
end; $$;

-- ── 4) METTRE UN BOT EN LIGNE avec un CRÉNEAU PRÉCIS (heure début/fin choisies) ──
create or replace function public.admin_set_availability(
  p_actor uuid, p_from timestamptz, p_until timestamptz,
  p_lat double precision, p_lng double precision, p_radius int default 10
) returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.qa_is_admin() then return jsonb_build_object('ok',false,'code','RLS_FORBIDDEN','message','Admin uniquement'); end if;
  if p_until <= p_from then return jsonb_build_object('ok',false,'code','INVALID_TIME','message','Fin de créneau avant le début'); end if;
  if p_until > now() + interval '18 hours' then return jsonb_build_object('ok',false,'code','INVALID_TIME','message','Au-delà de la fenêtre 18h'); end if;
  update public.profiles
    set is_available=true, available_from=p_from, available_until=p_until,
        center_lat=p_lat, center_lng=p_lng, available_radius_km=greatest(p_radius,1)
    where id=p_actor and is_bot=true;
  if not found then return jsonb_build_object('ok',false,'code','NOT_FOUND','message','Bot introuvable'); end if;
  return jsonb_build_object('ok',true,'code','OK','message','Bot en ligne de '||to_char(p_from,'HH24:MI')||' à '||to_char(p_until,'HH24:MI'));
end; $$;

grant execute on function public.qa_is_admin() to authenticated;
grant execute on function public.admin_create_clutch(uuid,uuid,text,timestamptz,text,int,double precision,double precision) to authenticated;
grant execute on function public.admin_accept_clutch(uuid,uuid) to authenticated;
grant execute on function public.admin_refuse_clutch(uuid,uuid) to authenticated;
grant execute on function public.admin_set_availability(uuid,timestamptz,timestamptz,double precision,double precision,int) to authenticated;
