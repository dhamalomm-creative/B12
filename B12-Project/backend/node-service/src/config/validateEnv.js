/**
 * validateEnv.js — Startup environment variable validation
 *
 * Security purpose:
 *  - FAIL FAST if required secrets are missing or weak
 *  - Prevent server from starting with default/insecure JWT_SECRET
 *  - Ensure database connectivity config is present
 *
 * Call this BEFORE any other require() in server.js
 */

const validateEnv = () => {
  // Trim accidental leading/trailing whitespace & tabs from copy-pasting
  ['NODE_ENV', 'JWT_SECRET', 'DATABASE_URL', 'ALLOWED_ORIGINS', 'JWT_EXPIRES_IN'].forEach((key) => {
    if (process.env[key]) {
      // Also drop surrounding quotes pasted into a hosting dashboard ("abc" → abc)
      process.env[key] = process.env[key].trim().replace(/^(["'])(.*)\1$/, '$2');
    }
  });

  const errors = [];

  // ── JWT_SECRET: required, min 32 chars, not a default value ──
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    errors.push(
      'JWT_SECRET is missing.\n' +
      '   Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  } else if (jwtSecret.length < 32) {
    errors.push(
      `JWT_SECRET is too short (${jwtSecret.length} chars). Minimum required: 32 characters.`,
    );
  } else {
    const weakPatterns = [
      'change-this', 'change-me', 'changeme', 'secret', 'your-secret',
      'mysecret', 'password', '123456', 'jwt-secret', 'default',
    ];
    // Secrets that were ever published in docs/examples must never be used.
    const publishedSecrets = [
      '5f7a0fd5ccc99d4cd7e14a0e235ebc646ec23eaf71a97c13a95062fbcaeb4907',
      'B12HealthSecretKey2026ChangeMeInProduction',
    ];
    // Report which rule matched (never the secret itself) so a failed deploy is easy to diagnose.
    const weakWord = weakPatterns.find((p) => jwtSecret.toLowerCase().includes(p));
    let reason = null;
    if (publishedSecrets.includes(jwtSecret)) reason = 'it is the old value that was published in this repo';
    else if (/^REPLACE[-_]/i.test(jwtSecret)) reason = 'it is still the REPLACE_WITH… placeholder';
    else if (weakWord) reason = `it contains the word "${weakWord}"`;
    if (reason) {
      errors.push(
        `JWT_SECRET appears to be a default/placeholder value — ${reason} (length ${jwtSecret.length}).\n` +
        '   Generate a new one: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"\n' +
        '   Then set it in your host\'s environment variables (Vercel: Project → Settings →\n' +
        '   Environment Variables → Production; Railway: Service → Variables) and REDEPLOY.',
      );
    }
  }

  // ── Database: require either DATABASE_URL or DB_HOST ──
  if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
    errors.push('DATABASE_URL or DB_HOST is required.');
  }

  // ── NODE_ENV: must be a known value ──
  const validEnvs = ['development', 'test', 'production'];
  if (process.env.NODE_ENV && !validEnvs.includes(process.env.NODE_ENV)) {
    errors.push(
      `NODE_ENV "${process.env.NODE_ENV}" is not valid. Must be one of: ${validEnvs.join(', ')}`,
    );
  }

  // ── ALLOWED_ORIGINS: warn if empty in production ──
  if (
    process.env.NODE_ENV === 'production' &&
    !process.env.ALLOWED_ORIGINS
  ) {
    errors.push(
      'ALLOWED_ORIGINS is required in production. Set to comma-separated list of allowed origins.',
    );
  }

  if (errors.length > 0) {
    console.error('\n🚨 SECURITY ERROR: Invalid or missing environment variables:');
    console.error('═'.repeat(60));
    errors.forEach((e) => console.error(`\n  ❌ ${e}`));
    console.error('\n' + '═'.repeat(60));
    console.error('\n🛑 Server will NOT start until these are resolved.\n');
    process.exit(1);
  }

  const env = process.env.NODE_ENV || 'development';
  console.log(`✅ [validateEnv] Environment validated — mode: ${env}`);
};

module.exports = validateEnv;
