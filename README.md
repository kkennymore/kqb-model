# KQKModel.js

`KQKModel` is a **chainable query builder and CRUD abstraction** for Node.js.  
It’s designed to be **extended** into application-specific models, making it easy to write clean, reusable database queries without repetitive SQL.

`KQKModel` provides a clean, object-oriented interface for building SQL queries and performing CRUD operations in Node.js.  
Designed with developers from OOP and Laravel backgrounds in mind, it offers:

- Chainable query builder methods (`select`, `where`, `join`, `groupBy`, etc.) similar to Eloquent.
- Active Record-style CRUD operations (`insert`, `update`, `delete`, `firstOrCreate`, `updateOrInsert`).
- Integrated caching support with Redis for improved performance.
- Transaction support for atomic operations.
- Easy extension to create domain-specific models, promoting reusable and maintainable code.

If you’re familiar with Laravel’s Eloquent ORM, `KQKModel` brings the same developer-friendly patterns and fluent syntax to Node.js.

---

## Table of Contents

- [Installation](#installation)
- [Extending KQKModel in Your App](#extending-KQKModel-in-your-app)
- [Query Builder Methods with Real Usage](#query-builder-methods-with-real-usage)
- [Execution Methods](#execution-methods)
- [CRUD Operations](#crud-operations)
- [Transaction Support](#transaction-support)
- [Error Handling](#error-handling)

---

## Installation

```bash
npm install kqb-model
````

---

## Extending KQKModel in Your App

In a real-world application, you would **extend** `KQKModel` to create your own domain-specific model classes and parse your config file and Redis Object to the super() constructor of the class that extends  `KQKModel` class:
```js
// models/UserModel.js
const KQBModel = require('kqb-model');

export default class UserModel extends KQKModel {
  constructor() {
    super(config, RadisService);
  }
}
```

Then you can create **methods inside `UserModel`** that use the builder methods in a real query context.

---

## Query Builder Methods with Real Usage

Below are **all builder methods** with **inside-a-model examples** and **detailed explanations**.

---

### 1. `select(columns)`

```js
// Get only ID and name of active users
async getActiveUserNames() {
  return this.select(['id', 'name'])   // Only fetch required columns
    .table('users')                    // Table name
    .where('status = ?', ['active'])   // Filter active users
    .get();                            // Execute and return results
}
```

**Why:** Reduces payload size by selecting only needed fields.

---

### 2. `distinct(columns)`

```js
// Get unique list of user roles
async getUniqueRoles() {
  return this.distinct(['role'])       // Avoid duplicates
    .table('users')
    .get();
}
```

**Why:** Use when duplicates in results are not needed.

---

### 3. `count(column, alias)`

```js
// Count how many active users exist
async getActiveUserCount() {
  return this.count('id', 'total_users')
    .table('users')
    .where('status = ?', ['active'])
    .first();
}
```

**Why:** Efficiently get a count without loading all rows.

---

### 4. `table(name)`

```js
// List all products
async getAllProducts() {
  return this.table('products')
    .get();
}
```

**Why:** Specifies the table to query from.

---

### 5. `where(condition, params)`

```js
// Find a user by email
async findByEmail(email) {
  return this.select(['id', 'name', 'email'])
    .table('users')
    .where('email = ?', [email])   // Parameter binding prevents SQL injection
    .first();
}
```

**Why:** Safe filtering with placeholders.

---

### 6. `orWhere(condition, params)`

```js
// Find users who are admin OR active
async getAdminOrActiveUsers() {
  return this.table('users')
    .where('role = ?', ['admin'])
    .orWhere('status = ?', ['active'])
    .get();
}
```

**Why:** Adds alternative filter conditions.

---

### 7. `whereIn(field, values)`

```js
// Find users by a list of IDs
async getUsersByIds(ids) {
  return this.select(['id', 'name'])
    .table('users')
    .whereIn('id', ids)
    .get();
}
```

**Why:** Matches multiple values without repetitive OR statements.

---

### 8. `whereNotIn(field, values)`

```js
// Exclude certain user IDs
async getAllExcept(ids) {
  return this.table('users')
    .whereNotIn('id', ids)
    .get();
}
```

**Why:** Opposite of `whereIn()` — useful for exclusions.

---

### 9. `join(type, table, condition)`

```js
// Get orders with customer details
async getOrdersWithCustomers() {
  return this.select(['orders.id', 'customers.name', 'orders.total'])
    .table('orders')
    .join('INNER', 'customers', 'orders.customer_id = customers.id')
    .get();
}
```

**Why:** Combines related tables.

---

### 10. `groupBy(fields)`

```js
// Total orders per customer
async getOrderCountsPerCustomer() {
  return this.select(['customer_id', 'COUNT(*) as total_orders'])
    .table('orders')
    .groupBy(['customer_id'])
    .get();
}
```

**Why:** Useful for aggregation queries.

---

### 11. `having(condition, params)`

```js
// Customers with more than 5 orders
async getHighOrderCustomers() {
  return this.select(['customer_id', 'COUNT(*) as total_orders'])
    .table('orders')
    .groupBy(['customer_id'])
    .having('COUNT(*) > ?', [5])
    .get();
}
```

**Why:** Filters aggregated results after grouping.

---

### 12. `orderBy(field, dir)`

```js
// Get latest users
async getLatestUsers() {
  return this.table('users')
    .orderBy('created_at', 'DESC')
    .get();
}
```

**Why:** Sorting results.

---

### 13. `limit(n)`

```js
// Get top 5 products
async getTop5Products() {
  return this.table('products')
    .orderBy('sales', 'DESC')
    .limit(5)
    .get();
}
```

**Why:** Restrict number of rows for pagination or previews.

---

## Execution Methods

Execution methods (`get`, `first`, `pluck`, `exists`) would be used **at the end of the chain** to actually run the query.

Example inside model:

```js
// Check if user exists by email
async doesUserExist(email) {
  return this.table('users')
    .where('email = ?', [email])
    .exists();
}
```

---

## CRUD Operations

You can mix builder methods with direct operations:

```js
// Insert new user
async createUser(data) {
  return this.insert('users', data);
}

// Update user name
async renameUser(id, name) {
  return this.update('users', { name }, 'id = ?', [id]);
}
```

---

## Transaction Support

```js
// Create user and profile together
async createUserWithProfile(userData, profileData) {
  await this.insertTransactionData([
    { table: 'users', data: userData },
    { table: 'profiles', data: profileData }
  ]);
  await this.commit();
}
```

---

## Error Handling

* All methods return a **consistent object**:

```js
{
  errorStatus: false,
  message: "Error description",
  data: [err]
}
```

* Prevents unhandled rejections in application code.

---

## License

MIT © Your Name

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
