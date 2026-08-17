import { randomUUID } from 'node:crypto';

import { query, queryOne } from './db.mjs';
import { AppError, badRequest, notFound } from './errors.mjs';

/**
 * Friends, and nudging them to read.
 *
 * Two rules shape everything here, and both exist because a "remind" button is
 * the easiest thing in an app to turn into harassment:
 *
 *   1. Friendship is mutual. Both people have to agree before either can see
 *      the other or send anything. A one-sided follow would let a stranger
 *      attach themselves to you and start prodding.
 *
 *   2. One nudge per friend per day, enforced by a unique index rather than by
 *      an `if` here — so it holds however the endpoint is called, including by
 *      a future caller nobody has written yet.
 *
 * Blocked people disappear from all of it, reusing the blocks the moderation
 * work already put in place.
 */

const NUDGE_LIMIT_MESSAGE = 'You have already nudged this friend today.';

function mapFriend(row) {
  return {
    friendshipId: row.friendship_id,
    userId: row.user_id,
    displayName: row.display_name ?? 'Someone',
    username: row.username ?? null,
    status: row.status,
    /** True when they asked and the caller has not answered yet. */
    awaitingMyReply: row.awaiting_my_reply ?? false,
    since: row.created_at?.toISOString?.() ?? null,
    lastNudgedAt: row.last_nudged_at?.toISOString?.() ?? null,
  };
}

/** Everyone the caller is connected to, accepted or still pending. */
export async function listFriends(userId) {
  const { rows } = await query(
    `select f.id                       as friendship_id,
            f.status,
            f.created_at,
            (f.addressee_id = $1 and f.status = 'pending') as awaiting_my_reply,
            u.id                       as user_id,
            u.display_name,
            u.username,
            (select max(n.created_at) from nudges n
              where n.from_user_id = $1 and n.to_user_id = u.id) as last_nudged_at
       from friendships f
       join users u
         on u.id = case when f.requester_id = $1 then f.addressee_id else f.requester_id end
      where (f.requester_id = $1 or f.addressee_id = $1)
        and not exists (
          select 1 from user_blocks b
           where (b.blocker_id = $1 and b.blocked_id = u.id)
              or (b.blocker_id = u.id and b.blocked_id = $1)
        )
      order by f.status desc, u.display_name`,
    [userId],
  );

  return rows.map(mapFriend);
}

/**
 * Sends a request by username.
 *
 * Usernames are the only handle deliberately shared with other people — an
 * email or phone number is not something to expose in a search box.
 */
export async function requestFriend(userId, username) {
  const handle = String(username).trim().replace(/^@/, '').toLowerCase();
  if (!handle) throw badRequest('Enter a username.');

  const target = await queryOne('select id, display_name from users where lower(username) = $1', [
    handle,
  ]);

  if (!target) throw notFound('No one is using that username.');
  if (target.id === userId) throw badRequest('That is your own username.');

  const blocked = await queryOne(
    `select 1 from user_blocks
      where (blocker_id = $1 and blocked_id = $2)
         or (blocker_id = $2 and blocked_id = $1)`,
    [userId, target.id],
  );
  // Deliberately the same answer as "no such user": confirming that a specific
  // person has blocked you is itself information they did not choose to share.
  if (blocked) throw notFound('No one is using that username.');

  const existing = await queryOne(
    `select id, status, requester_id from friendships
      where least(requester_id, addressee_id) = least($1, $2)
        and greatest(requester_id, addressee_id) = greatest($1, $2)`,
    [userId, target.id],
  );

  if (existing) {
    if (existing.status === 'accepted') throw badRequest('You are already friends.');

    // They asked first — treat this as accepting rather than a duplicate.
    if (existing.requester_id === target.id) {
      await query(
        `update friendships set status = 'accepted', responded_at = now() where id = $1`,
        [existing.id],
      );
      return { status: 'accepted', displayName: target.display_name };
    }

    throw badRequest('You have already asked. Waiting for them to accept.');
  }

  await query(
    `insert into friendships (id, requester_id, addressee_id) values ($1, $2, $3)`,
    [randomUUID(), userId, target.id],
  );

  return { status: 'pending', displayName: target.display_name };
}

/** Accepts a request that was sent to the caller. */
export async function acceptFriend(userId, friendshipId) {
  const row = await queryOne(
    `update friendships
        set status = 'accepted', responded_at = now()
      where id = $1 and addressee_id = $2 and status = 'pending'
      returning id`,
    [friendshipId, userId],
  );
  return Boolean(row);
}

/**
 * Removes the friendship, whether it was accepted or still pending.
 * Either side can do this, and declining is the same operation as unfriending.
 */
export async function removeFriend(userId, friendshipId) {
  const row = await queryOne(
    `delete from friendships
      where id = $1 and (requester_id = $2 or addressee_id = $2)
      returning id`,
    [friendshipId, userId],
  );
  return Boolean(row);
}

const MAX_NUDGE_MESSAGE = 140;

/**
 * Nudges a friend to read.
 *
 * The daily ceiling is a unique index on (from, to, date), so a race between
 * two taps cannot slip a second one through — the second insert simply fails.
 */
export async function nudgeFriend(userId, friendUserId, message = '') {
  const friendship = await queryOne(
    `select id from friendships
      where status = 'accepted'
        and least(requester_id, addressee_id) = least($1, $2)
        and greatest(requester_id, addressee_id) = greatest($1, $2)`,
    [userId, friendUserId],
  );

  if (!friendship) {
    throw new AppError(403, 'not_friends', 'You can only nudge people you are friends with.');
  }

  const text = String(message).trim().slice(0, MAX_NUDGE_MESSAGE);

  try {
    await query(
      `insert into nudges (id, from_user_id, to_user_id, message) values ($1, $2, $3, $4)`,
      [randomUUID(), userId, friendUserId, text],
    );
  } catch (error) {
    // 23505 is unique_violation — the one-per-day index did its job.
    if (error?.code === '23505') {
      throw new AppError(429, 'nudge_limit', NUDGE_LIMIT_MESSAGE);
    }
    throw error;
  }

  return { sent: true };
}

/** Nudges waiting for the caller, newest first. */
export async function listNudges(userId, { unseenOnly = false } = {}) {
  const { rows } = await query(
    `select n.id, n.message, n.created_at, n.seen_at,
            u.display_name as from_name, u.username as from_username
       from nudges n
       join users u on u.id = n.from_user_id
      where n.to_user_id = $1
        ${unseenOnly ? 'and n.seen_at is null' : ''}
        and not exists (
          select 1 from user_blocks b
           where b.blocker_id = $1 and b.blocked_id = n.from_user_id
        )
      order by n.created_at desc
      limit 50`,
    [userId],
  );

  return rows.map((row) => ({
    id: row.id,
    message: row.message,
    fromName: row.from_name ?? 'A friend',
    fromUsername: row.from_username ?? null,
    createdAt: row.created_at.toISOString(),
    seen: Boolean(row.seen_at),
  }));
}

export async function markNudgesSeen(userId) {
  await query('update nudges set seen_at = now() where to_user_id = $1 and seen_at is null', [
    userId,
  ]);
  return { seen: true };
}
