/**
 * RedisStore tests — no database or real Redis needed.
 * A small fake client reproduces the INCR/PTTL/PEXPIRE script semantics so we can check
 * that limits are shared across instances and that Redis failures never block requests.
 */
const { EventEmitter } = require('events');
const express = require('express');
const request = require('supertest');
const rateLimit = require('express-rate-limit');
const RedisStore = require('../src/middleware/redisStore');

class FakeRedis extends EventEmitter {
  constructor() {
    super();
    this.data = new Map(); // key -> { value, expiresAt }
    this.isOpen = true;
    this.isReady = true;
    this.failNext = false;
    this.now = () => Date.now();
  }

  live(key) {
    const e = this.data.get(key);
    if (e && e.expiresAt !== null && e.expiresAt <= this.now()) { this.data.delete(key); return undefined; }
    return e;
  }

  async eval(_script, { keys, arguments: args }) {
    if (this.failNext) { this.failNext = false; throw new Error('boom'); }
    const key = keys[0];
    const e = this.live(key) || { value: 0, expiresAt: null };
    e.value += 1;
    if (e.expiresAt === null) e.expiresAt = this.now() + Number(args[0]);
    this.data.set(key, e);
    return [e.value, e.expiresAt - this.now()];
  }

  async decr(key) { const e = this.live(key); if (e) e.value -= 1; }

  async del(key) { this.data.delete(key); }
}

// An "API instance": its own express app + limiter, but sharing the Redis client.
const makeInstance = (client, { max = 3, windowMs = 60000 } = {}) => {
  const app = express();
  app.use(rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    passOnStoreError: true,
    keyGenerator: () => 'same-client',
    store: new RedisStore(client, 'rl:test:'),
  }));
  app.get('/', (req, res) => res.json({ ok: true }));
  return app;
};

describe('RedisStore', () => {
  it('shares one limit across separate server instances', async () => {
    const redis = new FakeRedis();
    const a = makeInstance(redis);
    const b = makeInstance(redis);

    expect((await request(a).get('/')).status).toBe(200);
    expect((await request(b).get('/')).status).toBe(200);
    expect((await request(a).get('/')).status).toBe(200);
    // 4th request overall — over the limit no matter which instance receives it
    expect((await request(b).get('/')).status).toBe(429);
    expect((await request(a).get('/')).status).toBe(429);
  });

  it('starts a fresh window once the old one expires', async () => {
    const redis = new FakeRedis();
    let t = 1_000_000;
    redis.now = () => t;
    const app = makeInstance(redis, { max: 1, windowMs: 1000 });

    expect((await request(app).get('/')).status).toBe(200);
    expect((await request(app).get('/')).status).toBe(429);
    t += 1001;
    expect((await request(app).get('/')).status).toBe(200);
  });

  it('sends RateLimit headers based on the shared counter', async () => {
    const app = makeInstance(new FakeRedis(), { max: 5 });
    const res = await request(app).get('/');
    expect(res.headers['ratelimit-limit']).toBe('5');
    expect(res.headers['ratelimit-remaining']).toBe('4');
  });

  it('lets requests through when Redis is disconnected (fails open, no hang)', async () => {
    const redis = new FakeRedis();
    redis.isOpen = false;
    redis.isReady = false;
    const app = makeInstance(redis, { max: 1 });
    const started = Date.now();
    expect((await request(app).get('/')).status).toBe(200);
    expect((await request(app).get('/')).status).toBe(200);
    expect(Date.now() - started).toBeLessThan(1000);
  });

  it('lets a request through when a Redis command errors', async () => {
    const redis = new FakeRedis();
    const app = makeInstance(redis, { max: 1 });
    redis.failNext = true;
    expect((await request(app).get('/')).status).toBe(200);
    // Next call works normally again and counts
    expect((await request(app).get('/')).status).toBe(200);
    expect((await request(app).get('/')).status).toBe(429);
  });

  it('waits briefly for a reconnecting client instead of failing straight away', async () => {
    const redis = new FakeRedis();
    redis.isReady = false; // open but still connecting
    const app = makeInstance(redis, { max: 5 });
    setTimeout(() => { redis.isReady = true; redis.emit('ready'); }, 50);
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.headers['ratelimit-remaining']).toBe('4'); // counted in Redis, not skipped
  });
});
