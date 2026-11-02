# B12 Health Tracker — Launch Checklist

Work through this top to bottom before telling anyone the app is live.
✅ = already done in code · 🔲 = you need to do it

---

## 1. Fix the deploy error (do this first)

The server refuses to start because the `JWT_SECRET` on your host is a placeholder or a
value that was published in this repo (anyone who has it can forge logins to any account).

1. 🔲 Generate a new secret on your computer:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. 🔲 Vercel → your **API** project → Settings → Environment Variables → edit `JWT_SECRET`
   for **Production** (and Preview) → paste the new value → **Redeploy**.
   Don't commit it or share it anywhere.
3. 🔲 In the same place, check `NODE_ENV=production` and
   `ALLOWED_ORIGINS=https://<your-exact-frontend-domain>` (no trailing slash).
   ⚠️ Random `*.vercel.app` sites are now **blocked in production**. Your frontend's exact URL
   must be in `ALLOWED_ORIGINS`, or set `ALLOW_VERCEL_PREVIEWS=true` if you rely on preview URLs.
4. 🔲 Open `https://<api-domain>/health` → should say `"status":"healthy"`.

✅ Removed the leaked secrets from `.env.docker.example` and `ecosystem.config.js`; the
local `.env` secret has been rotated.

---

## 2. Speed ("the app feels slow")

| Cause | Fix |
|---|---|
| Database is in **Mumbai** (Supabase ap-south-1) but Vercel runs the API in **Washington DC** by default, so every query crossed the world (~200 ms each, and one login did ~7 queries). | ✅ `vercel.json` now pins the API to `bom1` (Mumbai). 🔲 Redeploy, then confirm under Vercel → Project → Settings → Functions → Region. |
| Every logged-in request did 2 DB lookups one after another. | ✅ Now run in parallel. |
| Login / register ran 6–8 queries one after another. | ✅ Independent queries run in parallel; register is one transaction. |
| Each serverless instance opened up to 10 DB connections and ran out of Supabase connections under load. | ✅ Pool is 2 per instance on Vercel; queries time out after 10 s instead of hanging. |
| Login slow-down also delayed *successful* logins. | ✅ Only failed attempts count. |
| Cold starts (first request after idle takes 1–3 s). | 🔲 Optional: move the API to Railway/Render (always-on, `railway.json` is ready) in a Mumbai/Singapore region, or keep it warm with an uptime pinger hitting `/health` every 5 min. |

---

## 3. Database

1. 🔲 **Run `backend/database/migrations/007_launch_hardening.sql` in the Supabase SQL editor.**
   - **Critical:** turns on Row Level Security on every table. Before this, Supabase's public
     REST API could serve `users.password_hash` and everyone's health data to anyone with
     the project's anon key. The Node API keeps working (it connects as the table owner).
   - Drops 6 duplicate indexes (faster writes).
   - Adds nightly cleanup of `token_blacklist`, `login_attempts` (90 days) and `audit_logs`
     (1 year). 🔲 Enable **pg_cron** (Database → Extensions) and run the file again to schedule it.
2. 🔲 Supabase → Settings → Database: confirm you're on the **pooler URL (port 6543)**, and
   reset the database password if it was ever shared.
3. 🔲 Turn on backups: the free plan only keeps daily backups for a short time. For health
   data, upgrade to Pro (point-in-time recovery) before real users arrive.

---

## 4. Security

✅ Already solid: bcrypt (cost 12), JWT locked to HS256 with issuer/audience, logout
revocation, temporary lockout after 5 failures, Helmet/CSP/HSTS, input validation,
generic errors in production, audit log, cascading account deletion.

- 🔲 Rotate the **GitHub token** that is embedded in your git remote URL (it was shown in
  plain text), then `git remote set-url origin https://github.com/dhamalomm-creative/B12`.
- 🔲 Supabase anon / service-role keys: never put the service-role key in the frontend.
- ⚠️ Known limits, fine for launch but worth fixing soon:
  - The in-memory rate limiters reset per serverless instance, so on Vercel they're weak.
    The DB-backed login lockout still works. For real limits use Upstash Redis.
  - The JWT lives in `localStorage` for 7 days. Any XSS bug could steal it. Keep the CSP strict,
    and later consider httpOnly cookies + shorter tokens.
  - No email verification, so anyone can sign up with someone else's email.

---

## 5. What users will miss (add these)

**Must-have before public launch**
1. 🔲 **Forgot password / reset by email.** Right now a user who forgets their password has
   lost their account and data. Needs an email provider (e.g. Resend, Postmark, AWS SES).
2. 🔲 **Medical disclaimer** visible on results ("This is not a diagnosis; see a doctor /
   get a serum B12 test"), plus a lawyer-reviewed Privacy Policy and Terms. Health data is
   regulated (India DPDP Act 2023; GDPR if you have EU users).
3. 🔲 **Contact / support email** (`NEXT_PUBLIC_CONTACT_EMAIL`) so people can reach you.
4. 🔲 **Error monitoring** (Sentry, free tier) for frontend + API, so you see crashes before users report them.

**Should-have in the first weeks**
- Email verification on sign-up.
- Daily check-in reminders (push/email) — streak apps live or die on reminders.
- Export my data (PDF/CSV), to take to a doctor and for privacy-law compliance.
- Privacy-friendly analytics (Plausible / Vercel Analytics) to see where people drop off
  in the questionnaire.
- A "Book a B12 blood test" call-to-action on high-risk results (also a revenue path).

---

## 6. Launch-day checks (15 minutes, on a phone and a laptop)

- 🔲 Guest takes the assessment → signs up → result is saved to the new account.
- 🔲 Log out → log in → dashboard, check-in, progress, foods and profile all load.
- 🔲 Five wrong passwords → locked for 15 min, with a clear message.
- 🔲 Delete account → can't log in again.
- 🔲 Every page works at phone width, and in dark mode.
- 🔲 `/health` is green; Vercel and Supabase logs show no errors.
- 🔲 Set up a free uptime monitor (UptimeRobot / Better Stack) on `/health`.
