/**
 * redisStore.js — express-rate-limit Store backed by Redis.
 *
 * Counters live in Redis, so every API instance (Vercel functions, several Railway
 * replicas) shares the same limits. One atomic Lua call per request increments the
 * counter and starts its expiry window.
 *
 * Errors are thrown (not swallowed) so express-rate-limit's `passOnStoreError`
 * decides what happens; the limiters in rateLimiter.js let the request through.
 */

const INCREMENT_SCRIPT = `
local hits = redis.call('INCR', KEYS[1])
local ttl = redis.call('PTTL', KEYS[1])
if ttl <= 0 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return { hits, ttl }
`;

// How long a request may wait for a (re)connecting Redis before failing open.
const READY_TIMEOUT_MS = 1500;

class RedisStore {
  /**
   * @param {import('redis').RedisClientType} client
   * @param {string} prefix  key prefix, unique per limiter (e.g. 'rl:api:')
   */
  constructor(client, prefix) {
    this.client = client;
    this.prefix = prefix;
    this.localKeys = false;
    this.windowMs = 60000;
  }

  init(options) {
    this.windowMs = options.windowMs;
  }

  key(k) {
    return `${this.prefix}${k}`;
  }

  async ready() {
    if (this.client.isReady) return;
    if (!this.client.isOpen) throw new Error('Redis client is not connected');
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.client.off('ready', onReady);
        reject(new Error('Redis not ready'));
      }, READY_TIMEOUT_MS);
      const onReady = () => { clearTimeout(timer); resolve(); };
      this.client.once('ready', onReady);
    });
  }

  async increment(k) {
    await this.ready();
    const [hits, ttl] = await this.client.eval(INCREMENT_SCRIPT, {
      keys: [this.key(k)],
      arguments: [String(this.windowMs)],
    });
    return { totalHits: Number(hits), resetTime: new Date(Date.now() + Number(ttl)) };
  }

  async decrement(k) {
    await this.ready();
    await this.client.decr(this.key(k));
  }

  async resetKey(k) {
    await this.ready();
    await this.client.del(this.key(k));
  }
}

module.exports = RedisStore;
