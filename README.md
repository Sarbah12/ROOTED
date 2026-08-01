# Rooted

This repository has one canonical app: the top-level `app/` directory.

## Folder layout

- `app/` - the real Expo Router app you should edit and run
- `components/` - shared UI pieces
- `constants/` - app data and theme values
- `hooks/` - reusable React hooks
- `assets/` - images and icons
- `Rooted/` - legacy snapshot kept only for reference

## Where to make changes

Edit the top-level files first:

- `app/(tabs)/index.tsx`
- `app/(tabs)/bible.tsx`
- `app/(tabs)/devotional.tsx`
- `app/(tabs)/notes.tsx`
- `app/(tabs)/prayer.tsx`
- `app/(tabs)/quiz.tsx`

## Run the app

```bash
npm install
npx expo start -c
```

## Run the backend

The project now includes a simple local backend for login, settings, notes, prayers, reading plans, and quiz data.

```bash
npm run backend
```

The API listens on `http://127.0.0.1:3333` by default.

### Backend config

Copy `.env.example` to `.env` and adjust as needed:

- `PORT` and `HOST` control where the server listens
- `DATABASE_URL` is reserved for the future database layer
- `FIREBASE_PROJECT_ID` and either `FIREBASE_SERVICE_ACCOUNT_JSON` or the `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` pair are required for Firebase Admin verification
- `FIREBASE_AUTH_EMULATOR_HOST` is optional if you run the Firebase Auth emulator locally
- `EXPO_PUBLIC_BACKEND_API_BASE_URL` lets the Expo app point at your local or deployed backend
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID` remains a legacy fallback for Google sign-in in the Expo app
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, and `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` let you configure Google sign-in per platform
- `BIBLE_API_KEY` and `OPENAI_API_KEY` are placeholders for external services
- `CORS_ORIGINS` accepts a comma-separated allowlist for Expo/web clients

### Auth flow

The backend now supports:

- `POST /v1/auth/login`
- `GET /v1/me`
- `POST /v1/auth/logout`

Login expects a Firebase `idToken` from the client and returns the normalized user profile.
Use the Firebase ID token in the `Authorization: Bearer <token>` header for protected routes.
Firebase handles token refresh on the client SDK, so the backend does not need its own refresh endpoint.
Logout revokes the Firebase refresh tokens for the signed-in user.

The Expo app initializes Firebase in [constants/firebase.ts](/Users/sarbahrichmond/Desktop/Rooted/constants/firebase.ts) and syncs a signed-in Firebase user to the backend through [context/firebase-auth.tsx](/Users/sarbahrichmond/Desktop/Rooted/context/firebase-auth.tsx). The login screen now uses Firebase-backed phone, Apple, and Google sign-in flows, with Google sign-in using platform-aware Google OAuth client IDs when available.

Google sign-in on iPhone and Android requires a development build or standalone build, not Expo Go. The native app IDs in [app.json](/Users/sarbahrichmond/Desktop/Rooted/app.json) must also match the OAuth clients you create in Google Cloud Console.

If the app looks stale, clear the Expo cache with `npx expo start -c` and reopen the top-level project folder.
