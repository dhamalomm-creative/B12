/**
 * redis.js — optional shared Redis connection (used for rate-limit counters).
 *
 * Set REDIS_URL (e.g. an Upstash or Railway Redis "rediss://..." URL) to share
 * rate-limit counters across every server instance. Without it the app falls back
 * to in-memory counters, which is fine for one long-running server or local dev.
 *
 * Commands fail fast while disconnected (disableOfflineQueue) so a Redis outage
 * can never make API requests hang; callers treat errors as "let the request through".
 */

const { createClient } = require('redis');
const logger = require('../utils/logger');

let client = null;

const getRedisClient = () => {
  const url = (process.env.REDIS_URL || '').trim();
  if (!url) return null;
  if (client) return client;

  client = createClient({
    url,
    disableOfflineQueue: true,
    socket: {
      connectTimeout: 5000,
      // Back off up to 5s between reconnects; never give up (the store fails open meanwhile)
      reconnectStrategy: (retries) => Math.min(retries * 250, 5000),
    },
  });

  // Log connection problems at most once a minute instead of on every retry
  let lastErrorLog = 0;
  client.on('error', (err) => {
    if (Date.now() - lastErrorLog > 60000) {
      lastErrorLog = Date.now();
      logger.warn('Redis connection error — rate limiting falls back to allowing requests', { error: err.message });
    }
  });
  client.on('ready', () => logger.info('Redis connected (shared rate limiting enabled)'));

  client.connect().catch(() => { /* reported by the 'error' handler; reconnects automatically */ });
  return client;
};

module.exports = { getRedisClient };
