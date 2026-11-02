# API Reference

The B12 Health Tracker API is a JSON REST API served by the Express app in [`B12-Project/backend/node-service`](../B12-Project/backend/node-service). The web app and the Android app both use it.

A machine-readable version of this reference is in [openapi.yaml](openapi.yaml).

- [Conventions](#conventions)
- [Authentication](#authentication)
- [Errors](#errors)
- [Rate limits](#rate-limits)
- Endpoints: [System](#system) · [Auth](#auth) · [Users](#users) · [BMI](#bmi) · [Questionnaire](#questionnaire) · [Check-in](#check-in) · [Insights](#insights) · [Notifications](#notifications)

---

## Conventions

| | |
|---|---|
| **Base URL (local)** | `http://localhost:3000` |
| **Base URL (production)** | Your deployed API host, e.g. `https://<your-api>.up.railway.app` |
| **Path prefix** | All resource endpoints live under `/api` |
| **Format** | Request and response bodies are JSON. Requests with a body **must** send `Content-Type: application/json`, otherwise the API returns `415`. |
| **Body size** | Max 100 KB |
| **Dates** | `YYYY-MM-DD` for calendar dates, ISO 8601 for timestamps |
| **IDs** | UUID v4 strings (questions use integer IDs) |
| **Field naming** | Request bodies use `camelCase`. Database records in responses use `snake_case`. |

Every response includes a boolean `success` field. On success, the payload fields sit next to it at the top level (there is no `data` wrapper):

```json
{ "success": true, "token": "eyJhbGciOi...", "user": { "id": "…", "email": "asha@example.com" } }
```

## Authentication

Protected endpoints need a JWT in the `Authorization` header:

```http
Authorization: Bearer <token>
```

You get a token from [`POST /api/auth/register`](#post-apiauthregister) or [`POST /api/auth/login`](#post-apiauthlogin).

| Property | Value |
|---|---|
| Algorithm | HS256 (other algorithms are rejected) |
| Lifetime | `JWT_EXPIRES_IN`, default `7d` |
| Claims | `jti` (unique token ID), `id` (user UUID), `email`, `iat`, `exp`, `iss` (`b12-health`), `aud` (`b12-app`) |
| Revocation | `POST /api/auth/logout` adds the token's `jti` to a blacklist; it is rejected from then on |

On every protected request the API also checks that the token has not been revoked and that the user still exists and is active.

| Status | `error` message | Meaning |
|---|---|---|
| 401 | `Authorization token required.` | No `Bearer` header |
| 401 | `Invalid authorization token.` | Bad signature, wrong issuer/audience, malformed |
| 401 | `Session expired. Please log in again.` | Token past `exp` |
| 401 | `Session has been terminated. Please log in again.` | Token was logged out |
| 401 | `Account not found.` | User was deleted |
| 403 | `Account has been deactivated. Please contact support.` | `users.is_active = false` |

Clients should treat any `401` as "signed out" and send the user back to the login screen.

## Errors

Errors use one shape:

```json
{ "success": false, "error": "Password must contain at least one uppercase letter." }
```

| Status | When |
|---|---|
| `400` | Validation failed. Only the **first** validation error is returned in `error`. |
| `401` | Missing, invalid, expired or revoked token; wrong login credentials |
| `403` | Account deactivated; CORS origin not allowed (`Origin not permitted.`) |
| `404` | Resource or route not found (`Route not found.`) |
| `409` | Email already registered |
| `415` | Request body is not `application/json` |
| `429` | Rate limit or login lockout hit. Includes `code` (see below). |
| `500` | Unexpected server error |

Unexpected errors include a `correlationId` (e.g. `"A3F8C9B1"`) that matches the server log entry. In production the message is generic; in development the response also includes `stack`.

```json
{ "success": false, "error": "An internal error occurred. Please try again later.", "correlationId": "A3F8C9B1" }
```

## Rate limits

| Limiter | Applies to | Limit | Key | Response |
|---|---|---|---|---|
| General | all `/api/*` | `RATE_LIMIT_MAX` per `RATE_LIMIT_WINDOW_MS` (default 300 per 15 min) | IP | `429`, `code: "RATE_LIMIT_API"` |
| Auth | `/api/auth/login`, `/api/auth/register` | `MAX_LOGIN_ATTEMPTS` **failed** requests per 15 min (default 5) | IP + email | `429`, `code: "RATE_LIMIT_AUTH"` |
| Auth slow-down | same as above | After 3 failed requests, each extra request is delayed by +500 ms (max 10 s) | IP + email | Slower response |
| Login lockout | `/api/auth/login` | `MAX_LOGIN_ATTEMPTS` failures for an email within `ACCOUNT_LOCKOUT_MINUTES` | email | `429` |

Successful requests do not count toward the auth limiter. Responses include the standard `RateLimit-*` headers.

---

## System

### `GET /`

Simple liveness message.

```json
{ "success": true, "message": "🩺 B12 Health Tracker API is live and running!", "health": "/health" }
```

### `GET /health`

Health check used by Docker and Railway. It does not touch the database.

```json
{
  "success": true,
  "service": "B12 Health Tracker API",
  "status": "healthy",
  "timestamp": "2026-11-03T10:15:00.000Z"
}
```

---

## Auth

### `POST /api/auth/register`

Create an account. Optionally creates the profile at the same time. **Public.**

**Body**

| Field | Type | Required | Rules |
|---|---|---|---|
| `email` | string | yes | Valid email, max 254 chars. Normalised (lower-cased). |
| `password` | string | yes | 8–128 chars, at least one uppercase letter and one number |
| `name` | string | no | Trimmed, max 80 chars |
| `age` | integer | no | 1–120. Sets `age_group` automatically. |
| `gender` | string | no | `male` · `female` · `other` |
| `dietType` | string | no | `vegan` · `vegetarian` · `pescatarian` · `omnivore` |

Invalid optional values are ignored rather than rejected.

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"asha@example.com","password":"Str0ngPass","name":"Asha","age":30,"gender":"female","dietType":"vegetarian"}'
```

**201 Created**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "0b6f3c1e-8c1d-4a52-9f0e-6f2d8d1a7b10", "email": "asha@example.com" }
}
```

**Errors:** `400` validation · `409` `Email already registered. Please log in to your existing account.` · `429` rate limit

### `POST /api/auth/login`

Exchange credentials for a token. **Public.**

| Field | Type | Required |
|---|---|---|
| `email` | string | yes |
| `password` | string | yes (max 128 chars) |

**200 OK** — same shape as register.

**Errors**

| Status | `error` |
|---|---|
| 400 | `Valid email required.` / `Password is required.` |
| 401 | `Invalid email or password.` (deliberately does not say which was wrong) |
| 429 | `Too many failed login attempts. Please wait 15 minutes before trying again.` |

### `POST /api/auth/logout`

Revoke the current token. **Requires auth.** No body.

```json
{ "success": true, "message": "Logged out successfully." }
```

### `POST /api/auth/refresh`

Swap a still-valid token for a new one with a fresh expiry. **Public** (the token goes in the body).

```json
{ "token": "eyJhbGciOiJIUzI1NiIs..." }
```

**200 OK**

```json
{ "success": true, "token": "eyJhbGciOiJIUzI1NiIs..." }
```

**Errors:** `400` `Token is required.` · `401` `Token has been revoked.` / `Token expired. Please log in again.` / `Account not found or locked.` / `Invalid or expired token.`

> An expired token cannot be refreshed. Call this before `exp`.

---

## Users

All `/api/users/*` endpoints **require auth** and only ever act on the signed-in user.

### `GET /api/users/profile`

```json
{
  "success": true,
  "user": { "id": "0b6f3c1e-…", "email": "asha@example.com", "created_at": "2026-10-01T08:00:00.000Z" },
  "profile": {
    "id": "c2d0…",
    "user_id": "0b6f3c1e-…",
    "name": "Asha",
    "age": 30,
    "age_group": "25-40",
    "gender": "female",
    "diet_type": "vegetarian",
    "diet_penalty_score": 8,
    "has_pernicious_anemia": false,
    "has_crohns_disease": false,
    "has_celiac_disease": false,
    "has_gastric_surgery": false,
    "takes_metformin": false,
    "takes_ppi": false,
    "is_pregnant": false,
    "is_breastfeeding": false,
    "alcohol_frequency": null,
    "smoking_status": null,
    "created_at": "…",
    "updated_at": "…"
  }
}
```

`profile` is `null` if the user has not saved one yet.

### `POST /api/users/profile`

Create or update the profile. Only the fields you send are changed.

| Field | Type | Rules / effect |
|---|---|---|
| `name` | string \| null | max 80 chars |
| `age` | integer \| null | 1–120; also sets `age_group` (`15-24`, `25-40`, `41-60`, `60+`) |
| `gender` | string | `male` · `female` · `other` |
| `dietType` | string | `vegan` · `vegetarian` · `pescatarian` · `omnivore`; also sets `diet_penalty_score` (12 / 8 / 4 / 0) |
| `hasPerniciousAnemia` | boolean | |
| `hasCrohnsCeliac` | boolean | Sets both `has_crohns_disease` and `has_celiac_disease` |
| `hasGastricSurgery` | boolean | |
| `takesMetformin` | boolean | |
| `takesPpi` | boolean | Proton-pump inhibitors |
| `isPregnant` | boolean | |
| `isBreastfeeding` | boolean | |
| `alcoholFrequency` | string \| null | max 20 chars |
| `smokingStatus` | string \| null | max 20 chars |

```json
{ "age": 31, "dietType": "vegan", "takesMetformin": true }
```

**201 Created** (new profile) or **200 OK** (updated):

```json
{ "success": true, "profile": { "user_id": "…", "age": 31, "age_group": "25-40", "diet_type": "vegan", "diet_penalty_score": 12, "takes_metformin": true, "…": "…" } }
```

### `POST /api/users/password`

Change the password. Uses the same policy as registration.

| Field | Type | Rules |
|---|---|---|
| `currentPassword` | string | required |
| `newPassword` | string | 8–128 chars, one uppercase, one number, must differ from the current one |

```json
{ "success": true, "message": "Password updated." }
```

**Errors (400):** `Current password is incorrect.` · `New password must be different from your current password.` · policy messages

> Changing the password does not revoke tokens that were already issued.

### `DELETE /api/users/me`

Permanently delete the account and **all** of its health data (profile, assessments, answers, check-ins, streaks, BMI logs, push tokens). This cannot be undone. Audit log rows are kept with `user_id` set to `NULL`.

Body (optional but recommended — the web app always sends it):

```json
{ "password": "Str0ngPass" }
```

If `password` is present it must be correct.

```json
{ "success": true, "message": "Your account and health data have been deleted." }
```

**Errors:** `400` `Password is incorrect.` · `404` `Account not found.`

---

## BMI

### `POST /api/users/bmi`

Save a BMI measurement. BMI is calculated on the server and rounded to one decimal.

| Field | Type | Rules |
|---|---|---|
| `heightCm` | number | 50–300 |
| `weightKg` | number | 10–500 |

Categories: `< 18.5` underweight · `< 25` normal · `< 30` overweight · `≥ 30` obese.

**201 Created**

```json
{
  "success": true,
  "bmi": {
    "id": "…", "user_id": "…",
    "height_cm": 165, "weight_kg": 60, "bmi": 22, "bmi_category": "normal",
    "measured_at": "2026-11-03", "created_at": "…"
  }
}
```

### `GET /api/users/bmi/latest`

```json
{ "success": true, "bmi": { "bmi": 22, "bmi_category": "normal", "measured_at": "2026-11-03", "…": "…" } }
```

`bmi` is `null` when nothing has been recorded.

### `GET /api/users/bmi/history`

| Query | Default | Max |
|---|---|---|
| `limit` | 10 | 50 |

```json
{ "success": true, "history": [ { "bmi": 22, "measured_at": "2026-11-03", "…": "…" } ] }
```

Newest first.

---

## Questionnaire

All `/api/questionnaire/*` endpoints **require auth**. The scoring rules are explained in [SCORING.md](SCORING.md).

### `GET /api/questionnaire/questions`

Returns the **v1** question set stored in the `questions` table, filtered by the user's profile (`audience` in `all`/gender, `age_group` in `all`/age group). The Android app uses this. The web app ships its own v2 question bank and does not call it.

```json
{
  "success": true,
  "total": 25,
  "questions": [
    {
      "id": 1,
      "question_text": "How often do you feel tired without doing heavy work?",
      "category": "energy",
      "weight": "3.00",
      "options": [ { "label": "Never", "value": "never", "score": 0 }, "…" ],
      "audience": "all",
      "age_group": "all"
    }
  ]
}
```

> `weight` comes back as a string because it is a Postgres `NUMERIC`.

### `POST /api/questionnaire/submit`

Score a completed questionnaire and save it. Two answer formats are accepted; every answer in one request must use the same format.

| Format | Used by | Answer item |
|---|---|---|
| **v2** | Web app | `{ "questionKey": "fatigue_frequency", "answerValue": "often" }` |
| **v1** | Android app | `{ "questionId": 1, "answerValue": "often" }` |

**Body rules**

| Field | Rules |
|---|---|
| `answers` | array, 1–60 items |
| `answers[].answerValue` | string, 1–100 chars |
| `answers[].questionKey` | v2: string, max 60 chars, must exist in the v2 bank; no duplicates |
| `answers[].questionId` | v1: integer 1–1000; no duplicates |

The user's saved `diet_type` is used for the diet component of the score (defaults to `omnivore`).

**v2 example**

```bash
curl -X POST http://localhost:3000/api/questionnaire/submit \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"answers":[{"questionKey":"fatigue_frequency","answerValue":"often"},{"questionKey":"tingling_numbness","answerValue":"sometimes"}]}'
```

**200 OK (v2)**

```json
{
  "success": true,
  "assessment_id": "5a1e…",
  "risk_level": "medium",
  "percentage": 48,
  "breakdown": { "diet": 67, "energy": 75, "neurological": 50 },
  "suggestions": [
    "Consider a B12 blood test at your next check-up, especially if your symptoms continue.",
    "Tingling, numbness, balance or memory changes should be checked by a doctor soon — nerve symptoms from low B12 can become lasting if untreated."
  ],
  "scoring_version": "2.0",
  "completed_at": "2026-11-03T10:20:00.000Z"
}
```

The v1 response has the same fields except `scoring_version` and `completed_at`, and `percentage` / `breakdown` values have up to two decimals.

| Field | Description |
|---|---|
| `risk_level` | `low` · `medium` · `high` |
| `percentage` | 0–100 overall risk score |
| `breakdown` | 0–100 per category group (`diet`, `energy`, `neurological`, `psychological`, `digestive`, `medical`, `lifestyle`, `physical`, `female_health` — only the ones that were asked) |
| `suggestions` | Up to 6 (v2) or 5 (v1) plain-language next steps |

**Errors (400):** `answers array is required` · `Each answer must have either a questionKey or a numeric questionId.` · `Unknown question: <key>` · `Invalid answer for question: <key>` · `Duplicate answer for question: <key>` · `Each question can only be answered once.`

Saving an assessment also writes one `assessment_answers` row per answer and refreshes the user's `user_health_state` baseline, all in one transaction.

### `GET /api/questionnaire/latest`

The most recent assessment (full row), or `null`.

```json
{
  "success": true,
  "assessment": {
    "id": "5a1e…",
    "risk_level": "medium",
    "risk_percentage": "48.00",
    "normalized_score": "48.00",
    "raw_score": "52.00",
    "max_possible_score": "108.00",
    "category_breakdown": { "diet": 67, "energy": 75 },
    "suggestions": ["…"],
    "questions_shown": 22,
    "scoring_version": "2.0",
    "age_at_assessment": 30, "gender": "female", "diet_type": "vegetarian",
    "completed_at": "2026-11-03T10:20:00.000Z",
    "…": "…"
  }
}
```

> `NUMERIC` columns (`risk_percentage`, `normalized_score`, `raw_score`, …) are returned as strings. Convert with `Number()` before doing maths.

### `GET /api/questionnaire/history`

| Query | Default | Max |
|---|---|---|
| `limit` | 20 | 100 |

```json
{
  "success": true,
  "assessments": [
    {
      "id": "5a1e…", "risk_level": "medium", "risk_percentage": "48.00", "normalized_score": "48.00",
      "category_breakdown": { "…": 0 }, "questions_shown": 22, "scoring_version": "2.0",
      "completed_at": "2026-11-03T10:20:00.000Z"
    }
  ]
}
```

Newest first.

### `GET /api/questionnaire/:id`

One assessment with its individual answers. `:id` must be a UUID that belongs to the signed-in user.

```json
{
  "success": true,
  "assessment": { "id": "5a1e…", "…": "…" },
  "answers": [
    {
      "id": "…", "assessment_id": "5a1e…", "question_id": null,
      "answer_value": "often", "answer_label": "Often",
      "answer_score": "3.00", "question_weight": "3.00", "weighted_score": "9.00",
      "question_category": "Energy & Fatigue",
      "question_text_snapshot": "[fatigue_frequency] How often do you feel tired without doing heavy work?",
      "answered_at": "…"
    }
  ]
}
```

**Errors:** `404` `Assessment not found` (also returned for another user's assessment, so IDs cannot be probed).

---

## Check-in

All `/api/checkin/*` endpoints **require auth**.

### `POST /api/checkin/daily`

Log today's symptoms. One check-in per user per day — sending again on the same day **updates** it without changing the streak.

| Field | Type | Scale |
|---|---|---|
| `energyScore` | integer 0–4 | 0 = very poor … 4 = excellent |
| `fatigueScore` | integer 0–4 | **0 = none … 4 = severe** (higher is worse) |
| `moodScore` | integer 0–4 | 0 = very poor … 4 = excellent |
| `sleepScore` | integer 0–4 | 0 = very poor … 4 = excellent |
| `focusScore` | integer 0–4 | 0 = very poor … 4 = excellent |
| `notes` | string \| null | optional, max 500 chars |
| `durationSeconds` | integer \| null | optional, 0–3600 |
| `localDate` | string | optional `YYYY-MM-DD` in the user's timezone. Accepted only if within ±1 day of the server's UTC date; otherwise the UTC date is used. |

```json
{ "energyScore": 2, "fatigueScore": 3, "moodScore": 2, "sleepScore": 1, "focusScore": 2, "localDate": "2026-11-03" }
```

**201 Created** (first check-in today) or **200 OK** (updated):

```json
{
  "success": true,
  "isNew": true,
  "checkinDate": "2026-11-03",
  "checkin": {
    "id": "…", "user_id": "…", "checkin_date": "2026-11-03",
    "energy_score": 2, "fatigue_score": 3, "mood_score": 2, "sleep_score": 1, "focus_score": 2,
    "total_score": 10, "notes": null, "duration_seconds": null
  },
  "streak": { "current_streak": 4, "longest_streak": 9, "total_checkins": 31, "last_checkin_date": "2026-11-03" }
}
```

Streak rules: a check-in the day after the last one extends the streak; a gap resets it to 1; a repeat on the same day changes nothing.

### `GET /api/checkin/history`

| Query | Default | Range |
|---|---|---|
| `days` | 7 | 1–90 |

Returns check-ins from the last `days` days (plus one extra day of slack for timezones), oldest first, and the streak.

```json
{
  "success": true,
  "days": 7,
  "logs": [ { "checkin_date": "2026-10-28", "energy_score": 3, "fatigue_score": 1, "…": "…" } ],
  "streak": { "current_streak": 0, "longest_streak": 9, "total_checkins": 31, "last_checkin_date": "2026-10-29" }
}
```

`streak.current_streak` is reported as `0` when the last check-in was more than 2 days ago. `streak` is `null` if the user has no streak row.

**Errors:** `400` `days must be between 1 and 90.`

---

## Insights

### `GET /api/insights`

**Requires auth.** Rule-based insights computed on request from the latest assessment and the last 7 days of check-ins.

```json
{
  "success": true,
  "total": 2,
  "insights": [
    {
      "type": "risk_moderate",
      "priority": "medium",
      "title": "🔶 Moderate Risk — Take Action",
      "message": "Your score was 48%. Small dietary changes can reduce your B12 risk significantly."
    },
    {
      "type": "trend_alert",
      "priority": "high",
      "title": "😴 Fatigue Pattern Detected",
      "message": "High fatigue reported 4 of the last 6 days. Fatigue is a key B12 deficiency symptom."
    }
  ]
}
```

| `type` | Trigger |
|---|---|
| `risk_alert` / `risk_moderate` / `risk_low` | Latest assessment's risk level |
| `no_assessment` | No assessment yet |
| `trend_alert` | ≥ 3 check-ins this week **and** one of: fatigue ≥ 3 on 3+ days; average energy < 1.5; average mood < 1.5 |
| `checkin_reminder` | No check-ins in the last 7 days |

`priority` is `high`, `medium` or `low`.

---

## Notifications

### `POST /api/notifications/token`

**Requires auth.** Register an Expo push token for the mobile app. Re-registering an existing token re-activates it.

| Field | Type | Rules |
|---|---|---|
| `token` | string | required |
| `platform` | string | `ios` · `android` (default `android`) |

```json
{ "success": true, "message": "Push token registered successfully" }
```

---

## Endpoint summary

| Method | Path | Auth |
|---|---|---|
| GET | `/` | – |
| GET | `/health` | – |
| POST | `/api/auth/register` | – |
| POST | `/api/auth/login` | – |
| POST | `/api/auth/logout` | ✓ |
| POST | `/api/auth/refresh` | – (token in body) |
| GET | `/api/users/profile` | ✓ |
| POST | `/api/users/profile` | ✓ |
| POST | `/api/users/password` | ✓ |
| DELETE | `/api/users/me` | ✓ |
| POST | `/api/users/bmi` | ✓ |
| GET | `/api/users/bmi/latest` | ✓ |
| GET | `/api/users/bmi/history` | ✓ |
| GET | `/api/questionnaire/questions` | ✓ |
| POST | `/api/questionnaire/submit` | ✓ |
| GET | `/api/questionnaire/latest` | ✓ |
| GET | `/api/questionnaire/history` | ✓ |
| GET | `/api/questionnaire/:id` | ✓ |
| POST | `/api/checkin/daily` | ✓ |
| GET | `/api/checkin/history` | ✓ |
| GET | `/api/insights` | ✓ |
| POST | `/api/notifications/token` | ✓ |
