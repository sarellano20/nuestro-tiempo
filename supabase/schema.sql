-- Nuestro Tiempo · Supabase schema
-- Run this script once in the Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null,
  avatar_path text,
  avatar_color text not null default '#f08c72',
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  emoji text not null default '💌',
  color text not null default '#b277c9',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entry_date date not null,
  entry_time time,
  title text not null,
  note text,
  location text,
  category_id uuid references public.categories(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.entry_photos (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries(id) on delete cascade,
  storage_path text not null,
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.presence (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  calendar_date date not null,
  updated_at timestamptz not null default now()
);

create index if not exists entries_entry_date_idx on public.entries(entry_date);
create index if not exists entries_user_id_idx on public.entries(user_id);
create index if not exists entry_photos_entry_id_idx on public.entry_photos(entry_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  requested_username text;
begin
  requested_username := lower(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  insert into public.profiles (id, username, display_name)
  values (new.id, requested_username, requested_username)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into public.categories (slug, name, emoji, color, sort_order) values
  ('comida', 'Comida', '🍜', '#f08c72', 1),
  ('actividad', 'Actividad', '✨', '#e7a93d', 2),
  ('juego', 'Juego', '🎮', '#8c7cf0', 3),
  ('pelicula', 'Película', '🎬', '#d978a9', 4),
  ('anime', 'Anime', '🌸', '#e88cab', 5),
  ('deportes', 'Deportes', '🏃', '#55ad96', 6),
  ('viajes', 'Viajes', '🧳', '#5d9ddd', 7),
  ('otro', 'Otro', '💌', '#b277c9', 8)
on conflict (slug) do update set name = excluded.name, emoji = excluded.emoji, color = excluded.color, sort_order = excluded.sort_order;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.entries enable row level security;
alter table public.entry_photos enable row level security;
alter table public.presence enable row level security;

drop policy if exists "Profiles are visible to signed in users" on public.profiles;
create policy "Profiles are visible to signed in users" on public.profiles for select to authenticated using (true);
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Categories are visible to signed in users" on public.categories;
create policy "Categories are visible to signed in users" on public.categories for select to authenticated using (true);

drop policy if exists "Entries are visible to signed in users" on public.entries;
create policy "Entries are visible to signed in users" on public.entries for select to authenticated using (true);
drop policy if exists "Users can create their own entries" on public.entries;
create policy "Users can create their own entries" on public.entries for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can update their own entries" on public.entries;
create policy "Users can update their own entries" on public.entries for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete their own entries" on public.entries;
create policy "Users can delete their own entries" on public.entries for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Photos are visible to signed in users" on public.entry_photos;
create policy "Photos are visible to signed in users" on public.entry_photos for select to authenticated using (true);
drop policy if exists "Users can add photos to their entries" on public.entry_photos;
create policy "Users can add photos to their entries" on public.entry_photos for insert to authenticated with check (exists (select 1 from public.entries where entries.id = entry_photos.entry_id and entries.user_id = auth.uid()));
drop policy if exists "Users can delete photos from their entries" on public.entry_photos;
create policy "Users can delete photos from their entries" on public.entry_photos for delete to authenticated using (exists (select 1 from public.entries where entries.id = entry_photos.entry_id and entries.user_id = auth.uid()));

drop policy if exists "Presence is visible to signed in users" on public.presence;
create policy "Presence is visible to signed in users" on public.presence for select to authenticated using (true);
drop policy if exists "Users can publish their own presence" on public.presence;
create policy "Users can publish their own presence" on public.presence for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can update their own presence" on public.presence;
create policy "Users can update their own presence" on public.presence for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public) values ('memory-photos', 'memory-photos', false) on conflict (id) do nothing;
drop policy if exists "Signed in users can view memory photos" on storage.objects;
create policy "Signed in users can view memory photos" on storage.objects for select to authenticated using (bucket_id = 'memory-photos');
drop policy if exists "Users can upload their own memory photos" on storage.objects;
create policy "Users can upload their own memory photos" on storage.objects for insert to authenticated with check (bucket_id = 'memory-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users can update their own memory photos" on storage.objects;
create policy "Users can update their own memory photos" on storage.objects for update to authenticated using (bucket_id = 'memory-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users can delete their own memory photos" on storage.objects;
create policy "Users can delete their own memory photos" on storage.objects for delete to authenticated using (bucket_id = 'memory-photos' and (storage.foldername(name))[1] = auth.uid()::text);

do $$
begin
  begin alter publication supabase_realtime add table public.entries; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.entry_photos; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.presence; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.profiles; exception when duplicate_object then null; end;
end $$;
