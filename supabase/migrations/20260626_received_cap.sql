-- ============================================================================
-- C/D4 — PLAFOND de clutchs REÇUS simultanés (anti-saturation / protection)
-- Décidé David 26.06 (challenge Claude : 5 AU TOTAL, pas par créneau ; file auto-promue = V2).
--
-- ⚠️ PRÉPARÉ, À APPLIQUER AVEC DAVID (règle : jamais de migration prod en solo).
-- Principe : la boîte de réception d'une personne est plafonnée à N clutchs ACTIFS au total.
--            Au-delà, le gardien refuse — mais avec le MÊME signal générique que cooldown/blocage
--            (anti-sonde : l'expéditeur ne peut JAMAIS déduire qu'elle est « pleine »).
--            N est réglable PAR utilisateur (colonne profiles.max_received_clutchs ; défaut 5).
-- ============================================================================

-- 1) Réglage par utilisateur (défaut = 5, aligné sur lib/clutch-config.ts maxReceivedClutchs)
alter table public.profiles add column if not exists max_received_clutchs int not null default 5;

-- 2) Le gardien create_clutch() — ré-émis avec le plafond de réception EN PLUS des règles existantes.
--    Ordre des gardes inchangé ; on ajoute la garde « boîte du destinataire pleine » avant l'insert.
create or replace function public.create_clutch(
  p_receiver uuid, p_venue text, p_proposed_time timestamptz, p_message text,
  p_duration_minutes int default null, p_is_quick boolean default false,
  p_venue_lat double precision default null, p_venue_lng double precision default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); pair record; new_id uuid; rcap int; rcount int;
begin
  if me is null then raise exception 'not_authenticated'; end if;
  if me = p_receiver then raise exception 'self_clutch'; end if;
  -- Blocage : on respecte la table `blocks` existante (les 2 sens = invisibilité mutuelle).
  if exists (select 1 from public.blocks where (blocker_id=me and blocked_id=p_receiver) or (blocker_id=p_receiver and blocked_id=me)) then
    raise exception 'blocked';
  end if;
  -- Cooldown de refus (table pairwise)
  select * into pair from public.clutch_pairs where actor_id = me and target_id = p_receiver;
  if pair.cooldown_until is not null and pair.cooldown_until > now() then raise exception 'cooldown'; end if;
  -- Anti-doublon par paire (un seul clutch actif entre 2 personnes)
  if exists (select 1 from public.clutches where status in ('pending','accepted','confirmed','checked_in')
             and ((sender_id=me and receiver_id=p_receiver) or (sender_id=p_receiver and receiver_id=me))) then
    raise exception 'pair_busy';
  end if;
  -- PLAFOND de réception (C/D4) : la boîte du destinataire est-elle pleine ?
  -- On ne compte QUE les clutchs en attente (pending) — un Verrou/confirmé n'occupe plus la « file ».
  select coalesce(max_received_clutchs, 5) into rcap from public.profiles where id = p_receiver;
  select count(*) into rcount from public.clutches where receiver_id = p_receiver and status = 'pending';
  if rcount >= coalesce(rcap, 5) then raise exception 'inbox_full'; end if;
  insert into public.clutches (sender_id, receiver_id, venue, venue_lat, venue_lng, proposed_time, message, duration_minutes, is_quick_date, status)
  values (me, p_receiver, p_venue, p_venue_lat, p_venue_lng, p_proposed_time, p_message, p_duration_minutes, p_is_quick, 'pending')
  returning id into new_id;
  return new_id;
end; $$;
