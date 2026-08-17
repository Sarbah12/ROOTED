# Project status

Last updated: 2026-08-14

A candid account of what works, what is built but unverified, and what is still
missing. See [README](../README.md) for how the app is put together.

---

## Verified

Things that have actually been run and observed to work.

| | Evidence |
|---|---|
| TypeScript compiles clean | `tsc --noEmit`, 0 errors |
| Lint clean | `expo lint`, 0 errors and 0 warnings |
| iOS build succeeds | EAS build `4baa7982`, signed `.ipa`, five minutes |
| TestFlight upload | "Submitted your app to Apple App Store Connect" |
| Verse rotation never repeats | 2,567 pool entries, full cycle walked: 2,567 distinct, 0 consecutive repeats, cycle 2 shares no position with cycle 1 |
| Backend boots in a container | Clean `npm ci --omit=dev` of `backend/` alone serves `/health` 200 on `0.0.0.0` |
| Offline Bible bundle | 66 books / 1,189 chapters / 31,102 verses — every chapter's verse count checked against a second source, all 1,189 match |
| Bible text is clean | 0 verses carrying translator apparatus, down from 6,406 before the source was replaced |
| Bible reader | John 3 and Psalms 23 rendered from the bundle in a running app |
| Translation coverage | Genesis 1 requested from all 17; six are NT-only and badged |
| Translation picker | 8 language groups render, offline and NT-only badges shown |
| Offline verse search | "good shepherd" returns John 10:11 and 10:14; full scan 160 ms |
| Phrase search | Loose "born again" gives Genesis 29:34; quoted gives only John 3:3 and 3:7 |
| Mark persistence | Highlights survive reload, stay keyed per chapter, no cross-chapter bleed |
| Resume reading | A saved position reopened Psalms 23 rather than the default chapter |
| Verse to note | Reference and quoted text carried into the note editor |
| Identifier detection | Username, phone and email each classified correctly at sign-up |
| Sermon note fields | Preacher fields appear only in sermon mode |
| App icon and splash | Generated from the Rooted mark, inspected |
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
- **Study plans, streaks, reflections, moderation.** Whole API surface
  untested, and the four screens over it have never rendered against real
  data.
- **Notes and prayer sync.** The offline half works on device; the sync half has
  never reached a server.
- **Sign in with Apple.** Entitlement and provisioning profile are correct, but
  the flow has not been exercised.

---

## Not built

- **Reading plan progress writes.** `PATCH /v1/reading-plans` exists; nothing
  calls it. Superseded in practice by study plans, so it may be dead weight.
- **Welcome email trigger.** `POST /v1/auth/welcome` exists; sign-up does not
  call it. Not a one-line fix: username and phone sign-ups are mapped onto
  synthetic addresses (`@users.rootedbible.app`, `@phone.rootedbible.app`), so
  sending blindly would hard-bounce and cost sender reputation. Both the caller
  and the handler need to skip addresses that are not real inboxes.
- **Blog cover images.** `posts.cover_image_url` exists in the schema; there is
  no upload path and no storage bucket.

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

**Three live credentials were pasted into a chat transcript:**

| Credential | Where | Action |
|---|---|---|
| App Store Connect key `LKYA6Y6CZ4` | `~/Downloads/AuthKey_LKYA6Y6CZ4.p8` | App Store Connect → Users and Access → Integrations → revoke, regenerate |
| Resend API key `re_BJzVu9pw…` | `.env` | Resend → API Keys → revoke, regenerate |
| NLT API key `17681cb9…` | `.env` | Lower stakes — a free non-commercial key, capped at 5,000 requests a day, so misuse burns quota rather than money. Still tied to your Tyndale registration; regenerate if the transcript is ever shared. |

None is in the repository — `.gitignore` covers `.env`, `*.p8`, `*.p12`,
`*.mobileprovision`, and `credentials.json`. The exposure is the transcript, not
the repo.

