---
title: 'DuckDB Beyond the Basics'
description: 'ASOF joins for time series alignment, SUMMARIZE for instant data profiling, remote file queries, PIVOT, and persistent connections — the DuckDB features that make it genuinely different.'
pubDate: 'Mar 26 2026'
heroImage: '/blog-sql.svg'
difficulty: 'high'
---

The [Parquet and DuckDB article](/blog/working-with-parquet-and-duckdb) covers the foundation: installing DuckDB, writing Parquet files, running basic aggregations. This article goes further — the features that separate DuckDB from "SQLite but faster" and make it a genuine Swiss Army knife for analytical data work.

---

## Instant Data Profiling with SUMMARIZE

Before writing a single `WHERE` clause on a new dataset, run `SUMMARIZE`. It returns min, max, mean, standard deviation, approximate distinct count, null count, and quartiles for every column in one query.

```python
import duckdb

duckdb.sql("""
    SUMMARIZE SELECT * FROM 'data/raw/transactions.parquet'
""").df()
```

Output (one row per column):

```
column_name  | column_type | min   | max    | approx_unique | avg     | std    | q25   | q50   | q75   | count  | null_percentage
-------------|-------------|-------|--------|---------------|---------|--------|-------|-------|-------|--------|----------------
amount       | DOUBLE      | 0.01  | 9847.5 | 12043         | 142.3   | 287.1  | 22.4  | 61.0  | 154.2 | 500000 | 0.0%
user_id      | VARCHAR     | A0001 | Z9999  | 84231         | NULL    | NULL   | NULL  | NULL  | NULL  | 500000 | 0.0%
created_at   | TIMESTAMP   | ...   | ...    | 487           | NULL    | NULL   | ...   | ...   | ...   | 500000 | 1.2%
category     | VARCHAR     | food  | travel | 14            | NULL    | NULL   | NULL  | NULL  | NULL  | 499012 | 0.2%
```

In one query you know the data shape, value ranges, cardinality of categorical columns, and which columns have nulls. This replaces `df.describe()`, `df.nunique()`, and `df.isnull().sum()` — and it runs without loading the file into memory.

For a quick column overview without statistics:

```python
duckdb.sql("DESCRIBE SELECT * FROM 'data/raw/transactions.parquet'").df()
```

---

## ASOF JOIN: Time Series Alignment Without the Pain

Aligning two time series datasets is one of the messiest operations in pandas. If a price update arrives at 09:32:14 and a sentiment score was recorded at 09:31:58, they belong together — but a standard join finds no match because the timestamps differ.

DuckDB's `ASOF JOIN` handles this directly. It joins each row in the left table to the most recent row in the right table where the key is less than or equal to the left row's key.

```python
result = duckdb.sql("""
    SELECT
        p.ticker,
        p.ts,
        p.close,
        s.sentiment_score,
        s.ts AS sentiment_ts,
        epoch_ms(p.ts) - epoch_ms(s.ts) AS lag_ms

    FROM prices p
    ASOF JOIN sentiment s
        ON p.ticker = s.ticker
        AND p.ts >= s.ts

    ORDER BY p.ticker, p.ts
""").df()
```

This joins each price bar to the most recent sentiment reading at or before that bar's timestamp — no fuzzy merge, no `merge_asof`, no manual window logic. It handles irregular intervals cleanly.

`ASOF JOIN` requires the join key to be ordered. DuckDB enforces this automatically.

**Forward-fill example:** The same pattern works for any sparse signal that should be carried forward until the next update — analyst ratings, economic indicators, earnings dates.

```python
result = duckdb.sql("""
    SELECT
        p.date,
        p.ticker,
        p.close,
        r.rating,        -- most recent analyst rating at or before this date
        r.date AS rating_date

    FROM daily_prices p
    ASOF JOIN analyst_ratings r
        ON p.ticker = r.ticker
        AND p.date >= r.date
""").df()
```

---

## Querying Remote Files Directly

DuckDB's `httpfs` extension lets you query files over HTTP or S3 without downloading them first.

```python
import duckdb

con = duckdb.connect()
con.install_extension("httpfs")
con.load_extension("httpfs")

# Query a remote Parquet file
result = con.sql("""
    SELECT *
    FROM read_parquet('https://example.com/data/prices.parquet')
    WHERE ticker = 'AAPL'
    LIMIT 1000
""").df()
```

DuckDB only downloads the column chunks and row groups it needs — for a filtered query against a 2 GB remote Parquet file, it may transfer only a few MB.

**S3 with credentials:**

```python
con.sql("""
    SET s3_region = 'us-east-1';
    SET s3_access_key_id = 'YOUR_KEY';
    SET s3_secret_access_key = 'YOUR_SECRET';
""")

result = con.sql("""
    SELECT COUNT(*), AVG(amount)
    FROM read_parquet('s3://my-bucket/data/transactions/*.parquet')
    WHERE date >= '2024-01-01'
""").df()
```

This pattern — filter-before-download against S3 Parquet — is materially cheaper than loading entire files into a compute instance. DuckDB uses Parquet column statistics and row group metadata to skip irrelevant data before downloading it.

---

## PIVOT and UNPIVOT

Reshaping data in pandas requires `pivot_table` with its awkward `aggfunc` argument, or `melt` for the reverse. DuckDB handles both in SQL.

**PIVOT — rows to columns:**

```python
# Monthly sales by category, one column per month
result = duckdb.sql("""
    PIVOT sales
    ON month
    USING SUM(amount)
    GROUP BY category
""").df()
```

