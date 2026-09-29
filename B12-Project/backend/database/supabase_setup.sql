-- ============================================================
-- Migration 001: Core Tables (Users, Profiles, Push Tokens)
-- B12 Health Tracker Backend
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- USERS â€” authentication
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),                   -- NULL for Google OAuth users
  google_id     VARCHAR(255) UNIQUE,            -- Google OAuth (Phase 2)
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- USER PROFILES â€” demographic & medical baseline
-- All columns are ML feature candidates
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS user_profiles (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  name                    VARCHAR(255),

  -- Demographics (ML features)
  age                     SMALLINT CHECK (age > 0 AND age < 120),
  age_group               VARCHAR(10),           -- '15-24' | '25-40' | '41-60' | '60+'
  gender                  VARCHAR(20),           -- 'male' | 'female' | 'other'

  -- Diet (ML feature â€” scored)
  diet_type               VARCHAR(20),           -- 'vegan' | 'vegetarian' | 'pescatarian' | 'omnivore'
  diet_penalty_score      SMALLINT DEFAULT 0,    -- vegan=12, vegetarian=8, pescatarian=4, omnivore=0

  -- Medical conditions (binary ML features)
  has_pernicious_anemia   BOOLEAN DEFAULT FALSE,
  has_crohns_disease      BOOLEAN DEFAULT FALSE,
  has_celiac_disease      BOOLEAN DEFAULT FALSE,
  has_gastric_surgery     BOOLEAN DEFAULT FALSE, -- gastric bypass/resection
  has_ibs                 BOOLEAN DEFAULT FALSE,

  -- Medications (binary ML features)
  takes_metformin         BOOLEAN DEFAULT FALSE,
  takes_ppi               BOOLEAN DEFAULT FALSE, -- proton pump inhibitors

  -- Female-specific (Phase 2)
  is_pregnant             BOOLEAN DEFAULT FALSE,
  is_breastfeeding        BOOLEAN DEFAULT FALSE,

  -- Lifestyle
  alcohol_frequency       VARCHAR(20),           -- 'never' | 'social' | 'weekly' | 'daily'
  smoking_status          VARCHAR(20),           -- 'never' | 'former' | 'current'

  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- PUSH TOKENS â€” Expo push notifications
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS push_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  token       VARCHAR(500) NOT NULL,
  platform    VARCHAR(10),                       -- 'ios' | 'android'
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);
-- ============================================================
-- Migration 002: Questionnaire â€” ML-Ready Answer Storage
-- B12 Health Tracker Backend
-- ============================================================

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- QUESTIONS â€” master question bank
-- Matches src/data/questions.js in the RN app
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS questions (
  id              SERIAL PRIMARY KEY,
  question_text   TEXT NOT NULL,

  -- ML feature grouping
  category        VARCHAR(30) NOT NULL,
  -- 'diet' | 'neurological' | 'energy' | 'digestive' | 'lifestyle' | 'psychological'

  question_type   VARCHAR(20) DEFAULT 'multiple_choice',

  -- Adaptive filtering (matches RN app logic)
  audience        VARCHAR(20) DEFAULT 'all',    -- 'all' | 'female' | 'male'
  age_group       VARCHAR(20) DEFAULT 'all',    -- 'all' | '15-24' | '25-40' | '41-60' | '60+'

  -- Scoring
  weight          NUMERIC(4,2) NOT NULL DEFAULT 1.0,  -- ML feature importance multiplier
  max_option_score NUMERIC(4,2) NOT NULL DEFAULT 4.0, -- highest answer.score in options

  -- Options stored as structured JSON for ML export
  -- Format: [{ "label": "Never", "value": "never", "score": 0 }]
  options         JSONB NOT NULL,

  -- Admin
  is_active       BOOLEAN DEFAULT TRUE,
  display_order   SMALLINT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- ASSESSMENTS â€” one row per completed questionnaire
-- Stores profile snapshot at time of assessment for ML
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS assessments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES users(id) ON DELETE CASCADE,

  -- â”€â”€ Profile snapshot at assessment time â”€â”€
  -- (Stored separately so changing profile doesn't corrupt history)
  age_at_assessment     SMALLINT,
  age_group             VARCHAR(10),
  gender                VARCHAR(20),
  diet_type             VARCHAR(20),
  diet_penalty_score    SMALLINT,
  has_pernicious_anemia BOOLEAN DEFAULT FALSE,
  has_crohns_disease    BOOLEAN DEFAULT FALSE,
  has_celiac_disease    BOOLEAN DEFAULT FALSE,
  has_gastric_surgery   BOOLEAN DEFAULT FALSE,
  takes_metformin       BOOLEAN DEFAULT FALSE,
  takes_ppi             BOOLEAN DEFAULT FALSE,

  -- â”€â”€ Scoring results â”€â”€
  raw_score             NUMERIC(6,2),           -- Î£(answer.score Ã— question.weight)
  max_possible_score    NUMERIC(6,2),           -- max score for this adaptive question set
  normalized_score      NUMERIC(5,2),           -- (raw/max) Ã— 100, range 0â€“100
  risk_percentage       NUMERIC(5,2),           -- same as normalized_score, kept for clarity
  risk_level            VARCHAR(10) NOT NULL,   -- 'low' | 'medium' | 'high'

  -- Category breakdown (JSON for frontend charts)
  -- Format: { "diet": 45.0, "neurological": 70.0, ... }
  category_breakdown    JSONB,

  -- Suggestions list returned to app
  suggestions           JSONB,                  -- ["Eat more fish", ...]

  -- â”€â”€ ML labels â”€â”€
  -- Filled later when ground truth is available (doctor/lab test confirmation)
  ml_label              VARCHAR(15),            -- 'deficient' | 'borderline' | 'normal'
  doctor_confirmed      BOOLEAN DEFAULT FALSE,
  lab_b12_value_pmol    NUMERIC(8,2),           -- actual lab B12 level if user inputs it (pmol/L)

  -- Metadata
  questions_shown       SMALLINT,               -- adaptive: 20â€“25 questions per session
  scoring_version       VARCHAR(10) DEFAULT '1.0', -- version tag for rule changes
  completed_at          TIMESTAMPTZ DEFAULT NOW(),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- ASSESSMENT_ANSWERS â€” core ML training table
-- One row per answer = ready for ML feature matrix
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS assessment_answers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id     UUID REFERENCES assessments(id) ON DELETE CASCADE,

  -- Denormalized for direct ML export without joins
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Question reference
  question_id       INT REFERENCES questions(id),

  -- â”€â”€ Raw answer â”€â”€
  answer_value      VARCHAR(100) NOT NULL,      -- e.g. 'never', 'sometimes', 'daily'
  answer_label      VARCHAR(200),               -- human-readable at time of answer

  -- â”€â”€ Scoring (snapshot â€” question weights can change over time) â”€â”€
  answer_score      NUMERIC(4,2) NOT NULL,      -- score from the options array
  question_weight   NUMERIC(4,2) NOT NULL,      -- weight at time of this answer
  weighted_score    NUMERIC(6,2) GENERATED ALWAYS AS (answer_score * question_weight) STORED,

  -- Question metadata snapshot (for ML without joining questions table)
  question_category VARCHAR(30),
  question_text_snapshot TEXT,                  -- text at time of answer

  -- Timing
  answered_at       TIMESTAMPTZ DEFAULT NOW()
);

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Indexes â€” performance + ML export
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE INDEX IF NOT EXISTS idx_assessments_user_date
  ON assessments(user_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_assessment_answers_export
  ON assessment_answers(user_id, question_category, answered_at);

CREATE INDEX IF NOT EXISTS idx_assessment_answers_assessment
  ON assessment_answers(assessment_id);

CREATE INDEX IF NOT EXISTS idx_questions_active
  ON questions(is_active, audience, age_group, display_order);
-- ============================================================
-- Migration 003: Daily Check-in & Streak Tracking
-- B12 Health Tracker Backend
-- ============================================================

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- DAILY_CHECKINS â€” 5-question daily log
-- Matches DailyCheckInScreen.js (5 questions, scored 0â€“4)
-- Also ML-ready: each metric is a separate column
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS daily_checkins (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
  checkin_date      DATE NOT NULL,

  -- â”€â”€ 5 daily symptom scores (0â€“4 each) â”€â”€
  -- These 5 dimensions match WeeklyProgressScreen.js chart categories
  energy_score      SMALLINT NOT NULL CHECK (energy_score BETWEEN 0 AND 4),
  fatigue_score     SMALLINT NOT NULL CHECK (fatigue_score BETWEEN 0 AND 4),
  mood_score        SMALLINT NOT NULL CHECK (mood_score BETWEEN 0 AND 4),
  sleep_score       SMALLINT NOT NULL CHECK (sleep_score BETWEEN 0 AND 4),
  focus_score       SMALLINT NOT NULL CHECK (focus_score BETWEEN 0 AND 4),

  -- Auto-computed total (0â€“20)
  total_score       SMALLINT GENERATED ALWAYS AS
                    (energy_score + fatigue_score + mood_score + sleep_score + focus_score) STORED,

  -- Optional free-text note
  notes             TEXT,

  -- Metadata
  duration_seconds  SMALLINT,                   -- how long the check-in took (UX metric)
  created_at        TIMESTAMPTZ DEFAULT NOW(),

  -- One check-in per user per day
  UNIQUE(user_id, checkin_date)
);

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- USER_STREAKS â€” streak + habit tracking
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS user_streaks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  current_streak      INT DEFAULT 0,
  longest_streak      INT DEFAULT 0,
  total_checkins      INT DEFAULT 0,
  last_checkin_date   DATE,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- INSIGHTS_LOG â€” server-generated insights cache
-- Stored so we can track what insights were shown
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS insights_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  insight_type  VARCHAR(30),                    -- 'risk_based' | 'trend_alert' | 'streak'
  insight_text  TEXT NOT NULL,
  metadata      JSONB,                          -- { "triggered_by": "fatigue_3days", ... }
  shown_at      TIMESTAMPTZ DEFAULT NOW()
);

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Indexes
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date
  ON daily_checkins(user_id, checkin_date DESC);

CREATE INDEX IF NOT EXISTS idx_streaks_user
  ON user_streaks(user_id);

CREATE INDEX IF NOT EXISTS idx_insights_user
  ON insights_log(user_id, shown_at DESC);
-- â”€â”€â”€ 004_bmi.sql â€” BMI Logs Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Stores periodic BMI measurements per user.
-- One record per measurement. The latest record is used for food recommendations.

CREATE TABLE IF NOT EXISTS user_bmi_logs (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  height_cm       REAL         NOT NULL CHECK (height_cm BETWEEN 50 AND 300),
  weight_kg       REAL         NOT NULL CHECK (weight_kg BETWEEN 10 AND 500),
  bmi             REAL         NOT NULL,
  bmi_category    VARCHAR(20)  NOT NULL,  -- 'underweight' | 'normal' | 'overweight' | 'obese'
  measured_at     DATE         NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Index for fast lookup of latest record per user
CREATE INDEX IF NOT EXISTS idx_user_bmi_logs_user_date
  ON user_bmi_logs (user_id, measured_at DESC);
-- ============================================================
-- Migration 005: User Health State
-- B12 Health Tracker Backend
-- ============================================================
-- This is a LIVING table â€” one row per user.
-- Created when the user first submits the questionnaire.
-- Overwritten every time the user submits a daily check-in.
-- The source assessments row is NEVER modified.
-- ============================================================

CREATE TABLE IF NOT EXISTS user_health_state (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- â”€â”€ Identity â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  -- One row per user (UNIQUE enforces this)
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (user_id),

  -- â”€â”€ Link to original questionnaire (read-only reference) â”€â”€
  -- We never touch the assessments row; this FK just lets us
  -- trace which questionnaire session seeded this record.
  assessment_id         UUID REFERENCES assessments(id) ON DELETE SET NULL,

  -- â”€â”€ Questionnaire data (copied once from assessments) â”€â”€â”€â”€â”€
  -- These reflect the user's medical baseline from onboarding.
  -- They do NOT change unless the user re-does the questionnaire.
  age_at_assessment     SMALLINT,
  age_group             VARCHAR(10),
  gender                VARCHAR(20),
  diet_type             VARCHAR(20),
  diet_penalty_score    SMALLINT       DEFAULT 0,
  has_pernicious_anemia BOOLEAN        DEFAULT FALSE,
  has_crohns_disease    BOOLEAN        DEFAULT FALSE,
  has_celiac_disease    BOOLEAN        DEFAULT FALSE,
  has_gastric_surgery   BOOLEAN        DEFAULT FALSE,
  takes_metformin       BOOLEAN        DEFAULT FALSE,
  takes_ppi             BOOLEAN        DEFAULT FALSE,

  -- Original risk result from the questionnaire
  baseline_risk_level   VARCHAR(10),          -- 'low' | 'medium' | 'high'
  baseline_risk_score   NUMERIC(5, 2),        -- normalized 0-100

  -- â”€â”€ Daily updated fields (overwritten on every check-in) â”€â”€
  -- Latest daily scores (0-4 each)
  current_energy_score  SMALLINT,
  current_fatigue_score SMALLINT,
  current_mood_score    SMALLINT,
  current_sleep_score   SMALLINT,
  current_focus_score   SMALLINT,
  current_daily_total   SMALLINT,             -- sum of 5 scores (0-20)

  -- â”€â”€ Metadata â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  last_checkin_date     DATE,
  total_checkins        INT            DEFAULT 0,
  created_at            TIMESTAMPTZ    DEFAULT NOW(),
  updated_at            TIMESTAMPTZ    DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_health_state_user
  ON user_health_state(user_id);

CREATE INDEX IF NOT EXISTS idx_user_health_state_assessment
  ON user_health_state(assessment_id);
-- ============================================================
-- Migration 006: Security Tables
-- B12 Health Tracker Backend
--
-- Tables created:
--   1. token_blacklist  â€” JWT logout / token revocation
--   2. login_attempts   â€” Brute-force & credential stuffing tracking
--   3. audit_logs       â€” Full security event audit trail
--
-- Defends against:
--   Stolen tokens, brute-force login, credential stuffing,
--   IDOR attacks, account takeover, insider threats
-- ============================================================


-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 1. TOKEN BLACKLIST â€” JWT logout / revocation
--
-- When a user logs out, their token's unique ID (jti) is
-- stored here. The auth middleware checks this table on EVERY
-- request. If the jti is found â†’ token is rejected immediately,
-- even if it hasn't expired yet.
--
-- Self-cleaning: expired entries are purged by cleanup_expired_tokens()
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS token_blacklist (
  jti         VARCHAR(36) PRIMARY KEY,              -- JWT unique ID (UUID format)
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL,                -- Token's original expiry â€” used for cleanup
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Fast lookup on every authenticated request
CREATE INDEX IF NOT EXISTS idx_token_blacklist_jti     ON token_blacklist(jti);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_user    ON token_blacklist(user_id);


-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 2. LOGIN ATTEMPTS â€” Brute-force & credential stuffing tracking
--
-- Every login attempt (success or failure) is recorded here.
-- The auth route queries this table to:
--   a) Block login if â‰¥5 failures in last 15 minutes (per email)
--   b) Auto-lock account after consecutive failures
--   c) Detect credential stuffing (same IP, many emails)
--
-- INET type stores IPv4 and IPv6 addresses natively in Postgres
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS login_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL,
  ip_address    INET NOT NULL,
  success       BOOLEAN NOT NULL DEFAULT FALSE,
  attempted_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Query pattern: WHERE email = ? AND attempted_at >= ? AND success = false
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email, attempted_at DESC);
-- Query pattern: WHERE ip_address = ? AND attempted_at >= ?  (detect credential stuffing)
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip    ON login_attempts(ip_address, attempted_at DESC);


