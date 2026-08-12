import { query, queryOne, transaction } from './db.mjs';

/**
 * Community study plans: authoring, joining, progress, reflections, streaks.
 *
 * Visibility is enforced here rather than in the routes, so there is one place
 * that decides who may read a plan. Blocked users are filtered out of every
 * reflection feed.
 */

// ------------------------------------------------------------------ mapping
function mapPlan(row) {
  if (!row) return null;
  return {
    id: row.id,
    ownerId: row.owner_id,
    ownerName: row.owner_name ?? null,
    title: row.title,
    description: row.description,
    visibility: row.visibility,
    joinCode: row.join_code,
    durationDays: row.duration_days,
    memberCount: row.member_count,
    isArchived: row.is_archived,
    createdAt: row.created_at.toISOString(),
    // Present only when the query joined membership for the caller.
    isMember: row.is_member ?? undefined,
    currentDay: row.current_day ?? undefined,
  };
}

function mapReflection(row) {
  if (!row) return null;
  return {
    id: row.id,
    planId: row.plan_id,
    userId: row.user_id,
    authorName: row.author_name ?? 'Someone',
    day: row.day,
    body: row.body,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

/** Short, unambiguous share code — no 0/O/1/I. */
function generateJoinCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

// -------------------------------------------------------------------- plans
export async function createPlan(userId, input) {
  return transaction(async (client) => {
    let joinCode = generateJoinCode();

    // Collisions are unlikely but cheap to retry.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const clash = await client.query('select 1 from study_plans where join_code = $1', [joinCode]);
      if (clash.rowCount === 0) break;
      joinCode = generateJoinCode();
    }

    const days = input.days ?? [];

    const { rows } = await client.query(
      `insert into study_plans (owner_id, title, description, visibility, join_code, duration_days)
       values ($1, $2, $3, $4, $5, $6)
       returning *`,
      [userId, input.title, input.description ?? '', input.visibility ?? 'link', joinCode, days.length]
    );
    const plan = rows[0];

    for (const [index, day] of days.entries()) {
      await client.query(
        `insert into study_plan_days (plan_id, day, reference, title, prompt)
         values ($1, $2, $3, $4, $5)`,
        [plan.id, index + 1, day.reference, day.title ?? '', day.prompt ?? '']
      );
    }

    // The author is a member from the start, so it shows in "my plans".
    await client.query(
      `insert into plan_members (plan_id, user_id, role) values ($1, $2, 'owner')`,
      [plan.id, userId]
    );

    return mapPlan(plan);
  });
}

/** Plans the user owns or has joined. */
export async function listMyPlans(userId) {
  const { rows } = await query(
    `select p.*, u.display_name as owner_name, true as is_member, m.current_day
     from plan_members m
     join study_plans p on p.id = m.plan_id
     join users u on u.id = p.owner_id
     where m.user_id = $1 and p.is_archived = false
     order by m.joined_at desc`,
    [userId]
  );
  return rows.map(mapPlan);
}

/** Wildcards typed by the user are literal, not pattern syntax. */
function likePattern(search) {
  const escaped = String(search).replace(/[\\%_]/g, (char) => `\\${char}`);
  return `%${escaped}%`;
}

/**
 * The public directory, excluding plans by people the caller has blocked.
 *
 * `search` matches the title, the description, or the author's name. An empty
 * search matches everything, so the directory and the search share one query.
 */
export async function listPublicPlans(userId, limit = 50, search = '') {
  const term = String(search).trim();
  const pattern = term ? likePattern(term) : null;

  const { rows } = await query(
    `select p.*, u.display_name as owner_name,
            (m.user_id is not null) as is_member, m.current_day
     from study_plans p
     join users u on u.id = p.owner_id
     left join plan_members m on m.plan_id = p.id and m.user_id = $1
     where p.visibility = 'public'
       and p.is_archived = false
       and not exists (
         select 1 from user_blocks b
         where b.blocker_id = $1 and b.blocked_id = p.owner_id
       )
       and (
         $3::text is null
         or p.title ilike $3 escape '\\'
         or coalesce(p.description, '') ilike $3 escape '\\'
         or coalesce(u.display_name, '') ilike $3 escape '\\'
       )
     order by p.member_count desc, p.created_at desc
     limit $2`,
    [userId, limit, pattern]
  );
  return rows.map(mapPlan);
}

export async function findPlanByCode(userId, joinCode) {
  const row = await queryOne(
    `select p.*, u.display_name as owner_name,
            (m.user_id is not null) as is_member, m.current_day
     from study_plans p
     join users u on u.id = p.owner_id
     left join plan_members m on m.plan_id = p.id and m.user_id = $1
     where upper(p.join_code) = upper($2) and p.is_archived = false`,
    [userId, joinCode]
  );
  return mapPlan(row);
}

/** Returns null when the plan does not exist or the caller may not see it. */
export async function getPlan(userId, planId) {
  const row = await queryOne(
    `select p.*, u.display_name as owner_name,
            (m.user_id is not null) as is_member, m.current_day
     from study_plans p
     join users u on u.id = p.owner_id
     left join plan_members m on m.plan_id = p.id and m.user_id = $1
     where p.id = $2`,
    [userId, planId]
  );

  if (!row) return null;

  // Private plans are visible to members only; link plans need the code, which
  // findPlanByCode handles, but a member can always reopen one they joined.
  const isMember = row.is_member;
  if (row.visibility === 'private' && !isMember && row.owner_id !== userId) {
    return null;
  }
  if (row.visibility === 'link' && !isMember && row.owner_id !== userId) {
    return null;
  }

  return mapPlan(row);
}

export async function getPlanDays(planId) {
  const { rows } = await query(
    'select day, reference, title, prompt from study_plan_days where plan_id = $1 order by day',
    [planId]
  );
  return rows;
}

export async function joinPlan(userId, planId) {
  await query(
    `insert into plan_members (plan_id, user_id) values ($1, $2)
     on conflict (plan_id, user_id) do nothing`,
    [planId, userId]
  );
  return getPlan(userId, planId);
}

export async function leavePlan(userId, planId) {
  // Owners cannot leave; they archive instead, so the plan is not orphaned.
  const row = await queryOne(
    `delete from plan_members
     where plan_id = $1 and user_id = $2 and role <> 'owner'
     returning plan_id`,
    [planId, userId]
  );
  return Boolean(row);
}

/**
 * Edits a plan the caller owns. Returns null for anyone else, so the route does
 * not have to check ownership separately.
 *
 * Passing `days` replaces the whole schedule: editing day 3 of a 30-day plan
 * means sending all 30 back. Members who already finished a day keep that
 * credit even if its reading changed — they did the work — but completions
 * past the end of a shortened plan are removed, or progress could read as more
 * days than the plan now has.
 */
export async function updatePlan(userId, planId, input) {
  return transaction(async (client) => {
    const owned = await client.query(
      'select id from study_plans where id = $1 and owner_id = $2',
      [planId, userId]
    );
    if (owned.rowCount === 0) return null;

    const fields = [];
    const values = [];

    for (const [column, value] of [
      ['title', input.title],
      ['description', input.description],
      ['visibility', input.visibility],
    ]) {
      if (value !== undefined) {
        values.push(value);
        fields.push(`${column} = $${values.length}`);
      }
    }

    if (input.days !== undefined) {
      await client.query('delete from study_plan_days where plan_id = $1', [planId]);

      for (const [index, day] of input.days.entries()) {
        await client.query(
          `insert into study_plan_days (plan_id, day, reference, title, prompt)
           values ($1, $2, $3, $4, $5)`,
          [planId, index + 1, day.reference, day.title ?? '', day.prompt ?? '']
        );
      }

      const length = input.days.length;
      values.push(length);
      fields.push(`duration_days = $${values.length}`);

      await client.query('delete from plan_completions where plan_id = $1 and day > $2', [
        planId,
        length,
      ]);
      await client.query(
        'update plan_members set current_day = least(current_day, $2) where plan_id = $1',
        [planId, Math.max(1, length)]
      );
    }

    if (fields.length === 0) {
      const unchanged = await client.query('select * from study_plans where id = $1', [planId]);
      return mapPlan(unchanged.rows[0]);
    }

    values.push(planId);
    const { rows } = await client.query(
      `update study_plans set ${fields.join(', ')} where id = $${values.length} returning *`,
      values
    );
    return mapPlan(rows[0]);
  });
}

export async function archivePlan(userId, planId) {
  const row = await queryOne(
    'update study_plans set is_archived = true where id = $1 and owner_id = $2 returning id',
    [planId, userId]
  );
  return Boolean(row);
}

// ----------------------------------------------------------------- progress
export async function completeDay(userId, planId, day) {
  return transaction(async (client) => {
    await client.query(
      `insert into plan_completions (plan_id, user_id, day)
       values ($1, $2, $3)
       on conflict (plan_id, user_id, day) do nothing`,
      [planId, userId, day]
    );

    // current_day is the furthest consecutive day finished, so a member who
    // skips ahead does not appear further along than they are.
    const { rows } = await client.query(
      'select day from plan_completions where plan_id = $1 and user_id = $2 order by day',
      [planId, userId]
    );

    let consecutive = 0;
    for (const row of rows) {
      if (row.day === consecutive + 1) consecutive += 1;
      else break;
    }

    await client.query(
      'update plan_members set current_day = $3 where plan_id = $1 and user_id = $2',
      [planId, userId, consecutive]
    );

    return { day, currentDay: consecutive, completedDays: rows.map((r) => r.day) };
  });
}

export async function uncompleteDay(userId, planId, day) {
  await query(
    'delete from plan_completions where plan_id = $1 and user_id = $2 and day = $3',
    [planId, userId, day]
  );
  return completeDay(userId, planId, day === 1 ? 0 : day - 1).catch(() => null);
}

export async function getMyProgress(userId, planId) {
  const { rows } = await query(
    'select day from plan_completions where plan_id = $1 and user_id = $2 order by day',
    [planId, userId]
  );
  return rows.map((row) => row.day);
}

/** Every member's position, for the plan's progress list. */
export async function getPlanMembers(userId, planId) {
  const { rows } = await query(
    `select m.user_id, m.role, m.current_day, m.joined_at, u.display_name,
            (select count(*) from plan_completions c
              where c.plan_id = m.plan_id and c.user_id = m.user_id) as days_done
     from plan_members m
     join users u on u.id = m.user_id
     where m.plan_id = $1
       and not exists (
         select 1 from user_blocks b
         where b.blocker_id = $2 and b.blocked_id = m.user_id
       )
     order by days_done desc, m.joined_at`,
    [planId, userId]
  );

  return rows.map((row) => ({
    userId: row.user_id,
    displayName: row.display_name,
    role: row.role,
    currentDay: row.current_day,
    daysDone: Number(row.days_done),
    joinedAt: row.joined_at.toISOString(),
  }));
}

// ------------------------------------------------------------------ streaks
/**
 * Current and longest streak in calendar days, across every plan.
 * A streak survives if the last completion was today or yesterday.
 */
export async function getStreak(userId) {
  const { rows } = await query(
    `select distinct completed_on from plan_completions
     where user_id = $1 order by completed_on desc`,
    [userId]
  );

  if (rows.length === 0) {
    return { current: 0, longest: 0, lastCompletedOn: null, totalDays: 0 };
  }

  const dates = rows.map((row) => new Date(row.completed_on));
  const dayMs = 24 * 60 * 60 * 1000;
  const startOfDay = (d) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

  const today = startOfDay(new Date());
  const mostRecent = startOfDay(dates[0]);

  let current = 0;
  if (today - mostRecent <= dayMs) {
    current = 1;
    for (let i = 1; i < dates.length; i += 1) {
      if (startOfDay(dates[i - 1]) - startOfDay(dates[i]) === dayMs) current += 1;
      else break;
    }
  }

  let longest = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i += 1) {
    if (startOfDay(dates[i - 1]) - startOfDay(dates[i]) === dayMs) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  return {
    current,
    longest: Math.max(longest, current),
    lastCompletedOn: rows[0].completed_on.toISOString().slice(0, 10),
    totalDays: rows.length,
  };
}

// -------------------------------------------------------------- reflections
export async function listReflections(userId, planId, day) {
  const { rows } = await query(
    `select r.*, u.display_name as author_name
     from plan_reflections r
     join users u on u.id = r.user_id
     where r.plan_id = $1 and r.day = $2
       and r.is_hidden = false
       and not exists (
         select 1 from user_blocks b
         where b.blocker_id = $3 and b.blocked_id = r.user_id
       )
     order by r.created_at desc`,
    [planId, day, userId]
  );
  return rows.map(mapReflection);
}

export async function createReflection(userId, planId, day, body) {
  const row = await queryOne(
    `insert into plan_reflections (plan_id, user_id, day, body)
     values ($1, $2, $3, $4)
     returning *, (select display_name from users where id = $2) as author_name`,
    [planId, userId, day, body]
  );
  return mapReflection(row);
}

export async function updateReflection(userId, id, body) {
  const row = await queryOne(
    `update plan_reflections set body = $3
     where id = $1 and user_id = $2
     returning *, (select display_name from users where id = $2) as author_name`,
    [id, userId, body]
  );
  return mapReflection(row);
}

export async function deleteReflection(userId, id) {
  const row = await queryOne(
    'delete from plan_reflections where id = $1 and user_id = $2 returning id',
    [id, userId]
  );
  return Boolean(row);
}

export async function isPlanMember(userId, planId) {
  const row = await queryOne(
    'select 1 from plan_members where plan_id = $1 and user_id = $2',
    [planId, userId]
  );
  return Boolean(row);
}

// --------------------------------------------------------------- moderation
export async function reportContent(reporterId, targetType, targetId, reason, details = '') {
  const row = await queryOne(
    `insert into content_reports (reporter_id, target_type, target_id, reason, details)
     values ($1, $2, $3, $4, $5)
     on conflict (reporter_id, target_type, target_id)
     do update set reason = excluded.reason, details = excluded.details, status = 'open'
     returning id, created_at`,
    [reporterId, targetType, targetId, reason, details]
  );

  // Hide a reflection once several distinct people flag it, so obvious abuse
  // disappears without waiting for a human.
  if (targetType === 'reflection') {
    const counted = await queryOne(
      `select count(*)::int as reports from content_reports
       where target_type = 'reflection' and target_id = $1 and status = 'open'`,
      [targetId]
    );
    if (counted && counted.reports >= 3) {
      await query('update plan_reflections set is_hidden = true where id = $1', [targetId]);
    }
  }

  return { id: row.id, createdAt: row.created_at.toISOString() };
}

export async function blockUser(blockerId, blockedId) {
  if (blockerId === blockedId) return false;
  await query(
    `insert into user_blocks (blocker_id, blocked_id) values ($1, $2)
     on conflict do nothing`,
    [blockerId, blockedId]
  );
  return true;
}

export async function unblockUser(blockerId, blockedId) {
  await query('delete from user_blocks where blocker_id = $1 and blocked_id = $2', [
    blockerId,
    blockedId,
  ]);
  return true;
}

export async function listBlockedUsers(userId) {
  const { rows } = await query(
    `select b.blocked_id, u.display_name
     from user_blocks b join users u on u.id = b.blocked_id
     where b.blocker_id = $1`,
    [userId]
  );
  return rows.map((row) => ({ userId: row.blocked_id, displayName: row.display_name }));
}
