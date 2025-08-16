const BaseDatabase = require("../database/BaseDatabase");
const KCache = require("./../cache/RedisService");

/**
 * Example configuration object for initializing KQBModel.
 * @example
 * const config = {
 *   db: {
 *       type: 'mysql',
 *       host: 'localhost',
 *       port: 3306,
 *       user: 'userDb',
 *       password: 'pass123',
 *       database: 'myDatabase',
 *       connectionLimit: 10,
 *       keyspace: 'oaadsystem',
 *       dataCenter: 'datacenter1'
 *   },
 *   redis: {
 *       host: "localhost",
 *       port: 6379,
 *       ttl: 60 * 5
 *   },
 *   upstash: {
 *       url: "https://maximum-camel-8387.upstash.io",
 *       token: "ASDDAAIjcDFjNzBlOTg0MWFhN2I0N2YwYjRkMWE3YTFmZjc4OTk1MHAxMA",
 *   },
 *   // can use "redis, file, lru, upstash",
 *   cache_system: "redis",
 *   activateCache: true
 * };
 */

/**
 * KQBModel
 * A chainable SQL query builder and CRUD abstraction layer for Node.js.
 * Supports MySQL queries, Redis caching, and transaction handling.
 */
class KQBModel {
  /**
   * Create a new KQBModel instance.
   * @param {Object} config - Configuration object.
   * @param {Object} config.db - Database connection config.
   * @param {boolean} [config.activateCache=false] - Enable Redis caching.
   */
  constructor(config) {
    this.config = config;
    this.redis = null;
    this.db = new BaseDatabase(config.db);
    this.queryString = "";
    this.queryParams = [];
    this.transactionQueries = null;
  }

  /**
   * Initialize cache (Redis) connection.
   * Must be called before using caching features.
   * @returns {Promise<void>}
   */
  async init() {
    await KCache.init(this.config);
    this.redis = KCache;
  }

  /**
   * Start a SELECT query.
   * @param {string[]|string} [columns=["*"]] - Columns to select.
   * @returns {KQBModel} Chainable instance.
   */
  select(columns = ["*"]) {
    const cols = Array.isArray(columns) ? columns.join(", ") : columns;
    this.queryString = `SELECT ${cols}`;
    return this;
  }

  /**
   * Start a DISTINCT SELECT query.
   * @param {string[]|string} [columns="*"] - Columns to select.
   * @returns {KQBModel}
   */
  distinct(columns = "*") {
    const cols = Array.isArray(columns) ? columns.join(", ") : columns;
    this.queryString = `SELECT DISTINCT ${cols}`;
    return this;
  }

  /**
   * Start a COUNT query.
   * @param {string} [column="*"] - Column to count.
   * @param {string} [alias="count"] - Alias for the count column.
   * @returns {KQBModel}
   */
  count(column = "*", alias = "count") {
    this.queryString = `SELECT COUNT(${column}) AS ${alias}`;
    return this;
  }

  /**
   * Define the table for the query.
   * @param {string} name - Table name.
   * @returns {KQBModel}
   */
  table(name) {
    if (!this.queryString.startsWith("SELECT")) {
      this.queryString = "SELECT *";
    }
    this.queryString += ` FROM ${name}`;
    return this;
  }

  /**
   * Add a WHERE condition.
   * @param {string} condition - SQL condition string.
   * @param {Array} [params=[]] - Parameter values.
   * @returns {KQBModel}
   */
  where(condition = "", params = []) {
    this.queryString += ` WHERE ${condition}`;
    this.queryParams.push(...params);
    return this;
  }

  /**
   * Add an OR WHERE condition.
   * @param {string} condition - SQL condition string.
   * @param {Array} [params=[]] - Parameter values.
   * @returns {KQBModel}
   */
  orWhere(condition = "", params = []) {
    this.queryString += ` OR ${condition}`;
    this.queryParams.push(...params);
    return this;
  }

