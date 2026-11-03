# Security

B12 Health Tracker stores health data, so the API, web app and database each have their own controls. To report a vulnerability, see the root [SECURITY.md](../SECURITY.md).

## Authentication and sessions

| Control | Where | Detail |
|---|---|---|
| Password hashing | `routes/auth.js`, `routes/users.js` | bcrypt, cost 12 |
| Password policy | register, change password | 8–128 chars, ≥ 1 uppercase, ≥ 1 number; new password must differ from the old one |
| Algorithm lock | `middleware/auth.js` | Only `HS256` accepted (blocks `alg: none` and key-confusion attacks) |
| Issuer / audience | sign + verify | `iss=b12-health`, `aud=b12-app` |
| Revocation | logout | Token `jti` stored in `token_blacklist` until expiry, checked on every request |
| Live account check | every request | Deleted or deactivated users are rejected even with a valid token |
| Secret strength | `config/validateEnv.js` | Server will not start with a missing, short, placeholder or previously published `JWT_SECRET` |

## Brute-force and enumeration

| Control | Detail |
|---|---|
| Login lockout | `MAX_LOGIN_ATTEMPTS` (5) failures for an email within `ACCOUNT_LOCKOUT_MINUTES` (15) → `429` until the window passes. It is **temporary** — accounts are never disabled by failed logins, so nobody can lock out another user permanently. |
| Auth rate limit | 5 failed requests per IP + email per 15 min on login and register |
| Progressive slow-down | +500 ms per failed request after the 3rd, up to 10 s |
| Shared counters | With `REDIS_URL` set, all limiters count in Redis (`middleware/redisStore.js`), so the limits hold across every API instance. Emails are SHA-256 hashed in keys. If Redis is down, limiters **fail open** (requests allowed, warning logged) — the login lockout above lives in Postgres and keeps working. |
| Timing-safe login | bcrypt runs against a dummy hash when the email is unknown |
| Generic errors | `Invalid email or password.` never says which part was wrong |
| Attempt log | Every attempt is written to `login_attempts` |

> Registration does reveal whether an email is already in use (`409`). This is a deliberate usability trade-off.

## Input handling

| Layer | Defends against |
|---|---|
| `express-validator` on every route | Wrong types, ranges, enums, lengths |
| Explicit field extraction | Mass assignment |
| `xss-clean` (password fields skipped) | Stored XSS |
| `express-mongo-sanitize` | `$` / `.` operator injection |
| `hpp` | HTTP parameter pollution |
| Prototype-pollution guard | `__proto__`, `constructor`, `prototype` keys |
| Content-Type guard | Form-encoded CSRF-style bodies (`415`) |
| 100 KB body limit | Large-payload DoS |
| Sequelize parameterised queries | SQL injection |

## Authorisation

Every resource query is scoped to `req.user.id`. There are no admin endpoints. `GET /api/questionnaire/:id` returns `404` for another user's assessment so IDs cannot be probed. A reusable `ownershipGuard` middleware (`middleware/ownershipGuard.js`) is available for future `/:id` routes and logs `IDOR_ATTEMPT` events.

## Transport and headers

| Control | API (Helmet) | Web (`next.config.mjs`) |
|---|---|---|
| CSP | `default-src 'self'`, no frames/objects | `connect-src` limited to self + API, `frame-ancestors 'none'` |
| HSTS | 1 year, subdomains, preload | 1 year, subdomains |
| Clickjacking | `frameSrc 'none'` | `X-Frame-Options: DENY` |
| MIME sniffing | `nosniff` | `nosniff` |
| Referrer | `no-referrer` | `strict-origin-when-cross-origin` |
| Fingerprinting | `X-Powered-By` removed | `poweredByHeader: false` |
| CORS | Exact-origin allow-list; `*.vercel.app` only if `ALLOW_VERCEL_PREVIEWS=true` | — |
| Slowloris | `keepAliveTimeout` 65 s / `headersTimeout` 66 s | — |

## Database

- TLS to Postgres in production and for any Supabase host.
- Row Level Security on every table with no policies, and all privileges revoked from `anon` and `authenticated` — Supabase's public REST API cannot read anything (migration 007).
- `ON DELETE CASCADE` so account deletion removes all health data.
- Statement and idle-in-transaction timeouts of 10 s.

## Logging and audit

- Security events go to `audit_logs` **and** to a rotating `security-*.log` file (90 days). DB write failures never break the request.
- Winston masks `password`, `token`, `authorization`, `secret` and similar keys, and strips control characters to stop log injection.
- Morgan access logs never include request bodies.
- In production, 5xx responses return a generic message and a `correlationId`; stack traces are only shown in development.

## Privacy

- Account deletion (`DELETE /api/users/me`) is permanent and requires the password in the web app, plus typing `DELETE`.
- Only the minimum is stored in the browser: the JWT and non-sensitive UI state (see [FRONTEND.md](FRONTEND.md#browser-storage-keys)).

## Known limitations

| Item | Notes |
|---|---|
| JWT in `localStorage` | Readable by any script on the page if XSS ever got through. Mitigated by CSP and sanitisation. An httpOnly cookie would be stronger but would change the Android contract. |
| Rate limits without Redis | If `REDIS_URL` is not set, rate-limit counters are per instance and reset on restart — fine for one server, weak on Vercel. Set `REDIS_URL` in production. |
| Password change keeps old sessions | Existing tokens stay valid until they expire or the user logs out. |
| No email verification or password reset | Not implemented yet. |

## Operator checklist

- [ ] Unique random `JWT_SECRET` per environment, stored only in the host's secret settings.
- [ ] `NODE_ENV=production` and an exact `ALLOWED_ORIGINS`.
- [ ] `ALLOW_VERCEL_PREVIEWS=false` in production.
- [ ] `REDIS_URL` set so rate limits are shared across instances.
- [ ] Migration 007 applied and `pg_cron` cleanup scheduled.
- [ ] Database password and connection string not shared outside the host.
- [ ] No credentials in git history or in git remote URLs.
- [ ] Privacy Policy and Terms reviewed by a lawyer before public launch.
