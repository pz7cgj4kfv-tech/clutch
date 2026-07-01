-- ============================================================
-- delete_test_bots() — SUPPRIME les bots CRÉÉS (marqueur 🤖 dans le nom), FK-safe.
-- Garde les bots ORIGINAUX (Sophie, Lucas, Jade, Nora, Anaïs, Camille, Thomas — sans 🤖).
-- Ordre : enfants d'abord (interactions), puis profils, puis auth.users. Chaque bloc tolère table absente.
-- Appelé par le Test Lab (« 🗑️ Supprimer les bots créés »). SECURITY DEFINER + gate admin.
-- ⚠️ À APPLIQUER en base (SQL Editor). Additif, ne touche pas aux vraies personnes ni aux bots originaux.
-- ============================================================
create or replace function public.delete_test_bots()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller uuid := auth.uid();
  admins uuid[] := array[
    'bad38f3e-87df-40e0-a2d2-75c03b58d72b',
    '409e83dc-dda8-42c3-bb98-3ea900857d35',
    '9626a0ba-037f-49dd-9957-ebd37e58a864'
  ]::uuid[];
  ids uuid[];
  deleted int := 0;
begin
  if caller is null or not (caller = any(admins)) then
    return jsonb_build_object('ok', false, 'message', 'réservé admin');
  end if;

  -- Cibler UNIQUEMENT les bots créés (marqueur 🤖).
  select array_agg(id) into ids from public.profiles where is_bot = true and name like '%🤖%';
  if ids is null or array_length(ids,1) is null then
    return jsonb_build_object('ok', true, 'deleted', 0, 'message', 'aucun bot créé (🤖) à supprimer');
  end if;

  -- Enfants d'abord (chaque bloc ignore si la table n'existe pas).
  begin delete from public.clutches         where sender_id = any(ids) or receiver_id = any(ids); exception when undefined_table then null; end;
  begin delete from public.occupancies      where user_id = any(ids); exception when undefined_table then null; end;
  begin delete from public.clutch_pairs     where actor_id = any(ids) or target_id = any(ids); exception when undefined_table then null; end;
  begin delete from public.event_participants where user_id = any(ids); exception when undefined_table then null; end;
  begin delete from public.event_waitlist   where user_id = any(ids); exception when undefined_table then null; end;
  begin delete from public.events           where created_by = any(ids); exception when undefined_table then null; end;
  begin delete from public.rdv_feedbacks    where from_id = any(ids) or to_id = any(ids); exception when undefined_table then null; end;
  begin delete from public.messages         where sender_id = any(ids) or receiver_id = any(ids); exception when undefined_table then null; end;
  begin delete from public.favorites        where user_id = any(ids) or target_id = any(ids); exception when undefined_table then null; end;
  begin delete from public.blocks           where blocker_id = any(ids) or blocked_id = any(ids); exception when undefined_table then null; end;
  begin delete from public.reports          where reporter_id = any(ids) or reported_id = any(ids); exception when undefined_table then null; end;
  begin delete from public.availabilities   where user_id = any(ids); exception when undefined_table then null; end;
  begin delete from public.push_subscriptions where user_id = any(ids); exception when undefined_table then null; end;

  -- Profils bots
  with d as (delete from public.profiles where id = any(ids) returning 1) select count(*) into deleted from d;

  -- auth.users associés (best-effort ; ignore si inaccessible)
  begin delete from auth.users where id = any(ids); exception when others then null; end;

  return jsonb_build_object('ok', true, 'deleted', deleted);
end;
$$;

grant execute on function public.delete_test_bots() to authenticated;
