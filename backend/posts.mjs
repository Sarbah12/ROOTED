import { query, queryOne } from './db.mjs';

/**
 * Community blog: posts, likes, comments.
 *
 * Blocked authors are filtered out of the feed and every comment thread, the
 * same way they are for plan reflections — one person blocked should disappear
 * everywhere, not just where they were blocked.
 *
 * like_count and comment_count are kept by triggers rather than counted per
 * read, since the feed would otherwise run two subqueries for every row.
 */

const EXCERPT_LENGTH = 180;

function mapPost(row) {
  if (!row) return null;
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: row.author_name ?? 'Someone',
    title: row.title,
    body: row.body,
    excerpt: row.excerpt,
    coverImageUrl: row.cover_image_url,
    tags: row.tags ?? [],
    status: row.status,
    likeCount: row.like_count,
    commentCount: row.comment_count,
    publishedAt: row.published_at ? row.published_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    // Present when the query joined the caller's like.
    likedByMe: row.liked_by_me ?? undefined,
  };
}

function mapComment(row) {
  if (!row) return null;
  return {
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    authorName: row.author_name ?? 'Someone',
    body: row.body,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

/** First couple of sentences, so the feed shows something useful. */
function buildExcerpt(body, provided) {
  if (provided?.trim()) return provided.trim().slice(0, EXCERPT_LENGTH);

  const flat = body.replace(/\s+/g, ' ').trim();
  if (flat.length <= EXCERPT_LENGTH) return flat;
  return `${flat.slice(0, EXCERPT_LENGTH).replace(/\s\S*$/, '')}…`;
}

// -------------------------------------------------------------------- feed
export async function listFeed(userId, { limit = 30, tag = null } = {}) {
  const { rows } = await query(
    `select p.*, u.display_name as author_name,
            (l.user_id is not null) as liked_by_me
     from posts p
     join users u on u.id = p.author_id
     left join post_likes l on l.post_id = p.id and l.user_id = $1
     where p.status = 'published'
       and p.is_hidden = false
       and ($3::text is null or $3 = any(p.tags))
       and not exists (
         select 1 from user_blocks b
         where b.blocker_id = $1 and b.blocked_id = p.author_id
       )
     order by p.published_at desc
     limit $2`,
    [userId, limit, tag]
  );
  return rows.map(mapPost);
}

/** The caller's own posts, drafts included. */
export async function listMyPosts(userId) {
  const { rows } = await query(
    `select p.*, u.display_name as author_name, false as liked_by_me
     from posts p join users u on u.id = p.author_id
     where p.author_id = $1
     order by p.updated_at desc`,
    [userId]
  );
  return rows.map(mapPost);
}

/** Null when the post does not exist, is hidden, or is someone else's draft. */
export async function getPost(userId, postId) {
  const row = await queryOne(
    `select p.*, u.display_name as author_name,
            (l.user_id is not null) as liked_by_me
     from posts p
     join users u on u.id = p.author_id
     left join post_likes l on l.post_id = p.id and l.user_id = $1
     where p.id = $2`,
    [userId, postId]
  );

  if (!row) return null;
  if (row.is_hidden && row.author_id !== userId) return null;
  if (row.status === 'draft' && row.author_id !== userId) return null;

  return mapPost(row);
}

export async function createPost(userId, input) {
  const status = input.status === 'published' ? 'published' : 'draft';

  const row = await queryOne(
    `insert into posts (author_id, title, body, excerpt, cover_image_url, tags,
                        status, published_at)
     values ($1, $2, $3, $4, $5, $6, $7, case when $7 = 'published' then now() end)
     returning *, (select display_name from users where id = $1) as author_name`,
    [
      userId,
      input.title,
      input.body ?? '',
      buildExcerpt(input.body ?? '', input.excerpt),
      input.coverImageUrl || null,
      input.tags ?? [],
      status,
    ]
  );
  return mapPost(row);
}

export async function updatePost(userId, postId, patch) {
  const existing = await queryOne(
    'select * from posts where id = $1 and author_id = $2',
    [postId, userId]
  );
  if (!existing) return null;

  const body = patch.body ?? existing.body;
  const status = patch.status ?? existing.status;

  const row = await queryOne(
    `update posts set
       title           = $3,
       body            = $4,
       excerpt         = $5,
       cover_image_url = $6,
       tags            = $7,
       status          = $8,
       -- Stamp the publish time the first time it goes live, and keep it after.
       published_at    = case
                           when $8 = 'published' and published_at is null then now()
                           when $8 = 'draft' then null
                           else published_at
                         end
     where id = $1 and author_id = $2
     returning *, (select display_name from users where id = $2) as author_name`,
    [
      postId,
      userId,
      patch.title ?? existing.title,
      body,
      buildExcerpt(body, patch.excerpt),
      patch.coverImageUrl !== undefined ? patch.coverImageUrl || null : existing.cover_image_url,
      patch.tags ?? existing.tags,
      status,
    ]
  );
  return mapPost(row);
}

export async function deletePost(userId, postId) {
  const row = await queryOne(
    'delete from posts where id = $1 and author_id = $2 returning id',
    [postId, userId]
  );
  return Boolean(row);
}

// ------------------------------------------------------------------- likes
export async function likePost(userId, postId) {
  await query(
    `insert into post_likes (post_id, user_id) values ($1, $2)
     on conflict do nothing`,
    [postId, userId]
  );
  const row = await queryOne('select like_count from posts where id = $1', [postId]);
  return { liked: true, likeCount: row?.like_count ?? 0 };
}

export async function unlikePost(userId, postId) {
  await query('delete from post_likes where post_id = $1 and user_id = $2', [postId, userId]);
  const row = await queryOne('select like_count from posts where id = $1', [postId]);
  return { liked: false, likeCount: row?.like_count ?? 0 };
}

// ---------------------------------------------------------------- comments
export async function listComments(userId, postId) {
  const { rows } = await query(
    `select c.*, u.display_name as author_name
     from post_comments c
     join users u on u.id = c.user_id
     where c.post_id = $1
       and c.is_hidden = false
       and not exists (
         select 1 from user_blocks b
         where b.blocker_id = $2 and b.blocked_id = c.user_id
       )
     order by c.created_at desc`,
    [postId, userId]
  );
  return rows.map(mapComment);
}

export async function createComment(userId, postId, body) {
  const row = await queryOne(
    `insert into post_comments (post_id, user_id, body)
     values ($1, $2, $3)
     returning *, (select display_name from users where id = $2) as author_name`,
    [postId, userId, body]
  );
  return mapComment(row);
}

export async function deleteComment(userId, commentId) {
  // The post's author may also remove comments on their own post.
  const row = await queryOne(
    `delete from post_comments c
     where c.id = $1
       and (c.user_id = $2
            or exists (select 1 from posts p where p.id = c.post_id and p.author_id = $2))
     returning c.id`,
    [commentId, userId]
  );
  return Boolean(row);
}

/** Hides a post or comment once enough distinct people report it. */
export async function hideIfHeavilyReported(targetType, targetId) {
  const counted = await queryOne(
    `select count(*)::int as reports from content_reports
     where target_type = $1 and target_id = $2 and status = 'open'`,
    [targetType, targetId]
  );

  if (!counted || counted.reports < 3) return false;

  const table = targetType === 'post' ? 'posts' : 'post_comments';
  await query(`update ${table} set is_hidden = true where id = $1`, [targetId]);
  return true;
}
