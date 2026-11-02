# Troubleshooting

## API will not start

| Message | Cause | Fix |
|---|---|---|
| `SECURITY ERROR … JWT_SECRET is missing` | Not set | Add it to `.env` (local) or the host's variables |
| `JWT_SECRET is too short` | Fewer than 32 chars | Generate a new one: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_SECRET appears to be a default/placeholder value` | Contains words like `secret`/`changeme`, starts with `REPLACE`, or was published in this repo | Generate a new one |
| `ALLOWED_ORIGINS is required in production` | `NODE_ENV=production` without origins | Set the web app's exact origin |
| `NODE_ENV "…" is not valid` | Typo | Use `development`, `test` or `production` |
| `DATABASE URL ERROR: Unable to parse DATABASE_URL` | Brackets or unescaped `@ # %` in the password | Remove `[ ]` placeholders; URL-encode the password |
| `Unable to connect to PostgreSQL: … password authentication failed` | Wrong password | Reset it in Supabase **Database settings** |
| `… self-signed certificate` / SSL errors | SSL mismatch | Set `DATABASE_SSL=true` for hosted DBs; for a local DB without SSL, use `NODE_ENV=development` and leave `DATABASE_SSL` unset |
| `… ENOTFOUND` / timeout | Wrong host or the Supabase project is paused | Check the connection string; restore the project |
| `EADDRINUSE :::3000` | Port in use | Stop the other process or set `PORT` |

## Requests fail

| Symptom | Cause | Fix |
|---|---|---|
| Browser: "blocked by CORS policy"; API: `403 Origin not permitted.` | Web origin not in `ALLOWED_ORIGINS` | Add the exact origin (scheme + host + port, no trailing slash) and redeploy the API |
| Browser: "Refused to connect … Content Security Policy" | `NEXT_PUBLIC_API_URL` was different at build time | Set it correctly and rebuild / redeploy the web app |
| `415 Unsupported Media Type` | Missing `Content-Type: application/json` | Send the header with every JSON body |
| `401 Session has been terminated` | Token was logged out | Log in again |
| `401` on every request after a deploy | `JWT_SECRET`, `JWT_ISSUER` or `JWT_AUDIENCE` changed | Expected — users log in again |
| `429 Too many failed login attempts` | 5 failures for that email in 15 min | Wait 15 minutes. Accounts are not disabled. |
| `429 RATE_LIMIT_API` | Over the general limit | Wait, or raise `RATE_LIMIT_MAX` |
| `500` with a `correlationId` | Server error | Search the API logs for that ID |
| `relation "…" does not exist` in logs | Schema not applied | Run `supabase_setup.sql` or the missing migrations |

## Web app

| Symptom | Fix |
|---|---|
| "Can't reach the server" | API not running, or `NEXT_PUBLIC_API_URL` wrong. Open `<api>/health` in the browser. |
| Module not found `@fontsource-variable/inter` | Run `npm install` in `frontend-web` |
| Changed `.env.local` but nothing happened | Restart `npm run dev`; in production, redeploy |
| Guest score not saved after sign-up | It is retried from the dashboard. If it keeps failing, check the network tab for the `/api/questionnaire/submit` error. |
| Streak looks wrong around midnight | Check-ins use the browser's local date (±1 day of UTC). Make sure the device clock and timezone are right. |
| Hydration warnings in the console | Do not read `localStorage` during render — load it in `useEffect` (see `AppContext`) |

## Accounts locked by the old bug

Before November 2026, five failed logins set `users.is_active = false` permanently. To unlock those accounts (only if you have no accounts that were intentionally deactivated):

```sql
UPDATE users SET is_active = true WHERE is_active = false;
```

## Logs

| Environment | Where |
|---|---|
| Local / Docker / Railway | `backend/node-service/logs/` — `error-YYYY-MM-DD.log`, `security-YYYY-MM-DD.log`, `exceptions-…`; in development also the console. Railway also shows stdout under **Deployments → Logs**. |
| Vercel | **Project → Logs** (stdout only, no files) |
| Database | Supabase **Logs → Postgres** |

Set `LOG_LEVEL=debug` for more detail. Sensitive fields are always redacted.

Still stuck? Open an issue with the steps to reproduce, the error message and any `correlationId` — never paste secrets or real user data.
