// adapters/CassandraAdapter.js

const cassandra = require('cassandra-driver');
const DatabaseAdapter = require("./DatabaseAdapter");


/**
 * CassandraAdapter extends the base DatabaseAdapter to provide
 * Cassandra-specific database interaction using cassandra-driver.
 */
class CassandraAdapter extends DatabaseAdapter {
  /**
   * @param {Object} config - Cassandra configuration object
   */
  constructor(config) {
    super(config);
    this.client = null;
  }

  /**
   * Initializes a Cassandra client connection.
   */
  async connect() {
    try {
      this.client = new cassandra.Client({
        contactPoints: this.config.hosts || [this.config.host || '127.0.0.1'],
        localDataCenter: this.config.dataCenter || 'datacenter1',
        keyspace: this.config.keyspace,
        credentials: {
          username: this.config.user,
          password: this.config.password,
        },
        pooling: {
          coreConnectionsPerHost: {
            [cassandra.types.distance.local]: this.config.connectionLimit || 2,
          },
        },
      });
      await this.client.connect();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Executes a CQL query with optional parameters.
   * @param {string} query - CQL query string
   * @param {Array} params - Parameters for the query
   * @returns {Promise<any>} Query result
   */
  async query(query, params = []) {
    if (!this.client) {
      throw new Error('Cassandra client not initialized. Call connect() first.');
    }

    try {
      const result = await this.client.execute(query, params, { prepare: true });
      return result.rows;
    } catch (error) {
      throw await _parseDbError(error);
    }
  }

  /**
   * Cassandra does not support full ACID transactions.
   * These methods are implemented as no-ops for API compatibility.
   */
  async beginTransaction() {

  }

  async commit() {

  }

  async rollback() {

  }

  /**
   * Gracefully closes the Cassandra connection.
   */
  async disconnect() {
    if (this.client) {
      await this.client.shutdown();
      this.client = null;
    }
  }

  async _parseDbError(err) {
    return [
      'ECONNREFUSED', 'PROTOCOL_CONNECTION_LOST', 'ENOTFOUND', 'ETIMEDOUT',
      'EHOSTUNREACH', 'ECONNRESET', 'ER_CON_COUNT_ERROR', 'ER_ACCESS_DENIED_ERROR',
      'ER_BAD_DB_ERROR', '08P01', '57P01'
    ];
  }
}

module.exports = CassandraAdapter;
