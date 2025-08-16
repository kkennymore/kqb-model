# KQBModel ORM

`KQBModel ORM` is a **chainable query builder and CRUD abstraction** for Node.js.  
It’s designed to be **extended** into application-specific models, making it easy to write clean, reusable database queries without repetitive SQL.

`KQBModel ORM` provides a clean, object-oriented interface for building SQL queries and performing CRUD operations in Node.js.  
Designed with developers from OOP and Laravel backgrounds in mind, it offers:

- Chainable query builder methods (`select`, `where`, `join`, `groupBy`, etc.) similar to Eloquent.
- Active Record-style CRUD operations (`insert`, `update`, `delete`, `firstOrCreate`, `updateOrInsert`).
- Integrated caching support via `KCache` with Redis, Upstash, File, or LRU.
- Transaction support for atomic operations.
- Easy extension to create domain-specific models, promoting reusable and maintainable code.

If you’re familiar with Laravel’s Eloquent ORM, `KQBModel ORM` brings the same developer-friendly patterns and fluent syntax to Node.js.

---

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Extending KQBModel ORM in Your App](#extending-kqbmodel-orm-in-your-app)
- [Query Builder Methods](#query-builder-methods)
- [Execution Methods](#execution-methods)
- [CRUD Operations](#crud-operations)
- [Transaction Support](#transaction-support)
- [KCache (Caching) Methods](#kcache-caching-methods)
- [Error Handling](#error-handling)
- [License](#license)

---

## Installation

```bash
npm install kqb-model
````

---

## Configuration

The `KQBModel` constructor expects a configuration object:

```js
const config = {
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
  upstash: {
    url: "https://maximum-camel-8387.upstash.io",
    token: "ASDDAAIjcDFjNzBlOTg0MWFhN2I0N2YwYjRkMWE3YTFmZjc4OTk1MHAxMA"
  },
  cache_system: "redis",  // Options: "redis", "upstash", "lru", "file"
  activateCache: true
};
```

* `db`: Database connection details.
* `redis`: Local Redis cache configuration.
* `upstash`: Cloud Redis cache (optional).
* `cache_system`: Defines which cache to use.
* `activateCache`: Boolean flag to enable/disable caching.

---

## Extending KQBModel ORM in Your App

```js
// models/UserModel.js
const { KQBModel, KCache } = require('kqb-model');

class UserModel extends KQBModel {
  constructor() {
    super(config); // Pass the config object
  }

  async initCache() {
    await KCache.init(config); // Initialize caching system
  }

  async findActiveUsers() {
    return this.select(['id', 'name'])
      .table('users')
      .where('status = ?', ['active'])
      .get();
  }
}

module.exports = UserModel;
```

**Usage:**

```js
const UserModel = require('./models/UserModel');
const users = new UserModel();

await users.initCache();
const activeUsers = await users.findActiveUsers();
```

---

## Query Builder Methods

### `select(columns)`

```js
this.select(['id','name']).table('users').where('status = ?', ['active']).get();
```

### `distinct(columns)`

```js
this.distinct(['role']).table('users').get();
```

### `count(column, alias)`

```js
this.count('id','total_users').table('users').where('status=?',['active']).first();
```

### `table(name)`

```js
this.table('products').get();
```

### `where(condition, params)`

```js
this.where('email=?', ['test@example.com']).first();
```

### `orWhere(condition, params)`

```js
this.where('role=?', ['admin']).orWhere('status=?',['active']).get();
```

### `whereIn(field, values)`

```js
this.whereIn('id', [1,2,3]).get();
```

### `whereNotIn(field, values)`

```js
this.whereNotIn('id', [1,2,3]).get();
```

### `join(type, table, condition)`

```js
this.join('INNER','customers','orders.customer_id = customers.id').get();
```

### `groupBy(fields)`

```js
this.groupBy(['customer_id']).get();
```

### `having(condition, params)`

```js
this.having('COUNT(*)> ?', [5]).get();
```

### `orderBy(field, dir)`

```js
this.orderBy('created_at', 'DESC').get();
```

### `limit(n)`

```js
this.limit(5).get();
```

---

## Execution Methods

* `get(cacheKey?, isCache?, ttl?)` → Returns an array of results.
* `first(cacheKey?, isCache?, ttl?)` → Returns first result.
* `pluck(column, cacheKey?, isCache?, ttl?)` → Returns array of a single column.
* `exists(cacheKey?, isCache?, ttl?)` → Returns boolean.

```js
const exists = await this.table('users').where('email=?',['test@example.com']).exists();
```

---

## CRUD Operations

```js
await this.insert('users', { name:'John', email:'john@example.com' });
await this.update('users', { name:'Johnny' }, 'id=?', [1]);
await this.delete('users', 'id=?', [1]);
await this.firstOrCreate('users', { email:'john@example.com' }, { name:'John' });
await this.updateOrInsert('users', { email:'john@example.com' }, { name:'Johnny' });
```

---

## Transaction Support

```js
await this.insertTransactionData([
  { table:'users', data:{ name:'John' } },
  { table:'profiles', data:{ user_id:1, bio:'Developer' } }
]);
await this.commit();
```

---

## KCache (Caching) Methods

`KCache` provides multiple caching strategies: **Redis, Upstash, File, LRU**.

### Initialization

```js
await KCache.init(config);
```

### Basic KV operations

| Method                              | Description                     | Example                                                 |
| ----------------------------------- | ------------------------------- | ------------------------------------------------------- |
| `get(key)`                          | Retrieve a value                | `await KCache.get('user_1');`                           |
| `set(key, value, mode?, duration?)` | Store a value with optional TTL | `await KCache.set('user_1', {name:'John'}, 'EX', 300);` |
| `delete(key)`                       | Delete a key                    | `await KCache.delete('user_1');`                        |
| `keys()`                            | List all keys                   | `await KCache.keys();`                                  |
| `clearAll()`                        | Clear entire cache              | `await KCache.clearAll();`                              |
| `getAll()`                          | Retrieve all key-value pairs    | `await KCache.getAll();`                                |

### Hash Operations

| Method                   | Description            | Example                                                |
| ------------------------ | ---------------------- | ------------------------------------------------------ |
| `hset(hash, key, value)` | Set field in a hash    | `await KCache.hset('users', 'user_1', {name:'John'});` |
| `hget(hash, key)`        | Get field from hash    | `await KCache.hget('users','user_1');`                 |
| `hgetAll(hash)`          | Get all fields in hash | `await KCache.hgetAll('users');`                       |
| `hdel(hash, key)`        | Delete field in hash   | `await KCache.hdel('users','user_1');`                 |

### List Operations

| Method                      | Description          | Example                                |
| --------------------------- | -------------------- | -------------------------------------- |
| `rpush(list, value)`        | Append value to list | `await KCache.rpush('queue', 'job1');` |
| `lpush(list, value)`        | Prepend value        | `await KCache.lpush('queue','job0');`  |
| `rpop(list)`                | Pop last element     | `await KCache.rpop('queue');`          |
| `lpop(list)`                | Pop first element    | `await KCache.lpop('queue');`          |
| `lrange(list, start, stop)` | Get range of list    | `await KCache.lrange('queue',0,5);`    |

### Set Operations

| Method                  | Description      | Example                                    |
| ----------------------- | ---------------- | ------------------------------------------ |
| `sadd(set, value)`      | Add member       | `await KCache.sadd('roles','admin');`      |
| `smembers(set)`         | List members     | `await KCache.smembers('roles');`          |
| `sismember(set, value)` | Check membership | `await KCache.sismember('roles','admin');` |
| `srem(set, value)`      | Remove member    | `await KCache.srem('roles','admin');`      |

### Pub/Sub Operations

| Method                         | Description          | Example                                                    |
| ------------------------------ | -------------------- | ---------------------------------------------------------- |
| `publish(channel, message)`    | Publish message      | `await KCache.publish('news','hello');`                    |
| `subscribe(channel, callback)` | Subscribe to channel | `await KCache.subscribe('news', msg => console.log(msg));` |

### Quit Cache Connection

```js
await KCache.quit();
```

---

## Error Handling

All methods return a **consistent object** in case of errors:

```js
{
  errorStatus: false,
  message: "Error description",
  data: [err]
}
```

---

## License

MIT © Usiobaifo A Kenneth

```

---
MIT License

Copyright (c) 2025 Usiobaifo A Kenneth

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights  
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell  
copies of the Software, and to permit persons to whom the Software is  
furnished to do so, subject to the following conditions:  

The above copyright notice and this permission notice shall be included in all  
copies or substantial portions of the Software.  

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR  
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE  
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER  
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,  
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE  
SOFTWARE.
```

---

This README includes:

* Full **KQBModel ORM query builder and CRUD methods**
* **Execution methods**
* **Transaction support**
* **Detailed KCache documentation** (all KV, hash, list, set, pub/sub)
* **Usage examples**
* Ready for GitHub or npm.

---