Local signing material lives in `~/Developer/rooted-credentials/` (`700`),
outside the project directory.

---

## TestFlight

Build 13 (`4baa7982`, version 1.0.0) is uploaded and processing.

**It was built against the placeholder backend URL.** `eas.json` still points
the production profile at `https://CHANGE-ME.example.com`, which does not
resolve, so every server call fails at the network layer and the screens fall
back to their cached-or-empty states rather than crashing. This was a deliberate
choice — the on-device half was worth testing before the backend exists.

What build 13 exercises honestly: the Bible reader and search, verse of the day
and its rotation, staying signed in across restarts, highlights and reading
position, the quiz, and on-device notes and prayers.

What will fail in it: study plans, the blog, notes and prayer sync, streaks,
reflections, and the licensed translations (NKJV, NLT, AMP).

The next build must set that URL to the real Railway domain first.

---

## App Store readiness

| Requirement | State |
|---|---|
| Bundle ID registered | Done — `com.rootedbible.app` |
| Sign in with Apple capability | Done |
| Encryption declaration | Done — `ITSAppUsesNonExemptEncryption: false` |
| App icon and splash | Done |
| Category | **Not set** — suggest Reference / Education |
| Content rights | **Not set** — and the answer changed when the NLT landed. It is no longer "no third-party content": the app now displays licensed text from Tyndale, so declare third-party content and be ready to show the licence terms |
| Age rating | **Not set** — answering "none" throughout gives 4+ |
| UGC report/block UI | Done — report and block on every reflection |
| Privacy policy URL | **Not written** — required |
| macOS platform entry | Should be **deleted** from App Store Connect; iOS only |

---

## Decisions worth remembering

**Public domain by default, licensed by exception.** The original sample text
was NIV-worded, which is copyrighted. Everything bundled or fetched without a
key is public domain. The exceptions are deliberate and each needs its own
licence: NKJV and AMP through API.Bible, and the NLT direct from Tyndale.

**The NLT does not go through API.Bible.** Tyndale publish it and run their own
API, which gives 5,000 requests a day free and a direct line for a commercial
licence — better than a slot in API.Bible's three-Bible non-commercial tier.
Requests must pin `version=NLT` or references resolve to Spanish first.

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

---

## Building locally (when the EAS quota is out)

The free EAS plan caps iOS builds per month. Local builds now work and are not
capped:

```
eas build --platform ios --profile production --local
```

**What made them fail for six attempts, and the fix.** A leftover
`rydechain-build.keychain` sat in the *system-wide* keychain search list. It
held a locked copy of a certificate whose display name is identical to the one
the build needs — distribution certificates are per Apple team, and Rooted and
RYDECHAIN share team `3FPZL5YV7Z`, so the same certificate appears in both
projects' keychains.

codesign resolves identities by name, kept selecting the copy in that locked
keychain, and failed with `errSecInternalComponent`. Unlocking the *login*
keychain did nothing, because the login keychain was never the one being asked
for. A macOS prompt naming "rydechain-build" is what finally identified it.

The fix was to take that keychain out of the global search list — nothing
deleted, no certificate touched:

```
security list-keychains -d user -s ~/Library/Keychains/login.keychain-db
```

If local signing breaks again, check that list first:
`security list-keychains -d user`.

**Also required.** `fastlane` must be installed (`brew install fastlane`); the
cloud builder ships with it. Set `LANG`/`LC_ALL` to a UTF-8 locale or the Ruby
tooling warns and misbehaves.

**Credentials.** Three distribution certificates exist on the team account, all
displaying the same name. The profile `Rooted AppStore All Distribution`
(`WTZ495NSCR`) contains all three, so signing succeeds whichever one Xcode
picks. `credentials.json` (gitignored) points at it, and the production profile
uses `credentialsSource: local`.

# Project status

Last updated: 2026-08-14

A candid account of what works, what is built but unverified, and what is still
missing. See [README](../README.md) for how the app is put together.

