/**
 * UpstashStrategy
 * ---------------
 * A Redis-like wrapper around Upstash Redis REST API.
 * Mirrors most Redis commands in async/await style.
 *
 * Usage:
 *   const UpstashStrategy = require('./UpstashStrategy');
 *   await UpstashStrategy.init();
 *   await UpstashStrategy.set('foo', 'bar', 60); // TTL = 60 seconds
 *   const value = await UpstashStrategy.get('foo');
 *   console.log(value); // 'bar'
 */

const { Redis } = require('@upstash/redis');

let redis = null;

const UpstashStrategy = {
  /**
   * Initialize Upstash connection
   * @returns {Promise<boolean>}
   */
  async init(config) {
    try {
      redis = new Redis({
        url: config?.upstash?.url,
        token: config?.upstash?.token,
      });

      // Test connection
      await redis.set('__ping__', 'pong', { ex: 5 });
      const pingResponse = await redis.get('__ping__');
      if (pingResponse !== 'pong') throw new Error('Upstash ping failed');

      console.log('✅ Upstash Redis connected');
      return true;
    } catch (err) {
      console.warn('⚠️ Upstash not available:', err.message);
      return false;
    }
  },

  /* ---------------- STRING COMMANDS ---------------- */

  /** Get a value by key */
  async get(key) {
    try {
      return await redis.get(key);
    } catch (err) {
      console.error(`❌ Upstash GET error for key "${key}":`, err.message);
      return null;
    }
  },

  /** Set a value with optional TTL (in seconds) */
  async set(key, data, ttl = 3600) {
    try {
      await redis.set(key, data, { ex: ttl });
    } catch (err) {
      console.error(`❌ Upstash SET error for key "${key}":`, err.message);
    }
  },

  /** Delete a key */
  async delete(key) {
    try {
      await redis.del(key);
    } catch (err) {
      console.error(`❌ Upstash DELETE error for key "${key}":`, err.message);
    }
  },

  /** Get all keys matching a pattern (uses scanIterator) */
  async keys(pattern = '*') {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const matched = [];
    for await (const key of redis.scanIterator()) {
      if (regex.test(key)) matched.push(key);
    }
    return matched;
  },

  /** Clear all keys */
  async clearAll() {
    for await (const key of redis.scanIterator()) {
      await redis.del(key);
    }
  },

  /** Get all key-value pairs */
  async getAll() {
    const all = {};
    for await (const key of redis.scanIterator()) {
      all[key] = await redis.get(key);
    }
    return all;
  },

  /* ---------------- HASH COMMANDS ---------------- */

  async hset(hash, field, value) {
    await redis.hset(hash, { [field]: value });
  },

  async hget(hash, field) {
    return await redis.hget(hash, field);
  },

  async hgetAll(hash) {
    return await redis.hgetall(hash);
  },

  async hdel(hash, field) {
    await redis.hdel(hash, field);
  },

  /* ---------------- LIST COMMANDS ---------------- */

  async rpush(list, ...values) {
    await redis.rpush(list, ...values);
  },

  async lpush(list, ...values) {
    await redis.lpush(list, ...values);
  },

  async rpop(list) {
    return await redis.rpop(list);
  },

  async lpop(list) {
    return await redis.lpop(list);
  },

  async lrange(list, start = 0, stop = -1) {
    return await redis.lrange(list, start, stop);
  },

  /* ---------------- SET COMMANDS ---------------- */

  async sadd(set, ...members) {
    await redis.sadd(set, ...members);
  },

  async smembers(set) {
    return await redis.smembers(set);
  },

  async sismember(set, member) {
    return await redis.sismember(set, member);
  },

  async srem(set, ...members) {
    await redis.srem(set, ...members);
  },

  /* ---------------- PUB/SUB COMMANDS ---------------- */
  // NOTE: Upstash supports pub/sub but it's HTTP-based and not long-lived like ioredis

  async publish(channel, message) {
    await redis.publish(channel, message);
  },

  async subscribe(channel, callback) {
    // Upstash pub/sub is not a persistent TCP subscription like in node-redis
    // You'd typically poll or use serverless functions for receiving messages.
    console.warn(
      '⚠️ Upstash subscribe: Persistent subscriptions are not supported via REST API.'
    );
  },

  /* ---------------- UTILITY ---------------- */

  async quit() {
    // No persistent connection to close in Upstash
  },
};

module.exports = UpstashStrategy;
