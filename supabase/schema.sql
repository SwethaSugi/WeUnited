-- ============================================================
-- NEXORA — Complete Supabase Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ────────────────────────────────────────
-- 0. EXTENSIONS
-- ────────────────────────────────────────
create extension if not exists "uuid-ossp";


-- ────────────────────────────────────────
-- 1. ENUM TYPES
-- ────────────────────────────────────────
do $$ begin
  create type user_role as enum ('member', 'chapter_admin', 'super_admin', 'visitor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type referral_status as enum ('pending', 'accepted', 'completed', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type attendance_status as enum ('present', 'absent', 'visitor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type meeting_status as enum ('scheduled', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;


-- ────────────────────────────────────────
-- 2. TABLES
-- ────────────────────────────────────────

-- chapters (created before profiles because profiles FK → chapters)
create table if not exists chapters (
  id                uuid primary key default uuid_generate_v4(),
  name              text not null,
  location          text,
  city              text,
  state             text,
  country           text not null default 'India',
  meeting_day       text,
  meeting_time      time,
  meeting_venue     text,
  chapter_admin_id  uuid,
  description       text,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- profiles (extends auth.users)
create table if not exists profiles (
  id                  uuid primary key references auth.users on delete cascade,
  full_name           text not null,
  email               text not null,
  phone               text,
  role                user_role not null default 'member',
  chapter_id          uuid references chapters(id) on delete set null,
  bio                 text,
  business_name       text,
  business_category   text,
  business_tagline    text,
  business_website    text,
  avatar_url          text,
  logo_url            text,
  linkedin_url        text,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- older live databases may predate this column — add it if missing
alter table chapters add column if not exists chapter_admin_id uuid;

-- add FK from chapters → profiles (chapter admin) — safe to re-run
do $$ begin
  alter table chapters
    add constraint fk_chapter_admin
    foreign key (chapter_admin_id)
    references profiles(id)
    on delete set null
    not valid;
exception when duplicate_object then null;
end $$;

-- referrals
create table if not exists referrals (
  id                      uuid primary key default uuid_generate_v4(),
  sender_id               uuid not null references profiles(id) on delete cascade,
  receiver_id             uuid not null references profiles(id) on delete cascade,
  referred_person_name    text not null,
  referred_person_contact text,
  business_category       text,
  description             text,
  estimated_value         numeric(12,2) not null default 0,
  actual_value            numeric(12,2) not null default 0,
  status                  referral_status not null default 'pending',
  notes                   text,
  chapter_id              uuid references chapters(id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  closed_at               timestamptz
);

-- meetings
create table if not exists meetings (
  id           uuid primary key default uuid_generate_v4(),
  chapter_id   uuid not null references chapters(id) on delete cascade,
  title        text not null,
  meeting_date date not null,
  start_time   time,
  end_time     time,
  venue        text,
  agenda       text,
  notes        text,
  status       meeting_status not null default 'scheduled',
  created_by   uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- visitors
create table if not exists visitors (
  id                  uuid primary key default uuid_generate_v4(),
  full_name           text not null,
  email               text,
  phone               text,
  business_name       text,
  business_category   text,
  chapter_id          uuid not null references chapters(id) on delete cascade,
  invited_by          uuid references profiles(id) on delete set null,
  visit_date          date,
  meeting_id          uuid references meetings(id) on delete set null,
  notes               text,
  converted_to_member boolean not null default false,
  created_at          timestamptz not null default now()
);

-- attendance
create table if not exists attendance (
  id          uuid primary key default uuid_generate_v4(),
  meeting_id  uuid not null references meetings(id) on delete cascade,
  user_id     uuid references profiles(id) on delete cascade,
  visitor_id  uuid references visitors(id) on delete cascade,
  status      attendance_status not null,
  marked_by   uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint attendance_user_or_visitor check (
    (user_id is not null and visitor_id is null) or
    (user_id is null and visitor_id is not null)
  )
);

-- notifications
create table if not exists notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  title      text not null,
  message    text not null,
  type       text,
  is_read    boolean not null default false,
  link       text,
  created_at timestamptz not null default now()
);


-- ────────────────────────────────────────
-- 3. INDEXES
-- ────────────────────────────────────────
create index if not exists idx_referrals_sender     on referrals(sender_id);
create index if not exists idx_referrals_receiver   on referrals(receiver_id);
create index if not exists idx_referrals_chapter    on referrals(chapter_id);
create index if not exists idx_meetings_chapter     on meetings(chapter_id);
create index if not exists idx_meetings_date        on meetings(meeting_date);
create index if not exists idx_attendance_meeting   on attendance(meeting_id);
create index if not exists idx_attendance_user      on attendance(user_id);
create index if not exists idx_notifications_user   on notifications(user_id, is_read);
create index if not exists idx_profiles_chapter     on profiles(chapter_id);
create index if not exists idx_visitors_chapter     on visitors(chapter_id);
create index if not exists idx_visitors_meeting     on visitors(meeting_id);


-- ────────────────────────────────────────
-- 4. UPDATED_AT TRIGGER FUNCTION
-- ────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function create_updated_at_trigger(tbl text)
returns void language plpgsql as $$
begin
  execute format(
    'drop trigger if exists trg_%s_updated_at on %I;
     create trigger trg_%s_updated_at
     before update on %I
     for each row execute procedure set_updated_at()',
    tbl, tbl, tbl, tbl
  );
end;
$$;

select create_updated_at_trigger('chapters');
select create_updated_at_trigger('profiles');
select create_updated_at_trigger('referrals');
select create_updated_at_trigger('meetings');


-- ────────────────────────────────────────
-- 5. AUTO-CREATE PROFILE ON SIGNUP
-- ────────────────────────────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();


-- ────────────────────────────────────────
-- 6. ROW LEVEL SECURITY
-- ────────────────────────────────────────
alter table profiles      enable row level security;
alter table chapters      enable row level security;
alter table referrals     enable row level security;
alter table meetings      enable row level security;
alter table attendance    enable row level security;
alter table visitors      enable row level security;
alter table notifications enable row level security;

-- Helper: is the current user an admin?
create or replace function is_admin()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and role in ('chapter_admin', 'super_admin')
  )
$$;

create or replace function is_super_admin()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and role = 'super_admin'
  )
$$;

-- ── profiles ──
drop policy if exists "profiles: read all" on profiles;
create policy "profiles: read all"
  on profiles for select to authenticated using (true);

drop policy if exists "profiles: insert own" on profiles;
create policy "profiles: insert own"
  on profiles for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles: update own" on profiles;
create policy "profiles: update own"
  on profiles for update to authenticated
  using (auth.uid() = id or is_admin());

-- ── chapters ──
drop policy if exists "chapters: read all" on chapters;
create policy "chapters: read all"
  on chapters for select to authenticated using (true);

drop policy if exists "chapters: admin write" on chapters;
create policy "chapters: admin write"
  on chapters for all to authenticated
  using (is_admin());

-- ── referrals ──
drop policy if exists "referrals: participant select" on referrals;
create policy "referrals: participant select"
  on referrals for select to authenticated
  using (
    sender_id = auth.uid()
    or receiver_id = auth.uid()
    or is_admin()
  );

drop policy if exists "referrals: sender insert" on referrals;
create policy "referrals: sender insert"
  on referrals for insert to authenticated
  with check (sender_id = auth.uid());

drop policy if exists "referrals: participant update" on referrals;
create policy "referrals: participant update"
  on referrals for update to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid() or is_admin());

-- ── meetings ──
drop policy if exists "meetings: chapter member select" on meetings;
create policy "meetings: chapter member select"
  on meetings for select to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and (p.chapter_id = meetings.chapter_id or p.role = 'super_admin')
    )
  );

