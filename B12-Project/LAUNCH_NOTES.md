# Launch-readiness update — November 2026

This release fixes the bugs found in a full review of the web app and API, rebuilds the
questionnaire to be interactive and educational, and hardens the backend for real users.
The Android app's API contract is unchanged (it keeps working as before).

## ⚠️ Do these before you deploy

1. **Rotate `JWT_SECRET`.** The old secret was published in `README.md`, `DEPLOYMENT_GUIDE.md`
   and `.env.docker.example`, so anyone could forge login tokens. The server now refuses to
   start with that value. Generate a new one:
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   (Existing sessions will be logged out — that's expected.)
2. **Set frontend env vars in Vercel:** `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`,
   `NEXT_PUBLIC_CONTACT_EMAIL` (see `frontend-web/.env.example`).
3. **Run `npm install` in `frontend-web`** — the Inter font is now self-hosted
   (`@fontsource-variable/inter`).
4. **Unlock accounts locked by the old bug** (see "Account lockout" below):
   `UPDATE users SET is_active = true WHERE is_active = false;`
   (Only run this if you have no intentionally-deactivated accounts.)
5. Have a lawyer review the Privacy Policy and Terms before public launch.

No database migration is needed.

## Critical bugs fixed

| Area | Problem | Fix |
|---|---|---|
| Scoring | Logged-in users' scores were computed from only 10 mapped answers, with **made-up default answers** for questions never asked (e.g. tingling = "occasionally"). Guests and members got different scores for the same answers. | New scoring v2: web and server share one engine and question bank. `scripts/check-scoring-parity.mjs` verifies they match on 2,000 random assessments. |
| Guest → sign-up | A guest's finished assessment was lost on registration. | Pending answers are saved and submitted automatically after sign-up / log-in. |
| Toasts | Every toast crashed the page (`type` was undefined). | Fixed. |
| Check-in | Fatigue was sent inverted ("None" = 4), triggering false "high fatigue" alerts. Errors were silently ignored. | Correct scale, back button, review step, notes, error + retry, "already checked in today" notice. |
| Insights API | `GET /api/insights` returned 500 for any moderate/high-risk user (`toFixed` on a Postgres NUMERIC string). | Fixed. |
| Security middleware | XSS / NoSQL sanitizers ran **before** the JSON body was parsed, so they did nothing. | Body is parsed first; password fields are excluded so special characters aren't mangled. |
| Account lockout | 5 wrong passwords set `is_active = false` permanently — anyone could lock out any user by typing their email. | Temporary 15-minute lockout only. |
| Rate limiting | The strict auth limiter also applied to `/logout` and `/refresh`. | Limited to `/login` and `/register`. |
| Delete account | "Delete" only deactivated the account; health data stayed. | Permanently deletes the user and all data (cascade). Web asks for password + "DELETE". |
| Password change | Accepted 6-character passwords (weaker than sign-up). | Same policy as sign-up; audit-logged. |
| Streaks / totals | `isNew` was always null (Sequelize upsert) so totals never counted; timezone could break streaks. | Explicit existence check; client sends its local date (validated ±1 day). Stale streaks show 0. |
| Hosting | Server ignored the `PORT` variable Railway/Render set. | Uses `PORT` (falls back to `NODE_PORT`). |
| Auth session | Any network error on load logged the user out; expired tokens left the app in a broken state. | Only 401/403 sign out; any 401 response signs out cleanly. |
| Hydration | App state was read from localStorage during render (React hydration mismatch). | Loaded after mount. |
| Questionnaire | "Save and exit" didn't save; profile defaults (male / vegetarian) were used if missing. | Progress is saved and resumed; missing profile redirects to onboarding. |

## New & improved

- **Interactive questionnaire** — illustrated "Why we ask" panel for every question, "Good to know"
  insight after each answer, section stepper, "Did you know" fact cards between sections, keyboard
  shortcuts (1–5, Enter, ←), resume where you left off, animated transitions, analysing screen,
  reduced-motion support, mobile "Why are we asking this?" toggle.
- **5 new evidence-based questions** (asked to everyone): B12 supplement use, absorption conditions /
  stomach surgery, metformin & acid reducers, sore tongue (glossitis), breathlessness / paleness, alcohol.
- **Results report** — what's driving your score (all categories, colour-coded), personalised next steps,
  "When to see a doctor" guidance with urgent-care red flags, change since last assessment, history,
  print / save for your doctor.
- **Dashboard** — real 7-day check-in strip, average energy, best streak, all insights.
- **Progress** — 7 / 14 / 30-day ranges, charts for all five metrics with axes and trend labels,
  pattern alerts, assessment score history.
- **Food guide** — 23 foods with per-serving B12, % of daily need, search, sort, Indian staples
  (curd, paneer), corrected values (NIH ODS / USDA) and removed misleading claims.
- **Profile** — edit gender, age, diet; password policy checklist; permanent account deletion.
- **Production polish** — self-hosted font, SEO metadata, Open Graph, sitemap, robots, 404 & error pages,
  security headers + CSP, skip link, focus styles, ARIA roles, updated Privacy Policy & Terms, FAQ on landing page.

## Tests

```bash
# Backend end-to-end tests (needs a Postgres with supabase_setup.sql applied)
cd backend/node-service && npm test

# Web ↔ server scoring parity
node scripts/check-scoring-parity.mjs
```
