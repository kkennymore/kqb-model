const BaseDatabase = require("../database/BaseDatabase");
/**
 * 
 * const config = {
 * db: {
 *  host: "localhost",
 *  user: "root",
 *  password: "",
 *  database: "test"
 * },
 * activateCache: true
 *};
 */

class KQBModel {
  constructor(config, redis) {
    this.config = config;
    this.redis = redis;
    this.db = new BaseDatabase(config.db);
    this.queryString = "";
    this.queryParams = [];
    this.transactionQueries = null;
  }

  select(columns = ["*"]) {
    const cols = Array.isArray(columns) ? columns.join(", ") : columns;
    this.queryString = `SELECT ${cols}`;
    return this;
  }

  distinct(columns = "*") {
    const cols = Array.isArray(columns) ? columns.join(", ") : columns;
    this.queryString = `SELECT DISTINCT ${cols}`;
    return this;
  }

  count(column = "*", alias = "count") {
    this.queryString = `SELECT COUNT(${column}) AS ${alias}`;
    return this;
  }

  table(name) {
    if (!this.queryString.startsWith("SELECT")) {
      this.queryString = "SELECT *";
    }
    this.queryString += ` FROM ${name}`;
    return this;
  }

  where(condition = "", params = []) {
    this.queryString += ` WHERE ${condition}`;
    this.queryParams.push(...params);
    return this;
  }

  orWhere(condition = "", params = []) {
    this.queryString += ` OR ${condition}`;
    this.queryParams.push(...params);
    return this;
  }

  whereIn(field, values = []) {
    if (!Array.isArray(values) || values.length === 0) return this;
    const placeholders = values.map(() => "?").join(", ");
    this.queryString += ` WHERE ${field} IN (${placeholders})`;
    this.queryParams.push(...values);
    return this;
  }

  whereNotIn(field, values = []) {
    if (!Array.isArray(values) || values.length === 0) return this;
    const placeholders = values.map(() => "?").join(", ");
    this.queryString += ` WHERE ${field} NOT IN (${placeholders})`;
    this.queryParams.push(...values);
    return this;
  }

  join(type, table, condition) {
    this.queryString += ` ${type.toUpperCase()} JOIN ${table} ON ${condition}`;
    return this;
  }

  groupBy(fields) {
    if (!fields) return this;
    const groupClause = Array.isArray(fields) ? fields.join(", ") : fields;
    this.queryString += ` GROUP BY ${groupClause}`;
    return this;
  }

  having(condition = "", params = []) {
    this.queryString += ` HAVING ${condition}`;
    this.queryParams.push(...params);
    return this;
  }

  orderBy(field, dir = "ASC") {
    this.queryString += ` ORDER BY ${field} ${dir}`;
    return this;
  }

  limit(n) {
    this.queryString += ` LIMIT ${n}`;
    return this;
  }

  async get(cacheKey = null, isCache = true, ttl = 300) {
    try {
      if (cacheKey && this.config.activateCache && isCache && this.redis) {
        const cached = await this.redis.get(cacheKey);
        if (cached) return JSON.parse(cached);
      }

      await this.db.connect();
      const result = await this.db.query(this.queryString, this.queryParams);
      await this.db.disconnect();

      if (cacheKey && this.config.activateCache && isCache && this.redis) {
        await this.redis.set(cacheKey, JSON.stringify(result), "EX", ttl);
      }

      return result;
    } catch (err) {
      return [{ errorStatus: false, message: "get failed", data: [err] }];
    }
  }

  async first(cacheKey = null, isCache = true, ttl = 300) {
    this.limit(1);
    const result = await this.get(cacheKey, isCache, ttl);
    return Array.isArray(result) && result.length > 0 ? result[0] : null;
  }

  async pluck(column, cacheKey = null, isCache = true, ttl = 300) {
    const result = await this.get(cacheKey, isCache, ttl);
    return Array.isArray(result) ? result.map(row => row[column]) : [];
  }

  async exists(cacheKey = null, isCache = true, ttl = 300) {
    const result = await this.limit(1).get(cacheKey, isCache, ttl);
    return Array.isArray(result) && result.length > 0;
  }

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

  async increment(table, field, value = 1, condition = "1", params = []) {
    const sql = `UPDATE ${table} SET ${field} = ${field} + ? WHERE ${condition}`;
    return this.raw(sql, [value, ...params]);
  }

  async decrement(table, field, value = 1, condition = "1", params = []) {
    const sql = `UPDATE ${table} SET ${field} = ${field} - ? WHERE ${condition}`;
    return this.raw(sql, [value, ...params]);
  }

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

  async transactionQuery(sql, params = []) {
    if (!this.transactionQueries) {
      this.transactionQueries = [];
      await this.db.connect();
      await this.db.beginTransaction();
    }
    this.transactionQueries.push({ sql, params });
    return this;
  }

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

module.exports = KQBModel;
