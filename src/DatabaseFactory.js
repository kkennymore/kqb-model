// core/db/getDatabaseAdapter.js
/**
 * Returns a database adapter instance based on the configured database type.
 * Currently supports only MySQL.
 *
 * @returns {Object} Database adapter instance
 * @throws {Error} If the configured database type is unsupported
 */
const MySQLAdapter = require("./MySQLAdapter");
const PostgresAdapter = require("./PostgresSQLAdapter");
const MongoDBAdapter = require("./MongoDBAdapter");
const CassandraAdapter = require("./CassandraAdapter");


function getDatabaseAdapter(config) {
  const dbType = config.type.toLowerCase();
  switch (dbType) {
    case 'mysql':
      return new MySQLAdapter(config);
    case 'postgres':
      return new PostgresAdapter(config);
    case 'mongodb':
      return new MongoDBAdapter(config);
    case 'cassandra':
      return new CassandraAdapter(config);
    default:
      throw new Error(`Unsupported DB_TYPE: ${config.type}`);
  }
}

module.exports = getDatabaseAdapter;