  /**
   * Add a WHERE IN condition.
   * @param {string} field - Column name.
   * @param {Array} values - Values to match.
   * @returns {KQBModel}
   */
  whereIn(field, values = []) {
    if (!Array.isArray(values) || values.length === 0) return this;
    const placeholders = values.map(() => "?").join(", ");
    this.queryString += ` WHERE ${field} IN (${placeholders})`;
    this.queryParams.push(...values);
    return this;
  }

  /**
   * Add a WHERE NOT IN condition.
   * @param {string} field - Column name.
   * @param {Array} values - Values to exclude.
   * @returns {KQBModel}
   */
  whereNotIn(field, values = []) {
    if (!Array.isArray(values) || values.length === 0) return this;
    const placeholders = values.map(() => "?").join(", ");
    this.queryString += ` WHERE ${field} NOT IN (${placeholders})`;
    this.queryParams.push(...values);
    return this;
  }

  /**
   * Add a JOIN clause.
   * @param {string} type - Join type (INNER, LEFT, RIGHT, etc.).
   * @param {string} table - Table to join.
   * @param {string} condition - Join condition.
   * @returns {KQBModel}
   */
  join(type, table, condition) {
    this.queryString += ` ${type.toUpperCase()} JOIN ${table} ON ${condition}`;
    return this;
  }

  /**
   * Add a GROUP BY clause.
   * @param {string[]|string} fields - Fields to group by.
   * @returns {KQBModel}
   */
  groupBy(fields) {
    if (!fields) return this;
    const groupClause = Array.isArray(fields) ? fields.join(", ") : fields;
    this.queryString += ` GROUP BY ${groupClause}`;
    return this;
  }

  /**
   * Add a HAVING clause.
   * @param {string} condition - SQL condition.
   * @param {Array} [params=[]] - Parameter values.
   * @returns {KQBModel}
   */
  having(condition = "", params = []) {
    this.queryString += ` HAVING ${condition}`;
    this.queryParams.push(...params);
    return this;
  }

  /**
   * Add an ORDER BY clause.
   * @param {string} field - Field to order by.
   * @param {string} [dir="ASC"] - Sort direction.
   * @returns {KQBModel}
   */
  orderBy(field, dir = "ASC") {
    this.queryString += ` ORDER BY ${field} ${dir}`;
    return this;
  }

  /**
   * Add a LIMIT clause.
   * @param {number} n - Number of rows to return.
   * @returns {KQBModel}
   */
  limit(n) {
    this.queryString += ` LIMIT ${n}`;
    return this;
  }

  /**
   * Execute the built query and return results.
   * Supports optional caching.
   * @param {string|null} [cacheKey=null] - Cache key to store/retrieve data.
   * @param {boolean} [isCache=true] - Whether to use caching.
   * @param {number} [ttl=300] - Cache time-to-live in seconds.
   * @returns {Promise<Array|Object>}
   */
  async get(cacheKey = null, isCache = true, ttl = 300) {
    try {
      if (cacheKey && this.config.cache_system !== "" && isCache) {
        const cached = await this.redis.get(cacheKey);
        if (cached) return JSON.parse(cached);
      }

      await this.db.connect();
      const result = await this.db.query(this.queryString, this.queryParams);
      await this.db.disconnect();

      if (cacheKey && this.config.cache_system !== "" && isCache) {
        await this.redis.set(cacheKey, JSON.stringify(result), "EX", ttl);
      }

      return result;
    } catch (err) {
      return [{ errorStatus: false, message: "get failed", data: [err] }];
    }
  }

  /**
   * Return the first row only from the query result.
   * @param {string|null} [cacheKey=null]
   * @param {boolean} [isCache=true]
   * @param {number} [ttl=300]
   * @returns {Promise<Object|null>}
   */
  async first(cacheKey = null, isCache = true, ttl = 300) {
    this.limit(1);
    const result = await this.get(cacheKey, isCache, ttl);
    return Array.isArray(result) && result.length > 0 ? result[0] : null;
  }

  /**
   * Return a single column's values as an array.
   * @param {string} column - Column name.
   * @param {string|null} [cacheKey=null]
   * @param {boolean} [isCache=true]
   * @param {number} [ttl=300]
   * @returns {Promise<Array>}
   */
  async pluck(column, cacheKey = null, isCache = true, ttl = 300) {
    const result = await this.get(cacheKey, isCache, ttl);
    return Array.isArray(result) ? result.map(row => row[column]) : [];
  }

