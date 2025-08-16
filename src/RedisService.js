const RedisStrategy = require('./RedisStrategy');
const UpstashStrategy = require('./UpstashStrategy');
const FileCacheStrategy = require('./FileCacheStrategy');
const LRUCacheStrategy = require('./LRUCacheStrategy');

let strategy = null;

async function initCache(config) {
  const system = String(config.cache_system || '').trim().toLowerCase();

  if (system === 'redis' && await RedisStrategy.init(config)) {
    strategy = RedisStrategy;
  } else if (system === 'upstash' && await UpstashStrategy.init(config)) {
    strategy = UpstashStrategy;
  } else if (system === 'lru' && await LRUCacheStrategy.init(config)) {
    strategy = LRUCacheStrategy;
  } else if (system === 'file' && await FileCacheStrategy.init(config)) {
    strategy = FileCacheStrategy;
  } else {
    console.warn(`⚠️ No valid cache strategy initialized for: "${system}". Using no-op cache.`);
    strategy = {
      async get() { return null; },
      async set() {},
      async delete() {},
      async keys() { return []; },
      async clearAll() {},
      async getAll() { return {}; },
    };
  }
}

// Wrapper to normalize responses and handle errors
function safeCall(method, defaultValue) {
  return async (...args) => {
    if (!strategy || typeof strategy[method] !== 'function') return defaultValue;
    try {
      return await strategy[method](...args);
    } catch (err) {
      console.error(`❌ Cache ${method.toUpperCase()} error:`, err.message);
      return defaultValue;
    }
  };
}

module.exports = {
  init: initCache,

  // Basic KV operations
  get: safeCall('get', null),
  set: safeCall('set', undefined),
  delete: safeCall('delete', undefined),
  keys: safeCall('keys', []),
  clearAll: safeCall('clearAll', undefined),
  getAll: safeCall('getAll', {}),

  // Extra methods (hashes, lists, sets, etc.)
  hset: safeCall('hset', undefined),
  hget: safeCall('hget', null),
  hgetAll: safeCall('hgetAll', {}),
  hdel: safeCall('hdel', undefined),

  rpush: safeCall('rpush', undefined),
  lpush: safeCall('lpush', undefined),
  rpop: safeCall('rpop', null),
  lpop: safeCall('lpop', null),
  lrange: safeCall('lrange', []),

  sadd: safeCall('sadd', undefined),
  smembers: safeCall('smembers', []),
  sismember: safeCall('sismember', false),
  srem: safeCall('srem', undefined),

  publish: safeCall('publish', undefined),
  subscribe: safeCall('subscribe', undefined),

  quit: safeCall('quit', undefined),
};
