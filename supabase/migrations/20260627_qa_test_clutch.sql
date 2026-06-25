-- ============================================================================
-- COCKPIT QA — qa_test_clutch() : DRY-RUN du gardien pour un expéditeur ARBITRAIRE
-- Permet au cockpit de tester « A → B » sans être connecté en A (create_clutch force auth.uid()).
-- Ne crée RIEN : rejoue les mêmes gardes que create_clutch() et renvoie la VRAIE raison.
-- = moteur du diagnostic anti-sonde (raison réelle admin vs message générique user).
--
-- ⚠️ PRÉPARÉ, À APPLIQUER AVEC DAVID. Admin-only (allowlist = mêmes IDs que isAdmin dans l'app).
-- ============================================================================

create or replace function public.qa_test_clutch(
  p_sender uuid, p_receiver uuid, p_proposed_time timestamptz default now()
) returns text language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); pair record; rcap int; rcount int;
  admin_ids uuid[] := array[
    'bad38f3e-87df-40e0-a2d2-75c03b58d72b',
    '409e83dc-dda8-42c3-bb98-3ea900857d35',
    '9626a0ba-037f-49dd-9957-ebd37e58a864'
  ]::uuid[];
begin
  -- Garde-fou : SEUL un admin peut simuler (sinon on exposerait les raisons réelles = faille anti-sonde).
  if me is null or not (me = any(admin_ids)) then return 'forbidden'; end if;
  -- Mêmes gardes que create_clutch(), DANS LE MÊME ORDRE, mais sans insert.
  if p_sender = p_receiver then return 'self_clutch'; end if;
  if exists (select 1 from public.blocks where (blocker_id=p_sender and blocked_id=p_receiver) or (blocker_id=p_receiver and blocked_id=p_sender)) then
    return 'blocked';
  end if;
  select * into pair from public.clutch_pairs where actor_id = p_sender and target_id = p_receiver;
  if pair.cooldown_until is not null and pair.cooldown_until > now() then return 'cooldown'; end if;
  if exists (select 1 from public.clutches where status in ('pending','accepted','confirmed','checked_in')
             and ((sender_id=p_sender and receiver_id=p_receiver) or (sender_id=p_receiver and receiver_id=p_sender))) then
    return 'pair_busy';
  end if;
  select coalesce(max_received_clutchs, 5) into rcap from public.profiles where id = p_receiver;
  select count(*) into rcount from public.clutches where receiver_id = p_receiver and status = 'pending';
  if rcount >= coalesce(rcap, 5) then return 'inbox_full'; end if;
  return 'ok'; -- passerait : aucun garde ne bloque
end; $$;
