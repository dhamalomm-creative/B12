/**
 * rateLimiter.js — Tiered rate limiting with progressive slow-down
 *
 * Defence layers:
 *  1. authLimiter   — 5 failed requests / 15 min per IP+email (brute-force, credential stuffing)
 *  2. apiLimiter    — 300 requests / 15 min per IP (general API abuse; env RATE_LIMIT_MAX)
 *  3. authSlowDown  — progressive delays after 3 auth requests (makes automation expensive)
 *
 * Key-generator for auth: IP + email combo
 *   → Prevents distributed attacks where one attacker rotates IPs
 *   → One email can't be hammered from 1000 IPs
 *
 * Counters are shared across all server instances when REDIS_URL is set (see
 * config/redis.js); otherwise each instance keeps its own in memory. If Redis is
 * unavailable, requests are let through (passOnStoreError) — logins stay protected
 * by the per-email lockout in routes/auth.js, which is stored in Postgres.
 */

const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { getRedisClient } = require('../config/redis');
const RedisStore = require('./redisStore');

const redis = getRedisClient();
// Each limiter needs its own store instance and key prefix.
const sharedStore = (prefix) => (redis ? { store: new RedisStore(redis, prefix), passOnStoreError: true } : {});

// Emails are hashed so raw addresses never end up as Redis keys.
const emailKey = (req) => crypto
  .createHash('sha256')
  .update((req.body?.email || '').toLowerCase().substring(0, 254))
  .digest('hex')
  .slice(0, 32);

// ── [1] Auth rate limiter: strict on failures ──
// Defends against: brute-force login, credential stuffing, account enumeration
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  skipSuccessfulRequests: true, // Only count failed attempts so legitimate users are not penalized
  message: {
    success: false,
    error: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
    code: 'RATE_LIMIT_AUTH',
  },
  keyGenerator: (req) => {
    // Combine IP + email for key — prevents single-IP bypass AND email-targeted attacks
    const ip = req.ip || 'unknown';
    return `auth_${ip}_${emailKey(req)}`;
  },
  ...sharedStore('rl:auth:'),
});

// ── [2] General API rate limiter: moderate ──
// Defends against: API scraping, automated scanning, general abuse
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || String(15 * 60 * 1000)),
  max: parseInt(process.env.RATE_LIMIT_MAX || '300'),
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
    code: 'RATE_LIMIT_API',
  },
  ...sharedStore('rl:api:'),
});

// ── [3] Progressive slow-down for auth endpoints ──
// Defends against: slow/distributed brute-force that tries to stay under rate limits
// After 3 requests → add 500ms delay. After 4 → 1000ms. After 5 → blocked by authLimiter.
// Makes automation VERY expensive before hitting hard block.
const authSlowDown = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 3,             // Start adding delay after 3 requests
  delayMs: (hits) => (hits - 3) * 500, // +500ms per request after the 3rd
  maxDelayMs: 10000,         // Cap at 10 seconds
  skipSuccessfulRequests: true, // Don't slow down people who simply log in a few times a day
  validate: false,
  keyGenerator: (req) => {
    const ip = req.ip || 'unknown';
    return `slowdown_${ip}_${emailKey(req)}`;
  },
  ...sharedStore('rl:slow:'),
});

module.exports = { authLimiter, apiLimiter, authSlowDown };
