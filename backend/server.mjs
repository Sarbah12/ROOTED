import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { URL } from 'node:url';

import {
  createPasswordResetLink,
  findUserByEmail,
  revokeFirebaseUserSessions,
  sanitizeFirebaseUserRecord,
  verifyFirebaseRequest,
  verifyLoginToken,
} from './auth.mjs';
import { getChapter, isBibleApiConfigured, listBibles } from './bible.mjs';
import { getNltChapter, isNltConfigured } from './nlt.mjs';
import {
  acceptFriend,
  listFriends,
  listNudges,
  markNudgesSeen,
  nudgeFriend,
  removeFriend,
  requestFriend,
} from './friends.mjs';
import { isEmailConfigured, sendPasswordResetEmail, sendWelcomeEmail } from './email.mjs';
import {
  createComment,
  createPost,
  deleteComment,
  deletePost,
  getPost,
  hideIfHeavilyReported,
  likePost,
  listComments,
  listFeed,
  listMyPosts,
  unlikePost,
  updatePost,
} from './posts.mjs';
import {
  archivePlan,
  blockUser,
  completeDay,
  createPlan,
  createReflection,
  deleteReflection,
  findPlanByCode,
  getMyProgress,
  getPlan,
  getPlanDays,
  getPlanMembers,
  getStreak,
  isPlanMember,
  joinPlan,
  leavePlan,
  listBlockedUsers,
  listMyPlans,
  listPublicPlans,
  listReflections,
  reportContent,
  unblockUser,
  uncompleteDay,
  updatePlan,
  updateReflection,
} from './plans.mjs';
import { loadConfig } from './config.mjs';
import { AppError, badRequest, isAppError, methodNotAllowed, notFound } from './errors.mjs';
import { createLogger } from './logger.mjs';
import { checkConnection } from './db.mjs';
import {
  createNote,
  createPrayer,
  deleteNote,
  deleteUser,
  deletePrayer,
  getSettings,
  getUser,
  isRealInbox,
  listNotes,
  listPrayers,
  listQuizResults,
  recordQuizResult,
  updateNote,
  updatePrayer,
  updateSettings,
  upsertUser,
} from './store.mjs';
import {
  assertBody,
  optionalArrayOfStrings,
  optionalBoolean,
  optionalEnum,
  optionalTrimmedString,
  rejectUnknownKeys,
  requiredTrimmedString,
} from './validation.mjs';

const config = loadConfig();
const logger = createLogger(config.logLevel);

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin') || '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(payload));
}

function sendError(res, error) {
  if (isAppError(error)) {
    sendJson(res, error.statusCode, {
      error: error.code,
      message: error.message,
      details: error.details,
    });
    return;
  }

  sendJson(res, 500, {
    error: 'internal_server_error',
    message: error instanceof Error ? error.message : 'Unknown error',
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on('data', (chunk) => {
      chunks.push(chunk);
      if (Buffer.concat(chunks).length > 1_000_000) {
        reject(new Error('Body too large'));
        req.destroy();
      }
    });

    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(badRequest('Request body must be valid JSON'));
      }
    });

    req.on('error', reject);
  });
}

function getPathParts(url) {
  return url.pathname.split('/').filter(Boolean);
}

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;

  if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return;
  }

  if (config.corsOrigins.length === 0 || config.corsOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', 'null');
}