drop policy if exists "meetings: admin write" on meetings;
create policy "meetings: admin write"
  on meetings for all to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.role in ('chapter_admin', 'super_admin')
        and (p.chapter_id = meetings.chapter_id or p.role = 'super_admin')
    )
  );

-- ── attendance ──
drop policy if exists "attendance: chapter member select" on attendance;
create policy "attendance: chapter member select"
  on attendance for select to authenticated
  using (
    exists (
      select 1 from meetings m
      join profiles p on p.id = auth.uid()
      where m.id = attendance.meeting_id
        and (p.chapter_id = m.chapter_id or p.role = 'super_admin')
    )
  );

drop policy if exists "attendance: admin write" on attendance;
create policy "attendance: admin write"
  on attendance for all to authenticated
  using (
    exists (
      select 1 from meetings m
      join profiles p on p.id = auth.uid()
      where m.id = attendance.meeting_id
        and p.role in ('chapter_admin', 'super_admin')
        and (p.chapter_id = m.chapter_id or p.role = 'super_admin')
    )
  );

drop policy if exists "attendance: self insert" on attendance;
create policy "attendance: self insert"
  on attendance for insert to authenticated
  with check (user_id = auth.uid());

-- ── visitors ──
drop policy if exists "visitors: chapter member select" on visitors;
create policy "visitors: chapter member select"
  on visitors for select to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and (p.chapter_id = visitors.chapter_id or p.role = 'super_admin')
    )
  );

drop policy if exists "visitors: chapter member insert" on visitors;
create policy "visitors: chapter member insert"
  on visitors for insert to authenticated
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and (p.chapter_id = visitors.chapter_id or p.role in ('chapter_admin', 'super_admin'))
    )
  );

drop policy if exists "visitors: admin update" on visitors;
create policy "visitors: admin update"
  on visitors for update to authenticated
  using (is_admin());

