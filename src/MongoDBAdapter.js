// adapters/MongoAdapter.js

const { MongoClient } = require('mongodb');
const DatabaseAdapter = require("./DatabaseAdapter");
/**
 * MongoAdapter extends the base DatabaseAdapter to provide
 * MongoDB-specific database interaction using mongodb driver.
 */
class MongoDBAdapter extends DatabaseAdapter {
  /**
   * @param {Object} config - MongoDB configuration object
   */
  constructor(config) {
    super(config);
    this.client = null;
    this.db = null;
    this.session = null;
  }

  /**
   * Initializes a MongoDB client connection.
   */
  async connect() {
    try {
      const uri = this.config.uri || `mongodb://${this.config.host}:${this.config.port}`;
      this.client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: this.config.connectionLimit || 10,
      });

      await this.client.connect();
      this.db = this.client.db(this.config.database);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Executes a MongoDB operation on a given collection.
   * @param {string} collectionName - Name of the collection
   * @param {string} operation - Operation name (e.g., 'find', 'insertOne')
   * @param {Array} args - Arguments to pass to the operation
   * @returns {Promise<any>} Operation result
   */
  async query(collectionName, operation, args = []) {
    if (!this.db) {
      throw new Error('MongoDB not initialized. Call connect() first.');
    }

    const collection = this.db.collection(collectionName);
    if (!collection[operation]) {
      throw new Error(`Unsupported MongoDB operation: ${operation}`);
    }

    const result = await collection[operation](...args, this.session ? { session: this.session } : {});
    return typeof result.toArray === 'function' ? await result.toArray() : result;
  }

  /**
   * Begins a new MongoDB session and starts a transaction.
   */
  async beginTransaction() {
    this.session = this.client.startSession();
    this.session.startTransaction();
  }

  /**
   * Commits the current transaction and ends the session.
   */
  async commit() {
    if (this.session) {
      await this.session.commitTransaction();
      this.session.endSession();
      this.session = null;
    }
  }

  /**
   * Aborts the current transaction and ends the session.
   */
  async rollback() {
    if (this.session) {
      await this.session.abortTransaction();
      this.session.endSession();
      this.session = null;
    }
  }

  /**
   * Gracefully closes the MongoDB connection.
   */
  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
  }
}

module.exports = MongoDBAdapter;