Output:
```
category  | Jan    | Feb    | Mar    | Apr
----------|--------|--------|--------|-------
food      | 12400  | 11800  | 14200  | 13100
travel    | 8300   | 6100   | 9400   | 11200
software  | 42000  | 44500  | 43100  | 46800
```

**UNPIVOT — columns to rows:**

```python
# Reverse: wide format back to long format
result = duckdb.sql("""
    UNPIVOT monthly_totals
    ON Jan, Feb, Mar, Apr
    INTO
        NAME month
        VALUE amount
""").df()
```

Both operations push column selection into the query planner — DuckDB reads only the columns involved, which matters for wide datasets.

---

## List Aggregates and Struct Types

DuckDB has first-class support for list and struct types, which makes it useful for semi-structured data where you don't want to fully normalize.

**Collect values into a list:**

```python
result = duckdb.sql("""
    SELECT
        user_id,
        LIST(category ORDER BY created_at) AS purchase_sequence,
        LIST_DISTINCT(category)            AS unique_categories,
        LEN(LIST(category))                AS total_purchases

    FROM transactions
    GROUP BY user_id
""").df()
```

`purchase_sequence` is a list column — each row contains an ordered array of strings. This keeps the sequence structure without exploding into one row per purchase.

**Unnest to expand list columns:**

```python
result = duckdb.sql("""
    SELECT user_id, UNNEST(purchase_sequence) AS category
    FROM user_sequences
""").df()
```

**Struct types for nested data:**

```python
result = duckdb.sql("""
    SELECT
        order_id,
        STRUCT_PACK(
            city    := shipping_city,
            state   := shipping_state,
            country := shipping_country
        ) AS shipping_address

    FROM orders
""").df()

# Access struct fields
result = duckdb.sql("""
    SELECT order_id, shipping_address.city
    FROM order_structs
""").df()
```

These types are especially useful when preparing data for ML pipelines or APIs where nested structure is expected.

---

## Persistent Connections and Macros

For repeated queries against the same data, a persistent connection is faster than reopening files every time.

```python
import duckdb

# Create a persistent DuckDB database file
con = duckdb.connect("analytics.duckdb")

# Register Parquet files as views — reusable across queries
con.sql("""
    CREATE OR REPLACE VIEW prices AS
    SELECT * FROM read_parquet('data/parquet/prices/**/*.parquet', hive_partitioning=true);

    CREATE OR REPLACE VIEW sentiment AS
    SELECT * FROM read_csv_auto('data/signals/sentiment.csv');
""")

# Query the views directly — no file paths in every query
result = con.sql("""
    SELECT p.ticker, p.date, p.close, s.score
    FROM prices p
    JOIN sentiment s ON p.ticker = s.ticker AND p.date = s.date
    WHERE p.date >= '2024-01-01'
""").df()

con.close()
```

Views in a persistent connection survive across Python sessions. The next time you open `analytics.duckdb`, the `prices` and `sentiment` views are already registered.

**Macros** let you define reusable SQL functions:

```python
con.sql("""
    CREATE OR REPLACE MACRO pct_change(a, b) AS ((b - a) / a) * 100;
    CREATE OR REPLACE MACRO sma(col, n) AS AVG(col) OVER (
        ORDER BY rowid ROWS BETWEEN (n - 1) PRECEDING AND CURRENT ROW
    );
""")

result = con.sql("""
    SELECT
        ticker,
        date,
        close,
        pct_change(LAG(close) OVER (PARTITION BY ticker ORDER BY date), close) AS ret_pct

    FROM prices
    ORDER BY ticker, date
""").df()
```

Macros eliminate copy-pasting the same expression across multiple queries.

---

## DuckDB vs pandas: When to Use Which

Both tools have their place. The decision is usually straightforward:

| Situation | Use |
|-----------|-----|
| Dataset fits in memory, lots of row-wise operations | pandas |
| SQL is cleaner than the pandas equivalent | DuckDB |
| Dataset is larger than available RAM | DuckDB |
| Complex window functions, ranking, pivoting | DuckDB |
| Joining files of different formats | DuckDB |
| Need the result as a DataFrame for sklearn/plotting | DuckDB → `.df()` |
| Time series alignment (ASOF JOIN) | DuckDB |
| Iterating row-by-row with custom logic | pandas |

The practical pattern is: transform with DuckDB, operate row-wise or model with pandas/sklearn. The `.df()` call is the handoff.

---

## What DuckDB Is Not

DuckDB is an analytical query engine. It is not a replacement for:

- **PostgreSQL / MySQL** — DuckDB has limited support for concurrent writes. For applications that INSERT/UPDATE at high frequency, use a transactional database.
- **Spark / Trino** — DuckDB runs on a single machine. For datasets that genuinely require distributed compute (multi-TB), use a distributed engine.
- **Redis / Memcached** — DuckDB is not a key-value store or cache.

Within its scope — fast analytical SQL on a single machine against files or DataFrames — DuckDB has no close competitor.

---

## Next Steps

- **[Working with Parquet and DuckDB](/blog/working-with-parquet-and-duckdb)** — The foundation: file formats, basic queries, and performance benchmarks.
- **[DuckDB for Financial Analysis](/blog/duckdb-for-financial-analysis)** — Applying these patterns to stock price data: rolling indicators, returns, feature matrix export.
- **[Building Your First Data Pipeline](/blog/building-your-first-data-pipeline)** — Where DuckDB fits in an end-to-end pipeline.
