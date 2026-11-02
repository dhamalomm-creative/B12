# Configuration

All configuration is through environment variables. Never commit real values — `.env` and `.env*.local` are git-ignored.

| App | Template | Copy to |
|---|---|---|
| API | `B12-Project/backend/node-service/.env.example` | `B12-Project/backend/node-service/.env` |
| Web | `B12-Project/frontend-web/.env.example` | `B12-Project/frontend-web/.env.local` |
| Docker Compose | `B12-Project/.env.docker.example` | `B12-Project/.env` |

## API (`backend/node-service`)

The API validates its environment at startup (`src/config/validateEnv.js`) and **refuses to start** if a required value is missing or unsafe.

### Required

| Variable | Example | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres` | Postgres connection string. Surrounding quotes and whitespace are stripped. URL-encode special characters in the password (`@` → `%40`, `#` → `%23`). |
| `JWT_SECRET` | 64 hex chars | At least 32 characters. Rejected if it contains words like `secret`, `password`, `changeme`, starts with `REPLACE`, or matches a value that was ever published in this repo. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. |
| `ALLOWED_ORIGINS` | `https://b12.example.com,http://localhost:3001` | **Required when `NODE_ENV=production`.** Comma-separated exact origins, no trailing slash. |

### Server

| Variable | Default | Notes |
|---|---|---|
| `NODE_ENV` | `development` | `development`, `test` or `production`. Production hides error details and turns on SSL to the DB. |
| `PORT` | `3000` | Hosting platforms set this. `NODE_PORT` is used as a fallback. |
| `LOG_LEVEL` | `info` | `error`, `warn`, `info`, `debug` |

### Database

| Variable | Default | Notes |
|---|---|---|
| `DATABASE_SSL` | — | `true` forces SSL. SSL is also on automatically in production and for any `supabase.com` host. |
| `DB_POOL_MAX` | `10` | Max pool size for a long-running server. On Vercel the pool is fixed at 2. |

> `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` in `.env.example` are only used by `backend/docker-compose.yml`. The API itself connects through `DATABASE_URL`.

### Auth

| Variable | Default | Notes |
|---|---|---|
| `JWT_EXPIRES_IN` | `7d` | Any [`ms`](https://github.com/vercel/ms) duration |
| `JWT_ISSUER` | `b12-health` | Must match between the token issuer and verifier |
| `JWT_AUDIENCE` | `b12-app` | Same |
| `MAX_LOGIN_ATTEMPTS` | `5` | Failed logins per email before the temporary lockout; also the auth rate-limit size |
| `ACCOUNT_LOCKOUT_MINUTES` | `15` | Window for counting failed logins |

Changing `JWT_SECRET`, `JWT_ISSUER` or `JWT_AUDIENCE` signs every user out.

### CORS and rate limiting

| Variable | Default | Notes |
|---|---|---|
| `ALLOW_VERCEL_PREVIEWS` | `true` in dev, `false` in production | Also allow any `*.vercel.app` origin. Keep it off in production — anyone can deploy to `vercel.app`. |
| `RATE_LIMIT_WINDOW_MS` | `900000` (15 min) | General API limiter window |
| `RATE_LIMIT_MAX` | `300` | Requests per IP per window. The Docker Compose files default this to `100`. |

Outside production, `localhost` and `127.0.0.1` origins are always allowed. If `ALLOWED_ORIGINS` is empty or `*`, every origin is allowed (development only).

### Unused

`FASTAPI_URL`, `ENABLE_MONGODB` and `MONGODB_URL` remain in `.env.example` from the old Python setup. The current code does not read them.

## Web app (`frontend-web`)

All three are `NEXT_PUBLIC_*`, so they are **baked into the browser bundle at build time**. Rebuild (or redeploy on Vercel) after changing them, and never put secrets here.

| Variable | Default | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | API base URL, no trailing slash. Also added to the CSP `connect-src`. |
| `NEXT_PUBLIC_SITE_URL` | — | Public URL of the web app, used for metadata, Open Graph, `sitemap.xml` and `robots.txt` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | — | Contact address shown in the Privacy Policy |

## Docker Compose (`B12-Project/docker-compose.yml`)

| Variable | Required | Default |
|---|---|---|
| `DATABASE_URL` | yes | — |
| `JWT_SECRET` | yes | — |
| `DATABASE_SSL` | | `true` |
| `ALLOWED_ORIGINS` | | `http://localhost:3001` |
| `NEXT_PUBLIC_API_URL` | | `http://localhost:3000` |
| `NODE_ENV` | | `production` |
| `JWT_EXPIRES_IN`, `JWT_ISSUER`, `JWT_AUDIENCE`, `RATE_LIMIT_*`, `MAX_LOGIN_ATTEMPTS`, `ACCOUNT_LOCKOUT_MINUTES`, `LOG_LEVEL` | | as above |

> `NEXT_PUBLIC_API_URL` is passed to the `web` container at runtime, but Next.js inlines it at build time. If your API is not at `http://localhost:3000`, build the image with the correct value set.
