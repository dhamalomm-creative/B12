# B12 Health Tracker — Web App

Next.js 16 (App Router) + React 19 web app for B12 Health Tracker.

## Quick start

Requires the API running (see [backend/README.md](../backend/README.md)).

```bash
cp .env.example .env.local
```

```bash
npm install
```

```bash
npm run dev
```

Open <http://localhost:3001>.

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server on port 3001 |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |

## Environment

| Variable | Example |
|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3001` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `support@example.com` |

They are inlined at build time — rebuild after changing them. Details: [docs/CONFIGURATION.md](../../docs/CONFIGURATION.md).

## Where things are

| Path | Contents |
|---|---|
| `app/` | One folder per route |
| `components/` | Layout (`AppShell`, `TabBar`), `AuthGuard`, UI primitives |
| `context/` | `AuthContext`, `AppContext`, `ThemeContext` |
| `data/questions.js` | v2 question bank and `buildQuestionSet()` |
| `utils/riskCalculator.js` | v2 scoring — must match the server (run `node ../scripts/check-scoring-parity.mjs`) |
| `services/api.js` | API client |

Pages, user flow, state and storage keys: [docs/FRONTEND.md](../../docs/FRONTEND.md).

> This project uses Next.js 16, which has breaking changes from earlier versions. See `node_modules/next/dist/docs/` before using an unfamiliar API.

## Deploy

Vercel, root directory `B12-Project/frontend-web`. See [docs/DEPLOYMENT.md](../../docs/DEPLOYMENT.md).
