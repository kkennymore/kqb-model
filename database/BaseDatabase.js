/**
 * @fileoverview BaseDatabase class that wraps the underlying database adapter.
 * 
 * @module core/BaseDatabase
 * 
 * @description
 * This class serves as a wrapper around the selected database adapter.
 * It provides methods to connect, query, manage transactions, and disconnect.
 * The actual database adapter is obtained dynamically via DatabaseFactory,
 * allowing flexibility in switching database implementations.
 * 
 * @example
 * const db = new BaseDatabase();
 * await db.connect();
 * const result = await db.query('SELECT * FROM users WHERE id = ?', [1]);
 * await db.disconnect();
 */

const getDatabaseAdapter  = require("./database/DatabaseFactory");

class BaseDatabase {
  /**
   * Creates a new BaseDatabase instance.
   * Retrieves the database adapter using the factory.
   */
  constructor(config) {

    this.db = getDatabaseAdapter(config);
  }

  /**
   * Establishes a connection to the database.
   * @returns {Promise<void>}
   */
  async connect() {
    await this.db.connect();
  }

  /**
   * Executes a SQL query with optional parameters.
   * @param {string} sql - The SQL query string.
   * @param {any[]} [params=[]] - The parameters for the SQL query.
   * @returns {Promise<any>} The query result.
   */
  async query(sql, params = []) {
    return await this.db.query(sql, params);
  }

  /**
   * Starts a database transaction.
   * @returns {Promise<void>}
   */
  async beginTransaction() {
    await this.db.beginTransaction();
  }

  /**
   * Commits the current transaction.
   * @returns {Promise<void>}
   */
  async commit() {
    await this.db.commit();
  }

  /**
   * Rolls back the current transaction.
   * @returns {Promise<void>}
   */
  async rollback() {
    await this.db.rollback();
  }

  /**
   * Closes the database connection.
   * @returns {Promise<void>}
   */
  async disconnect() {
    await this.db.disconnect();
  }
}

module.exports = BaseDatabase;