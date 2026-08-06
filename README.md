# Rooted

A Bible study app for iOS and Android — offline Scripture, a prayer journal,
study notes, Scripture quizzes, and community study plans you can read through
alongside other people.

Built with Expo (SDK 54) and React Native, with a Node backend over Postgres.

---

## Quick start

```bash
npm install
npx expo start
```

Backend (separate dependency tree — see [Backend](#backend)):

```bash
cd backend && npm install && npm start
```

> **Location matters.** Keep this project out of `~/Desktop` and `~/Documents`.
> Both are iCloud-synced, and syncing a `node_modules` tree makes builds
> pathologically slow — `npm install` took 26 minutes there versus 21 seconds
> in `~/Developer`. See [Known gotchas](#known-gotchas).

---

## Project layout

| Path | What it is |
|---|---|
| `app/` | Screens (expo-router file-based routing) |
| `app/(tabs)/` | Home, Bible, Notes, Prayer, Quiz |
| `components/` | Shared UI |
| `constants/` | Theme, Bible data, quiz bank, identity mapping |
| `assets/bible/kjv/` | Bundled KJV, one JSON file per book |
| `hooks/` | Data hooks (notes, prayers, plans, chapters, quiz results) |
| `context/` | Auth and settings providers |
| `backend/` | Node API — its own `package.json` |
| `scripts/build-bible.mjs` | Regenerates the offline Bible bundle |
| `Rooted/` | **Legacy snapshot — ignore.** Excluded from `tsconfig.json` |

---

## Features

### Bible

The **complete KJV ships with the app**: 66 books, 1,189 chapters, 31,100
verses, in `assets/bible/kjv/`. Reading works with no network at all.

Additional translations — WEB, ASV, BBE, YLT, Darby — are fetched on demand
from [bible-api.com](https://bible-api.com) and cached on device. If a fetch
fails the reader falls back to the bundled KJV rather than showing nothing.

**Every translation is public domain.** This is deliberate: the app originally
shipped NIV-worded sample text, which is copyrighted by Biblica and would have
needed a licence for App Store distribution.

Regenerate the bundle with:

```bash
npm run build:bible
```

`constants/bible-books.ts` and `constants/bible-offline.ts` are generated — do
not edit them by hand. The loader map is lazy, so opening one book does not
parse all 66.

### Notes and Prayer

Both are **offline-first**. Every edit writes to AsyncStorage immediately; the
backend is a sync layer that pushes pending work and reconciles on reconnect.
Nothing depends on a request succeeding — losing a journal entry to a network
blip is not acceptable.

The shared machinery lives in `hooks/use-synced-collection.ts`; `use-notes` and
`use-prayers` are thin wrappers over it.

Records carry a `pending` flag (`create` / `update` / `delete`). Local edits win
over server state, and deletes are tombstoned until the server confirms.

### Quiz

Questions are tagged with **both a book and one or more topics**, so a single
bank feeds two browsing modes: study John then quiz on John, or study the
parables across the gospels then quiz on Parables.

Questions shuffle per attempt. Best score and attempt count are stored per
subject on device (`rooted:quiz-results:v1`).

### Study plans (backend complete, screens not yet built)

Users author a plan with a passage per day, then share it. Members mark days
done, see each other's progress, and write what they learnt that day.

- **Visibility** is `private`, `link` (six-character join code), or `public`
  (listed in a directory). Enforced in `getPlan()`, not at each route.
- **`current_day`** is the furthest *consecutive* day finished — someone who
  skips to day 20 without doing 2–19 still shows as day 1.
- **Streaks** count distinct calendar days across every plan, and survive if
  you read today or yesterday. Three plans in one day is one day of streak.

### Moderation

Shared reflections make this a user-generated-content app, which **App Store
Review Guideline 1.2 requires** be reportable and blockable. Apps are rejected
without it.

- `POST /v1/reports` — a reflection auto-hides once three distinct people flag
  it, so obvious abuse goes before a human sees it
- `/v1/blocks` — blocked users are filtered from every reflection feed, member
  list, and the public plan directory

### Real data only

No screen shows a fabricated figure. Counts come from the user's own records,
plan progress is `currentDay / durationDays` from the server, and streaks are
computed from actual completion dates.

**When data cannot be loaded, screens show zero or an empty state — never a
placeholder.** `usePlans` keeps the last real values on network failure rather
than substituting a guess. Verse of the day rotates by calendar day with its
text read from the bundled KJV.

---

## Authentication

Sign-in accepts **email, username, or phone number, plus a password**, or
**Sign in with Apple**.

Firebase has no phone+password or username+password provider, so
`constants/identity.ts` maps the latter two onto synthetic addresses:

```
ada@example.com   ->  ada@example.com                        (as-is)
adalovelace       ->  adalovelace@users.rootedbible.app
+233 20 123 4567  ->  233201234567@phone.rootedbible.app
```

Firebase already enforces one account per email, so **usernames and phone
numbers inherit that uniqueness for free** — no separate collision check.

Two deliberate choices:

- Failed sign-ins return **one vague message** regardless of cause, and the
  reset screen reports success even for unknown addresses. Neither can be used
  to discover which accounts exist.
- Sign-up asks for a **recovery email** when the identifier is a username or
  phone, since those are not real inboxes and a forgotten password would
  otherwise be unrecoverable.

**Firebase Console setup required:** Authentication → Sign-in method → enable
**Email/Password**. Without it every sign-up fails with
`auth/operation-not-allowed`.

---

## Backend

`backend/` has **its own `package.json`** and dependency tree. It must: the app
keeps `firebase-admin` in devDependencies, which would break a production
install of the backend.

### Database

Postgres (Supabase). Apply the schema:

```bash
cd backend && npm install && npm run migrate
```

`schema.sql` is idempotent, so it doubles as the migration — re-run it after
edits.

Data is **keyed by Firebase uid and every query filters on it**. The original
store kept one global `notes` and `prayers` array in a JSON file, so every
signed-in account read and wrote the same rows.

Row Level Security is enabled with **no permissive policies**. The backend
connects as `postgres` and enforces access itself, so RLS is not what gates
these tables — but anything reaching the database through Supabase's public
anon key reads nothing.

### API

| Method | Path | Notes |
|---|---|---|
| `POST` | `/v1/auth/login` | Firebase idToken → profile |
| `POST` | `/v1/auth/logout` | Revokes refresh tokens |
| `POST` | `/v1/auth/password-reset` | Always 200 — see below |
| `POST` | `/v1/auth/welcome` | Welcome email |
| `GET` | `/v1/me` | Profile + settings |
| `GET/PUT/PATCH` | `/v1/me/settings` | |
| `GET` | `/v1/me/streak` | Current and longest |
| `GET/POST` | `/v1/notes` | |
| `PATCH/DELETE` | `/v1/notes/:id` | |
| `GET/POST` | `/v1/prayers` | |
| `PATCH/DELETE` | `/v1/prayers/:id` | |
| `GET/POST` | `/v1/plans` | `?scope=mine\|public`, `?code=ABC123` |
| `GET/DELETE` | `/v1/plans/:id` | |
| `POST` | `/v1/plans/:id/join`, `/leave` | |
| `GET` | `/v1/plans/:id/members` | |
| `POST/DELETE` | `/v1/plans/:id/days/:day/complete` | |
| `GET/POST` | `/v1/plans/:id/days/:day/reflections` | |
| `PATCH/DELETE` | `/v1/reflections/:id` | |
| `GET/POST` | `/v1/reports`, `/v1/blocks` | Moderation |
| `GET/POST` | `/v1/quiz/results` | |
| `GET/PATCH` | `/v1/reading-plans` | |
| `GET` | `/v1/health` | Reports database reachability |

`/v1/auth/password-reset` **always answers 200**, whether or not the address is
registered. Any other behaviour would turn it into an account-existence oracle.

### Email

Transactional mail goes through [Resend](https://resend.com). Firebase can send
reset mail itself, but the template is theirs and the sender reads
`firebaseapp.com` — so the backend asks the Admin SDK for the reset *link* and
delivers it in a Rooted-branded message.

`RESEND_FROM` must use a domain **verified in Resend**. Until you verify one,
use their sandbox sender, which only delivers to your own Resend account email:

```
RESEND_FROM="Rooted <onboarding@resend.dev>"
```

### Environment

Copy `.env.example` to `.env`. Required for the backend to function at all:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Supabase connection string |
| `FIREBASE_PROJECT_ID` | Token verification |
| `FIREBASE_CLIENT_EMAIL` | From the service account JSON |
| `FIREBASE_PRIVATE_KEY` | From the service account JSON |
| `RESEND_API_KEY` | Transactional email |
| `RESEND_FROM` | Verified sender |
| `EXPO_PUBLIC_BACKEND_API_BASE_URL` | Where the app looks for the API |

Without the Firebase values **every authenticated endpoint returns 503**.

### Deployment

`backend/render.yaml` is a Render blueprint. Secrets are marked `sync: false`
and must be set in the dashboard, never committed.

iOS blocks plaintext HTTP, so a device build needs an **HTTPS** backend URL in
the `production` profile of `eas.json`.

---

## iOS builds

```bash
npx eas build --platform ios --profile production
npx eas submit --platform ios --latest
```

| Profile | Target |
|---|---|
| `development` | Dev client, simulator |
| `preview` | Simulator, unsigned — **no Apple credentials needed** |
| `preview:device` | Real device, signed |
| `production` | App Store / TestFlight |

- Bundle ID: `com.rootedbible.app` (`com.rooted.app` was already taken globally)
- Team: Accra Resource Center LBG (`3FPZL5YV7Z`)
- App Store ID: `6798345216`
- EAS project owner: `accra-resource-center`

`appVersionSource` is `remote`, so **EAS owns the build number** — do not set
`ios.buildNumber` in `app.json`.

**Credential creation cannot be automated.** EAS refuses to generate a
distribution certificate in `--non-interactive` mode; that first build must be
run by a human answering the prompts. Local `credentials.json` (gitignored)
bypasses this once certificates exist.

---

## Known gotchas

**Do not keep this project in an iCloud-synced folder.** Measured on the same
machine, same day:

| Operation | `~/Desktop` (iCloud) | `~/Developer` |
|---|---|---|
| `git clone` | 10 min, timed out | 4 s |
| `npm install` | 26 min | 21 s |
| `git status` | 6+ min, timed out | 1 s |
| `tsc --noEmit` | killed 6× | 3 s |
| `eas build` | hung twice, never uploaded | succeeded |

**`tsconfig.json` excludes `Rooted/`.** That legacy snapshot is a second full
React Native app with its own `node_modules`; without the exclusion every
typecheck pulls it in and reports ~70 irrelevant errors.

**`expo-firebase-recaptcha` was vendored, then deleted.** It was unmaintained
and pulled in `expo-firebase-core`, which uses pre-SDK-44 autolinking that no
longer works. Removing phone OTP removed the need entirely.

---

## Setup checklist

- [ ] Firebase → Authentication → enable **Email/Password**
- [ ] Firebase → download service account JSON → set the three `FIREBASE_*` vars
- [ ] Supabase → copy connection string → `DATABASE_URL`
- [ ] `cd backend && npm install && npm run migrate`
- [ ] Resend → verify a sending domain (or use the sandbox sender)
- [ ] Deploy the backend and set the production URL in `eas.json`
- [ ] App Store Connect → set Category, Content Rights, Age Rating
