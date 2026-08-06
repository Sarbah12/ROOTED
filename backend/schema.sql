-- Rooted database schema (Postgres / Supabase)
--
-- Apply with:  psql "$DATABASE_URL" -f backend/schema.sql
-- Safe to re-run: every statement is idempotent.
--
-- Note on ids: users.id is the Firebase uid (a string), not a uuid. Auth stays
-- with Firebase; Postgres only stores application data keyed by that uid.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- users
create table if not exists users (
  id                  text primary key,
  display_name        text        not null default 'Guest Reader',
  email               text,
  phone_country_code  text        not null default '',
  phone_number        text        not null default '',
  provider            text        not null default 'firebase',
  username            text        unique,
  recovery_email      text,
  photo_url           text,
  email_verified      boolean     not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Sign-in identifiers resolve to a Firebase email; keep a lookup for support
-- tooling and to spot collisions early.
create index if not exists users_username_idx on users (lower(username));
create index if not exists users_email_idx    on users (lower(email));

-- ------------------------------------------------------------- settings
create table if not exists user_settings (
  user_id                      text primary key references users(id) on delete cascade,
  dark_mode                    boolean     not null default false,
  reminders_enabled            boolean     not null default true,
  verse_notifications_enabled  boolean     not null default true,
  streak_badge_enabled         boolean     not null default false,
  reminder_time                text        not null default '7:00 AM',
  font_size                    text        not null default 'Default',
  updated_at                   timestamptz not null default now()
);

-- ---------------------------------------------------------------- notes
create table if not exists notes (
  id          uuid        primary key default gen_random_uuid(),
  user_id     text        not null references users(id) on delete cascade,
  title       text        not null,
  reference   text        not null default '',
  content     text        not null default '',
  tags        text[]      not null default '{}',
  color       text        not null default '#2E6A5C',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Every list query is "this user's rows, newest first".
create index if not exists notes_user_updated_idx
  on notes (user_id, updated_at desc);

-- -------------------------------------------------------------- prayers
create table if not exists prayers (
  id          uuid        primary key default gen_random_uuid(),
  user_id     text        not null references users(id) on delete cascade,
  title       text        not null,
  category    text        not null default 'Personal',
  content     text        not null default '',
  status      text        not null default 'unanswered'
                          check (status in ('unanswered', 'ongoing', 'answered')),
  verse       text        not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists prayers_user_updated_idx
  on prayers (user_id, updated_at desc);

-- Filtering by status is the other common read (Ongoing / Answered tabs).
create index if not exists prayers_user_status_idx
  on prayers (user_id, status);

-- --------------------------------------------------- reading plan progress
-- Plan definitions live in the app (constants/bible-study.ts); only a user's
-- position in a plan needs storing.
create table if not exists reading_progress (
  user_id     text        not null references users(id) on delete cascade,
  plan_id     text        not null,
  progress    real        not null default 0 check (progress between 0 and 1),
  updated_at  timestamptz not null default now(),
  primary key (user_id, plan_id)
);

-- ------------------------------------------------------------ quiz results
create table if not exists quiz_results (
  user_id       text        not null references users(id) on delete cascade,
  subject_key   text        not null,   -- 'book:jhn' or 'topic:faith'
  best_score    integer     not null default 0,
  best_total    integer     not null default 0,
  attempts      integer     not null default 0,
  last_score    integer     not null default 0,
  last_taken_at timestamptz not null default now(),
  primary key (user_id, subject_key)
);

-- ------------------------------------------------------- updated_at bumps
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
  foreach t in array array['users', 'user_settings', 'notes', 'prayers', 'reading_progress']
  loop
    execute format('drop trigger if exists %I_set_updated_at on %I', t, t);
    execute format(
      'create trigger %I_set_updated_at before update on %I
       for each row execute function set_updated_at()', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------- security
-- The Node backend connects as the postgres role and enforces access itself by
-- filtering on the Firebase uid, so RLS is not what gates these tables. It is
-- enabled anyway with no permissive policies, so that anything reaching this
-- database through Supabase's anon/authenticated API keys reads nothing.
alter table users            enable row level security;
alter table user_settings    enable row level security;
alter table notes            enable row level security;
alter table prayers          enable row level security;
alter table reading_progress enable row level security;
alter table quiz_results     enable row level security;
