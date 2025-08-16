declare class KCache {
  /**
   * Initialize the Redis cache connection.
   * @param config - Configuration object (includes host, port, password, etc.)
   */
  static init(config: any): Promise<void>;

  /**
   * Get a value from cache by key.
   * @param key - Cache key
   * @returns Parsed JSON object or string stored in Redis
   */
  static get(key: string): Promise<any>;

  /**
   * Set a value in cache.
   * @param key - Cache key
   * @param value - Value to store (object will be stringified)
   * @param mode - Optional Redis mode, e.g., "EX" for expire, "PX" for milliseconds
   * @param duration - Optional duration in seconds (EX) or milliseconds (PX)
   * @returns Promise resolving when value is set
   */
  static set(key: string, value: any, mode?: "EX" | "PX", duration?: number): Promise<void>;

  /**
   * Delete a key from cache.
   * @param key - Cache key to delete
   * @returns Promise resolving when deletion completes
   */
  static del(key: string): Promise<void>;

  /**
   * Check if a key exists in cache.
   * @param key - Cache key
   * @returns True if key exists, false otherwise
   */
  static exists(key: string): Promise<boolean>;

  /**
   * Flush all keys from Redis cache.
   * @returns Promise resolving when flush completes
   */
  static flushAll(): Promise<void>;
}

declare class KQBModel {
  constructor(config: any, redis?: typeof KCache);

  // Query builder methods
  select(columns?: string[]): this;
  distinct(columns?: string | string[]): this;
  count(column?: string, alias?: string): this;
  table(name: string): this;
  where(condition?: string, params?: any[]): this;
  orWhere(condition?: string, params?: any[]): this;
  whereIn(field: string, values: any[]): this;
  whereNotIn(field: string, values: any[]): this;
  join(type: string, table: string, condition: string): this;
  groupBy(fields: string | string[]): this;
  having(condition?: string, params?: any[]): this;
  orderBy(field: string, dir?: "ASC" | "DESC"): this;
  limit(n: number): this;

  // Query execution methods
  get(cacheKey?: string, isCache?: boolean, ttl?: number): Promise<any[]>;
  first(cacheKey?: string, isCache?: boolean, ttl?: number): Promise<any>;
  pluck(column: string, cacheKey?: string, isCache?: boolean, ttl?: number): Promise<any[]>;
  exists(cacheKey?: string, isCache?: boolean, ttl?: number): Promise<boolean>;

  insert(table: string, data: object): Promise<any>;
  update(table: string, data: object, condition: string, params?: any[]): Promise<any>;
  delete(table: string, condition: string, params?: any[]): Promise<any>;

  raw(sql: string, params?: any[]): Promise<any>;
  increment(table: string, field: string, value?: number, condition?: string, params?: any[]): Promise<any>;
  decrement(table: string, field: string, value?: number, condition?: string, params?: any[]): Promise<any>;

  firstOrCreate(table: string, whereData?: object, createData?: object): Promise<any>;
  updateOrInsert(table: string, whereData?: object, updateData?: object): Promise<any>;

  // Transaction methods
  insertTransactionData(payload: { table: string; data: object }[]): Promise<any>;
  updateTransactionData(payload: { table: string; data: object; condition: string; params?: any[] }[]): Promise<any>;
  transactionQuery(sql: string, params?: any[]): Promise<this>;
  commit(): Promise<boolean>;

  // Cache instance (optional, available after init)
  redis?: typeof KCache;
}

declare const _default: {
  KQBModel: typeof KQBModel;
  KCache: typeof KCache;
};

export = _default;
