import { getAuth } from 'firebase-admin/auth';

import { badRequest, unauthorized } from './errors.mjs';
import { createFirebaseAdminApp } from './firebase.mjs';

function extractBearerToken(value) {
  if (!value) {
    return null;
  }

  const [scheme, token] = String(value).split(/\s+/);
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
    return null;
  }

  return token;
}

function normalizeProvider(providerId) {
  if (providerId === 'google.com') {
    return 'google';
  }

  if (providerId === 'apple.com') {
    return 'apple';
  }

  if (providerId === 'phone') {
    return 'phone';
  }

  return providerId || 'firebase';
}

function splitPhoneNumber(phoneNumber = '') {
  const value = String(phoneNumber);
  if (!value) {
    return { countryCode: '', number: '' };
  }

  return { countryCode: '', number: value };
}

export function sanitizeFirebaseUserRecord(userRecord, decodedToken) {
  const providerId = userRecord.providerData?.[0]?.providerId || decodedToken.firebase?.sign_in_provider;
  const phoneNumber = userRecord.phoneNumber || decodedToken.phone_number || '';

  return {
    uid: userRecord.uid,
    displayName: userRecord.displayName || decodedToken.name || 'Guest Reader',
    email: userRecord.email || decodedToken.email || null,
    phone: splitPhoneNumber(phoneNumber),
    provider: normalizeProvider(providerId),
    photoURL: userRecord.photoURL || decodedToken.picture || null,
    emailVerified: Boolean(userRecord.emailVerified ?? decodedToken.email_verified),
  };
}

export async function verifyFirebaseRequest(req, config) {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    throw unauthorized('Missing bearer token');
  }

  const app = createFirebaseAdminApp(config);
  const auth = getAuth(app);
  const decodedToken = await auth.verifyIdToken(token, true);
  const userRecord = await auth.getUser(decodedToken.uid);

  return { decodedToken, userRecord };
}

export async function verifyLoginToken(idToken, config) {
  if (!idToken || typeof idToken !== 'string') {
    throw badRequest('idToken is required');
  }

  const app = createFirebaseAdminApp(config);
  const auth = getAuth(app);
  const decodedToken = await auth.verifyIdToken(idToken, true);
  const userRecord = await auth.getUser(decodedToken.uid);

  return { decodedToken, userRecord };
}

export async function revokeFirebaseUserSessions(uid, config) {
  const app = createFirebaseAdminApp(config);
  const auth = getAuth(app);
  await auth.revokeRefreshTokens(uid);
}
