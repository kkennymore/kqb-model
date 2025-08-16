// adapters/DatabaseAdapter.js

/**
 * Abstract base class for all database adapters.
 * Specific database implementations should extend this class
 * and override required methods.
 */
class DatabaseAdapter {
  /**
   * @param {Object} config - Database configuration object
   */
  constructor(config) {
    if (!config) {
      throw new Error('Database configuration is required');
    }

    this.config = config;
    this.connection = null;
  }

  /**
   * Establish a connection to the database.
   * Must be implemented by subclasses.
   */
  async connect() {
    throw new Error('connect() must be implemented by the subclass');
  }

  /**
   * Run a SQL query against the database.
   * @param {string} sql - The SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<any>}
   */
  async query(sql, params) {
    throw new Error('query() must be implemented by the subclass');
  }

  /**
   * Begin a database transaction.
   * Optional: Override in subclasses if supported.
   */
  async beginTransaction() {}

  /**
   * Commit the current transaction.
   * Optional: Override in subclasses if supported.
   */
  async commit() {}

  /**
   * Roll back the current transaction.
   * Optional: Override in subclasses if supported.
   */
  async rollback() {}

  /**
   * Disconnect from the database.
   * Optional: Override in subclasses if needed.
   */
  async disconnect() {}
}

module.exports = DatabaseAdapter;
