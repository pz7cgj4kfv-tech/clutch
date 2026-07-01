-- ============================================================
-- create_test_bots(p_n) — crée N bots de test « comme de vraies personnes »
-- (âge 25-45 = notre cible, genre/prénom variés, marqueur 🤖 dans le nom, autour de Lausanne).
-- Appelé par le Test Lab (bouton « ➕ N bots »). SECURITY DEFINER + gate admin (mêmes 3 IDs que 20260620_bots.sql).
-- ⚠️ À APPLIQUER + TESTER avec David : insère dans auth.users (FK profiles.id) puis profiles.
--    Si une colonne NOT NULL sans défaut manque, l'erreur remonte dans le Test Lab (message clair) → on ajuste ensemble.
-- ============================================================
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
    '9626a0ba-037f-49dd-9957-ebd37e58a864'   -- Mel
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
    a := 25 + floor(random() * 21)::int;   -- 25..45
    nm := case when g = 'woman' then prenoms_f[1 + floor(random()*array_length(prenoms_f,1))::int]
               else prenoms_m[1 + floor(random()*array_length(prenoms_m,1))::int] end
          || ' 🤖';

    -- 1) auth.users minimal (satisfait la FK profiles.id si elle existe)
    begin
      insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                              email_confirmed_at, created_at, updated_at,
                              raw_app_meta_data, raw_user_meta_data)
      values (bid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
              'bot_' || replace(bid::text,'-','') || '@clutch.test', '',
              now(), now(), now(),
              '{"provider":"email","providers":["email"]}'::jsonb, '{"bot":true}'::jsonb);
    exception when others then
      -- si pas de FK / table inaccessible, on continue : le profil seul peut suffire
      null;
    end;

    -- 2) profil bot (autour de Lausanne, rayon par défaut)
    insert into public.profiles (id, name, age, gender, is_bot, center_lat, center_lng, available_radius_km, is_available)
    values (bid, nm, a, g, true,
            46.5197 + (random()-0.5)*0.04, 6.6323 + (random()-0.5)*0.06, 8, false)
    on conflict (id) do nothing;

    created := created + 1;
  end loop;

  return jsonb_build_object('ok', true, 'created', created);
end;
$$;

grant execute on function public.create_test_bots(int) to authenticated;
