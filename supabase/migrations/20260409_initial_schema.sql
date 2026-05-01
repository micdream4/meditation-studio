create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  subscription_status text not null default 'inactive' check (
    subscription_status in ('active', 'inactive', 'past_due', 'canceled')
  ),
  subscription_plan text check (subscription_plan in ('monthly', 'yearly')),
  subscription_end timestamptz,
  generation_credits_used integer not null default 0,
  voice_clone_credits_used integer not null default 0,
  stripe_customer_id text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  mode text not null check (mode in ('mood', 'template', 'custom')),
  prompt_input jsonb not null default '{}'::jsonb,
  script_text text,
  duration_minutes integer not null check (duration_minutes in (1, 5, 10, 15, 20)),
  voice_id text not null,
  music_track_id text not null,
  status text not null default 'queued' check (
    status in ('queued', 'script_ready', 'audio_ready', 'failed')
  ),
  audio_url text,
  error_code text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.saved_tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  generation_id uuid not null references public.generations (id) on delete cascade,
  title text not null,
  storage_path text not null,
  duration_seconds integer not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.curated_tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  full_audio_path text not null,
  preview_audio_path text not null,
  transcript_path text,
  duration_seconds integer not null,
  sort_order integer not null default 0
);

create table if not exists public.voice_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  provider_voice_id text not null,
  sample_storage_path text,
  consent_accepted_at timestamptz,
  status text not null default 'active' check (status in ('active', 'deleted', 'failed')),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists generations_user_id_created_at_idx
  on public.generations (user_id, created_at desc);

create index if not exists saved_tracks_user_id_created_at_idx
  on public.saved_tracks (user_id, created_at desc);

create unique index if not exists voice_profiles_user_id_active_idx
  on public.voice_profiles (user_id)
  where status = 'active';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (
    id,
    email,
    display_name,
    subscription_status,
    subscription_plan,
    subscription_end,
    generation_credits_used,
    voice_clone_credits_used,
    stripe_customer_id
  )
  values (
    new.id,
    coalesce(new.email, ''),
    new.raw_user_meta_data ->> 'full_name',
    'inactive',
    null,
    null,
    0,
    0,
    null
  )
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.users enable row level security;
alter table public.generations enable row level security;
alter table public.saved_tracks enable row level security;
alter table public.curated_tracks enable row level security;
alter table public.voice_profiles enable row level security;

drop policy if exists "Users can read own profile" on public.users;
create policy "Users can read own profile"
  on public.users
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
  on public.users
  for update
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.users;
create policy "Users can insert own profile"
  on public.users
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can manage own generations" on public.generations;
create policy "Users can manage own generations"
  on public.generations
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage own saved tracks" on public.saved_tracks;
create policy "Users can manage own saved tracks"
  on public.saved_tracks
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Curated tracks are viewable by everyone" on public.curated_tracks;
create policy "Curated tracks are viewable by everyone"
  on public.curated_tracks
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Service role manages curated tracks" on public.curated_tracks;
create policy "Service role manages curated tracks"
  on public.curated_tracks
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Users can manage own voice profiles" on public.voice_profiles;
create policy "Users can manage own voice profiles"
  on public.voice_profiles
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'audio-assets',
  'audio-assets',
  true,
  104857600,
  array['audio/mpeg', 'audio/mp3', 'application/pdf']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
