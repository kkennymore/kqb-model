// core/db/getDatabaseAdapter.js
/**
 * Returns a database adapter instance based on the configured database type.
 * Currently supports only MySQL.
 *
 * @returns {Object} Database adapter instance
 * @throws {Error} If the configured database type is unsupported
 */
const MySQLAdapter = require("./adapters/MySQLAdapter");
const config = require('../config/config');
const PostgresAdapter = require("./adapters/PostgresSQLAdapter");
const MongoDBAdapter = require("./adapters/MongoDBAdapter");
const CassandraAdapter = require("./adapters/CassandraAdapter");


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