-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- 3. AUDIT LOGS â€” Security event trail
--
-- Every security-relevant action is recorded here:
--   LOGIN, LOGOUT, FAILED_LOGIN, ACCOUNT_LOCKED, REGISTER,
--   PASSWORD_CHANGE, TOKEN_REFRESH, IDOR_ATTEMPT, etc.
--
-- Purpose:
--   a) Forensic investigation after a breach
--   b) Compliance (DPDP Act, HIPAA, GDPR principles)
--   c) Real-time alerting integration (export to SIEM)
--   d) Detect anomalous patterns (login from new country, etc.)
--
-- metadata JSONB allows flexible extra context per event type
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,  -- Keep log even if user deleted
  event_type  VARCHAR(50) NOT NULL,
  ip_address  INET,
  user_agent  TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Query by user (all actions by a specific user)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user       ON audit_logs(user_id, created_at DESC);
-- Query by event type (all failed logins in last 24h)
CREATE INDEX IF NOT EXISTS idx_audit_logs_event      ON audit_logs(event_type, created_at DESC);
-- Query by IP (all activity from a suspicious IP)
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip         ON audit_logs(ip_address, created_at DESC);
-- General time-range queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);


-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- MAINTENANCE: Cleanup function for expired blacklisted tokens
--
-- Blacklisted tokens are only needed until they expire naturally.
-- After expiry, they can't be used anyway â€” so we clean them up.
--
-- Schedule with pg_cron (if available):
--   SELECT cron.schedule('cleanup-tokens', '0 * * * *', 'SELECT cleanup_expired_tokens()');
--
-- Or call manually / from a Node.js cron job.
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM token_blacklist WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Also purge very old login_attempts (keep last 90 days for forensics)
CREATE OR REPLACE FUNCTION cleanup_old_login_attempts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM login_attempts WHERE attempted_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
-- ============================================================
-- Questions Seed â€” B12 Adaptive Questionnaire
-- 25 questions matching src/data/questions.js in the RN app
-- Categories: diet, neurological, energy, digestive, lifestyle, psychological
-- Audiences: all | female | male
-- Age groups: all | 15-24 | 25-40 | 41-60 | 60+
-- ============================================================

