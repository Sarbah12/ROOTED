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
import { loadStore, updateStore } from './store.mjs';
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

async function requireAuth(req) {
  return verifyFirebaseRequest(req, config);
}

async function handleAuthLogin(req, res) {
  const body = assertBody(await readBody(req));
  rejectUnknownKeys(body, ['idToken'], 'login');
  const idToken = requiredTrimmedString(body.idToken, 'idToken');
  const { decodedToken, userRecord } = await verifyLoginToken(idToken, config);
  const firebaseUser = sanitizeFirebaseUserRecord(userRecord, decodedToken);
  const response = await updateStore((draft) => {
    const settings = draft.user?.id === firebaseUser.uid ? draft.user.settings : { ...draft.user.settings };

    draft.user = {
      id: firebaseUser.uid,
      displayName: firebaseUser.displayName,
      email: firebaseUser.email,
      phone: firebaseUser.phone,
      provider: firebaseUser.provider,
      settings,
      photoURL: firebaseUser.photoURL || null,
      emailVerified: firebaseUser.emailVerified,
    };

    return {
      user: draft.user,
      firebaseUser,
      claims: decodedToken,
    };
  });

  sendJson(res, 200, response);
}

async function handleAuthLogout(req, res) {
  const authContext = await requireAuth(req);

  await revokeFirebaseUserSessions(authContext.decodedToken.uid, config);

  sendJson(res, 200, { loggedOut: true });
}

async function handleMe(req, res) {
  const store = await loadStore();
  const authContext = await requireAuth(req);
  const firebaseUser = sanitizeFirebaseUserRecord(authContext.userRecord, authContext.decodedToken);

  sendJson(res, 200, {
    user: store.user?.id === firebaseUser.uid ? store.user : firebaseUser,
    firebaseUser,
  });
}

async function handleSettings(req, res) {
  const store = await loadStore();
  await requireAuth(req, store);

  if (req.method === 'GET') {
    sendJson(res, 200, store.user.settings);
    return;
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const body = assertBody(await readBody(req));
    rejectUnknownKeys(
      body,
      ['darkMode', 'remindersEnabled', 'verseNotificationsEnabled', 'streakBadgeEnabled', 'reminderTime', 'fontSize'],
      'settings',
    );

    const nextSettings = {
      darkMode: optionalBoolean(body.darkMode, 'darkMode'),
      remindersEnabled: optionalBoolean(body.remindersEnabled, 'remindersEnabled'),
      verseNotificationsEnabled: optionalBoolean(body.verseNotificationsEnabled, 'verseNotificationsEnabled'),
      streakBadgeEnabled: optionalBoolean(body.streakBadgeEnabled, 'streakBadgeEnabled'),
      reminderTime: optionalTrimmedString(body.reminderTime),
      fontSize: optionalEnum(body.fontSize, ['Small', 'Default', 'Large'], 'fontSize'),
    };

    const updated = await updateStore((draft) => {
      draft.user.settings = {
        ...draft.user.settings,
        ...Object.fromEntries(
          Object.entries(nextSettings).filter(([, value]) => value !== undefined),
        ),
      };
    });

    sendJson(res, 200, updated.user.settings);
    return;
  }

  throw methodNotAllowed();
}

async function handleNotes(req, res, id) {
  const store = await loadStore();
  await requireAuth(req, store);

  if (!id && req.method === 'GET') {
    sendJson(res, 200, { notes: store.notes });
    return;
  }

  if (!id && req.method === 'POST') {
    const body = assertBody(await readBody(req));
    const created = await updateStore((draft) => {
      const note = {
        id: randomUUID(),
        title: requiredTrimmedString(body.title, 'title'),
        reference: optionalTrimmedString(body.reference) || '',
        content: optionalTrimmedString(body.content) || '',
        tags: optionalArrayOfStrings(body.tags, 'tags') || [],
        updatedAt: new Date().toISOString(),
        color: optionalTrimmedString(body.color) || '#2E6A5C',
      };

      draft.notes.unshift(note);
      return note;
    });

    sendJson(res, 201, created);
    return;
  }

  if (id && (req.method === 'PATCH' || req.method === 'PUT')) {
    const body = assertBody(await readBody(req));
    const updated = await updateStore((draft) => {
      const note = draft.notes.find((item) => item.id === id);

      if (!note) {
        return null;
      }

      if (body.title !== undefined) {
        note.title = requiredTrimmedString(body.title, 'title');
      }
      if (body.reference !== undefined) {
        note.reference = optionalTrimmedString(body.reference) || '';
      }
      if (body.content !== undefined) {
        note.content = optionalTrimmedString(body.content) || '';
      }
      if (body.tags !== undefined) {
        note.tags = optionalArrayOfStrings(body.tags, 'tags') || [];
      }
      if (body.color !== undefined) {
        note.color = optionalTrimmedString(body.color) || note.color;
      }

      note.updatedAt = new Date().toISOString();
      return note;
    });

    if (!updated) {
      throw notFound();
    }

    sendJson(res, 200, updated);
    return;
  }

  if (id && req.method === 'DELETE') {
    const deleted = await updateStore((draft) => {
      const index = draft.notes.findIndex((item) => item.id === id);

      if (index === -1) {
        return null;
      }

      const [note] = draft.notes.splice(index, 1);
      return note;
    });

    if (!deleted) {
      throw notFound();
    }

    sendJson(res, 200, { deleted: true, id });
    return;
  }

  throw methodNotAllowed();
}

