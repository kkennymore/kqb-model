/**
 * RedisStrategy
 * -------------
 * A simple Redis client wrapper exposing commonly used Redis commands
 * in a clean, async/await-friendly interface.
 *
 * Usage:
 *   const RedisStrategy = require('./RedisStrategy');
 *   await RedisStrategy.init();
 *   await RedisStrategy.set('foo', 'bar', 60); // TTL = 60 seconds
 *   const value = await RedisStrategy.get('foo');
 *   console.log(value); // 'bar'
 */

const redis = require('redis');
const config = require('../../../config/config');

let client = null;

const RedisStrategy = {
  /**
   * Initialize Redis connection
   * @returns {Promise<boolean>}
   */
  async init() {
    try {
      client = redis.createClient({
        socket: {
          host: config?.redis?.host,
          port: Number(config?.redis?.port),
        },
        password: config?.redis?.password || undefined,
      });

      await client.connect();
      console.log('✅ Redis connected');
      return true;
    } catch (err) {
      console.warn('⚠️ Redis not available:', err.message);
      return false;
    }
  },

  /**
   * Get a value by key
   * @param {string} key
   * @returns {Promise<string|null>}
   */
  async get(key) {
    return await client.get(key);
  },

  /**
   * Set a value with optional TTL (in seconds)
   * @param {string} key
   * @param {string} data
   * @param {number} ttl
   */
  async set(key, data, ttl = 3600) {
    await client.set(key, data, { EX: ttl });
  },

  /**
   * Delete a key
   * @param {string} key
   */
  async delete(key) {
    await client.del(key);
  },

  /**
   * Get all keys matching a pattern
   * @param {string} pattern
   * @returns {Promise<string[]>}
   */
  async keys(pattern = '*') {
    return await client.keys(pattern);
  },

  /**
   * Clear all keys (DANGEROUS!)
   */
  async clearAll() {
    await client.flushAll();
  },

  /**
   * Get all key-value pairs
   * @returns {Promise<Object>}
   */
  async getAll() {
    const keys = await client.keys('*');
    const all = {};
    for (const key of keys) {
      all[key] = await client.get(key);
    }
    return all;
  },

  /* ---------------- HASH COMMANDS ---------------- */

  /** Set a hash field */
  async hset(hash, field, value) {
    await client.hSet(hash, field, value);
  },

  /** Get a hash field */
  async hget(hash, field) {
    return await client.hGet(hash, field);
  },

  /** Get all fields of a hash */
  async hgetAll(hash) {
    return await client.hGetAll(hash);
  },

  /** Delete a field from a hash */
  async hdel(hash, field) {
    await client.hDel(hash, field);
  },

  /* ---------------- LIST COMMANDS ---------------- */

  /** Push value(s) to the end of a list */
  async rpush(list, ...values) {
    await client.rPush(list, values);
  },

  /** Push value(s) to the start of a list */
  async lpush(list, ...values) {
    await client.lPush(list, values);
  },

  /** Pop value from the end of a list */
  async rpop(list) {
    return await client.rPop(list);
  },

  /** Pop value from the start of a list */
  async lpop(list) {
    return await client.lPop(list);
  },

  /** Get a range of list items */
  async lrange(list, start = 0, stop = -1) {
    return await client.lRange(list, start, stop);
  },

  /* ---------------- SET COMMANDS ---------------- */

  /** Add members to a set */
  async sadd(set, ...members) {
    await client.sAdd(set, members);
  },

  /** Get all members of a set */
  async smembers(set) {
    return await client.sMembers(set);
  },

  /** Check if member exists in a set */
  async sismember(set, member) {
    return await client.sIsMember(set, member);
  },

  /** Remove member(s) from a set */
  async srem(set, ...members) {
    await client.sRem(set, members);
  },

  /* ---------------- PUB/SUB COMMANDS ---------------- */

  /** Publish a message to a channel */
  async publish(channel, message) {
    await client.publish(channel, message);
  },

  /** Subscribe to a channel (callback runs on new message) */
  async subscribe(channel, callback) {
    const subscriber = client.duplicate();
    await subscriber.connect();
    await subscriber.subscribe(channel, callback);
  },

  /* ---------------- UTILITY ---------------- */

  /** Disconnect client */
  async quit() {
    await client.quit();
  },
};

module.exports = RedisStrategy;
