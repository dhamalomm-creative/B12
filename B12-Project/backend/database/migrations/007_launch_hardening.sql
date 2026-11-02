-- ============================================================
-- Migration 007: Launch hardening (security + performance)
--
-- Safe to run more than once. Run it in the Supabase SQL editor
-- AFTER supabase_setup.sql (or migrations 001-006).
--
-- 1. Row Level Security on every table
--    Supabase exposes the `public` schema through its auto-generated REST API
--    (PostgREST). Without RLS, anyone holding the project's anon key could read
--    users.password_hash and every user's health data directly, bypassing this API.
--    Enabling RLS with NO policies blocks that path completely. The Node API is
--    unaffected: it connects as the table owner (`postgres`), which bypasses RLS.
--
-- 2. Remove duplicate indexes
--    These columns already have a UNIQUE / PRIMARY KEY index, so the extra index
--    only slows down every INSERT/UPDATE and wastes storage.
--
-- 3. Scheduled cleanup of tables that otherwise grow forever
--    (token_blacklist, login_attempts, audit_logs).
-- ============================================================

-- ── 1. Row Level Security ───────────────────────────────────
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens        ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights_log       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bmi_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_health_state  ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_blacklist    ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs         ENABLE ROW LEVEL SECURITY;

-- Belt and braces: the public API roles get no table privileges at all.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon';
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon';
    EXECUTE 'REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM authenticated';
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated';
    EXECUTE 'REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM authenticated';
  END IF;
END $$;

-- ── 2. Duplicate indexes ────────────────────────────────────
DROP INDEX IF EXISTS idx_users_email;              -- users.email is UNIQUE
DROP INDEX IF EXISTS idx_profiles_user;            -- user_profiles.user_id is UNIQUE
DROP INDEX IF EXISTS idx_streaks_user;             -- user_streaks.user_id is UNIQUE
DROP INDEX IF EXISTS idx_user_health_state_user;   -- user_health_state.user_id is UNIQUE
DROP INDEX IF EXISTS idx_token_blacklist_jti;      -- token_blacklist.jti is the PRIMARY KEY
DROP INDEX IF EXISTS idx_daily_checkins_user_date; -- UNIQUE(user_id, checkin_date) covers it

-- ── 3. Cleanup ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION cleanup_security_tables()
RETURNS VOID AS $$
BEGIN
  DELETE FROM token_blacklist WHERE expires_at   < NOW();
  DELETE FROM login_attempts  WHERE attempted_at < NOW() - INTERVAL '90 days';
  DELETE FROM audit_logs      WHERE created_at   < NOW() - INTERVAL '365 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule it nightly when pg_cron is enabled
-- (Supabase: Database -> Extensions -> enable "pg_cron", then re-run this file).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'b12-cleanup-security-tables';
    PERFORM cron.schedule('b12-cleanup-security-tables', '15 3 * * *', 'SELECT cleanup_security_tables()');
  ELSE
    RAISE NOTICE 'pg_cron is not enabled - enable it and re-run this migration to schedule cleanup.';
  END IF;
END $$;