---

## Verified

Things that have actually been run and observed to work.

| | Evidence |
|---|---|
| TypeScript compiles clean | `tsc --noEmit`, 0 errors |
| Lint clean | `expo lint`, 0 errors and 0 warnings |
| iOS build succeeds | EAS build `4baa7982`, signed `.ipa`, five minutes |
| TestFlight upload | "Submitted your app to Apple App Store Connect" |
| Verse rotation never repeats | 2,567 pool entries, full cycle walked: 2,567 distinct, 0 consecutive repeats, cycle 2 shares no position with cycle 1 |
| Backend boots in a container | Clean `npm ci --omit=dev` of `backend/` alone serves `/health` 200 on `0.0.0.0` |
| Offline Bible bundle | 66 books / 1,189 chapters / 31,102 verses — every chapter's verse count checked against a second source, all 1,189 match |
| Bible text is clean | 0 verses carrying translator apparatus, down from 6,406 before the source was replaced |
| Bible reader | John 3 and Psalms 23 rendered from the bundle in a running app |
| Translation coverage | Genesis 1 requested from all 17; six are NT-only and badged |
| Translation picker | 8 language groups render, offline and NT-only badges shown |
| Offline verse search | "good shepherd" returns John 10:11 and 10:14; full scan 160 ms |
| Phrase search | Loose "born again" gives Genesis 29:34; quoted gives only John 3:3 and 3:7 |
| Mark persistence | Highlights survive reload, stay keyed per chapter, no cross-chapter bleed |
| Resume reading | A saved position reopened Psalms 23 rather than the default chapter |
| Verse to note | Reference and quoted text carried into the note editor |
| Identifier detection | Username, phone and email each classified correctly at sign-up |
| Sermon note fields | Preacher fields appear only in sermon mode |
| App icon and splash | Generated from the Rooted mark, inspected |
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
- **Study plans, streaks, reflections, moderation.** Whole API surface
  untested, and the four screens over it have never rendered against real
  data.
- **Notes and prayer sync.** The offline half works on device; the sync half has
  never reached a server.
- **Sign in with Apple.** Entitlement and provisioning profile are correct, but
  the flow has not been exercised.

---

## Not built

- **Reading plan progress writes.** `PATCH /v1/reading-plans` exists; nothing
  calls it. Superseded in practice by study plans, so it may be dead weight.
- **Welcome email trigger.** `POST /v1/auth/welcome` exists; sign-up does not
  call it. Not a one-line fix: username and phone sign-ups are mapped onto
  synthetic addresses (`@users.rootedbible.app`, `@phone.rootedbible.app`), so
  sending blindly would hard-bounce and cost sender reputation. Both the caller
  and the handler need to skip addresses that are not real inboxes.
- **Blog cover images.** `posts.cover_image_url` exists in the schema; there is
  no upload path and no storage bucket.

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

**Three live credentials were pasted into a chat transcript:**

| Credential | Where | Action |
|---|---|---|
| App Store Connect key `LKYA6Y6CZ4` | `~/Downloads/AuthKey_LKYA6Y6CZ4.p8` | App Store Connect → Users and Access → Integrations → revoke, regenerate |
| Resend API key `re_BJzVu9pw…` | `.env` | Resend → API Keys → revoke, regenerate |
| NLT API key `17681cb9…` | `.env` | Lower stakes — a free non-commercial key, capped at 5,000 requests a day, so misuse burns quota rather than money. Still tied to your Tyndale registration; regenerate if the transcript is ever shared. |

None is in the repository — `.gitignore` covers `.env`, `*.p8`, `*.p12`,
`*.mobileprovision`, and `credentials.json`. The exposure is the transcript, not
the repo.

Local signing material lives in `~/Developer/rooted-credentials/` (`700`),
outside the project directory.

---

## TestFlight

Build 13 (`4baa7982`, version 1.0.0) is uploaded and processing.