-- Clear existing data (for re-seeding)
TRUNCATE TABLE questions RESTART IDENTITY CASCADE;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- COMMON QUESTIONS (10) â€” shown to everyone
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

INSERT INTO questions (question_text, category, weight, max_option_score, audience, age_group, options, display_order) VALUES
(
  'How often do you eat animal-based foods (meat, fish, eggs, dairy)?',
  'diet', 2.0, 4, 'all', 'all',
  '[
    {"label":"Daily","value":"daily","score":0},
    {"label":"A few times a week","value":"few_week","score":1},
    {"label":"Rarely (once a week or less)","value":"rarely","score":3},
    {"label":"Never","value":"never","score":4}
  ]',
  1
),
(
  'Do you take any Vitamin B12 supplements?',
  'diet', 1.5, 4, 'all', 'all',
  '[
    {"label":"Yes, regularly","value":"yes_regular","score":0},
    {"label":"Yes, occasionally","value":"yes_occasional","score":1},
    {"label":"No","value":"no","score":4}
  ]',
  2
),
(
  'How often do you experience unusual tiredness or fatigue?',
  'energy', 1.8, 4, 'all', 'all',
  '[
    {"label":"Never","value":"never","score":0},
    {"label":"Sometimes (1-2 days/week)","value":"sometimes","score":1},
    {"label":"Often (3-5 days/week)","value":"often","score":3},
    {"label":"Almost always","value":"always","score":4}
  ]',
  3
),
(
  'Do you experience numbness, tingling, or "pins and needles" in your hands or feet?',
  'neurological', 2.0, 4, 'all', 'all',
  '[
    {"label":"Never","value":"never","score":0},
    {"label":"Occasionally","value":"occasionally","score":1},
    {"label":"Frequently","value":"frequently","score":3},
    {"label":"Daily","value":"daily","score":4}
  ]',
  4
),
(
  'Have you noticed any difficulty concentrating, memory lapses, or "brain fog"?',
  'neurological', 1.8, 4, 'all', 'all',
  '[
    {"label":"Never","value":"never","score":0},
    {"label":"Occasionally","value":"occasionally","score":1},
    {"label":"Frequently","value":"frequently","score":3},
    {"label":"Very often","value":"very_often","score":4}
  ]',
  5
),
(
  'Do you experience shortness of breath or heart palpitations without physical exertion?',
  'energy', 1.6, 4, 'all', 'all',
  '[
    {"label":"Never","value":"never","score":0},
    {"label":"Rarely","value":"rarely","score":1},
    {"label":"Sometimes","value":"sometimes","score":2},
    {"label":"Frequently","value":"frequently","score":4}
  ]',
  6
),
(
  'How would you describe your mood in general?',
  'psychological', 1.5, 4, 'all', 'all',
  '[
    {"label":"Generally positive","value":"positive","score":0},
    {"label":"Occasionally low or irritable","value":"occasional_low","score":1},
    {"label":"Frequently anxious or depressed","value":"frequent_low","score":3},
    {"label":"Persistently depressed or moody","value":"persistent_low","score":4}
  ]',
  7
),
(
  'Do you have any digestive issues such as bloating, indigestion, or loss of appetite?',
  'digestive', 1.4, 4, 'all', 'all',
  '[
    {"label":"Never","value":"never","score":0},
    {"label":"Occasionally","value":"occasionally","score":1},
    {"label":"Frequently","value":"frequently","score":3},
    {"label":"Very often or always","value":"always","score":4}
  ]',
  8
),
(
  'Has a doctor ever told you that you have anaemia?',
  'energy', 2.0, 4, 'all', 'all',
  '[
    {"label":"No","value":"no","score":0},
    {"label":"In the past but resolved","value":"past","score":2},
    {"label":"Currently diagnosed","value":"current","score":4}
  ]',
  9
),
(
  'Is the top of your tongue smooth, red, or sore (glossitis)?',
  'digestive', 1.6, 4, 'all', 'all',
  '[
    {"label":"No, looks normal","value":"no","score":0},
    {"label":"Occasionally sore","value":"occasionally","score":2},
    {"label":"Yes, smooth and often sore","value":"yes","score":4}
  ]',
  10
),

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- AGE-BASED QUESTIONS
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Young adults (15â€“24)
(
  'Are you currently following a strict vegan or plant-based diet without B12 fortified foods?',
  'diet', 1.8, 4, 'all', '15-24',
  '[
    {"label":"No","value":"no","score":0},
    {"label":"Vegetarian but eat dairy/eggs","value":"vegetarian","score":1},
    {"label":"Vegan with some fortified foods","value":"vegan_fortified","score":2},
    {"label":"Strict vegan, no fortified foods","value":"strict_vegan","score":4}
  ]',
  11
),
(
  'How often do you consume energy drinks or highly processed foods as meal replacements?',
  'lifestyle', 1.2, 4, 'all', '15-24',
  '[
    {"label":"Never","value":"never","score":0},
    {"label":"Occasionally (1-2/week)","value":"occasionally","score":1},
    {"label":"Often (3-5/week)","value":"often","score":3},
    {"label":"Daily","value":"daily","score":4}
  ]',
  12
),