  /**
   * Check if at least one record exists for the query.
   * @param {string|null} [cacheKey=null]
   * @param {boolean} [isCache=true]
   * @param {number} [ttl=300]
   * @returns {Promise<boolean>}
   */
  async exists(cacheKey = null, isCache = true, ttl = 300) {
    const result = await this.limit(1).get(cacheKey, isCache, ttl);
    return Array.isArray(result) && result.length > 0;
  }

  /**
   * Insert a single row into a table.
   * @param {string} table - Table name.
   * @param {Object} data - Key-value pairs representing columns and values.
   * @returns {Promise<Object>} Insert result.
   */
  async insert(table, data) {
    try {
      await this.db.connect();
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map(() => "?").join(", ");
      const sql = `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`;
      const result = await this.db.query(sql, values);
      await this.db.disconnect();
      return result;
    } catch (err) {
      return { errorStatus: false, message: "Insert failed", data: [err] };
    }
  }

  /**
   * Update rows in a table.
   * @param {string} table - Table name.
   * @param {Object} data - Key-value pairs for updating columns.
   * @param {string} condition - WHERE clause condition.
   * @param {Array} [params=[]] - Parameters for the WHERE clause.
   * @returns {Promise<Object>} Update result.
   */
  async update(table, data, condition, params = []) {
    try {
      await this.db.connect();
      const sets = Object.keys(data).map(key => `${key} = ?`);
      const values = [...Object.values(data), ...params];
      const sql = `UPDATE ${table} SET ${sets.join(", ")} WHERE ${condition}`;
      const result = await this.db.query(sql, values);
      await this.db.disconnect();
      return result;
    } catch (err) {
      return { errorStatus: false, message: "Update failed", data: [err] };
    }
  }

  /**
   * Delete rows from a table.
   * @param {string} table - Table name.
   * @param {string} condition - WHERE clause condition.
   * @param {Array} [params=[]] - Parameters for the WHERE clause.
   * @returns {Promise<Object>} Delete result.
   */
  async delete(table, condition, params = []) {
    try {
      await this.db.connect();
      const sql = `DELETE FROM ${table} WHERE ${condition}`;
      const result = await this.db.query(sql, params);
      await this.db.disconnect();
      return result;
    } catch (err) {
      return { errorStatus: false, message: "Deleting data failed", data: [err] };
    }
  }

  /**
   * Execute a raw SQL query.
   * @param {string} sql - Raw SQL query string.
   * @param {Array} [params=[]] - Parameter values.
   * @returns {Promise<Array|Object>} Query result.
   */
  async raw(sql, params = []) {
    try {
      await this.db.connect();
      const result = await this.db.query(sql, params);
      await this.db.disconnect();
      return result;
    } catch (err) {
      return [{ errorStatus: false, message: "Raw query failed", data: [err] }];
    }
  }

  /**
   * Increment a numeric field.
   * @param {string} table - Table name.
   * @param {string} field - Field name.
   * @param {number} [value=1] - Increment value.
   * @param {string} [condition="1"] - WHERE condition.
   * @param {Array} [params=[]] - Parameters for the WHERE clause.
   * @returns {Promise<Object>} Result.
   */
  async increment(table, field, value = 1, condition = "1", params = []) {
    const sql = `UPDATE ${table} SET ${field} = ${field} + ? WHERE ${condition}`;
    return this.raw(sql, [value, ...params]);
  }

  /**
   * Decrement a numeric field.
   * @param {string} table - Table name.
   * @param {string} field - Field name.
   * @param {number} [value=1] - Decrement value.
   * @param {string} [condition="1"] - WHERE condition.
   * @param {Array} [params=[]] - Parameters for the WHERE clause.
   * @returns {Promise<Object>} Result.
   */
  async decrement(table, field, value = 1, condition = "1", params = []) {
    const sql = `UPDATE ${table} SET ${field} = ${field} - ? WHERE ${condition}`;
    return this.raw(sql, [value, ...params]);
  }

