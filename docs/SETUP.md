# Local Development Setup

This guide gets the API and the web app running on your machine.

## Prerequisites

| Tool | Version | Check |
|---|---|---|
| Node.js | 20 or newer (the Docker images use 20) | `node -v` |
| npm | 9+ | `npm -v` |
| Git | any | `git --version` |
| PostgreSQL | 14+ — or a free Supabase project | |
| Docker (optional) | 24+ with Compose v2 | `docker compose version` |

## 1. Clone

```bash
git clone https://github.com/dhamalomm-creative/B12.git
```

```bash
cd B12/B12-Project
```

## 2. Create the database

Pick **one** option.

### Option A — Supabase (recommended)

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste the whole of [`backend/database/supabase_setup.sql`](../B12-Project/backend/database/supabase_setup.sql) and run it. This creates all tables, indexes, the question seed, Row Level Security and the cleanup function.
3. Go to **Project Settings → Database → Connection string → URI** and copy it. Use the pooler URL on port `6543`. Replace `[YOUR-PASSWORD]` with your database password.

### Option B — Local PostgreSQL

```bash
createdb b12db
```

```bash
psql -d b12db -f backend/database/supabase_setup.sql
```

Your connection string is then something like `postgresql://<user>:<password>@localhost:5432/b12db`.

### Option C — Postgres in Docker

`backend/docker-compose.yml` starts Postgres 16 plus the API and runs migrations 001–006 and the seed on first start. Run `migrations/007_launch_hardening.sql` yourself afterwards. Postgres is not published to the host in that file; connect with `docker exec -it b12_postgres psql -U b12user -d b12db`.

## 3. Start the API

```bash
cd backend/node-service
```

```bash
cp .env.example .env
```

Edit `.env` and set at least:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://...
JWT_SECRET=<paste the generated value>
ALLOWED_ORIGINS=http://localhost:3001
```

Generate the secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Install and run:

```bash
npm install
```

```bash
npm run dev
```

You should see `✅ PostgreSQL connected successfully` and `✅ B12 Node API running on http://0.0.0.0:3000`. Check <http://localhost:3000/health>.

Every variable is described in [CONFIGURATION.md](CONFIGURATION.md).

## 4. Start the web app

In a second terminal, from `B12-Project`:

```bash
cd frontend-web
```

```bash
cp .env.example .env.local
```

```bash
npm install
```

```bash
npm run dev
```

The dev script already uses port 3001. Open <http://localhost:3001>.

## 5. Try it

1. Click **Start free** and go through onboarding and the questionnaire as a guest.
2. Create an account from the score preview — the guest answers are submitted automatically.
3. Do a daily check-in and open **Progress**.

Or hit the API directly:

```bash
curl -s -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d "{\"email\":\"dev@example.com\",\"password\":\"DevPass123\"}"
```

## Running everything with Docker

From `B12-Project` (uses an external database such as Supabase):

```bash
cp .env.docker.example .env
```

Set `DATABASE_URL` and `JWT_SECRET` in `.env`, then:

```bash
docker compose up --build -d
```

Web: <http://localhost:3001> · API: <http://localhost:3000>

## Useful commands

| Where | Command | What |
|---|---|---|
| `backend/node-service` | `npm run dev` | API with nodemon |
| `backend/node-service` | `npm test` | API tests — see [TESTING.md](TESTING.md) |
| `frontend-web` | `npm run lint` | ESLint |
| `frontend-web` | `npm run build && npm start` | Production build |
| `B12-Project` | `node scripts/check-scoring-parity.mjs` | Web ↔ server scoring check |

## Notes for contributors

- The web app runs **Next.js 16**, which has breaking changes from earlier versions. Check `frontend-web/node_modules/next/dist/docs/` before using an unfamiliar API.
- If you change `frontend-web/data/questions.js` or `utils/riskCalculator.js`, update `backend/node-service/src/services/questionBankV2.json` / `scoringEngineV2.js` to match and run the parity script. See [SCORING.md](SCORING.md).

Something not working? See [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