-- Adults (25â€“40)
(
  'Are you currently pregnant, planning to become pregnant, or breastfeeding?',
  'lifestyle', 2.0, 4, 'female', '25-40',
  '[
    {"label":"No","value":"no","score":0},
    {"label":"Planning to become pregnant","value":"planning","score":1},
    {"label":"Currently pregnant","value":"pregnant","score":3},
    {"label":"Breastfeeding","value":"breastfeeding","score":3}
  ]',
  13
),
(
  'Do you regularly take medications such as metformin (for diabetes) or proton pump inhibitors (antacids)?',
  'lifestyle', 2.0, 4, 'all', '25-40',
  '[
    {"label":"No","value":"no","score":0},
    {"label":"Occasionally","value":"occasionally","score":1},
    {"label":"Yes, one of these","value":"yes_one","score":3},
    {"label":"Yes, both","value":"yes_both","score":4}
  ]',
  14
),

-- Middle-aged (41â€“60)
(
  'Have you ever had any stomach or gastrointestinal surgery (e.g., gastric bypass, stomach removal)?',
  'lifestyle', 2.5, 4, 'all', '41-60',
  '[
    {"label":"No","value":"no","score":0},
    {"label":"Minor GI procedure","value":"minor","score":1},
    {"label":"Yes, major GI surgery","value":"major","score":4}
  ]',
  15
),
(
  'Have you been diagnosed with an autoimmune condition such as pernicious anaemia, Crohn''s disease, or Celiac disease?',
  'lifestyle', 2.5, 4, 'all', '41-60',
  '[
    {"label":"No","value":"no","score":0},
    {"label":"Suspected but not confirmed","value":"suspected","score":2},
    {"label":"Yes, diagnosed","value":"yes","score":4}
  ]',
  16
),

