-- 4Aura Community Platform: Master Schema Setup
-- COPY AND PASTE THIS ENTIRE SCRIPT INTO SUPABASE SQL EDITOR

-- ==========================================
-- 1. TABLE DEFINITIONS
-- ==========================================

-- Servers
create table if not exists servers (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  icon text,
  banner text,
  owner_id text not null,
  invite_code text unique default substr(md5(random()::text), 0, 9),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Server Roles
create table if not exists server_roles (
  id uuid default gen_random_uuid() primary key,
  server_id uuid references servers(id) on delete cascade,
  name text not null,
  color text default '#8b5cf6',
  permissions jsonb default '{"manage_hub": false, "manage_channels": false, "kick_members": false, "delete_messages": false}'::jsonb,
  "order" int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Categories
create table if not exists categories (
  id uuid default gen_random_uuid() primary key,
  server_id uuid references servers(id) on delete cascade,
  name text not null,
  "order" int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Channels
create table if not exists channels (
  id uuid default gen_random_uuid() primary key,
  server_id uuid references servers(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  name text not null,
  type text default 'text',
  "order" int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Server Members
create table if not exists server_members (
  server_id uuid references servers(id) on delete cascade,
  user_id text not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  role_ids uuid[] default '{}',
  primary key (server_id, user_id)
);

-- Profiles (User Data & Moderation)
create table if not exists profiles (
  id text primary key,
  bio text,
  custom_banner text,
  settings jsonb default '{}'::jsonb,
  is_banned boolean default false,
  is_dev boolean default false,
  api_key_override text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Messages (Realtime Powered)
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  room_id text,
  server_id uuid references servers(id) on delete cascade,
  channel_id uuid references channels(id) on delete cascade,
  user_id text not null,
  user_name text,
  user_avatar text,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- System Config (Global Controls)
create table if not exists system_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 2. SEED DATA
-- ==========================================

insert into system_config (key, value)
values 
  ('maintenance_mode', 'false'::jsonb),
  ('system_message', '"Welcome to 4Aura!"'::jsonb),
  ('api_key_override', 'null'::jsonb)
on conflict (key) do nothing;

-- ==========================================
-- 3. REALTIME SETUP
-- ==========================================

begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;

alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table system_config;
-- Optional: alter publication supabase_realtime add table servers;
-- Optional: alter publication supabase_realtime add table channels;

-- ==========================================
-- 4. RLS POLICIES (SECURITY)
-- ==========================================

-- Enable RLS on all tables
alter table servers enable row level security;
alter table server_roles enable row level security;
alter table channels enable row level security;
alter table server_members enable row level security;
alter table profiles enable row level security;
alter table messages enable row level security;
alter table system_config enable row level security;

-- Servers
drop policy if exists "Public Read Servers" on servers;
create policy "Public Read Servers" on servers for select using (true);
drop policy if exists "Public Insert Servers" on servers;
create policy "Public Insert Servers" on servers for insert with check (true);
drop policy if exists "Owners can delete servers" on servers;
create policy "Owners can delete servers" on servers for delete using (true);

-- Channels
drop policy if exists "Public Read Channels" on channels;
create policy "Public Read Channels" on channels for select using (true);
drop policy if exists "Public Insert Channels" on channels;
create policy "Public Insert Channels" on channels for insert with check (true);

-- Members
drop policy if exists "Public Read Members" on server_members;
create policy "Public Read Members" on server_members for select using (true);
drop policy if exists "Public Insert Members" on server_members;
create policy "Public Insert Members" on server_members for insert with check (true);
drop policy if exists "Users can leave servers" on server_members;
create policy "Users can leave servers" on server_members for delete using (true);

-- Profiles
drop policy if exists "Public Read Profiles" on profiles;
create policy "Public Read Profiles" on profiles for select using (true);
drop policy if exists "Public Update Profiles" on profiles;
create policy "Public Update Profiles" on profiles for update using (true);
drop policy if exists "Public Insert Profiles" on profiles;
create policy "Public Insert Profiles" on profiles for insert with check (true);

-- Messages
drop policy if exists "Public Read Messages" on messages;
create policy "Public Read Messages" on messages for select using (true);
drop policy if exists "Public Insert Messages" on messages;
create policy "Public Insert Messages" on messages for insert with check (true);

-- System Config
drop policy if exists "Public Read Config" on system_config;
create policy "Public Read Config" on system_config for select using (true);
drop policy if exists "Public Update Config" on system_config;
create policy "Public Update Config" on system_config for update using (true);
drop policy if exists "Public Insert Config" on system_config;
create policy "Public Insert Config" on system_config for insert with check (true);
