module.exports = {
    db: {
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        user: 'userDb',
        password: 'pass123',
        database: 'myDatabase',
        connectionLimit: 10,
        keyspace: 'oaadsystem',
        dataCenter: 'datacenter1'
    },
    redis: {
        host: "localhost",
        port: 6379,
        ttl: 60 * 5
    },
    // upstash server redis cache
    upstash: {
        url: "https://maximum-camel-8387.upstash.io",
        token: "ASDDAAIjcDFjNzBlOTg0MWFhN2I0N2YwYjRkMWE3YTFmZjc4OTk1MHAxMA",
    },
    // can use "redis, file, lru, upstash",
    cache_system: "redis",
    activateCache: true
}