-- Seniors (60+)
(
  'Did you know that B12 absorption decreases with age? Do you take a B12 supplement specifically for this reason?',
  'diet', 1.5, 4, 'all', '60+',
  '[
    {"label":"Yes, I take a supplement","value":"yes","score":0},
    {"label":"No, but I eat B12-rich foods daily","value":"diet_focused","score":1},
    {"label":"No supplement, eat some B12 foods","value":"no_supplement_some","score":3},
    {"label":"No supplement, limited B12 foods","value":"no_supplement_none","score":4}
  ]',
  17
),
(
  'Have you noticed any problems with balance, walking steadily, or coordination?',
  'neurological', 2.2, 4, 'all', '60+',
  '[
    {"label":"No","value":"no","score":0},
    {"label":"Occasionally","value":"occasionally","score":2},
    {"label":"Frequently","value":"frequently","score":4}
  ]',
  18
),
(
  'Have you experienced any confusion, memory problems, or early signs of dementia?',
  'neurological', 2.5, 4, 'all', '60+',
  '[
    {"label":"No","value":"no","score":0},
    {"label":"Some forgetfulness","value":"some","score":1},
    {"label":"Noticeable memory issues","value":"noticeable","score":3},
    {"label":"Yes, diagnosed/significant concern","value":"significant","score":4}
  ]',
  19
),

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- GENDER-BASED QUESTIONS
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

