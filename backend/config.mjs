function parseList(value) {
  if (!value) {
    return [];
  }

  return String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parsePort(value, fallback) {
  const parsed = Number(value ?? fallback);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`Invalid PORT value: ${value}`);
  }

  return parsed;
}

export function loadConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || 'development';

  return {
    nodeEnv,
    host: env.HOST || '127.0.0.1',
    port: parsePort(env.PORT, 3333),
    databaseUrl: env.DATABASE_URL || null,
    firebaseProjectId: env.FIREBASE_PROJECT_ID || null,
    firebaseClientEmail: env.FIREBASE_CLIENT_EMAIL || null,
    firebasePrivateKey: env.FIREBASE_PRIVATE_KEY || null,
    firebaseServiceAccountJson: env.FIREBASE_SERVICE_ACCOUNT_JSON || null,
    firebaseAuthEmulatorHost: env.FIREBASE_AUTH_EMULATOR_HOST || null,
    apiKeys: {
      openai: env.OPENAI_API_KEY || null,
    },
    corsOrigins: parseList(env.CORS_ORIGINS),
    logLevel: env.LOG_LEVEL || 'info',
  };
}

/**
 * Shared instance for modules that just need to read config (db, migrations).
 * server.mjs still calls loadConfig() itself so tests can inject an env.
 */
export const config = loadConfig();
