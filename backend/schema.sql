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
  -- 'study' is a personal note; 'sermon' carries the preacher fields below.
  kind        text        not null default 'study'
                          check (kind in ('study', 'sermon')),
  preacher    text        not null default '',
  church      text        not null default '',
  series      text        not null default '',
  sermon_date date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Every list query is "this user's rows, newest first".
create index if not exists notes_user_updated_idx
  on notes (user_id, updated_at desc);

-- Filtering the Notes tab by kind, and looking up a preacher's sermons.
create index if not exists notes_user_kind_idx on notes (user_id, kind);
create index if not exists notes_preacher_idx  on notes (user_id, lower(preacher))
  where preacher <> '';

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

-- =====================================================================
-- Community study plans
-- =====================================================================

-- A plan authored by a user. `visibility` decides discovery:
--   private  only the owner
--   link     anyone holding the join code
--   public   listed in the directory
create table if not exists study_plans (
  id            uuid        primary key default gen_random_uuid(),
  owner_id      text        not null references users(id) on delete cascade,
  title         text        not null,
  description   text        not null default '',
  visibility    text        not null default 'link'
                            check (visibility in ('private', 'link', 'public')),
  -- Short code for share links; unique so it can be looked up directly.
  join_code     text        unique,
  duration_days integer     not null default 0,
  member_count  integer     not null default 0,
  is_archived   boolean     not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists study_plans_owner_idx  on study_plans (owner_id);
-- Powers the public directory: newest listed plans first.
create index if not exists study_plans_public_idx on study_plans (visibility, created_at desc)
  where visibility = 'public' and is_archived = false;

-- One row per day of reading.
create table if not exists study_plan_days (
  plan_id    uuid    not null references study_plans(id) on delete cascade,
  day        integer not null check (day > 0),
  reference  text    not null,           -- e.g. 'John 3' or 'Genesis 1-3'
  title      text    not null default '',
  prompt     text    not null default '', -- optional reflection question
  primary key (plan_id, day)
);

-- Membership. current_day is a cache of "furthest consecutive day done".
create table if not exists plan_members (
  plan_id     uuid        not null references study_plans(id) on delete cascade,
  user_id     text        not null references users(id) on delete cascade,
  role        text        not null default 'member' check (role in ('owner', 'member')),
  current_day integer     not null default 0,
  joined_at   timestamptz not null default now(),
  primary key (plan_id, user_id)
);

create index if not exists plan_members_user_idx on plan_members (user_id);

-- One row per day a member finishes. completed_on is a date so streaks can be
-- computed by calendar day regardless of the time of day someone reads.
create table if not exists plan_completions (
  plan_id      uuid        not null references study_plans(id) on delete cascade,
  user_id      text        not null references users(id) on delete cascade,
  day          integer     not null,
  completed_on date        not null default current_date,
  completed_at timestamptz not null default now(),
  primary key (plan_id, user_id, day)
);

-- Streaks scan a user's completion dates across every plan.
create index if not exists plan_completions_user_date_idx
  on plan_completions (user_id, completed_on desc);

-- What someone learnt that day. Visible to the rest of the plan.
create table if not exists plan_reflections (
  id         uuid        primary key default gen_random_uuid(),
  plan_id    uuid        not null references study_plans(id) on delete cascade,
  user_id    text        not null references users(id) on delete cascade,
  day        integer     not null,
  body       text        not null,
  is_hidden  boolean     not null default false,  -- set by moderation
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The feed for a given day of a plan.
create index if not exists plan_reflections_plan_day_idx
  on plan_reflections (plan_id, day, created_at desc);

-- =====================================================================
-- Moderation
--
-- Required by App Store Review Guideline 1.2 for user-generated content:
-- a way to report objectionable content and to block abusive users.
-- =====================================================================

create table if not exists content_reports (
  id           uuid        primary key default gen_random_uuid(),
  reporter_id  text        not null references users(id) on delete cascade,
  target_type  text        not null
                           check (target_type in ('reflection', 'plan', 'user', 'post', 'comment')),
  target_id    text        not null,
  reason       text        not null,
  details      text        not null default '',
  status       text        not null default 'open'
                           check (status in ('open', 'reviewed', 'actioned', 'dismissed')),
  created_at   timestamptz not null default now()
);

create index if not exists content_reports_open_idx on content_reports (status, created_at desc);
-- One report per person per item; re-reporting updates rather than piles up.
create unique index if not exists content_reports_unique_idx
  on content_reports (reporter_id, target_type, target_id);

create table if not exists user_blocks (
  blocker_id text        not null references users(id) on delete cascade,
  blocked_id text        not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- ------------------------------------------------------- updated_at bumps
do $$
declare t text;
begin
  foreach t in array array['study_plans', 'plan_reflections']
  loop
    execute format('drop trigger if exists %I_set_updated_at on %I', t, t);
    execute format(
      'create trigger %I_set_updated_at before update on %I
       for each row execute function set_updated_at()', t, t);
  end loop;
end $$;

-- Keep study_plans.member_count in step with plan_members.
create or replace function sync_plan_member_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update study_plans set member_count = member_count + 1 where id = new.plan_id;
  elsif tg_op = 'DELETE' then
    update study_plans set member_count = greatest(member_count - 1, 0) where id = old.plan_id;
  end if;
  return null;
end;
$$ language plpgsql;

drop trigger if exists plan_members_count_sync on plan_members;
create trigger plan_members_count_sync
  after insert or delete on plan_members
  for each row execute function sync_plan_member_count();

alter table study_plans      enable row level security;
alter table study_plan_days  enable row level security;
alter table plan_members     enable row level security;
alter table plan_completions enable row level security;
alter table plan_reflections enable row level security;
alter table content_reports  enable row level security;
alter table user_blocks      enable row level security;


-- =====================================================================
-- Community blog
-- =====================================================================

-- Long-form posts written by users. Drafts are visible only to their author.
create table if not exists posts (
  id            uuid        primary key default gen_random_uuid(),
  author_id     text        not null references users(id) on delete cascade,
  title         text        not null,
  body          text        not null default '',
  -- Short summary for the feed; derived from the body when left empty.
  excerpt       text        not null default '',
  cover_image_url text,
  tags          text[]      not null default '{}',
  status        text        not null default 'draft'
                            check (status in ('draft', 'published')),
  -- Denormalised so the feed does not count rows per post on every read.
  like_count    integer     not null default 0,
  comment_count integer     not null default 0,
  is_hidden     boolean     not null default false,   -- set by moderation
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- The feed: published, not hidden, newest first.
create index if not exists posts_feed_idx on posts (published_at desc)
  where status = 'published' and is_hidden = false;

create index if not exists posts_author_idx on posts (author_id, updated_at desc);
create index if not exists posts_tags_idx   on posts using gin (tags);

create table if not exists post_likes (
  post_id    uuid        not null references posts(id) on delete cascade,
  user_id    text        not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists post_likes_user_idx on post_likes (user_id);

create table if not exists post_comments (
  id         uuid        primary key default gen_random_uuid(),
  post_id    uuid        not null references posts(id) on delete cascade,
  user_id    text        not null references users(id) on delete cascade,
  body       text        not null,
  is_hidden  boolean     not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists post_comments_post_idx
  on post_comments (post_id, created_at desc);

-- ------------------------------------------------------- updated_at bumps
do $$
declare t text;
begin
  foreach t in array array['posts', 'post_comments']
  loop
    execute format('drop trigger if exists %I_set_updated_at on %I', t, t);
    execute format(
      'create trigger %I_set_updated_at before update on %I
       for each row execute function set_updated_at()', t, t);
  end loop;
end $$;

-- Keep the denormalised counts honest.
create or replace function sync_post_like_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update posts set like_count = like_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$ language plpgsql;

drop trigger if exists post_likes_count_sync on post_likes;
create trigger post_likes_count_sync
  after insert or delete on post_likes
  for each row execute function sync_post_like_count();

create or replace function sync_post_comment_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update posts set comment_count = comment_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$ language plpgsql;

drop trigger if exists post_comments_count_sync on post_comments;
create trigger post_comments_count_sync
  after insert or delete on post_comments
  for each row execute function sync_post_comment_count();

alter table posts         enable row level security;
alter table post_likes    enable row level security;
alter table post_comments enable row level security;

-- ---------------------------------------------------------------- friends
-- Friendship is mutual and must be accepted. A one-sided "follow" would let
-- anyone attach themselves to a stranger and then nudge them, which is the
-- shape most harassment takes in small social features.
create table if not exists friendships (
  id           text        primary key,
  requester_id text        not null references users(id) on delete cascade,
  addressee_id text        not null references users(id) on delete cascade,
  status       text        not null default 'pending'
                           check (status in ('pending', 'accepted')),
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id)
);

-- One relationship per pair whichever way round it was asked, so B cannot
-- send a second request while A's is still pending.
create unique index if not exists friendships_pair
  on friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

create index if not exists friendships_addressee
  on friendships (addressee_id, status);

-- ----------------------------------------------------------------- nudges
-- A reminder from one friend to another to open their Bible.
create table if not exists nudges (
  id           text        primary key,
  from_user_id text        not null references users(id) on delete cascade,
  to_user_id   text        not null references users(id) on delete cascade,
  message      text        not null default '',
  created_at   timestamptz not null default now(),
  seen_at      timestamptz,
  check (from_user_id <> to_user_id)
);

-- The rate limit lives in the database rather than in application code: one
-- nudge per friend per day, enforced whatever calls it. A "remind" button with
-- no ceiling is a harassment vector, and the first thing App Review looks for
-- in a social feature.
create unique index if not exists nudges_one_per_friend_per_day
  on nudges (from_user_id, to_user_id, (created_at::date));

create index if not exists nudges_inbox
  on nudges (to_user_id, created_at desc);