-- ── notifications ──
drop policy if exists "notifications: own select" on notifications;
create policy "notifications: own select"
  on notifications for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "notifications: own update" on notifications;
create policy "notifications: own update"
  on notifications for update to authenticated
  using (user_id = auth.uid());

drop policy if exists "notifications: insert" on notifications;
create policy "notifications: insert"
  on notifications for insert to authenticated
  with check (true);


-- ────────────────────────────────────────
-- 6b. FK ON DELETE FIX-UP (idempotent — safe to re-run)
-- ────────────────────────────────────────
-- These tables were originally created before their ON DELETE clauses were
-- added above. Because table creation above uses "create table if not
-- exists", re-running this file does NOT retroactively fix an existing
-- table's constraints — only a fresh table gets them. Run this block once
-- (or as many times as needed) to bring an already-existing database's
-- foreign keys in line with the CASCADE / SET NULL behavior declared above.
-- Without this, removing a member fails with errors like:
--   "update or delete on table "profiles" violates foreign key
--    constraint "referrals_sender_id_fkey""

-- Wrapped in DO blocks with exception handling: your live table/column names
-- may not match this file 1:1 (e.g. a table created by hand, or renamed
-- since). Each block fixes what it can and reports a NOTICE — instead of
-- aborting the whole script — for anything that doesn't match, so you can
-- see exactly what to adjust rather than the script dying on the first
-- mismatch.

do $$ begin
  alter table referrals drop constraint if exists referrals_sender_id_fkey;
  alter table referrals add constraint referrals_sender_id_fkey
    foreign key (sender_id) references profiles(id) on delete cascade;
exception when others then
  raise notice 'SKIPPED referrals.sender_id: %', sqlerrm;
end $$;

do $$ begin
  alter table referrals drop constraint if exists referrals_receiver_id_fkey;
  alter table referrals add constraint referrals_receiver_id_fkey
    foreign key (receiver_id) references profiles(id) on delete cascade;
exception when others then
  raise notice 'SKIPPED referrals.receiver_id: %', sqlerrm;
end $$;

do $$ begin
  alter table meetings drop constraint if exists meetings_created_by_fkey;
  alter table meetings add constraint meetings_created_by_fkey
    foreign key (created_by) references profiles(id) on delete set null;
exception when others then
  raise notice 'SKIPPED meetings.created_by: %', sqlerrm;
end $$;

do $$ begin
  alter table visitors drop constraint if exists visitors_invited_by_fkey;
  alter table visitors add constraint visitors_invited_by_fkey
    foreign key (invited_by) references profiles(id) on delete set null;
exception when others then
  raise notice 'SKIPPED visitors.invited_by: %', sqlerrm;
end $$;

do $$ begin
  alter table attendance drop constraint if exists attendance_user_id_fkey;
  alter table attendance add constraint attendance_user_id_fkey
    foreign key (user_id) references profiles(id) on delete cascade;
exception when others then
  raise notice 'SKIPPED attendance.user_id: %', sqlerrm;
end $$;

do $$ begin
  alter table attendance drop constraint if exists attendance_marked_by_fkey;
  alter table attendance add constraint attendance_marked_by_fkey
    foreign key (marked_by) references profiles(id) on delete set null;
exception when others then
  raise notice 'SKIPPED attendance.marked_by: %', sqlerrm;
end $$;

do $$ begin
  alter table notifications drop constraint if exists notifications_user_id_fkey;
  alter table notifications add constraint notifications_user_id_fkey
    foreign key (user_id) references profiles(id) on delete cascade;
exception when others then
  raise notice 'SKIPPED notifications.user_id: %', sqlerrm;
end $$;

do $$ begin
  alter table chapters drop constraint if exists fk_chapter_admin;
  alter table chapters add constraint fk_chapter_admin
    foreign key (chapter_admin_id) references profiles(id) on delete set null;
exception when others then
  raise notice 'SKIPPED chapters.chapter_admin_id: %', sqlerrm;
end $$;

-- After running, check the "Messages"/"Notices" panel in the SQL editor —
-- any table listed there has a real mismatch (missing column, different
-- name, etc.) that still needs a manual look via Table Editor.


-- ────────────────────────────────────────
-- 7. STORAGE BUCKETS
-- ────────────────────────────────────────
-- Run these in Supabase Dashboard → Storage (or via SQL):
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;
-- insert into storage.buckets (id, name, public) values ('logos', 'logos', true) on conflict do nothing;


-- ────────────────────────────────────────
-- 8. REALTIME
-- ────────────────────────────────────────
-- Enable in Supabase Dashboard → Database → Replication, or run:
-- alter publication supabase_realtime add table notifications;
-- alter publication supabase_realtime add table referrals;


-- ============================================================
-- SCHEMA COMPLETE ✓
-- Next: run supabase/seed.sql for sample data
-- ============================================================
