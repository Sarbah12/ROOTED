# Deploying the backend

17 translations in the app are unreachable for one reason: the production
build points at `https://CHANGE-ME.example.com`. Nothing else is wrong with
them — the API keys work, the server serves them, the code is written. This is
the deploy that turns them on.

It is worth doing in two stages, because **stage one needs one variable and
unlocks 14 of the 17**.

---

## Stage 1 — the Bible proxy (14 translations)

The server runs perfectly well with no database and no Firebase. In that mode
it does one job: it holds the API.Bible key and serves the public-domain and
openly licensed translations to anyone, no account required. Verified locally —
Romans 8 came back in Geneva 1599, Reina Valera 1909, Darby's French, the
Clementine Vulgate, Czech Kralická, Chinese, LSV and T4T with nothing set but
the key.

**One variable:**

| Variable | Value |
| --- | --- |
| `API_BIBLE_KEY` | your API.Bible key (in `.env` locally) |

`PORT` is injected by the platform — do not set it. `NODE_ENV=production` makes
the server bind `0.0.0.0`, which it must do to be reachable; Railway sets this
for you, but set it explicitly if your platform does not.

**Healthcheck path: `/health`.** Not `/v1/health`. The unversioned one only
reports that the process is up. The versioned one also reports the database,
and while it no longer fails a database-free deploy, `/health` is the one that
cannot give a false negative.

After deploying, `GET /v1/health` describes exactly what the deployment can do:

```json
{"ok":true,"database":"not configured","bible":"ok","nlt":"no NLT_API_KEY","accounts":"disabled (no database)"}
```

Then set the app's backend URL to the real domain in `eas.json` under
`build.production.env.EXPO_PUBLIC_BACKEND_API_BASE_URL`, and build. Those 14
translations start working — with no sign-in, because they need none.

---

## Stage 2 — accounts, and the three commercial translations

NKJV, AMP and NLT are licensed text and the server requires a signed-in user
before it will proxy them. That means Firebase, which means the rest of the
account features come with it.

| Variable | Value |
| --- | --- |
| `NLT_API_KEY` | Tyndale key, for the NLT specifically |
| `DATABASE_URL` | Postgres connection string |
| `FIREBASE_PROJECT_ID` | from the Firebase console |
| `FIREBASE_CLIENT_EMAIL` | from the service account JSON |
| `FIREBASE_PRIVATE_KEY` | from the service account JSON (keep the `\n` escapes) |
| `RESEND_API_KEY` | only needed for the welcome and reset emails |
| `RESEND_FROM` | e.g. `Rooted <onboarding@resend.dev>` until a domain is verified |
| `APP_PUBLIC_URL` | the app's public URL, used in email links |
| `CORS_ORIGINS` | comma-separated, only needed for the web build |

`FIREBASE_SERVICE_ACCOUNT_JSON` may be used instead of the three separate
Firebase variables.

Two things must happen outside the deploy:

1. **Enable Email/Password in the Firebase console.** Nothing about sign-in
   works until this is on, and it cannot be done from here.
2. **Run the migrations** once `DATABASE_URL` is set:

   ```
   npm run migrate --prefix backend
   ```

---

## What still will not work

The Message is not available from any API the app can reach, at any price we
have. It needs a licence from NavPress before it can exist in the app at all.

---

## The npm audit warning, in advance

`npm ci --omit=dev` installs 151 packages and reports **8 moderate
vulnerabilities**. All eight are the same root cause — a missing buffer bounds
check in `uuid` v3/v5/v6 when a `buf` argument is passed — reached through
`firebase-admin` → Firestore/Cloud Storage → `gaxios`/`google-gax`.

None of it is reachable here. The backend imports only `firebase-admin/app`
and `firebase-admin/auth`, and calls exactly one thing: `verifyIdToken`.
Firestore and Cloud Storage are never loaded, and nothing calls `uuid` with a
buffer. Upgrading to firebase-admin 14 does not clear the advisories either, so
a major version bump buys nothing but risk to the auth path.

Left alone deliberately. Worth re-checking when `uuid` ships a fix upstream.
