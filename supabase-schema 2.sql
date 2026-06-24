-- ============================================================
-- CLUTCH — Supabase Schema
-- Colle ce SQL dans l'éditeur SQL de ton projet Supabase
-- ============================================================

-- 1. TABLE PROFILES (extension de auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  age int,
  gender text check (gender in ('woman', 'man', 'nb')),
  bio text default '',
  job text default '',
  neighborhood text default 'Lausanne',
  photo_url text,
  interests text[] default '{}',
  languages text[] default '{FR}',
  reliability_score int default 100,
  badge text default 'Nouveau',
  is_available boolean default false,
  invitations_this_week int default 0,
  week_reset_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. TABLE CLUTCHES (invitations RDV)
create table if not exists public.clutches (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  venue text not null,
  venue_safety text default 'safe' check (venue_safety in ('safe', 'neutral', 'alert')),
  proposed_time timestamptz not null,
  message text not null,
  status text default 'pending' check (status in ('pending','accepted','counter','declined','timeout','cancelled','completed','noshow')),
  counter_time timestamptz,
  counter_venue text,
  expires_at timestamptz not null default (now() + interval '2 hours'),
  checked_in_sender boolean default false,
  checked_in_receiver boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. TABLE MESSAGES
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  clutch_id uuid references public.clutches(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- 4. TABLE FEEDBACK (anonyme)
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  clutch_id uuid references public.clutches(id) on delete cascade not null,
  given_by uuid references public.profiles(id) not null,
  rating text not null check (rating in ('super', 'ok', 'rabbit', 'ghost')),
  created_at timestamptz default now(),
  unique(clutch_id, given_by)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.clutches enable row level security;
alter table public.messages enable row level security;
alter table public.feedback enable row level security;

-- Profiles: visibles par tous les connectés, modifiables par soi-même
create policy "Profiles visible by all" on public.profiles for select using (auth.role() = 'authenticated');
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Clutches: visibles par sender et receiver uniquement
create policy "Clutches visible by participants" on public.clutches for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Authenticated users can create clutches" on public.clutches for insert
  with check (auth.uid() = sender_id);
create policy "Participants can update clutch" on public.clutches for update
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Messages: visibles par participants du clutch
create policy "Messages visible by clutch participants" on public.messages for select
  using (
    auth.uid() in (
      select sender_id from public.clutches where id = clutch_id
      union
      select receiver_id from public.clutches where id = clutch_id
    )
  );
create policy "Authenticated users can send messages" on public.messages for insert
  with check (auth.uid() = sender_id);

-- Feedback: anonyme — on peut voir que les stats agrégées
create policy "Users can insert own feedback" on public.feedback for insert
  with check (auth.uid() = given_by);
create policy "Users can see their own feedback" on public.feedback for select
  using (auth.uid() = given_by);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'Utilisateur'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-timeout expired clutches
create or replace function public.expire_clutches()
returns void language plpgsql security definer as $$
begin
  update public.clutches
  set status = 'timeout'
  where status = 'pending'
    and expires_at < now();
end;
$$;

-- Reset invitations weekly
create or replace function public.reset_weekly_invitations()
returns void language plpgsql security definer as $$
begin
  update public.profiles
  set invitations_this_week = 0,
      week_reset_at = now()
  where week_reset_at < now() - interval '7 days';
end;
$$;

-- Update reliability score after feedback
create or replace function public.update_reliability()
returns trigger language plpgsql security definer as $$
begin
  if new.rating = 'ghost' then
    update public.profiles
    set reliability_score = greatest(0, reliability_score - 20),
        badge = '👻 Fantôme',
        invitations_this_week = invitations_this_week + 3
    where id = (
      select case when new.given_by = c.sender_id then c.receiver_id else c.sender_id end
      from public.clutches c where c.id = new.clutch_id
    );
  elsif new.rating = 'rabbit' then
    update public.profiles
    set reliability_score = greatest(0, reliability_score - 10),
        badge = '🐰 Lapin'
    where id = (
      select case when new.given_by = c.sender_id then c.receiver_id else c.sender_id end
      from public.clutches c where c.id = new.clutch_id
    );
  elsif new.rating = 'super' then
    update public.profiles
    set reliability_score = least(100, reliability_score + 5)
    where id = (
      select case when new.given_by = c.sender_id then c.receiver_id else c.sender_id end
      from public.clutches c where c.id = new.clutch_id
    );
  end if;
  return new;
end;
$$;

create trigger on_feedback_created
  after insert on public.feedback
  for each row execute procedure public.update_reliability();

-- ============================================================
-- 5. TABLE EVENTS (événements avec modération)
-- ============================================================
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  emoji text default '📅',
  venue text not null,
  date_label text default '',
  price text default 'Gratuit',
  spots int default 6,
  description text default '',
  type text default 'user' check (type in ('clutch', 'partner', 'user')),
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  photo_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.events enable row level security;

-- Lecture : événements approuvés visibles par tous les connectés + ses propres events
create policy "Events: approved visible to authenticated" on public.events for select
  using (auth.role() = 'authenticated' and (status = 'approved' or auth.uid() = created_by));

-- Insertion : tout utilisateur connecté peut créer un événement
create policy "Events: users can create" on public.events for insert
  with check (auth.uid() = created_by);

-- Mise à jour du statut : via fonction sécurisée (admin uniquement en pratique)
-- La fonction ci-dessous bypass le RLS grâce à SECURITY DEFINER
create or replace function public.admin_update_event_status(event_id uuid, new_status text)
returns void language plpgsql security definer as $$
begin
  update public.events
  set status = new_status
  where id = event_id;
end;
$$;

-- ============================================================
-- STORAGE (photos de profil)
-- ============================================================
-- Dans Supabase Dashboard → Storage → New bucket → "avatars" → public: true
-- Puis dans Storage → Policies → ajouter:
-- SELECT: true (public)
-- INSERT: auth.uid()::text = (storage.foldername(name))[1]
