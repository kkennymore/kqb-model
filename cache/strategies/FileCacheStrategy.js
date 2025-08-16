/**
 * FileCacheStrategy
 * -----------------
 * Persistent, file-based key-value store with Redis-like methods.
 * Stores JSON files in a nested folder structure for speed.
 *
 * ⚠️ Not recommended for high-frequency writes (use memory or Redis instead).
 */

const fs = require('fs');
const path = require('path');
const fsp = fs.promises;
const crypto = require('crypto');

const CACHE_DIR = path.join(__dirname, '../user-cache');
const hashKey = (key) => crypto.createHash('md5').update(key).digest('hex');
const safeFileName = (key) =>
  key.replace(/[^a-zA-Z0-9_\-]/g, '_') + '.json';

const getFilePath = (key) => {
  const hashed = hashKey(key);
  const subdir = path.join(CACHE_DIR, hashed[0], hashed[1]);
  return { dir: subdir, full: path.join(subdir, safeFileName(key)) };
};

async function readEntry(key) {
  const { full } = getFilePath(key);
  if (!fs.existsSync(full)) return null;

  try {
    const raw = await fsp.readFile(full, 'utf8');
    const entry = JSON.parse(raw);
    const now = Math.floor(Date.now() / 1000);
    if (now - entry.timestamp < entry.ttl) {
      return entry.data;
    } else {
      await fsp.unlink(full).catch(() => {});
      return null;
    }
  } catch (_) {
    return null;
  }
}

async function writeEntry(key, data, ttl) {
  const { dir, full } = getFilePath(key);
  await fsp.mkdir(dir, { recursive: true });
  const now = Math.floor(Date.now() / 1000);
  const entry = { data, timestamp: now, ttl };
  await fsp.writeFile(full, JSON.stringify(entry), 'utf8');
}

async function deleteEntry(key) {
  const { full } = getFilePath(key);
  if (fs.existsSync(full)) {
    await fsp.unlink(full);
  }
}

async function walkKeys(dir, keys = []) {
  if (!fs.existsSync(dir)) return keys;
  const items = await fsp.readdir(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      await walkKeys(fullPath, keys);
    } else if (item.name.endsWith('.json')) {
      keys.push(item.name.replace(/\.json$/, ''));
    }
  }
  return keys;
}

const FileCacheStrategy = {
  async init() {
    await fsp.mkdir(CACHE_DIR, { recursive: true });
    console.log('✅ File cache initialized');
    return true;
  },

  /* ---------------- STRING COMMANDS ---------------- */
  async get(key) {
    return await readEntry(key);
  },

  async set(key, data, ttl = 3600) {
    await writeEntry(key, data, ttl);
  },

  async delete(key) {
    await deleteEntry(key);
  },

  async keys(pattern = '*') {
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
    );
    const allKeys = await walkKeys(CACHE_DIR);
    return allKeys.filter((key) => regex.test(key));
  },

  async clearAll() {
    if (fs.existsSync(CACHE_DIR)) {
      await fsp.rm(CACHE_DIR, { recursive: true, force: true });
    }
    await fsp.mkdir(CACHE_DIR, { recursive: true });
  },

  async getAll() {
    const all = {};
    const allKeys = await walkKeys(CACHE_DIR);
    for (const key of allKeys) {
      all[key] = await readEntry(key);
    }
    return all;
  },

  /* ---------------- HASH COMMANDS ---------------- */
  async hset(hash, field, value) {
    const obj = (await readEntry(hash)) || {};
    obj[field] = value;
    await writeEntry(hash, obj, 86400); // default 1 day TTL
  },

  async hget(hash, field) {
    const obj = await readEntry(hash);
    return obj ? obj[field] ?? null : null;
  },

  async hgetAll(hash) {
    return (await readEntry(hash)) || {};
  },

  async hdel(hash, field) {
    const obj = await readEntry(hash);
    if (obj && field in obj) {
      delete obj[field];
      await writeEntry(hash, obj, 86400);
    }
  },

  /* ---------------- LIST COMMANDS ---------------- */
  async rpush(list, ...values) {
    const arr = (await readEntry(list)) || [];
    arr.push(...values);
    await writeEntry(list, arr, 86400);
  },

  async lpush(list, ...values) {
    const arr = (await readEntry(list)) || [];
    arr.unshift(...values);
    await writeEntry(list, arr, 86400);
  },

  async rpop(list) {
    const arr = (await readEntry(list)) || [];
    const val = arr.pop();
    await writeEntry(list, arr, 86400);
    return val;
  },

  async lpop(list) {
    const arr = (await readEntry(list)) || [];
    const val = arr.shift();
    await writeEntry(list, arr, 86400);
    return val;
  },

  async lrange(list, start = 0, stop = -1) {
    const arr = (await readEntry(list)) || [];
    return arr.slice(start, stop === -1 ? undefined : stop + 1);
  },

  /* ---------------- SET COMMANDS ---------------- */
  async sadd(setKey, ...members) {
    const set = new Set((await readEntry(setKey)) || []);
    members.forEach((m) => set.add(m));
    await writeEntry(setKey, Array.from(set), 86400);
  },

  async smembers(setKey) {
    return (await readEntry(setKey)) || [];
  },

  async sismember(setKey, member) {
    const set = new Set((await readEntry(setKey)) || []);
    return set.has(member);
  },

  async srem(setKey, ...members) {
    const set = new Set((await readEntry(setKey)) || []);
    members.forEach((m) => set.delete(m));
    await writeEntry(setKey, Array.from(set), 86400);
  },

  /* ---------------- PUB/SUB (NO-OP) ---------------- */
  async publish(channel, message) {
    console.warn('⚠️ File cache does not support pub/sub.');
  },

  async subscribe(channel, callback) {
    console.warn('⚠️ File cache does not support pub/sub.');
  },

  /* ---------------- UTILITY ---------------- */
  async quit() {
    // Nothing to close for file cache
  },
};

module.exports = FileCacheStrategy;
