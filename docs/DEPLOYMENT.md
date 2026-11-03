# Deployment

Recommended production setup:

| Component | Platform | Root directory |
|---|---|---|
| Database | Supabase | — |
| API | Railway (Docker) — or Vercel serverless | `B12-Project/backend/node-service` |
| Web app | Vercel | `B12-Project/frontend-web` |

Deploy in this order: **database → API → web app → update API CORS**.

## Before you deploy

- [ ] Generate a new `JWT_SECRET` for production (never reuse a development or published value):

  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

- [ ] Tests pass and the scoring parity check passes ([TESTING.md](TESTING.md)).
- [ ] Read the latest entry in [CHANGELOG.md](../CHANGELOG.md) for any required manual steps.

## 1. Database (Supabase)

1. Create a project and choose the region closest to your users (e.g. `ap-south-1` Mumbai).
2. **SQL Editor → New query** → paste and run `B12-Project/backend/database/supabase_setup.sql`.
3. **Database → Extensions** → enable `pg_cron`, then run `migrations/007_launch_hardening.sql` again so the nightly cleanup is scheduled.
4. **Project Settings → Database → Connection string → URI** — copy the pooler URL (port `6543`) and insert your password.

For an existing database, run only the new migrations instead of the full setup script.

## 2. API

### Shared rate limiting (Redis) — recommended

Create a small Redis database — e.g. [Upstash](https://upstash.com) → **Create database** (pick the region closest to your API), or **Railway → New → Database → Redis** — and copy its `rediss://…` connection URL. Add it to the API's variables as `REDIS_URL`.

Without it, every server instance counts rate limits on its own; on Vercel that lets an attacker spread login attempts across many instances. If Redis is ever unreachable the API keeps working (limits fail open, and the per-email login lockout is in Postgres).

### Option A — Railway

`railway.json` builds the `Dockerfile` and health-checks `/health`.

1. **New Project → Deploy from GitHub repo** → pick the repository.
2. **Settings → Root Directory:** `B12-Project/backend/node-service`.
3. **Variables:**

   ```env
   NODE_ENV=production
   DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
   DATABASE_SSL=true
   JWT_SECRET=<generated>
   JWT_EXPIRES_IN=7d
   ALLOWED_ORIGINS=https://<your-web-domain>
   ALLOW_VERCEL_PREVIEWS=false
   REDIS_URL=rediss://default:<password>@<host>:6379
   ```

   Railway sets `PORT` itself.
4. **Networking → Generate Domain**, then open `https://<api-domain>/health` — it should return `"status": "healthy"`.

### Option B — Vercel (serverless)

`vercel.json` rewrites every path to `api/index.js` and pins the region to `bom1` (Mumbai). Change the region to match your database.

1. **Add New → Project** → import the repo, **Root Directory:** `B12-Project/backend/node-service`, framework **Other**.
2. Add the same environment variables as above.
3. Deploy and check `/health`.

On Vercel the DB pool is limited to 2 connections per instance, and logs go to stdout (**Project → Logs**). Rate-limit counters are per instance.

### Option C — Docker on any server

```bash
cd B12-Project/backend/node-service
```

```bash
docker build -t b12-api .
```

```bash
docker run -d --name b12-api -p 3000:3000 --env-file .env --restart unless-stopped b12-api
```

Put it behind a reverse proxy (Nginx, Caddy) with HTTPS. The app trusts one proxy hop for client IPs.

## 3. Web app (Vercel)

1. **Add New → Project** → import the repo.
2. **Framework:** Next.js. **Root Directory:** `B12-Project/frontend-web`.
3. **Environment variables** (Production):

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://<api-domain>` (no trailing slash) |
   | `NEXT_PUBLIC_SITE_URL` | `https://<web-domain>` |
   | `NEXT_PUBLIC_CONTACT_EMAIL` | your support address |

4. Deploy. These values are baked in at build time — **redeploy** after changing them.

## 4. Connect them

Set the API's `ALLOWED_ORIGINS` to the exact web origin(s), e.g. `https://b12.example.com,https://b12-health.vercel.app`, and redeploy the API. A CORS failure shows in the browser console as a blocked request and in the API log as `CORS blocked request from unknown origin`.

## Running both with Docker Compose

`B12-Project/docker-compose.yml` runs the API and the web app; the database is external (Supabase).

```bash
cd B12-Project
```

```bash
cp .env.docker.example .env
```

Fill in `.env`, then:

```bash
docker compose up --build -d
```

The web container waits for the API health check. Web on port 3001, API on 3000.

## Post-deployment checks

- [ ] `GET /health` returns 200.
- [ ] Register, log in, complete the questionnaire, check in, log out on the live site.
- [ ] Browser console shows no CORS or CSP errors.
- [ ] `curl -I https://<api-domain>/health` shows `strict-transport-security`.
- [ ] In Supabase, `audit_logs` has `REGISTER` and `LOGIN` rows.

## Rolling back

- **Vercel:** **Deployments** → previous deployment → **Promote to Production**.
- **Railway:** **Deployments** → previous deployment → **Redeploy**.
- **Database:** migrations are forward-only. Take a backup (Supabase **Database → Backups**) before applying a new one.

## Rotating `JWT_SECRET`

Set the new value on the API host and redeploy. Every existing session becomes invalid, and users must log in again. The web app handles this automatically by sending users to the login page on the first `401`.