async function handlePrayers(req, res, id) {
  const store = await loadStore();
  await requireAuth(req, store);

  if (!id && req.method === 'GET') {
    sendJson(res, 200, { prayers: store.prayers });
    return;
  }

  if (!id && req.method === 'POST') {
    const body = assertBody(await readBody(req));
    const created = await updateStore((draft) => {
      const prayer = {
        id: randomUUID(),
        title: requiredTrimmedString(body.title, 'title'),
        category: optionalTrimmedString(body.category) || 'Personal',
        content: optionalTrimmedString(body.content) || '',
        status: optionalEnum(body.status, ['unanswered', 'ongoing', 'answered'], 'status') || 'unanswered',
        verse: optionalTrimmedString(body.verse) || '',
        updatedAt: new Date().toISOString(),
      };

      draft.prayers.unshift(prayer);
      return prayer;
    });

    sendJson(res, 201, created);
    return;
  }

  if (id && (req.method === 'PATCH' || req.method === 'PUT')) {
    const body = assertBody(await readBody(req));
    const updated = await updateStore((draft) => {
      const prayer = draft.prayers.find((item) => item.id === id);

      if (!prayer) {
        return null;
      }

      if (body.title !== undefined) {
        prayer.title = requiredTrimmedString(body.title, 'title');
      }
      if (body.category !== undefined) {
        prayer.category = optionalTrimmedString(body.category) || prayer.category;
      }
      if (body.content !== undefined) {
        prayer.content = optionalTrimmedString(body.content) || '';
      }
      if (body.status !== undefined) {
        prayer.status = optionalEnum(body.status, ['unanswered', 'ongoing', 'answered'], 'status') || prayer.status;
      }
      if (body.verse !== undefined) {
        prayer.verse = optionalTrimmedString(body.verse) || '';
      }

      prayer.updatedAt = new Date().toISOString();
      return prayer;
    });

    if (!updated) {
      throw notFound();
    }

    sendJson(res, 200, updated);
    return;
  }

  if (id && req.method === 'DELETE') {
    const deleted = await updateStore((draft) => {
      const index = draft.prayers.findIndex((item) => item.id === id);

      if (index === -1) {
        return null;
      }

      const [prayer] = draft.prayers.splice(index, 1);
      return prayer;
    });

    if (!deleted) {
      throw notFound();
    }

    sendJson(res, 200, { deleted: true, id });
    return;
  }

  throw methodNotAllowed();
}

async function handleDashboard(req, res) {
  const store = await loadStore();
  await requireAuth(req, store);

  sendJson(res, 200, {
    user: store.user,
    stats: {
      notes: store.notes.length,
      prayers: store.prayers.length,
      plans: store.readingPlans.length,
      quizQuestions: store.quizQuestions.length,
    },
    readingPlans: store.readingPlans,
    notes: store.notes.slice(0, 3),
    prayers: store.prayers.slice(0, 3),
  });
}

async function handleQuestions(req, res) {
  const store = await loadStore();
  await requireAuth(req, store);
  sendJson(res, 200, { questions: store.quizQuestions });
}

async function handleReadingPlans(req, res) {
  const store = await loadStore();
  await requireAuth(req, store);
  sendJson(res, 200, { readingPlans: store.readingPlans });
}

async function handleVersionedHealth(req, res) {
  sendJson(res, 200, {
    ok: true,
    service: 'rooted-backend',
    version: 'v1',
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

    if (parts[0] === 'v1' && parts[1] === 'quiz' && parts[2] === 'questions' && req.method === 'GET') {
      await handleQuestions(req, res);
      return;
    }

    if (parts[0] === 'v1' && parts[1] === 'reading-plans' && req.method === 'GET') {
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
