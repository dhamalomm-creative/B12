# B12 Health Tracker — Backend

Express API and database schema shared by the B12 Health web app and Android app.

| Folder | Contents |
|---|---|
| `node-service/` | Node.js 20 + Express 4 API (Sequelize, JWT, scoring engines) |
| `database/` | SQL migrations `001`–`007`, question seed, and `supabase_setup.sql` (everything in one file) |

## Quick start

```bash
cd node-service
```

```bash
cp .env.example .env
```

Set `DATABASE_URL` and `JWT_SECRET` in `.env` (generate the secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`), then:

```bash
npm install
```

```bash
npm run dev
```

Health check: <http://localhost:3000/health>

| Script | Purpose |
|---|---|
| `npm run dev` | Start with nodemon |
| `npm start` | Start for production |
| `npm test` | Jest + Supertest (needs a test database) |

## Endpoints

| Prefix | Purpose |
|---|---|
| `/api/auth` | register, login, logout, refresh |
| `/api/users` | profile, password, account deletion, BMI |
| `/api/questionnaire` | questions (v1), submit (v1 + v2), latest, history, by id |
| `/api/checkin` | daily check-in, history + streak |
| `/api/insights` | personalised insights |
| `/api/notifications` | Expo push token |

Full reference: [docs/API.md](../../docs/API.md) · OpenAPI: [docs/openapi.yaml](../../docs/openapi.yaml)

## More

- [Architecture](../../docs/ARCHITECTURE.md) — middleware order, folder layout, data flows
- [Configuration](../../docs/CONFIGURATION.md) — every environment variable
- [Database](../../docs/DATABASE.md) — tables, migrations, RLS, ML export
- [Scoring](../../docs/SCORING.md) — v1 and v2 risk scoring
- [Security](../../docs/SECURITY.md) — controls and known limitations
- [Deployment](../../docs/DEPLOYMENT.md) — Railway, Vercel, Docker
- [Testing](../../docs/TESTING.md)

## Legacy files

`ecosystem.config.js`, `setup.ps1`, `status.bat`, `logs.bat` and `restart.bat` belong to the earlier PM2 + Python setup (paths under `D:\B12\backend-v2`). The Python scoring service has been replaced by `node-service/src/services/scoringEngine.js`. `docker-compose.yml` in this folder starts a local Postgres plus the API and applies migrations 001–006 only.