function withRoute(handler) {
  return async (req, res, url) => {
    const startedAt = Date.now();

    try {
      await handler(req, res, url);
      logger.info(`${req.method} ${url.pathname} ${res.statusCode || 200}`, {
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      const wrappedError =
        error instanceof AppError || error instanceof Error ? error : badRequest('Unexpected error');

      if (!(wrappedError instanceof AppError)) {
        logger.error(`${req.method} ${url.pathname} 500`, {
          durationMs,
          message: wrappedError.message,
        });
      } else if (wrappedError.statusCode >= 500) {
        logger.error(`${req.method} ${url.pathname} ${wrappedError.statusCode}`, {
          durationMs,
          message: wrappedError.message,
        });
      } else {
        logger.warn(`${req.method} ${url.pathname} ${wrappedError.statusCode}`, {
          durationMs,
          message: wrappedError.message,
        });
      }

      sendError(res, wrappedError);
    }
  };
}

/** Verifies the bearer token and returns the caller's normalized profile. */
async function requireUser(req) {
  const { decodedToken, userRecord } = await verifyFirebaseRequest(req, config);
  return sanitizeFirebaseUserRecord(userRecord, decodedToken);
}

async function handleAuthLogin(req, res) {
  const body = assertBody(await readBody(req));
  rejectUnknownKeys(body, ['idToken'], 'login');
  const idToken = requiredTrimmedString(body.idToken, 'idToken');

  const { decodedToken, userRecord } = await verifyLoginToken(idToken, config);
  const firebaseUser = sanitizeFirebaseUserRecord(userRecord, decodedToken);

  const user = await upsertUser(firebaseUser);
  const settings = await getSettings(firebaseUser.uid);

  sendJson(res, 200, { user: { ...user, settings }, firebaseUser, claims: decodedToken });
}

async function handleAuthLogout(req, res) {
  const firebaseUser = await requireUser(req);
  await revokeFirebaseUserSessions(firebaseUser.uid, config);
  sendJson(res, 200, { loggedOut: true });
}

async function handleMe(req, res) {
  const firebaseUser = await requireUser(req);

  /**
   * Deleting the account. Everything referencing the user cascades, so this
   * removes notes, prayers, plans, posts, comments and reflections with it.
   *
   * The Firebase user is deleted by the app rather than here: doing it from
   * the client means the person's own credentials authorise it, and a failure
   * to remove their data server-side cannot leave them locked out of an
   * account whose contents still exist.
   */
  if (req.method === 'DELETE') {
    await deleteUser(firebaseUser.uid);
    sendJson(res, 200, { deleted: true });
    return;
  }

  const user = (await getUser(firebaseUser.uid)) ?? (await upsertUser(firebaseUser));
  const settings = await getSettings(firebaseUser.uid);

  sendJson(res, 200, { user: { ...user, settings }, firebaseUser });
}

async function handleSettings(req, res) {
  const firebaseUser = await requireUser(req);

  if (req.method === 'GET') {
    sendJson(res, 200, await getSettings(firebaseUser.uid));
    return;
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const body = assertBody(await readBody(req));
    rejectUnknownKeys(
      body,
      ['darkMode', 'remindersEnabled', 'verseNotificationsEnabled', 'streakBadgeEnabled',
       'reminderTime', 'fontSize'],
      'settings'
    );

    const patch = {
      darkMode: optionalBoolean(body.darkMode, 'darkMode'),
      remindersEnabled: optionalBoolean(body.remindersEnabled, 'remindersEnabled'),
      verseNotificationsEnabled: optionalBoolean(body.verseNotificationsEnabled, 'verseNotificationsEnabled'),
      streakBadgeEnabled: optionalBoolean(body.streakBadgeEnabled, 'streakBadgeEnabled'),
      reminderTime: optionalTrimmedString(body.reminderTime),
      fontSize: optionalTrimmedString(body.fontSize),
    };

    sendJson(res, 200, await updateSettings(firebaseUser.uid, patch));
    return;
  }

  throw methodNotAllowed();
}

async function handleNotes(req, res, id) {
  const firebaseUser = await requireUser(req);
  const userId = firebaseUser.uid;

  if (!id && req.method === 'GET') {
    sendJson(res, 200, { notes: await listNotes(userId) });
    return;
  }

  if (!id && req.method === 'POST') {
    const body = assertBody(await readBody(req));
    const created = await createNote(userId, {
      title: requiredTrimmedString(body.title, 'title'),
      reference: optionalTrimmedString(body.reference) || '',
      content: optionalTrimmedString(body.content) || '',
      tags: optionalArrayOfStrings(body.tags, 'tags') || [],
      color: optionalTrimmedString(body.color) || '#2E6A5C',
      kind: optionalEnum(body.kind, ['study', 'sermon'], 'kind') || 'study',
      preacher: optionalTrimmedString(body.preacher) || '',
      church: optionalTrimmedString(body.church) || '',
      series: optionalTrimmedString(body.series) || '',
      sermonDate: optionalTrimmedString(body.sermonDate) || null,
    });
    sendJson(res, 201, created);
    return;
  }

  if (id && (req.method === 'PATCH' || req.method === 'PUT')) {
    const body = assertBody(await readBody(req));
    const patch = {};
    if (body.title !== undefined) patch.title = requiredTrimmedString(body.title, 'title');
    if (body.reference !== undefined) patch.reference = optionalTrimmedString(body.reference) || '';
    if (body.content !== undefined) patch.content = optionalTrimmedString(body.content) || '';
    if (body.tags !== undefined) patch.tags = optionalArrayOfStrings(body.tags, 'tags') || [];
    if (body.color !== undefined) patch.color = optionalTrimmedString(body.color) || '#2E6A5C';
    if (body.kind !== undefined) patch.kind = optionalEnum(body.kind, ['study', 'sermon'], 'kind');
    if (body.preacher !== undefined) patch.preacher = optionalTrimmedString(body.preacher) || '';
    if (body.church !== undefined) patch.church = optionalTrimmedString(body.church) || '';
    if (body.series !== undefined) patch.series = optionalTrimmedString(body.series) || '';
    if (body.sermonDate !== undefined) patch.sermonDate = optionalTrimmedString(body.sermonDate) || null;

    const updated = await updateNote(userId, id, patch);
    if (!updated) throw notFound();
    sendJson(res, 200, updated);
    return;
  }

  if (id && req.method === 'DELETE') {
    if (!(await deleteNote(userId, id))) throw notFound();
    sendJson(res, 200, { deleted: true, id });
    return;
  }

  throw methodNotAllowed();
}

async function handlePrayers(req, res, id) {
  const firebaseUser = await requireUser(req);
  const userId = firebaseUser.uid;

  if (!id && req.method === 'GET') {
    sendJson(res, 200, { prayers: await listPrayers(userId) });
    return;
  }

  if (!id && req.method === 'POST') {
    const body = assertBody(await readBody(req));
    const created = await createPrayer(userId, {
      title: requiredTrimmedString(body.title, 'title'),
      category: optionalTrimmedString(body.category) || 'Personal',
      content: optionalTrimmedString(body.content) || '',
      status: optionalEnum(body.status, ['unanswered', 'ongoing', 'answered'], 'status') || 'unanswered',
      verse: optionalTrimmedString(body.verse) || '',
    });
    sendJson(res, 201, created);
    return;
  }

  if (id && (req.method === 'PATCH' || req.method === 'PUT')) {
    const body = assertBody(await readBody(req));
    const patch = {};
    if (body.title !== undefined) patch.title = requiredTrimmedString(body.title, 'title');
    if (body.category !== undefined) patch.category = optionalTrimmedString(body.category) || 'Personal';
    if (body.content !== undefined) patch.content = optionalTrimmedString(body.content) || '';
    if (body.status !== undefined) {
      patch.status = optionalEnum(body.status, ['unanswered', 'ongoing', 'answered'], 'status');
    }
    if (body.verse !== undefined) patch.verse = optionalTrimmedString(body.verse) || '';

    const updated = await updatePrayer(userId, id, patch);
    if (!updated) throw notFound();
    sendJson(res, 200, updated);
    return;
  }

  if (id && req.method === 'DELETE') {
    if (!(await deletePrayer(userId, id))) throw notFound();
    sendJson(res, 200, { deleted: true, id });
    return;
  }

  throw methodNotAllowed();
}

async function handleDashboard(req, res) {
  const firebaseUser = await requireUser(req);
  const userId = firebaseUser.uid;

  const [user, settings, notes, prayers, plans] = await Promise.all([
    getUser(userId),
    getSettings(userId),
    listNotes(userId),
    listPrayers(userId),
    listMyPlans(userId),
  ]);

  sendJson(res, 200, {
    user: { ...user, settings },
    counts: {
      notes: notes.length,
      prayers: prayers.length,
      plans: plans.length,
    },
    notes: notes.slice(0, 3),
    prayers: prayers.slice(0, 3),
  });
}


async function handleQuizResults(req, res) {
  const firebaseUser = await requireUser(req);

  if (req.method === 'GET') {
    sendJson(res, 200, { results: await listQuizResults(firebaseUser.uid) });
    return;
  }

  if (req.method === 'POST') {
    const body = assertBody(await readBody(req));
    rejectUnknownKeys(body, ['subjectKey', 'score', 'total'], 'quiz result');
    const subjectKey = requiredTrimmedString(body.subjectKey, 'subjectKey');

    if (!Number.isInteger(body.score) || !Number.isInteger(body.total) || body.total <= 0) {
      throw badRequest('score and total must be integers, and total must be positive');
    }

    sendJson(res, 200, await recordQuizResult(firebaseUser.uid, subjectKey, body.score, body.total));
    return;
  }

  throw methodNotAllowed();
}

/**
 * Sends a branded password-reset email.
 *
 * Always answers 200, whether or not the address is registered — a different
 * response would turn this into an account-existence oracle.
 */
async function handlePasswordReset(req, res) {
  const body = assertBody(await readBody(req));
  rejectUnknownKeys(body, ['email'], 'password reset');
  const email = requiredTrimmedString(body.email, 'email').toLowerCase();

  if (!isEmailConfigured()) {
    throw new AppError(503, 'email_unavailable', 'Email delivery is not configured.');
  }

  const link = await createPasswordResetLink(email, config);

  if (link) {
    const user = await findUserByEmail(email, config);
    try {
      await sendPasswordResetEmail(email, link, user?.displayName || '');
    } catch (error) {
      // Log, but keep the response uniform.
      logger.error('Failed to send reset email', { message: error.message });
    }
  }

  sendJson(res, 200, { sent: true });
}

/** Fire-and-forget welcome mail; failure must not fail the request. */
async function handleWelcomeEmail(req, res) {
  const firebaseUser = await requireUser(req);

  // Not an error worth failing the request over: signing up with a username or
  // phone number is a legitimate choice, and it simply has no inbox to write to.
  if (!isEmailConfigured() || !isRealInbox(firebaseUser.email)) {
    sendJson(res, 200, { sent: false, reason: 'no-inbox' });
    return;
  }

  try {
    await sendWelcomeEmail(firebaseUser.email, firebaseUser.displayName || '');
    sendJson(res, 200, { sent: true });
  } catch (error) {
    logger.error('Failed to send welcome email', { message: error.message });
    sendJson(res, 200, { sent: false });
  }
}

const MAX_REFLECTION_LENGTH = 2000;

/** Validates and normalises a plan's schedule, shared by create and edit. */
function normalizePlanDays(value) {
  const days = Array.isArray(value) ? value : [];
  if (days.length === 0) throw badRequest('A plan needs at least one day.');
  if (days.length > 400) throw badRequest('A plan cannot exceed 400 days.');

  for (const day of days) {
    if (!day || typeof day.reference !== 'string' || !day.reference.trim()) {
      throw badRequest('Every day needs a passage reference.');
    }
  }

  return days.map((day) => ({
    reference: day.reference.trim(),
    title: typeof day.title === 'string' ? day.title.trim() : '',
    prompt: typeof day.prompt === 'string' ? day.prompt.trim() : '',
  }));
}

/** /v1/plans and /v1/plans/:id/... */
async function handlePlans(req, res, parts, url) {
  const user = await requireUser(req);
  const userId = user.uid;
  const planId = parts[2];
  const section = parts[3];

  // ---- collection
  if (!planId) {
    if (req.method === 'GET') {
      const scope = url.searchParams.get('scope') || 'mine';
      const code = url.searchParams.get('code');

      if (code) {
        const found = await findPlanByCode(userId, code);
        if (!found) throw notFound();
        sendJson(res, 200, { plan: found });
        return;
      }

      const plans =
        scope === 'public'
          ? await listPublicPlans(userId, 50, url.searchParams.get('q') || '')
          : await listMyPlans(userId);
      sendJson(res, 200, { plans });
      return;
    }

    if (req.method === 'POST') {
      const body = assertBody(await readBody(req));
      rejectUnknownKeys(body, ['title', 'description', 'visibility', 'days'], 'plan');

      const plan = await createPlan(userId, {
        title: requiredTrimmedString(body.title, 'title'),
        description: optionalTrimmedString(body.description) || '',
        visibility: optionalEnum(body.visibility, ['private', 'link', 'public'], 'visibility') || 'link',
        days: normalizePlanDays(body.days),
      });

      sendJson(res, 201, plan);
      return;
    }

    throw methodNotAllowed();
  }

  // ---- single plan
  const plan = await getPlan(userId, planId);
  if (!plan) throw notFound();

  if (!section) {
    if (req.method === 'GET') {
      const [days, progress, members] = await Promise.all([
        getPlanDays(planId),
        getMyProgress(userId, planId),
        getPlanMembers(userId, planId),
      ]);
      sendJson(res, 200, { plan, days, completedDays: progress, members });
      return;
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      const body = assertBody(await readBody(req));
      rejectUnknownKeys(body, ['title', 'description', 'visibility', 'days'], 'plan');

      const updated = await updatePlan(userId, planId, {
        title: body.title === undefined ? undefined : requiredTrimmedString(body.title, 'title'),
        description:
          body.description === undefined ? undefined : optionalTrimmedString(body.description) || '',
        visibility:
          body.visibility === undefined
            ? undefined
            : optionalEnum(body.visibility, ['private', 'link', 'public'], 'visibility'),
        days: body.days === undefined ? undefined : normalizePlanDays(body.days),
      });

      // updatePlan returns null for anyone who does not own the plan.
      if (!updated) {
        throw new AppError(403, 'not_the_owner', 'Only the person who made this plan can edit it.');
      }

      sendJson(res, 200, { plan: updated });
      return;
    }

    if (req.method === 'DELETE') {
      if (!(await archivePlan(userId, planId))) throw notFound();
      sendJson(res, 200, { archived: true });
      return;
    }

    throw methodNotAllowed();
  }

  if (section === 'join' && req.method === 'POST') {
    sendJson(res, 200, { plan: await joinPlan(userId, planId) });
    return;
  }

  if (section === 'leave' && req.method === 'POST') {
    if (!(await leavePlan(userId, planId))) {
      throw badRequest('Plan owners cannot leave their own plan; archive it instead.');
    }
    sendJson(res, 200, { left: true });
    return;
  }

  if (section === 'members' && req.method === 'GET') {
    sendJson(res, 200, { members: await getPlanMembers(userId, planId) });
    return;
  }

  // Everything below is for members only.
  if (!(await isPlanMember(userId, planId))) {
    throw new AppError(403, 'not_a_member', 'Join this plan first.');
  }

  if (section === 'days' && parts[4]) {
    const day = Number(parts[4]);
    if (!Number.isInteger(day) || day < 1) throw badRequest('Invalid day.');

    if (parts[5] === 'complete') {
      if (req.method === 'POST') {
        sendJson(res, 200, await completeDay(userId, planId, day));
        return;
      }
      if (req.method === 'DELETE') {
        await uncompleteDay(userId, planId, day);
        sendJson(res, 200, { completedDays: await getMyProgress(userId, planId) });
        return;
      }
      throw methodNotAllowed();
    }

    if (parts[5] === 'reflections') {
      if (req.method === 'GET') {
        sendJson(res, 200, { reflections: await listReflections(userId, planId, day) });
        return;
      }

      if (req.method === 'POST') {
        const body = assertBody(await readBody(req));
        rejectUnknownKeys(body, ['body'], 'reflection');
        const text = requiredTrimmedString(body.body, 'body');
        if (text.length > MAX_REFLECTION_LENGTH) {
          throw badRequest(`Keep reflections under ${MAX_REFLECTION_LENGTH} characters.`);
        }
        sendJson(res, 201, await createReflection(userId, planId, day, text));
        return;
      }

      throw methodNotAllowed();
    }
  }

  throw notFound();
}

async function handleReflection(req, res, id) {
  const user = await requireUser(req);

  if (req.method === 'PATCH' || req.method === 'PUT') {
    const body = assertBody(await readBody(req));
    rejectUnknownKeys(body, ['body'], 'reflection');
    const text = requiredTrimmedString(body.body, 'body');
    if (text.length > MAX_REFLECTION_LENGTH) {
      throw badRequest(`Keep reflections under ${MAX_REFLECTION_LENGTH} characters.`);
    }
    const updated = await updateReflection(user.uid, id, text);
    if (!updated) throw notFound();
    sendJson(res, 200, updated);
    return;
  }

  if (req.method === 'DELETE') {
    if (!(await deleteReflection(user.uid, id))) throw notFound();
    sendJson(res, 200, { deleted: true });
    return;
  }

  throw methodNotAllowed();
}

async function handleStreak(req, res) {
  const user = await requireUser(req);
  sendJson(res, 200, await getStreak(user.uid));
}

/** Report objectionable content — App Store Guideline 1.2. */
async function handleReport(req, res) {
  const user = await requireUser(req);
  const body = assertBody(await readBody(req));
  rejectUnknownKeys(body, ['targetType', 'targetId', 'reason', 'details'], 'report');

  const targetType = optionalEnum(
    body.targetType,
    ['reflection', 'plan', 'user', 'post', 'comment'],
    'targetType'
  );
  if (!targetType) throw badRequest('targetType is required.');

  const result = await reportContent(
    user.uid,
    targetType,
    requiredTrimmedString(body.targetId, 'targetId'),
    requiredTrimmedString(body.reason, 'reason'),
    optionalTrimmedString(body.details) || ''
  );

  // Posts and comments auto-hide on repeated reports, as reflections do.
  if (targetType === 'post' || targetType === 'comment') {
    await hideIfHeavilyReported(targetType, requiredTrimmedString(body.targetId, 'targetId'));
  }

  sendJson(res, 201, result);
}

/** Block and unblock users — App Store Guideline 1.2. */
async function handleBlocks(req, res, targetId) {
  const user = await requireUser(req);

  if (!targetId && req.method === 'GET') {
    sendJson(res, 200, { blocked: await listBlockedUsers(user.uid) });
    return;
  }

  if (!targetId && req.method === 'POST') {
    const body = assertBody(await readBody(req));
    rejectUnknownKeys(body, ['userId'], 'block');
    const blockedId = requiredTrimmedString(body.userId, 'userId');
    if (!(await blockUser(user.uid, blockedId))) throw badRequest('You cannot block yourself.');
    sendJson(res, 201, { blocked: true });
    return;
  }

  if (targetId && req.method === 'DELETE') {
    await unblockUser(user.uid, targetId);
    sendJson(res, 200, { blocked: false });
    return;
  }

  throw methodNotAllowed();
}

/**
 * Licensed Bible text, proxied so the API.Bible key stays server-side.
 *   GET /v1/bible/versions
 *   GET /v1/bible/:bibleId/:bookId/:chapter
 */
/**
 * Public-domain Bibles served without a sign-in.
 *
 * The auth gate on this endpoint exists to stop our licensed key being used as
 * someone else's free Bible API. Public-domain texts carry no licence to
 * protect, and the app promises the Bible can be read with no account — so
 * gating these would break that promise to solve a problem they do not have.
 *
 * They still cost API.Bible quota, which is why every response is cached
 * server-side before it is returned.
 */
const OPEN_BIBLE_IDS = new Set([
  '9879dbb7cfe39e4d-01', // World English Bible
  '7142879509583d59-01', // World English Bible, British Edition
  '06125adad2d5898a-01', // American Standard Version
  '179568874c45066f-01', // Douay-Rheims 1899
  'c61908161b077c4c-01', // Czech Kralická 1613
  '7ea794434e9ea7ee-01', // Chinese Contemporary, Simplified
  'a6e06d2c5b90ad89-01', // Chinese Contemporary, Traditional
  // Biblica's "Open" editions carry the same terms as their Chinese ones
  // above — freely licensed, not public domain. Gating these behind an
  // account while serving the Chinese ones freely was an oversight, and it
  // put the Ghanaian translations out of reach of the readers who want them.
  'b6aee081108c0bc6-01', // Open Akuapem Twi Contemporary
  '18f6cf27f7b43297-01', // Open Asante Twi Contemporary
  'ac90bfebd4ee9c4d-01', // Open Ewe Contemporary
  'b8d1feac6e94bd74-01', // Open Yoruba Contemporary
  'a36fc06b086699f1-02', // Open Igbo Contemporary
  '0ab0c764d56a715d-01', // Open Hausa Contemporary
  '611f8eb23aec8f13-01', // Open Kiswahili Contemporary (Neno)
  // Public domain, and old enough that no licence applies. These were marked
  // as licensed by mistake, so the app asked for a sign-in before it would
  // fetch a 1599 Geneva Bible.
  'a93a92589195411f-01', // Bible J.N. Darby (French)
  '592420522e16049f-01', // Reina Valera 1909
  'd63894c8d9a7a503-01', // Biblia Livre Para Todos
  '65eec8e0b60e656b-01', // Free Bible Version
  '01b29f4b342acc35-01', // Literal Standard Version
  'c315fa9f71d4af3a-01', // Geneva Bible 1599
  '55212e3cf5d04d49-01', // Cambridge Paragraph Bible of the KJV
  '66c22495370cdfc0-01', // Translation for Translators
]);

async function handleBible(req, res, parts) {
  // parts is ['v1','bible',<bibleId>,<bookId>,<chapter>]
  const open = OPEN_BIBLE_IDS.has(parts[2]);
  if (!open) await requireUser(req);

  // The NLT comes from Tyndale directly rather than through API.Bible, so it
  // is served whether or not an API.Bible key exists.
  if (parts[2] === 'nlt' && parts[3] && parts[4] && req.method === 'GET') {
    if (!isNltConfigured()) {
      throw new AppError(503, 'nlt_unavailable', 'The NLT is not configured on this server.');
    }

    const chapterNumber = Number(parts[4]);
    if (!Number.isInteger(chapterNumber) || chapterNumber < 1) {
      throw badRequest('Invalid chapter.');
    }

    sendJson(res, 200, await getNltChapter(parts[3], chapterNumber));
    return;
  }

  if (!isBibleApiConfigured()) {
    throw new AppError(
      503,
      'bible_api_unavailable',
      'Licensed translations are not configured on this server.'
    );
  }

  if (parts[2] === 'versions' && req.method === 'GET') {
    sendJson(res, 200, { versions: await listBibles() });
    return;
  }

  const [, , bibleId, bookId, chapter] = parts;
  if (bibleId && bookId && chapter && req.method === 'GET') {
    const chapterNumber = Number(chapter);
    if (!Number.isInteger(chapterNumber) || chapterNumber < 1) {
      throw badRequest('Invalid chapter.');
    }

    sendJson(res, 200, await getChapter(bibleId, bookId, chapterNumber));
    return;
  }

  throw notFound();
}


/**
 * /v1/friends and /v1/nudges
 *
 *   GET    /v1/friends                list, accepted and pending
 *   POST   /v1/friends                { username } — ask to connect
 *   POST   /v1/friends/:id/accept     accept a request sent to you
 *   DELETE /v1/friends/:id            decline, or unfriend — same thing
 *   POST   /v1/friends/:userId/nudge  { message } — once per friend per day
 *
 *   GET    /v1/nudges                 what friends have sent you
 *   POST   /v1/nudges/seen            mark them read
 */
async function handleFriends(req, res, parts) {
  const user = await requireUser(req);
  const userId = user.uid;
  const id = parts[2];
  const action = parts[3];

  if (!id) {
    if (req.method === 'GET') {
      sendJson(res, 200, { friends: await listFriends(userId) });
      return;
    }

    if (req.method === 'POST') {
      const body = assertBody(await readBody(req));
      rejectUnknownKeys(body, ['username'], 'friend request');
      const result = await requestFriend(userId, requiredTrimmedString(body.username, 'username'));
      sendJson(res, 201, result);
      return;
    }

    throw methodNotAllowed();
  }

  if (action === 'accept' && req.method === 'POST') {
    if (!(await acceptFriend(userId, id))) throw notFound('That request is no longer waiting.');
    sendJson(res, 200, { accepted: true });
    return;
  }

  if (action === 'nudge' && req.method === 'POST') {
    const body = assertBody(await readBody(req));
    rejectUnknownKeys(body, ['message'], 'nudge');
    sendJson(res, 201, await nudgeFriend(userId, id, optionalTrimmedString(body.message) || ''));
    return;
  }

  if (!action && req.method === 'DELETE') {
    if (!(await removeFriend(userId, id))) throw notFound();
    sendJson(res, 200, { removed: true });
    return;
  }

  throw notFound();
}

async function handleNudges(req, res, parts) {
  const user = await requireUser(req);

  if (parts[2] === 'seen' && req.method === 'POST') {
    sendJson(res, 200, await markNudgesSeen(user.uid));
    return;
  }

  if (!parts[2] && req.method === 'GET') {
    sendJson(res, 200, { nudges: await listNudges(user.uid) });
    return;
  }

  throw notFound();
}

const MAX_POST_BODY = 40000;
const MAX_COMMENT = 2000;

/** /v1/posts and /v1/posts/:id/... */
async function handlePosts(req, res, parts, url) {
  const user = await requireUser(req);
  const userId = user.uid;
  const postId = parts[2];
  const section = parts[3];

  // ---- collection
  if (!postId) {
    if (req.method === 'GET') {
      const scope = url.searchParams.get('scope') || 'feed';
      const tag = url.searchParams.get('tag');

      const posts =
        scope === 'mine' ? await listMyPosts(userId) : await listFeed(userId, { tag });
      sendJson(res, 200, { posts });
      return;
    }

    if (req.method === 'POST') {
      const body = assertBody(await readBody(req));
      rejectUnknownKeys(
        body,
        ['title', 'body', 'excerpt', 'coverImageUrl', 'tags', 'status'],
        'post'
      );

      const text = optionalTrimmedString(body.body) || '';
      if (text.length > MAX_POST_BODY) {
        throw badRequest('That post is too long.');
      }

      const created = await createPost(userId, {
        title: requiredTrimmedString(body.title, 'title'),
        body: text,
        excerpt: optionalTrimmedString(body.excerpt) || '',
        coverImageUrl: optionalTrimmedString(body.coverImageUrl) || '',
        tags: optionalArrayOfStrings(body.tags, 'tags') || [],
        status: optionalEnum(body.status, ['draft', 'published'], 'status') || 'draft',
      });

      sendJson(res, 201, created);
      return;
    }

    throw methodNotAllowed();
  }

  // ---- single post
  if (!section) {
    if (req.method === 'GET') {
      const post = await getPost(userId, postId);
      if (!post) throw notFound();
      sendJson(res, 200, post);
      return;
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      const body = assertBody(await readBody(req));
      rejectUnknownKeys(
        body,
        ['title', 'body', 'excerpt', 'coverImageUrl', 'tags', 'status'],
        'post'
      );

      const patch = {};
      if (body.title !== undefined) patch.title = requiredTrimmedString(body.title, 'title');
      if (body.body !== undefined) {
        patch.body = optionalTrimmedString(body.body) || '';
        if (patch.body.length > MAX_POST_BODY) throw badRequest('That post is too long.');
      }
      if (body.excerpt !== undefined) patch.excerpt = optionalTrimmedString(body.excerpt) || '';
      if (body.coverImageUrl !== undefined) {
        patch.coverImageUrl = optionalTrimmedString(body.coverImageUrl) || '';
      }
      if (body.tags !== undefined) patch.tags = optionalArrayOfStrings(body.tags, 'tags') || [];
      if (body.status !== undefined) {
        patch.status = optionalEnum(body.status, ['draft', 'published'], 'status');
      }

      const updated = await updatePost(userId, postId, patch);
      if (!updated) throw notFound();
      sendJson(res, 200, updated);
      return;
    }

    if (req.method === 'DELETE') {
      if (!(await deletePost(userId, postId))) throw notFound();
      sendJson(res, 200, { deleted: true });
      return;
    }

    throw methodNotAllowed();
  }

  // A post must be readable before it can be liked or commented on.
  const post = await getPost(userId, postId);
  if (!post) throw notFound();

  if (section === 'like') {
    if (req.method === 'POST') {
      sendJson(res, 200, await likePost(userId, postId));
      return;
    }
    if (req.method === 'DELETE') {
      sendJson(res, 200, await unlikePost(userId, postId));
      return;
    }
    throw methodNotAllowed();
  }

  if (section === 'comments') {
    if (req.method === 'GET') {
      sendJson(res, 200, { comments: await listComments(userId, postId) });
      return;
    }

    if (req.method === 'POST') {
      const body = assertBody(await readBody(req));
      rejectUnknownKeys(body, ['body'], 'comment');
      const text = requiredTrimmedString(body.body, 'body');
      if (text.length > MAX_COMMENT) {
        throw badRequest(`Keep comments under ${MAX_COMMENT} characters.`);
      }
      sendJson(res, 201, await createComment(userId, postId, text));
      return;
    }

    throw methodNotAllowed();
  }

  throw notFound();
}

async function handleComment(req, res, commentId) {
  const user = await requireUser(req);

  if (req.method === 'DELETE') {
    if (!(await deleteComment(user.uid, commentId))) throw notFound();
    sendJson(res, 200, { deleted: true });
    return;
  }

  throw methodNotAllowed();
}

async function handleVersionedHealth(req, res) {
  // Report the database too, so "ok" means the service can actually serve.
  //
  // A server with no DATABASE_URL is not broken — it is deliberately running
  // as a Bible proxy only, which is a useful thing to deploy on its own and
  // serves every public domain translation without an account. Reporting that
  // as 503 made a perfectly good deployment look like a failed one.
  let database;
  let healthy = true;

  if (!config.databaseUrl) {
    database = 'not configured';
  } else {
    try {
      await checkConnection();
      database = 'ok';
    } catch (error) {
      database = `error: ${error.message}`;
      healthy = false;
    }
  }

  sendJson(res, healthy ? 200 : 503, {
    ok: healthy,
    service: 'rooted-backend',
    version: 'v1',
    database,
    // What this deployment can actually do, so a misconfiguration is visible
    // from a URL rather than from a user reporting a blank screen.
    bible: isBibleApiConfigured() ? 'ok' : 'no API_BIBLE_KEY',
    nlt: isNltConfigured() ? 'ok' : 'no NLT_API_KEY',
    accounts: config.databaseUrl ? 'ok' : 'disabled (no database)',
    time: new Date().toISOString(),
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'OPTIONS') {
    setCorsHeaders(req, res);
    res.writeHead(204, {
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin') || '*',
    });
    res.end();
    return;
  }

  setCorsHeaders(req, res);

  const parts = getPathParts(url);
  const routeKey = parts.join('/');

  const routes = [
    ['GET', '', async () => sendJson(res, 200, { service: 'rooted-backend', ok: true, version: '1' })],
    ['GET', 'health', async () =>
      sendJson(res, 200, { ok: true, service: 'rooted-backend', time: new Date().toISOString() })],
    ['GET', 'v1/health', handleVersionedHealth],
  ];

  await withRoute(async () => {
    for (const [method, path, handler] of routes) {
      if (req.method === method && routeKey === path) {
        await handler(req, res, url);
        return;
      }
    }

    if (parts[0] === 'v1' && parts[1] === 'auth' && parts[2] === 'login' && req.method === 'POST') {
      await handleAuthLogin(req, res);
      return;
    }

    if (parts[0] === 'v1' && parts[1] === 'auth' && parts[2] === 'password-reset' && req.method === 'POST') {
      await handlePasswordReset(req, res);
      return;
    }

    if (parts[0] === 'v1' && parts[1] === 'auth' && parts[2] === 'welcome' && req.method === 'POST') {
      await handleWelcomeEmail(req, res);
      return;
    }

    if (parts[0] === 'v1' && parts[1] === 'auth' && parts[2] === 'logout' && req.method === 'POST') {
      await handleAuthLogout(req, res);
      return;
    }

    if (
      parts[0] === 'v1' &&
      parts[1] === 'me' &&
      parts.length === 2 &&
      (req.method === 'GET' || req.method === 'DELETE')
    ) {
      await handleMe(req, res);
      return;
    }

    if (parts[0] === 'v1' && parts[1] === 'me' && parts[2] === 'settings') {
      await handleSettings(req, res);
      return;
    }

    if (parts[0] === 'v1' && parts[1] === 'dashboard' && req.method === 'GET') {
      await handleDashboard(req, res);
      return;
    }

    if (parts[0] === 'v1' && parts[1] === 'notes') {
      await handleNotes(req, res, parts[2]);
      return;
    }

    if (parts[0] === 'v1' && parts[1] === 'prayers') {
      await handlePrayers(req, res, parts[2]);
      return;
    }

    if (parts[0] === 'v1' && parts[1] === 'friends') {
      await handleFriends(req, res, parts);
      return;
    }

    if (parts[0] === 'v1' && parts[1] === 'nudges') {
      await handleNudges(req, res, parts);
      return;
    }

    if (parts[0] === 'v1' && parts[1] === 'bible') {
      await handleBible(req, res, parts);
      return;
    }

    if (parts[0] === 'v1' && parts[1] === 'posts') {
      await handlePosts(req, res, parts, url);
      return;
    }

    if (parts[0] === 'v1' && parts[1] === 'comments' && parts[2]) {
      await handleComment(req, res, parts[2]);
      return;
    }

    if (parts[0] === 'v1' && parts[1] === 'plans') {
      await handlePlans(req, res, parts, url);
      return;
    }

    if (parts[0] === 'v1' && parts[1] === 'reflections' && parts[2]) {
      await handleReflection(req, res, parts[2]);
      return;
    }

    if (parts[0] === 'v1' && parts[1] === 'me' && parts[2] === 'streak' && req.method === 'GET') {
      await handleStreak(req, res);
      return;
    }

    if (parts[0] === 'v1' && parts[1] === 'reports' && req.method === 'POST') {
      await handleReport(req, res);
      return;
    }

    if (parts[0] === 'v1' && parts[1] === 'blocks') {
      await handleBlocks(req, res, parts[2]);
      return;
    }

    if (parts[0] === 'v1' && parts[1] === 'quiz' && parts[2] === 'results') {
      await handleQuizResults(req, res);
      return;
    }


    throw notFound();
  })(req, res, url);
});

server.listen(config.port, config.host, () => {
  logger.info(`Rooted backend running at http://${config.host}:${config.port}`, {
    nodeEnv: config.nodeEnv,
  });
});
