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
- `OPENAI_API_KEY` is a placeholder for a future external service
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

The Expo app initializes Firebase in [constants/firebase.ts](constants/firebase.ts) and syncs a signed-in Firebase user to the backend through [context/firebase-auth.tsx](context/firebase-auth.tsx). The login screen offers Firebase-backed **phone** and **Apple** sign-in. Google sign-in was removed.

Phone sign-in needs a reCAPTCHA token before Firebase will send an SMS. That runs in a WebView via [components/firebase-recaptcha](components/firebase-recaptcha), vendored from the abandoned `expo-firebase-recaptcha` package — see the comments there for why.

Apple sign-in requires `ios.usesAppleSignIn` in [app.json](app.json) (already set) so the entitlement is generated, and a real build — it does not work in Expo Go.

## Bible text

The full KJV ships with the app under `assets/bible/kjv` (66 books, 1,189 chapters, 31,100 verses) so reading works offline. Regenerate it with:

```bash
npm run build:bible
```

Additional translations (WEB, ASV, BBE, YLT, Darby) are fetched on demand from
[bible-api.com](https://bible-api.com) and cached on device; if the network fails the
reader falls back to the bundled KJV. Every translation used is public domain.

## iOS builds

Build profiles live in [eas.json](eas.json).

```bash
npx eas build --platform ios --profile preview
```

`preview` targets the simulator. Use `preview:device` or `production` for real devices —
both need an Apple Developer Program membership for signing. Before shipping production,
set a real HTTPS `EXPO_PUBLIC_BACKEND_API_BASE_URL` in the `production` profile; iOS App
Transport Security blocks plain HTTP, so the localhost default will not work on a device.

If the app looks stale, clear the Expo cache with `npx expo start -c` and reopen the top-level project folder.
