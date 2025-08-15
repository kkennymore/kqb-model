// adapters/PostgresAdapter.js

const { Pool } = require('pg');
const DatabaseAdapter = require("./DatabaseAdapter");
/**
 * PostgresAdapter extends the base DatabaseAdapter to provide
 * PostgreSQL-specific database interaction using node-postgres.
 */
class PostgresAdapter extends DatabaseAdapter {
  /**
   * @param {Object} config - PostgreSQL configuration object
   */
  constructor(config) {
    super(config);
    this.pool = null;
    this.client = null;
  }

  /**
   * Initializes a PostgreSQL connection pool.
   */
  async connect() {
    try {
      this.pool = new Pool({
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password,
        database: this.config.database,
        max: this.config.connectionLimit || 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Executes a SQL query with optional parameters.
   * @param {string} sql - The SQL query string
   * @param {Array} params - Parameters for the query
   * @returns {Promise<any>} Query result
   */
  async query(sql, params = []) {
    if (!this.pool) {
      throw new Error('PostgreSQL pool not initialized. Call connect() first.');
    }

    if (this.client) {
      // Use transaction-bound client
      const result = await this.client.query(sql, params);
      return result.rows;
    } else {
      // Regular query from pool
      const result = await this.pool.query(sql, params);
      return result.rows;
    }
  }

  /**
   * Begins a new transaction by acquiring a client from the pool.
   */
  async beginTransaction() {
    this.client = await this.pool.connect();
    await this.client.query('BEGIN');
  }

  /**
   * Commits the current transaction and releases the client.
   */
  async commit() {
    if (this.client) {
      await this.client.query('COMMIT');
      this.client.release();
      this.client = null;
    }
  }

  /**
   * Rolls back the current transaction and releases the client.
   */
  async rollback() {
    if (this.client) {
      await this.client.query('ROLLBACK');
      this.client.release();
      this.client = null;
    }
  }

  /**
   * Gracefully closes all connections in the pool.
   */
  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}

module.exports = PostgresAdapter;