-- Female-specific
(
  'Do you experience heavy menstrual periods that last more than 5 days?',
  'energy', 1.6, 4, 'female', 'all',
  '[
    {"label":"No / Not applicable","value":"no","score":0},
    {"label":"Moderate (5â€“7 days)","value":"moderate","score":1},
    {"label":"Heavy (over 7 days or very heavy flow)","value":"heavy","score":3}
  ]',
  20
),
(
  'Have you recently given birth or finished breastfeeding in the last 12 months?',
  'lifestyle', 1.8, 4, 'female', 'all',
  '[
    {"label":"No","value":"no","score":0},
    {"label":"Gave birth over 6 months ago","value":"over_6mo","score":1},
    {"label":"Currently breastfeeding or gave birth within 6 months","value":"recent","score":3}
  ]',
  21
),

-- Male-specific
(
  'Do you consume alcohol more than 3 times per week?',
  'lifestyle', 1.4, 4, 'male', 'all',
  '[
    {"label":"No / Rarely","value":"no","score":0},
    {"label":"1-2 times a week","value":"low","score":1},
    {"label":"3-4 times a week","value":"moderate","score":2},
    {"label":"Daily","value":"daily","score":4}
  ]',
  22
),
(
  'Do you engage in high-intensity training or endurance sports that require a high-protein diet?',
  'lifestyle', 1.2, 4, 'male', 'all',
  '[
    {"label":"No","value":"no","score":0},
    {"label":"Recreational exercise","value":"recreational","score":0},
    {"label":"Regular high-intensity training","value":"high_intensity","score":1},
    {"label":"Professional / daily endurance sport","value":"professional","score":2}
  ]',
  23
),

-- General lifestyle (applicable to all)
(
  'How would you rate your current stress levels?',
  'psychological', 1.3, 4, 'all', 'all',
  '[
    {"label":"Low â€” I manage stress well","value":"low","score":0},
    {"label":"Moderate â€” sometimes stressed","value":"moderate","score":1},
    {"label":"High â€” frequently stressed","value":"high","score":3},
    {"label":"Very high â€” chronic stress","value":"very_high","score":4}
  ]',
  24
),
(
  'How many hours of sleep do you typically get per night?',
  'lifestyle', 1.1, 4, 'all', 'all',
  '[
    {"label":"7â€“9 hours (recommended)","value":"optimal","score":0},
    {"label":"6â€“7 hours","value":"slightly_less","score":1},
    {"label":"5â€“6 hours","value":"less","score":2},
    {"label":"Less than 5 hours","value":"very_less","score":4}
  ]',
  25
);