  /**
   * Return the first row matching condition, or insert a new row if none exists.
   * @param {string} table - Table name.
   * @param {Object} whereData - Conditions to match.
   * @param {Object} createData - Data to insert if no row exists.
   * @returns {Promise<Object>} Existing or inserted row.
   */
  async firstOrCreate(table, whereData = {}, createData = {}) {
    const whereKeys = Object.keys(whereData);
    const whereValues = Object.values(whereData);
    const whereClause = whereKeys.map(k => `${k} = ?`).join(" AND ");

    const existing = await this.select().table(table).where(whereClause, whereValues).first();
    if (existing) return existing;

    const insertData = { ...whereData, ...createData };
    await this.insert(table, insertData);
    return insertData;
  }

  /**
   * Update a row if it exists, otherwise insert a new row.
   * @param {string} table - Table name.
   * @param {Object} whereData - Conditions to match.
   * @param {Object} updateData - Data to update or insert.
   * @returns {Promise<Object>} Result of insert or update.
   */
  async updateOrInsert(table, whereData = {}, updateData = {}) {
    const whereKeys = Object.keys(whereData);
    const whereValues = Object.values(whereData);
    const whereClause = whereKeys.map(k => `${k} = ?`).join(" AND ");

    const exists = await this.select().table(table).where(whereClause, whereValues).exists();
    if (exists) {
      return this.update(table, updateData, whereClause, whereValues);
    } else {
      const insertData = { ...whereData, ...updateData };
      return this.insert(table, insertData);
    }
  }

  /**
   * Insert multiple rows in a single transaction.
   * @param {Array} payload - Array of {table, data} objects.
   * @returns {Promise<Object>} Transaction result.
   */
  async insertTransactionData(payload) {
    try {
      for (const row of payload) {
        const { table, data } = row;
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map(() => "?").join(", ");
        const sql = `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`;
        await this.transactionQuery(sql, values);
      }
      await this.commit();
      return { success: true, message: "Success" };
    } catch (err) {
      return { errorStatus: false, message: "Transaction insertion failed", data: [err] };
    }
  }

  /**
   * Update multiple rows in a single transaction.
   * @param {Array} payload - Array of {table, data, condition, params} objects.
   * @returns {Promise<Object>} Transaction result.
   */
  async updateTransactionData(payload) {
    try {
      for (const row of payload) {
        const { table, data, condition, params = [] } = row;
        const keys = Object.keys(data);
        const values = Object.values(data);
        const setClause = keys.map(key => `${key} = ?`).join(", ");
        const sqlParams = [...values, ...params];
        const sql = `UPDATE ${table} SET ${setClause} WHERE ${condition}`;
        await this.transactionQuery(sql, sqlParams);
      }
      await this.commit();
      return { success: true, message: "Update successful" };
    } catch (err) {
      return { errorStatus: false, message: "Update failed", data: [err] };
    }
  }

  /**
   * Add a query to the current transaction queue.
   * Automatically starts a transaction if none exists.
   * @param {string} sql - SQL statement.
   * @param {Array} [params=[]] - Parameters for the SQL.
   * @returns {Promise<KQBModel>} Chainable instance.
   */
  async transactionQuery(sql, params = []) {
    if (!this.transactionQueries) {
      this.transactionQueries = [];
      await this.db.connect();
      await this.db.beginTransaction();
    }
    this.transactionQueries.push({ sql, params });
    return this;
  }

  /**
   * Commit all queued transaction queries.
   * Rolls back on error.
   * @returns {Promise<boolean>} True if commit succeeded.
   * @throws Will throw an error if commit fails.
   */
  async commit() {
    try {
      for (const { sql, params } of this.transactionQueries || []) {
        await this.db.query(sql, params);
      }
      await this.db.commit();
      return true;
    } catch (err) {
      await this.db.rollback();
      throw err;
    } finally {
      await this.db.disconnect();
      this.transactionQueries = [];
    }
  }
}

module.exports = {
  KQBModel,
  KCache
};
