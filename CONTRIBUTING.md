# Contributing

Thanks for helping improve B12 Health Tracker. This guide covers how to set up, make a change and get it merged.

## Getting set up

Follow [docs/SETUP.md](docs/SETUP.md). Use a separate development database — never point a local API at production.

## Workflow

1. Create a branch from `main`:

   | Prefix | For |
   |---|---|
   | `feat/` | New features |
   | `fix/` | Bug fixes |
   | `docs/` | Documentation only |
   | `chore/` | Tooling, dependencies, refactors |

2. Make the change, with tests where it makes sense.
3. Run the checks below.
4. Open a pull request against `main` and fill in the checklist.

## Checks before a PR

```bash
cd B12-Project/backend/node-service && npm test
```

```bash
cd B12-Project/frontend-web && npm run lint && npm run build
```

```bash
cd B12-Project && node scripts/check-scoring-parity.mjs
```

## Code style

- **Match the surrounding code.** JavaScript (no TypeScript), 2-space indent, single quotes, semicolons.
- **API routes:** validate every input with `express-validator`, extract only the fields you expect from `req.body`, scope every query to `req.user.id`, and respond with `sendSuccess` / `sendError` from `utils/response.js`. Pass unexpected errors to `next(err)`.
- **Security events** (auth, password, deletion) go through `logSecurityEvent`.
- **Web app:** CSS Modules per component, design tokens from `app/globals.css`, no `localStorage` reads during render. Next.js 16 differs from older versions — check `node_modules/next/dist/docs/`.
- Keep comments for the *why*, not the *what*.

## Changes that need extra care

| If you change… | Also do |
|---|---|
| An API route, request or response shape | Update [docs/API.md](docs/API.md) and [docs/openapi.yaml](docs/openapi.yaml). Keep it backward compatible — the Android app uses the same API. |
| Questions, options, weights or scoring | Update both web and server copies, bump `SCORING_VERSION` if scores change, run the parity script. See [docs/SCORING.md](docs/SCORING.md). |
| The database schema | Add a new idempotent `backend/database/migrations/00N_*.sql`, append it to `supabase_setup.sql`, update [docs/DATABASE.md](docs/DATABASE.md). Never edit a migration that has already shipped. |
| An environment variable | Update the `.env.example` files and [docs/CONFIGURATION.md](docs/CONFIGURATION.md). |
| Anything user-visible or operational | Add a line under **Unreleased** in [CHANGELOG.md](CHANGELOG.md). |

## Commit messages

Short imperative subject (≤ 72 chars), optional body explaining why:

```text
Fix streak reset when checking in after midnight

The server compared against the UTC date, so users ahead of UTC lost
their streak. Accept the client's local date within ±1 day.
```

## Pull request checklist

- [ ] Tests, lint, build and parity check pass
- [ ] Docs and `CHANGELOG.md` updated
- [ ] No secrets, `.env` files, real user data or credentials in the diff
- [ ] API changes are backward compatible with the Android app

## Never commit

- `.env` / `.env.local` or any real `JWT_SECRET`, database password or API key
- Production data or exports from `assessment_answers`
- `node_modules/`, `.next/`, `logs/`

If a secret is committed by mistake, **rotate it immediately** — removing it from a later commit is not enough.

## Security issues

Do not open a public issue. See [SECURITY.md](SECURITY.md).
