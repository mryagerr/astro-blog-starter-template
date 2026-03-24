---
title: 'Organizing Data with SQL'
description: 'Use SQL to filter, sort, join, and aggregate your data. A practical reference covering the queries you will actually use day to day.'
pubDate: 'Mar 14 2025'
heroImage: '/blog-sql.svg'
---

SQL is the most widely understood language for working with structured data. Once your data is in a database — or even a CSV loaded into SQLite or DuckDB — you can answer almost any question about it with a query. This article focuses on the practical patterns you'll use constantly.

## Setting Up: SQLite

SQLite is the fastest way to start. It's a single file, has no server, and ships with Python.

```python
import sqlite3

# creates the file if it doesn't exist
conn = sqlite3.connect("data/journal.db")
cursor = conn.cursor()
```

Loading a CSV directly into SQLite with pandas:

```python
import pandas as pd
import sqlite3

df = pd.read_csv("data/raw/users.csv")
conn = sqlite3.connect("data/journal.db")
df.to_sql("users", conn, if_exists="replace", index=False)
conn.close()
```

That's it. Your CSV is now a SQL table.

## The Core SELECT Statement

Every query follows this structure:

```sql
SELECT columns
FROM   table
WHERE  condition
ORDER  BY column
LIMIT  n;
```

```sql
-- Get all columns
SELECT * FROM users;

-- Get specific columns
SELECT name, email, created_at FROM users;

-- Filter with WHERE
SELECT name, city FROM users WHERE age > 30;

-- Sort results
SELECT name, age FROM users ORDER BY age DESC;

-- Limit rows
SELECT name FROM users LIMIT 10;
```

## Filtering Data

`WHERE` clauses support most comparison operators you'd expect:

```sql
-- Equality and inequality
SELECT * FROM orders WHERE status = 'completed';
SELECT * FROM orders WHERE status != 'cancelled';

-- Numeric comparisons
SELECT * FROM products WHERE price BETWEEN 10 AND 50;

-- Multiple conditions
SELECT * FROM users WHERE age > 25 AND city = 'Chicago';
SELECT * FROM users WHERE city = 'Austin' OR city = 'Dallas';

-- Pattern matching (% = any characters, _ = one character)
SELECT * FROM users WHERE email LIKE '%@gmail.com';
SELECT * FROM users WHERE name LIKE 'A%';

-- Check for NULL
SELECT * FROM users WHERE phone IS NULL;
SELECT * FROM users WHERE phone IS NOT NULL;

-- Match against a list
SELECT * FROM orders WHERE status IN ('pending', 'processing');
```

## Aggregating Data

Aggregation functions collapse multiple rows into a single value:

```sql
-- Count, sum, average, min, max
SELECT COUNT(*)       AS total_users    FROM users;
SELECT SUM(amount)    AS total_revenue  FROM orders;
SELECT AVG(price)     AS avg_price      FROM products;
SELECT MIN(created_at) AS first_order   FROM orders;
SELECT MAX(score)     AS top_score      FROM results;
```

### GROUP BY

`GROUP BY` splits rows into groups before aggregating:

```sql
-- Count users by city
SELECT city, COUNT(*) AS user_count
FROM   users
GROUP  BY city
ORDER  BY user_count DESC;

-- Total revenue by product category
SELECT category, SUM(amount) AS revenue
FROM   orders
GROUP  BY category;

-- Filter groups with HAVING (not WHERE — that filters rows before grouping)
SELECT city, COUNT(*) AS user_count
FROM   users
GROUP  BY city
HAVING COUNT(*) > 100;
```

## Joining Tables

Joins combine data from two tables based on a shared key. This is where SQL becomes powerful for organizing data.

### INNER JOIN

Returns only rows that have a match in both tables:

```sql
SELECT users.name, orders.amount, orders.created_at
FROM   orders
INNER JOIN users ON orders.user_id = users.id;
```

### LEFT JOIN

Returns all rows from the left table, with NULLs where there's no match in the right:

```sql
-- All users, with their most recent order (or NULL if no orders)
SELECT users.name, orders.amount
FROM   users
LEFT JOIN orders ON orders.user_id = users.id;
```

Use `LEFT JOIN` when you want to keep rows even if there's no match — for example, users who have never placed an order.

### Practical Join Example

```sql
-- Orders with user name and product name
SELECT
    o.id           AS order_id,
    u.name         AS customer,
    p.name         AS product,
    o.quantity,
    o.amount,
    o.created_at
FROM orders o
JOIN users    u ON o.user_id    = u.id
JOIN products p ON o.product_id = p.id
WHERE o.status = 'completed'
ORDER BY o.created_at DESC;
```

## Common Data-Organizing Queries

### Deduplication

Find duplicates:
```sql
SELECT email, COUNT(*) AS occurrences
FROM   users
GROUP  BY email
HAVING COUNT(*) > 1;
```

Keep only the most recent record per email:
```sql
DELETE FROM users
WHERE id NOT IN (
    SELECT MAX(id)
    FROM   users
    GROUP  BY email
);
```

### Date Filtering

```sql
-- Records from the last 30 days
SELECT * FROM events
WHERE created_at >= DATE('now', '-30 days');

-- Records from a specific month
SELECT * FROM orders
WHERE strftime('%Y-%m', created_at) = '2025-01';
```

### Creating a Summary Table

```sql
CREATE TABLE monthly_summary AS
SELECT
    strftime('%Y-%m', created_at)  AS month,
    COUNT(*)                        AS order_count,
    SUM(amount)                     AS total_revenue,
    AVG(amount)                     AS avg_order_value
FROM   orders
WHERE  status = 'completed'
GROUP  BY month
ORDER  BY month;
```

## Running Queries from Python

```python
import sqlite3
import pandas as pd

conn = sqlite3.connect("data/journal.db")

# Read query results into a DataFrame
df = pd.read_sql_query("""
    SELECT city, COUNT(*) AS user_count
    FROM   users
    GROUP  BY city
    ORDER  BY user_count DESC
    LIMIT  10
""", conn)

print(df)
conn.close()
```

## DuckDB: SQL on Files Without a Database

DuckDB is a newer option that lets you query CSV and Parquet files directly with SQL — no import step required:

```python
import duckdb

result = duckdb.query("""
    SELECT city, COUNT(*) AS n
    FROM   read_csv_auto('data/raw/users.csv')
    GROUP  BY city
    ORDER  BY n DESC
""").df()

print(result)
```

DuckDB is especially useful for ad-hoc queries on large files where you don't want to maintain a database.

## Next Steps

- **[Python & Pandas for Data Wrangling](/blog/python-pandas-data-wrangling)** — Clean and reshape data before loading it into SQL.
- **[Building Your First Data Pipeline](/blog/building-your-first-data-pipeline)** — Automate the full collect → organize → query cycle.