**It was built against the placeholder backend URL.** `eas.json` still points
the production profile at `https://CHANGE-ME.example.com`, which does not
resolve, so every server call fails at the network layer and the screens fall
back to their cached-or-empty states rather than crashing. This was a deliberate
choice — the on-device half was worth testing before the backend exists.

What build 13 exercises honestly: the Bible reader and search, verse of the day
and its rotation, staying signed in across restarts, highlights and reading
position, the quiz, and on-device notes and prayers.

What will fail in it: study plans, the blog, notes and prayer sync, streaks,
reflections, and the licensed translations (NKJV, NLT, AMP).

The next build must set that URL to the real Railway domain first.

---

## App Store readiness

| Requirement | State |
|---|---|
| Bundle ID registered | Done — `com.rootedbible.app` |
| Sign in with Apple capability | Done |
| Encryption declaration | Done — `ITSAppUsesNonExemptEncryption: false` |
| App icon and splash | Done |
| Category | **Not set** — suggest Reference / Education |
| Content rights | **Not set** — and the answer changed when the NLT landed. It is no longer "no third-party content": the app now displays licensed text from Tyndale, so declare third-party content and be ready to show the licence terms |
| Age rating | **Not set** — answering "none" throughout gives 4+ |
| UGC report/block UI | Done — report and block on every reflection |
| Privacy policy URL | **Not written** — required |
| macOS platform entry | Should be **deleted** from App Store Connect; iOS only |

---

## Decisions worth remembering

**Public domain by default, licensed by exception.** The original sample text
was NIV-worded, which is copyrighted. Everything bundled or fetched without a
key is public domain. The exceptions are deliberate and each needs its own
licence: NKJV and AMP through API.Bible, and the NLT direct from Tyndale.

**The NLT does not go through API.Bible.** Tyndale publish it and run their own
API, which gives 5,000 requests a day free and a direct line for a commercial
licence — better than a slot in API.Bible's three-Bible non-commercial tier.
Requests must pin `version=NLT` or references resolve to Spanish first.

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

---

## Building locally (when the EAS quota is out)

The free EAS plan allows a limited number of iOS builds a month; it ran out on
14 August and resets on the 1st. Cloud builds work unchanged. Local builds do
not, and the reason is worth writing down because it took a while to find.

**The blocker.** Three distribution certificates exist on the Apple account,
all displaying the same name:

| Serial | Apple id | Where the private key is |
|---|---|---|
| `5C315540…` | `6FRVN5X239` | login keychain, and `rydechain-build.keychain` |
| `55784328…` | `86C8DX3Z5M` | `rooted-credentials/distribution.p12` |
| `2B7A4570…` | `CVAHQHWG3V` | EAS servers |

Xcode resolves the shared name to `5C315540…`, then codesign fails with
`errSecInternalComponent` — it cannot reach that key, because EAS builds
against its own temporary keychain rather than the login one.

**Already done.** A profile `Rooted AppStore All Distribution` (`WTZ495NSCR`)
was created containing all three certificates, so the profile no longer
rejects whichever one Xcode picks. That removed the earlier
"profile doesn't include signing certificate" failure.

**What is still needed** — one of these, both requiring a human at the machine:

1. Let codesign use the login keychain key without a prompt:
   `security unlock-keychain ~/Library/Keychains/login.keychain-db` then
   `security set-key-partition-list -S apple-tool:,apple: -s ~/Library/Keychains/login.keychain-db`
   Both ask for the account password, which is why they cannot be scripted here.

2. Or remove `5C315540…` from the login and `rydechain-build` keychains so Xcode
   falls through to the certificate in the p12. Export it first — deleting takes
   the private key with it, and it is shared with the RYDECHAIN signing setup.

`credentials.json` (gitignored) already points at the new profile and the
matching p12. `credentialsSource` is left at the default so cloud builds keep
using EAS credentials, which is the path known to work.
