# Changelog

All notable changes to this project are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- **Blood test results:** users can add their serum B12 result (pg/mL or pmol/L) to an assessment on the results page and see how it compares with the questionnaire. New `PUT/DELETE /api/questionnaire/:id/lab`; stored in the existing `lab_b12_value_pmol` / `ml_label` columns (no migration).
- **Doctor report:** `/report` — a one-page A4 summary (score, drivers, blood test, history, key answers, 14-day check-in chart) saved via the browser's "Save as PDF".
- **Shared rate limiting:** set `REDIS_URL` to keep rate-limit counters in Redis across all API instances (fails open if Redis is down). Rate-limit keys now hash the email.
- Full project documentation in `docs/`: setup, configuration, architecture, API reference, OpenAPI spec, database, scoring, frontend, security, deployment, testing and troubleshooting.
- `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md` and `LICENSE`.
- **Periods screening question:** women are asked "Do you currently have periods?" before any period questions. Answering no skips them, and the pregnancy question is also skipped after menopause. It's never asked at 60+. The new `period_status` question scores 0, and answers to questions it hides are dropped. Existing answers score the same, so `SCORING_VERSION` stays `2.0`.
- Migration `007_launch_hardening.sql`: Row Level Security on every table, privileges revoked from Supabase `anon`/`authenticated`, duplicate indexes removed, nightly `cleanup_security_tables()` via `pg_cron`.

### Changed
- Auth middleware checks the token blacklist and the user in parallel.
- Registration creates the user, streak and profile in one transaction.
- `*.vercel.app` origins are no longer allowed by default in production (`ALLOW_VERCEL_PREVIEWS`).
- Smaller DB pool and statement timeouts for serverless deployments.
- `DEPLOYMENT_GUIDE.md` moved to `docs/DEPLOYMENT.md`; sub-folder READMEs now point to `docs/`.
- Plainer wording for the diet, period and pregnancy questions.

### Fixed
- **Diet questions now match the diet chosen.** The vegetarian path no longer mentions eggs anywhere (question, "Good to know", "Why we ask", suggestion, onboarding hint, picture). Removed plant-based text from the non-vegetarian path, and fish, eggs and dairy pictures or text from the vegan path. The doctor report now shows the food question as the user's own diet saw it. The Vegetarian filter on the Foods page no longer lists eggs (they stay under All foods).
- Double-clicking Continue in the questionnaire could skip the next question while the card animated out.
- `scripts/check-scoring-parity.mjs` crashing on Windows (`ERR_UNSUPPORTED_ESM_URL_SCHEME`) — dynamic imports now use `file://` URLs.

## [2026-11] — Launch readiness

Summary of `B12-Project/LAUNCH_NOTES.md`.

### Required manual steps
- Rotate `JWT_SECRET` — the old value had been published and is now refused at startup.
- Set `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CONTACT_EMAIL` on the web host.
- Run `npm install` in `frontend-web` (self-hosted Inter font).
- Unlock accounts locked by the old lockout bug (see [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md#accounts-locked-by-the-old-bug)).

### Added
- Scoring v2 shared by web and server, with `scripts/check-scoring-parity.mjs`.
- Guest answers are saved and submitted automatically after sign-up.
- Interactive questionnaire: "Why we ask" panels, section stepper, fact cards, keyboard shortcuts, resume.
- Five new clinical questions (supplements, absorption conditions, medications, sore tongue, breathlessness/paleness, alcohol).
- Results report, richer dashboard and progress pages, expanded food guide, profile editing and permanent account deletion.
- SEO metadata, sitemap, robots, 404/error pages, security headers and CSP on the web app.

### Fixed
- Scores no longer use made-up default answers; guests and members get the same score.
- Toasts crashing the page; inverted fatigue scale in check-ins.
- `GET /api/insights` returning 500 for medium/high-risk users.
- Sanitisers running before the body was parsed (so they did nothing); password fields are now excluded.
- Failed logins permanently disabling accounts — now a temporary 15-minute lockout.
- Strict auth limiter applying to logout and refresh.
- Password change accepting weak passwords.
- Streak totals and timezone handling.
- Server ignoring the `PORT` variable on Railway/Render.
- Network errors on load signing users out; hydration mismatches from `localStorage`.

## Earlier

- Scoring engine moved from the Python FastAPI service into the Node API.
- Web app built as a port of the Android app, sharing the same API.
- Database fixes for upserts, streak calculation and questionnaire mapping.
