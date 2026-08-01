import { cert, getApps, initializeApp } from 'firebase-admin/app';

import { serviceUnavailable } from './errors.mjs';

function parseServiceAccountJson(raw) {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON must be valid JSON');
  }
}

function normalizePrivateKey(privateKey) {
  return String(privateKey).replace(/\\n/g, '\n');
}

export function createFirebaseAdminApp(config) {
  const existing = getApps()[0];
  if (existing) {
    return existing;
  }

  const serviceAccount = parseServiceAccountJson(config.firebaseServiceAccountJson);
  const projectId = config.firebaseProjectId || serviceAccount?.project_id || null;

  const options = {};

  if (projectId) {
    options.projectId = projectId;
  }

  if (serviceAccount) {
    options.credential = cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: normalizePrivateKey(serviceAccount.private_key),
    });
  } else if (config.firebaseClientEmail && config.firebasePrivateKey) {
    if (!projectId) {
      throw new Error('FIREBASE_PROJECT_ID is required when using FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY');
    }

    options.credential = cert({
      projectId,
      clientEmail: config.firebaseClientEmail,
      privateKey: normalizePrivateKey(config.firebasePrivateKey),
    });
  }

  if (!options.credential && !projectId) {
    throw serviceUnavailable(
      'Firebase config is missing. Set FIREBASE_PROJECT_ID and either FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY.',
    );
  }

  return initializeApp(options);
}
