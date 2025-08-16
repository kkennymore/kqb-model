/**
 * LRUCacheStrategy
 * ----------------
 * In-memory cache implementation using lru-cache.
 * Mirrors common Redis-like methods for compatibility with other strategies.
 *
 * NOTE:
 * - This is ephemeral: data is lost on process restart.
 * - Complex structures (hashes, lists, sets) are stored as JS objects/arrays.
 *
 * Usage:
 *   const LRUCacheStrategy = require('./LRUCacheStrategy');
 *   await LRUCacheStrategy.init();
 *   await LRUCacheStrategy.set('foo', 'bar', 60);
 *   console.log(await LRUCacheStrategy.get('foo'));
 */

const { LRUCache } = require('lru-cache');

const DEFAULT_TTL = 1000 * 60 * 60; // 1 hour

let cache = null;

const LRUCacheStrategy = {
  /** Initialize the in-memory cache */
  async init(config) {
    try {
      cache = new LRUCache({
        max: 1000,
        ttl: DEFAULT_TTL,
      });
      console.log('✅ LRUCache-based in-memory cache enabled');
      return true;
    } catch (err) {
      console.error('❌ LRUCache init error:', err.message);
      return false;
    }
  },

  /* ---------------- STRING COMMANDS ---------------- */

  async get(key) {
    try {
      return cache.get(key) ?? null;
    } catch (err) {
      console.error(`❌ LRUCache GET error for "${key}":`, err.message);
      return null;
    }
  },

  async set(key, data, ttlSeconds = DEFAULT_TTL / 1000) {
    try {
      cache.set(key, data, { ttl: ttlSeconds * 1000 });
    } catch (err) {
      console.error(`❌ LRUCache SET error for "${key}":`, err.message);
    }
  },

  async delete(key) {
    try {
      cache.delete(key);
    } catch (err) {
      console.error(`❌ LRUCache DELETE error for "${key}":`, err.message);
    }
  },

  async keys(pattern = '*') {
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
    );
    return cache.keys().filter((key) => regex.test(key));
  },

  async clearAll() {
    cache.clear();
  },

  async getAll() {
    const all = {};
    for (const key of cache.keys()) {
      all[key] = cache.get(key);
    }
    return all;
  },

  /* ---------------- HASH COMMANDS ---------------- */
  async hset(hash, field, value) {
    const obj = cache.get(hash) || {};
    obj[field] = value;
    cache.set(hash, obj);
  },

  async hget(hash, field) {
    const obj = cache.get(hash);
    return obj ? obj[field] ?? null : null;
  },

  async hgetAll(hash) {
    return cache.get(hash) || {};
  },

  async hdel(hash, field) {
    const obj = cache.get(hash);
    if (obj && field in obj) {
      delete obj[field];
      cache.set(hash, obj);
    }
  },

  /* ---------------- LIST COMMANDS ---------------- */
  async rpush(list, ...values) {
    const arr = cache.get(list) || [];
    arr.push(...values);
    cache.set(list, arr);
  },

  async lpush(list, ...values) {
    const arr = cache.get(list) || [];
    arr.unshift(...values);
    cache.set(list, arr);
  },

  async rpop(list) {
    const arr = cache.get(list) || [];
    const val = arr.pop();
    cache.set(list, arr);
    return val;
  },

  async lpop(list) {
    const arr = cache.get(list) || [];
    const val = arr.shift();
    cache.set(list, arr);
    return val;
  },

  async lrange(list, start = 0, stop = -1) {
    const arr = cache.get(list) || [];
    return arr.slice(start, stop === -1 ? undefined : stop + 1);
  },

  /* ---------------- SET COMMANDS ---------------- */
  async sadd(setKey, ...members) {
    const set = new Set(cache.get(setKey) || []);
    members.forEach((m) => set.add(m));
    cache.set(setKey, Array.from(set));
  },

  async smembers(setKey) {
    return cache.get(setKey) || [];
  },

  async sismember(setKey, member) {
    const set = new Set(cache.get(setKey) || []);
    return set.has(member);
  },

  async srem(setKey, ...members) {
    const set = new Set(cache.get(setKey) || []);
    members.forEach((m) => set.delete(m));
    cache.set(setKey, Array.from(set));
  },

  /* ---------------- PUB/SUB (NO-OP) ---------------- */
  async publish(channel, message) {
    console.warn('⚠️ LRUCache does not support pub/sub.');
  },

  async subscribe(channel, callback) {
    console.warn('⚠️ LRUCache does not support pub/sub.');
  },

  /* ---------------- UTILITY ---------------- */
  async quit() {
    // Nothing to close for in-memory cache
  },
};

module.exports = LRUCacheStrategy;
