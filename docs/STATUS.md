# Project status

Last updated: 2026-08-06

A candid account of what works, what is built but unverified, and what is still
missing. See [README](../README.md) for how the app is put together.

---

## Verified

Things that have actually been run and observed to work.

| | Evidence |
|---|---|
| TypeScript compiles clean | `tsc --noEmit`, 0 errors |
| iOS build succeeds | EAS build 9, signed `.ipa` |
| TestFlight upload | "Submitted your app to Apple App Store Connect" |
| Offline Bible bundle | 66 books / 1,189 chapters / 31,100 verses, spot-checked |
| Bible API reachable | `bible-api.com` returns chapters for numbered books |
| App icon and splash | Generated from the Rooted logo, inspected |
| Backend syntax | `node --check` on every `.mjs` |

---

## Built but never executed

Written, typechecked, and reviewed — but no code path below has run against a
live system. Expect some of it to need adjustment on first contact.

- **Password sign-in, sign-up, password reset.** Requires the Firebase
  Email/Password provider, which is not yet enabled.
- **Everything touching Postgres.** No database exists yet; the schema has never
  been applied.
- **Resend email.** No message has been sent. Sender domain unverified.
- **Study plans, streaks, reflections, moderation.** Whole API surface untested.
- **Notes and prayer sync.** The offline half works on device; the sync half has
  never reached a server.
- **Sign in with Apple.** Entitlement and provisioning profile are correct, but
  the flow has not been exercised.

---

## Not built

- **Study plan screens.** The backend is complete; there is no UI to browse,
  create, join, or view a plan, and no reflection feed. This is the largest
  remaining piece of app work.
- **Report and block UI.** Endpoints exist. Apple requires the controls to be
  reachable from the interface, so this is **required before App Store review**
  once reflections are visible in the app.
- **Reading plan progress writes.** `PATCH /v1/reading-plans` exists; nothing
  calls it.
- **Welcome email trigger.** `POST /v1/auth/welcome` exists; sign-up does not
  call it.

---

## Blocking setup

None of the backend features can run until these are done. All require account
access rather than code.

1. **Firebase → Authentication → enable Email/Password.**
   Until then every sign-up fails with `auth/operation-not-allowed`.

2. **Firebase → service account JSON → set `FIREBASE_*` in `.env`.**
   Without it *every* authenticated endpoint returns
   `503 Firebase config is missing`. Confirmed by hitting `/v1/me` directly.

3. **Supabase → connection string → `DATABASE_URL`, then `npm run migrate`.**
   No tables exist yet.

4. **Resend → verify a sending domain.**
   `RESEND_FROM` is set to `noreply@rootedbible.app`, which Resend will reject
   until the domain is verified. Use `onboarding@resend.dev` meanwhile — it only
   delivers to your own Resend account address.

---

## Security debt

**Two live credentials were pasted into a chat transcript and should be
rotated:**

| Credential | Where | Action |
|---|---|---|
| App Store Connect key `LKYA6Y6CZ4` | `~/Downloads/AuthKey_LKYA6Y6CZ4.p8` | App Store Connect → Users and Access → Integrations → revoke, regenerate |
| Resend API key `re_BJzVu9pw…` | `.env` | Resend → API Keys → revoke, regenerate |

Neither is in the repository — `.gitignore` covers `.env`, `*.p8`, `*.p12`,
`*.mobileprovision`, and `credentials.json`. The exposure is the transcript, not
the repo.

Local signing material lives in `~/Developer/rooted-credentials/` (`700`),
outside the project directory.

---

## TestFlight

Build 9 is uploaded and processing. **It is already out of date** — it contains
the phone-OTP login, which has since been replaced by password sign-in. A new
build is needed once the Firebase provider is enabled.

What build 9 can usefully exercise: the Bible reader, quiz, and on-device
persistence for notes, prayers, and settings.

---

## App Store readiness

| Requirement | State |
|---|---|
| Bundle ID registered | Done — `com.rootedbible.app` |
| Sign in with Apple capability | Done |
| Encryption declaration | Done — `ITSAppUsesNonExemptEncryption: false` |
| App icon and splash | Done |
| Category | **Not set** — suggest Reference / Education |
| Content rights | **Not set** — answer "no third-party content" (KJV is public domain) |
| Age rating | **Not set** — answering "none" throughout gives 4+ |
| UGC report/block UI | **Not built** — required by Guideline 1.2 |
| Privacy policy URL | **Not written** — required |
| macOS platform entry | Should be **deleted** from App Store Connect; iOS only |

---

## Decisions worth remembering

**Public-domain translations only.** The original sample text was NIV-worded,
which is copyrighted. Every translation now shipped or fetched is public domain,
so no licence is needed.

**Auth identifiers map onto synthetic emails.** Firebase has no phone+password
or username+password provider. Mapping them onto addresses on owned domains
gets uniqueness enforcement for free.

**Consecutive-day progress.** `current_day` counts the furthest unbroken run, so
skipping ahead does not inflate someone's position on the member list.

**Zero, not placeholder.** Any figure that cannot be loaded renders as zero or
an empty state. Cached values are kept on failure because they were real once; a
guess is never substituted.

**Keep the project out of iCloud.** `~/Desktop` and `~/Documents` are synced,
which made builds unusably slow. See the table in the README.
