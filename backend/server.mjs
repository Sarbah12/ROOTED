import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { URL } from 'node:url';

import {
  revokeFirebaseUserSessions,
  sanitizeFirebaseUserRecord,
  verifyFirebaseRequest,
  verifyLoginToken,
} from './auth.mjs';
import { loadConfig } from './config.mjs';
import { AppError, badRequest, isAppError, methodNotAllowed, notFound } from './errors.mjs';
import { createLogger } from './logger.mjs';
import { checkConnection } from './db.mjs';
import {
  createNote,
  createPrayer,
  deleteNote,
  deletePrayer,
  getReadingProgress,
  getSettings,
  getUser,
  listNotes,
  listPrayers,
  listQuizResults,
  recordQuizResult,
  setReadingProgress,
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

/** Plan definitions are static content, not user data. */
const READING_PLANS = [
  { id: 'plan_1', name: 'Bible in a Year', duration: '365 days', color: '#2E6A5C' },
  { id: 'plan_2', name: 'New Testament in 90 Days', duration: '90 days', color: '#8A6236' },
  { id: 'plan_3', name: 'Psalms & Proverbs', duration: '60 days', color: '#5D7A66' },
];

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

  const [user, settings, notes, prayers, progress] = await Promise.all([
    getUser(userId),
    getSettings(userId),
    listNotes(userId),
    listPrayers(userId),
    getReadingProgress(userId),
  ]);

  const progressById = new Map(progress.map((item) => [item.id, item.progress]));

  sendJson(res, 200, {
    user: { ...user, settings },
    counts: {
      notes: notes.length,
      prayers: prayers.length,
      plans: READING_PLANS.length,
    },
    readingPlans: READING_PLANS.map((plan) => ({
      ...plan,
      progress: progressById.get(plan.id) ?? 0,
    })),
    notes: notes.slice(0, 3),
    prayers: prayers.slice(0, 3),
  });
}

async function handleReadingPlans(req, res) {
  const firebaseUser = await requireUser(req);

  if (req.method === 'GET') {
    const progress = await getReadingProgress(firebaseUser.uid);
    const progressById = new Map(progress.map((item) => [item.id, item.progress]));
    sendJson(res, 200, {
      readingPlans: READING_PLANS.map((plan) => ({
        ...plan,
        progress: progressById.get(plan.id) ?? 0,
      })),
    });
    return;
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    const body = assertBody(await readBody(req));
    rejectUnknownKeys(body, ['planId', 'progress'], 'reading plan');
    const planId = requiredTrimmedString(body.planId, 'planId');

    if (typeof body.progress !== 'number' || body.progress < 0 || body.progress > 1) {
      throw badRequest('progress must be a number between 0 and 1');
    }

    sendJson(res, 200, await setReadingProgress(firebaseUser.uid, planId, body.progress));
    return;
  }

  throw methodNotAllowed();
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

async function handleVersionedHealth(req, res) {
  // Report the database too, so "ok" means the service can actually serve.
  let database = 'ok';
  try {
    await checkConnection();
  } catch (error) {
    database = `error: ${error.message}`;
  }

  sendJson(res, database === 'ok' ? 200 : 503, {
    ok: database === 'ok',
    service: 'rooted-backend',
    version: 'v1',
    database,
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

    if (parts[0] === 'v1' && parts[1] === 'auth' && parts[2] === 'logout' && req.method === 'POST') {
      await handleAuthLogout(req, res);
      return;
    }

    if (parts[0] === 'v1' && parts[1] === 'me' && parts.length === 2 && req.method === 'GET') {
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

    if (parts[0] === 'v1' && parts[1] === 'quiz' && parts[2] === 'results') {
      await handleQuizResults(req, res);
      return;
    }

    if (parts[0] === 'v1' && parts[1] === 'reading-plans') {
      await handleReadingPlans(req, res);
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
