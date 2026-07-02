-- ============================================================================
-- DOM (Dominique) = admin Test Lab (02.07). UID auth = bfb0eabf-8982-4e36-a65e-81b51ec4eef6
-- ① ajoute son UID à la garde admin qa_is_admin() (allowlist). ② même chose pour create_test_bots.
-- ③ complète sa fiche profil (prénom + genre) — le trigger l'a déjà créée avec le préfixe email.
-- ⚠️ À APPLIQUER dans le SQL Editor.
-- ============================================================================

-- ① Garde admin commune (RPC gardées / Test Lab)
create or replace function public.qa_is_admin() returns boolean language sql stable as $$
  select auth.uid() = any(array[
    'bad38f3e-87df-40e0-a2d2-75c03b58d72b',
    '409e83dc-dda8-42c3-bb98-3ea900857d35',
    '9626a0ba-037f-49dd-9957-ebd37e58a864',
    'bfb0eabf-8982-4e36-a65e-81b51ec4eef6'   -- Dom (Dominique)
  ]::uuid[]);
$$;

-- ② Allowlist de create_test_bots (liste séparée en dur dans la fonction)
create or replace function public.create_test_bots(p_n int default 8)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller uuid := auth.uid();
  admins uuid[] := array[
    'bad38f3e-87df-40e0-a2d2-75c03b58d72b',  -- David (gmail)
    '409e83dc-dda8-42c3-bb98-3ea900857d35',  -- David (Tafit)
    '9626a0ba-037f-49dd-9957-ebd37e58a864',  -- Mel
    'bfb0eabf-8982-4e36-a65e-81b51ec4eef6'   -- Dom
  ]::uuid[];
  prenoms_f text[] := array['Chloé','Léa','Manon','Sarah','Emma','Julie','Camille','Inès','Laura','Nina','Alice','Zoé'];
  prenoms_m text[] := array['Lucas','Hugo','Théo','Noah','Maxime','Adrien','Nathan','Yanis','Marco','Ethan','Robin','Ivan'];
  n int := greatest(1, least(coalesce(p_n,8), 60));
  i int;
  bid uuid;
  g text;
  nm text;
  a int;
  created int := 0;
begin
  if caller is null or not (caller = any(admins)) then
    return jsonb_build_object('ok', false, 'message', 'réservé admin');
  end if;

  for i in 1..n loop
    bid := gen_random_uuid();
    g := case when random() < 0.5 then 'woman' else 'man' end;
    a := 25 + floor(random() * 21)::int;
    nm := case when g = 'woman' then prenoms_f[1 + floor(random()*array_length(prenoms_f,1))::int]
               else prenoms_m[1 + floor(random()*array_length(prenoms_m,1))::int] end
          || ' 🤖';
    begin
      insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                              email_confirmed_at, created_at, updated_at,
                              raw_app_meta_data, raw_user_meta_data)
      values (bid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
              'bot_' || replace(bid::text,'-','') || '@clutch.test', '',
              now(), now(), now(),
              '{"provider":"email","providers":["email"]}'::jsonb, '{"bot":true}'::jsonb);
    exception when others then null;
    end;
    insert into public.profiles (id, name, age, gender, is_bot, center_lat, center_lng, available_radius_km, is_available)
    values (bid, nm, a, g, true,
            46.5197 + (random()-0.5)*0.04, 6.6323 + (random()-0.5)*0.06, 8, false)
    on conflict (id) do nothing;
    created := created + 1;
  end loop;

  return jsonb_build_object('ok', true, 'created', created);
end;
$$;

-- ③ Fiche profil de Dom (prénom + genre). Le trigger a déjà créé la ligne → on la complète.
insert into public.profiles (id, name, gender)
values ('bfb0eabf-8982-4e36-a65e-81b51ec4eef6', 'Dominique', 'man')
on conflict (id) do update set name = 'Dominique', gender = 'man';
