// adapters/MySQLAdapter.js

const mysql = require('mysql2/promise');
const DatabaseAdapter = require("./DatabaseAdapter");
/**
 * MySQLAdapter extends the base DatabaseAdapter to provide
 * MySQL-specific database interaction using mysql2/promise.
 */
class MySQLAdapter extends DatabaseAdapter {
  /**
   * @param {Object} config - MySQL configuration object
   */
  constructor(config) {
    super(config);
    this.pool = null;
  }

  /**
   * Initializes a MySQL connection pool.
   */
  async connect() {
    try {
      this.pool = mysql.createPool({
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password,
      database: this.config.database,
      waitForConnections: true,
      connectionLimit: this.config.connectionLimit || 10,
      queueLimit: 0,
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
      throw new Error('MySQL pool not initialized. Call connect() first.');
    }

    if (this.connection) {
      // Use transaction-bound connection
      const [results] = await this.connection.execute(sql, params);
      return results;
    } else {
      // Regular query from pool
      const [results] = await this.pool.execute(sql, params);
      return results;
    }
  }


  /**
   * Begins a new transaction by acquiring a connection from the pool.
   */
  async beginTransaction() {
    this.connection = await this.pool.getConnection();
    await this.connection.beginTransaction();
  }

  /**
   * Commits the current transaction and releases the connection.
   */
  async commit() {
    if (this.connection) {
      await this.connection.commit();
      this.connection.release();
      this.connection = null;
    }
  }

  /**
   * Rolls back the current transaction and releases the connection.
   */
  async rollback() {
    if (this.connection) {
      await this.connection.rollback();
      this.connection.release();
      this.connection = null;
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

module.exports = MySQLAdapter;
