# Testing

## API tests

Location: `B12-Project/backend/node-service/tests/` · Runner: Jest + Supertest.

| File | Covers |
|---|---|
| `auth.test.js` | Register, duplicate email (409), weak password, login, wrong password (401), `/health` |
| `api.e2e.test.js` | Register with profile; passwords with HTML characters; XSS sanitising of names; invalid enums; body-less POST; v2 and v1 questionnaire submission, unknown and duplicate answers; latest + history; blood test result (unit conversion, labels, validation, ownership, removal); check-in once per day + edit; score range validation; check-in history + streak; password policy on change; temporary (not permanent) lockout; account deletion |
| `redisStore.test.js` | Redis-backed rate limiting with a fake Redis client: limits shared across two app instances, window expiry, `RateLimit-*` headers, fails open (no hang) when Redis is down or errors, waits briefly for a reconnecting client. **No database needed:** `npx jest tests/redisStore.test.js` |

The tests run against a **real PostgreSQL database** — they create users with unique `@b12.test` emails. Use a dedicated test database, never production.

### Run

1. Create a test database and apply `backend/database/supabase_setup.sql` to it.
2. From `B12-Project/backend/node-service`:

   **bash**

   ```bash
   NODE_ENV=test DATABASE_URL=postgresql://user:pass@localhost:5432/b12_test JWT_SECRET=<32+ random chars> npm test
   ```

   **PowerShell**

   ```powershell
   $env:NODE_ENV='test'; $env:DATABASE_URL='postgresql://user:pass@localhost:5432/b12_test'; $env:JWT_SECRET='<32+ random chars>'; npm test
   ```

With `NODE_ENV=test` the server does not bind a port or write access logs. Tests run in band (`--runInBand`) because they share one database.

### Cleaning up test data

```sql
DELETE FROM users WHERE email LIKE '%@b12.test';
DELETE FROM login_attempts WHERE email LIKE '%@b12.test';
```

## Scoring parity check

Confirms that the web scorer (`frontend-web/utils/riskCalculator.js`) and the server scorer (`backend/node-service/src/services/scoringEngineV2.js`) agree, and that the server's question bank matches `frontend-web/data/questions.js`.

From `B12-Project`:

```bash
node scripts/check-scoring-parity.mjs
```

It exits with a non-zero code and prints each mismatch if anything differs. Run it whenever you touch questions or scoring.

## Web app

There are no automated UI tests yet. Before a release:

```bash
cd B12-Project/frontend-web
```

```bash
npm run lint
```

```bash
npm run build
```

Then go through this manual checklist against a local or staging API:

- [ ] Guest: onboarding → questionnaire → score preview
- [ ] Questionnaire: "Save and exit", reload, resume where you left off
- [ ] Questionnaire as a woman: answer "Do you currently have periods?" with each option, go back and change it; the question count and later questions update
- [ ] Register from the score preview; the guest result appears on the dashboard
- [ ] Log out and log back in
- [ ] Daily check-in; check in again the same day (updates, streak unchanged)
- [ ] Progress: switch 7 / 14 / 30 days
- [ ] BMI: save a measurement, see history
- [ ] Profile: edit, change password, delete account (redirects to `/` with a confirmation banner)
- [ ] Mobile width, dark mode and keyboard navigation
- [ ] No errors in the browser console

## Adding tests

- Put API tests in `tests/*.test.js`; import the app with `require('../server')`.
- Use a unique email per run (`` `name_${Date.now()}@b12.test` ``).
- Cover the error paths as well as the happy path — validation and auth failures are part of the contract the Android app depends on.
