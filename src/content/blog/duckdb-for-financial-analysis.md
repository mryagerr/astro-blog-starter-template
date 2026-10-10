---
title: 'DuckDB for Financial Data Analysis'
description: 'Use DuckDB to run fast analytical SQL over stock price data, compute rolling indicators, and build a local analytics layer — no server required.'
pubDate: 'Jun 18 2025'
updatedDate: 'Oct 10 2026'
heroImage: '/blog-duckdb-finance.png'
difficulty: 'high'
tags: ['analysis']
financialDisclaimer: true
---

The [Parquet and DuckDB article](/article/working-with-parquet-and-duckdb/) covers the basics: installing DuckDB, writing Parquet files, running queries. This article goes further — it uses stock market data as the working example and covers the patterns that come up repeatedly in financial analysis: rolling windows, returns, rank filtering, multi-file queries, and exporting results for downstream use.

## Setting Up a Local Stock Data Store

Start with a directory of daily OHLCV CSV files — one per ticker, or one combined file. Convert to Parquet once and query many times.

```python
import duckdb
from pathlib import Path

RAW = Path("data/raw")
PARQUET = Path("data/parquet")
PARQUET.mkdir(parents=True, exist_ok=True)

# Convert all CSVs to a single Parquet file, adding a ticker column
duckdb.sql(f"""
    COPY (
        SELECT
            parse_filename(filename, true) AS ticker,
            CAST(Date AS DATE)      AS date,
            CAST(Open AS DOUBLE)    AS open,
            CAST(High AS DOUBLE)    AS high,
            CAST(Low AS DOUBLE)     AS low,
            CAST(Close AS DOUBLE)   AS close,
            CAST(Volume AS BIGINT)  AS volume
        FROM read_csv(
            '{RAW}/*.csv',
            filename = true,
            auto_detect = true
        )
    )
    TO '{PARQUET}/prices.parquet'
    (FORMAT PARQUET, COMPRESSION 'zstd')
""")
```

`filename = true` adds the source file path as a `filename` column, and `parse_filename(filename, true)` strips the directory and the `.csv` extension, so `data/raw/AAPL.csv` becomes `AAPL`. That derives the ticker from the filename without pre-processing the CSVs.

## OHLCV Data Quality Checks

Raw price data from free sources contains errors that are easy to miss and expensive to ignore. Run these checks immediately after ingestion, before any calculations.

```python
import duckdb

issues = duckdb.sql("""
    WITH flagged AS (
        SELECT
            ticker,
            date,
            open, high, low, close, volume,

            -- High must be >= all other prices
            CASE WHEN high < low                 THEN 'high < low'
                 WHEN high < open                THEN 'high < open'
                 WHEN high < close               THEN 'high < close'
                 ELSE NULL END AS price_error,

            -- Zero or negative values are always wrong
            CASE WHEN close <= 0                 THEN 'non-positive close'
                 WHEN volume < 0                 THEN 'negative volume'
                 ELSE NULL END AS range_error,

            -- Price gaps larger than 50% in a single day suggest a split or bad data
            CASE WHEN ABS(
                close / NULLIF(LAG(close, 1) OVER (PARTITION BY ticker ORDER BY date), 0) - 1
            ) > 0.50 THEN 'large gap — possible split or bad tick'
                 ELSE NULL END AS gap_warning

        FROM 'data/parquet/prices.parquet'
    )
    SELECT *
    FROM flagged
    WHERE price_error IS NOT NULL
       OR range_error IS NOT NULL
       OR gap_warning IS NOT NULL
    ORDER BY ticker, date
""").df()

if not issues.empty:
    print(f"Found {len(issues)} data quality issues:")
    print(issues.to_string())
```

The flags are computed in a CTE and filtered in the outer query because SQL evaluates `WHERE` before window functions: putting `gap_warning` (which uses `LAG`) directly in the `WHERE` clause fails with `WHERE clause cannot contain window functions`.

Large single-day gaps are the most common surprise. They can mean:
- A stock split (adjust prices or use an adjusted-close data source)
- A missing trading day creating a phantom gap across a weekend or holiday
- A genuinely bad tick from the data provider

The right response depends on the cause — but you need to know the gap exists before you can decide.

### A Note on Survivorship Bias

The tickers in your dataset are the ones that *still exist*. Companies that went bankrupt, were acquired, or were delisted during your study window are absent — but they were live trading candidates at the time. Training a model only on survivors inflates apparent returns because the worst outcomes are excluded by construction.

There is no simple fix from free data sources. Being aware of the bias is the first step: when your backtest shows strong performance, ask whether the result would hold for the full population of tradeable stocks at the time, not just the ones that survived to today.

## Computing Returns

Daily and rolling returns are the foundation of almost every financial calculation.

```python
import duckdb

result = duckdb.sql("""
    SELECT
        ticker,
        date,
        close,

        -- Daily return
        (close - LAG(close, 1) OVER w) / LAG(close, 1) OVER w AS daily_return,

        -- Cumulative return from first available date
        close / FIRST_VALUE(close) OVER w - 1 AS cum_return,

        -- Log return (for statistics)
        LN(close / LAG(close, 1) OVER w) AS log_return

    FROM 'data/parquet/prices.parquet'
    WINDOW w AS (PARTITION BY ticker ORDER BY date)
    ORDER BY ticker, date
""").df()
```

Using a named `WINDOW` clause avoids repeating the partition/order definition across every column.

## Rolling Indicators

### Simple and Exponential Moving Averages

DuckDB's window functions handle rolling aggregations directly. Two details matter if these columns feed a model:

- **Warm-up rows.** A `ROWS BETWEEN 19 PRECEDING` window on the 3rd row of a ticker averages 3 values, not 20. Those partial-window values look like real indicators but aren't. The query below emits `NULL` until the window is full, so a later `dropna()` removes them instead of letting them leak into features.
- **Volatility is measured on returns, not prices.** The standard deviation of *close prices* scales with the price level and trend (a $400 stock looks "more volatile" than a $40 one). The standard deviation of *daily returns* is the conventional volatility measure. Multiplying by `SQRT(252)` annualizes it (252 ≈ trading days per year).

```python
result = duckdb.sql("""
    WITH r AS (
        SELECT
            ticker,
            date,
            close,
            close / LAG(close, 1) OVER (PARTITION BY ticker ORDER BY date) - 1 AS daily_return
        FROM 'data/parquet/prices.parquet'
    )
    SELECT
        ticker,
        date,
        close,

        -- 20-day simple moving average (NULL until 20 rows are available)
        CASE WHEN COUNT(close) OVER w20 = 20 THEN AVG(close) OVER w20 END AS sma_20,

        -- 50-day SMA
        CASE WHEN COUNT(close) OVER w50 = 50 THEN AVG(close) OVER w50 END AS sma_50,

        -- 20-day volatility: sample std dev of daily returns, annualized
        CASE WHEN COUNT(daily_return) OVER w20 = 20
             THEN STDDEV_SAMP(daily_return) OVER w20 * SQRT(252) END AS vol_20_ann

    FROM r
    WINDOW
        w20 AS (PARTITION BY ticker ORDER BY date ROWS BETWEEN 19 PRECEDING AND CURRENT ROW),
        w50 AS (PARTITION BY ticker ORDER BY date ROWS BETWEEN 49 PRECEDING AND CURRENT ROW)
    ORDER BY ticker, date
""").df()
```

Output on synthetic sample data (two made-up tickers, 300 trading days; not real prices), first rows where every column is populated:

```
ticker       date      close     sma_20     sma_50  vol_20_ann
  AAPL 2024-03-11 196.966173 190.116846 183.170391    0.181265
  AAPL 2024-03-12 197.918857 190.525886 183.510513    0.145428
  AAPL 2024-03-13 199.891974 191.086673 183.944733    0.144923
  AAPL 2024-03-14 195.622814 191.501771 184.251673    0.165338
  AAPL 2024-03-15 194.782601 191.984502 184.489137    0.159029
```

An exponential moving average is recursive: each value depends on the previous EMA, not on a fixed window of raw rows. Plain window functions can't express that recursion, and a recursive CTE works but is slow and hard to read. The pragmatic approach is to compute EMAs in pandas on the DuckDB result:

```python
result = result.sort_values(["ticker", "date"])
result["ema_20"] = (
    result.groupby("ticker")["close"]
    .transform(lambda s: s.ewm(span=20, adjust=False).mean())
)
```

`span=20` sets the smoothing factor to 2 / (20 + 1), the usual definition for a "20-day EMA". `adjust=False` uses the recursive form, matching how charting platforms compute it. The first ~20 values are still dominated by the starting price, so treat them as warm-up just like the SMA rows.

### Relative Strength Index (RSI)

RSI requires computing average gains and losses, which maps cleanly onto window functions.

The version below uses a **simple** 14-period average of gains and losses. That is Cutler's RSI, an SMA variant. Wilder's original RSI (the one most charting platforms show) uses a recursive, exponentially smoothed average, so values from this query will differ somewhat from your broker's chart, especially right after large moves. Cutler's variant is easier to express in SQL and doesn't depend on where the series starts.

```python
result = duckdb.sql("""
    WITH daily AS (
        SELECT
            ticker,
            date,
            close,
            close - LAG(close, 1) OVER (PARTITION BY ticker ORDER BY date) AS chg
        FROM 'data/parquet/prices.parquet'
    ),
    gains_losses AS (
        SELECT
            ticker,
            date,
            close,
            GREATEST(chg, 0) AS gain,
            ABS(LEAST(chg, 0)) AS loss
        FROM daily
        WHERE chg IS NOT NULL
    ),
    averages AS (
        SELECT
            ticker,
            date,
            close,
            COUNT(*)  OVER w14 AS n,
            AVG(gain) OVER w14 AS avg_gain,
            AVG(loss) OVER w14 AS avg_loss
        FROM gains_losses
        WINDOW w14 AS (PARTITION BY ticker ORDER BY date ROWS BETWEEN 13 PRECEDING AND CURRENT ROW)
    )
    SELECT
        ticker,
        date,
        close,
        CASE
            WHEN n < 14       THEN NULL   -- warm-up: fewer than 14 price changes
            WHEN avg_loss = 0 THEN 100    -- no down moves in the window
            ELSE 100 - 100 / (1 + avg_gain / avg_loss)
        END AS rsi_14
    FROM averages
    ORDER BY ticker, date
""").df()
```

The `avg_loss = 0` branch matters. Without it, a window with no down days divides by zero (or by `NULLIF(..., 0)`, which returns `NULL`), and a strong uptrend, exactly when RSI should read 100, silently shows up as a missing value.

Output on synthetic sample data (not real prices) around a stretch with no down days. The original `NULLIF` version returns `NULL` on the two 100 rows:

```
ticker       date      close     rsi_14
  AAPL 2024-06-05 202.190909  92.626149
  AAPL 2024-06-06 204.296171  92.846511
  AAPL 2024-06-07 209.033976 100.000000
  AAPL 2024-06-10 209.782724 100.000000
  AAPL 2024-06-11 208.221439  95.109740
```

## Querying Multiple Tickers at Once

DuckDB's `IN` operator and `WHERE` filtering push efficiently into Parquet column statistics.

```python
WATCHLIST = ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN"]

result = duckdb.sql(f"""
    SELECT *
    FROM 'data/parquet/prices.parquet'
    WHERE ticker IN ({', '.join(f"'{t}'" for t in WATCHLIST)})
      AND date >= '2024-01-01'
    ORDER BY ticker, date
""").df()
```

For larger watchlists, pass a list directly using DuckDB's Python parameter binding:

```python
import duckdb

con = duckdb.connect()
con.execute("CREATE TABLE watchlist AS SELECT unnest(?) AS ticker", [WATCHLIST])

result = con.execute("""
    SELECT p.*
    FROM 'data/parquet/prices.parquet' p
    JOIN watchlist w ON p.ticker = w.ticker
    WHERE p.date >= '2024-01-01'
""").df()
```

## Ranking and Filtering

Find the top performers by return over a rolling window — a common screening task.

```python
result = duckdb.sql("""
    WITH returns AS (
        SELECT
            ticker,
            date,
            close / NULLIF(LAG(close, 20) OVER (
                PARTITION BY ticker ORDER BY date
            ), 0) - 1 AS ret_20d
        FROM 'data/parquet/prices.parquet'
    )
    SELECT *
    FROM (
        SELECT
            ticker,
            date,
            ret_20d,
            RANK() OVER (PARTITION BY date ORDER BY ret_20d DESC) AS rank_desc
        FROM returns
        WHERE ret_20d IS NOT NULL
    )
    WHERE rank_desc <= 5
    ORDER BY date DESC, rank_desc
""").df()
```

This returns the top 5 tickers by 20-day return for each trading day — a momentum screen.

## Joining Prices with External Signals

The stock sentiment pipeline produces a CSV of sentiment scores by ticker and date. Join it directly against the price Parquet without materializing either dataset.

Two things go wrong with a naive `LEFT JOIN` here:

- **Fan-out.** If the sentiment file has more than one row for the same ticker and date (a re-run, or two scrapes on the same day), each price row matches every duplicate, and the result has more rows than the price table. Aggregate the signal to one row per ticker-date *before* joining.
- **Timing.** A sentiment score labeled with today's date may be computed from posts written after the close. Using it as a feature for today's price is look-ahead. The safe default is to lag it one period, so day *t*'s features use the signal from day *t − 1*.

```python
result = duckdb.sql("""
    WITH sentiment AS (
        -- one row per ticker-date, no matter how many raw rows exist
        SELECT
            ticker,
            CAST(date AS DATE)       AS date,
            AVG(reddit_sentiment)    AS reddit_sentiment,
            AVG(google_trends_score) AS google_trends_score,
            AVG(headline_sentiment)  AS headline_sentiment
        FROM read_csv_auto('data/signals/sentiment.csv')
        GROUP BY 1, 2
    )
    SELECT
        p.ticker,
        p.date,
        p.close,
        p.close / LAG(p.close, 1) OVER w - 1 AS ret_1d,
        -- previous day's signals: known before today's session
        LAG(s.reddit_sentiment, 1)    OVER w AS reddit_sentiment_lag1,
        LAG(s.google_trends_score, 1) OVER w AS google_trends_lag1,
        LAG(s.headline_sentiment, 1)  OVER w AS headline_sentiment_lag1
    FROM 'data/parquet/prices.parquet' p
    LEFT JOIN sentiment s
        ON p.ticker = s.ticker AND p.date = s.date
    WINDOW w AS (PARTITION BY p.ticker ORDER BY p.date)
    ORDER BY p.ticker, p.date
""").df()
```

On the sample data, which has two deliberately duplicated sentiment rows, the naive join returns 602 rows for a 600-row price table. The deduplicated version returns 600.

DuckDB handles the join between a Parquet file and a CSV in a single query, so no staging tables are needed.

## Persisting Results

For long-running queries you run repeatedly, write results back to Parquet.

```python
duckdb.sql("""
    COPY (
        WITH r AS (
            SELECT
                ticker,
                date,
                close,
                close / LAG(close, 1) OVER (PARTITION BY ticker ORDER BY date) - 1 AS daily_return
            FROM 'data/parquet/prices.parquet'
        )
        SELECT
            ticker,
            date,
            close,
            CASE WHEN COUNT(close) OVER w20 = 20 THEN AVG(close) OVER w20 END AS sma_20,
            CASE WHEN COUNT(close) OVER w50 = 50 THEN AVG(close) OVER w50 END AS sma_50,
            CASE WHEN COUNT(daily_return) OVER w20 = 20
                 THEN STDDEV_SAMP(daily_return) OVER w20 * SQRT(252) END AS vol_20_ann
        FROM r
        WINDOW
            w20 AS (PARTITION BY ticker ORDER BY date ROWS BETWEEN 19 PRECEDING AND CURRENT ROW),
            w50 AS (PARTITION BY ticker ORDER BY date ROWS BETWEEN 49 PRECEDING AND CURRENT ROW)
        ORDER BY ticker, date
    )
    TO 'data/parquet/prices_with_indicators.parquet'
    (FORMAT PARQUET, COMPRESSION 'zstd')
""")
```

Subsequent queries read the pre-computed indicators instead of recomputing them on every run.

## Exporting for Machine Learning

The final feature matrix for model training is usually a flat DataFrame. DuckDB can produce it in one query.

```python
import duckdb
import pandas as pd

features = duckdb.sql("""
    WITH sentiment AS (
        SELECT
            ticker,
            CAST(date AS DATE)       AS date,
            AVG(reddit_sentiment)    AS reddit_sentiment,
            AVG(google_trends_score) AS google_trends_score
        FROM read_csv_auto('data/signals/sentiment.csv')
        GROUP BY 1, 2
    )
    SELECT
        p.ticker,
        p.date,
        -- Price features
        p.close,
        p.close / LAG(p.close, 1) OVER w - 1 AS ret_1d,
        p.close / LAG(p.close, 5) OVER w - 1 AS ret_5d,
        CASE WHEN COUNT(p.close) OVER w20 = 20
             THEN AVG(p.close) OVER w20 / p.close - 1 END AS dist_sma20,

        -- Sentiment features, lagged one day to avoid look-ahead
        LAG(s.reddit_sentiment, 1)    OVER w AS reddit_sentiment_lag1,
        LAG(s.google_trends_score, 1) OVER w AS google_trends_lag1,

        -- Target: 1 if tomorrow's close is higher, 0 otherwise (flat days count as 0).
        -- NULL on each ticker's last row, where there is no next close.
        CASE
            WHEN LEAD(p.close, 1) OVER w IS NULL THEN NULL
            WHEN LEAD(p.close, 1) OVER w > p.close THEN 1
            ELSE 0
        END AS target

    FROM 'data/parquet/prices.parquet' p
    LEFT JOIN sentiment s
        ON p.ticker = s.ticker AND p.date = s.date
    WINDOW
        w   AS (PARTITION BY p.ticker ORDER BY p.date),
        w20 AS (PARTITION BY p.ticker ORDER BY p.date ROWS BETWEEN 19 PRECEDING AND CURRENT ROW)
    ORDER BY p.ticker, p.date
""").df()

# Drop warm-up rows (partial windows), the first lagged rows, and each ticker's
# last row (no next-day target)
features = features.dropna()
```

Every column is qualified with `p.` because both the price table and the sentiment CTE have `ticker` and `date` columns. Unqualified names fail with `Ambiguous reference to column name "ticker"`.

The target is mapped to 0/1 explicitly. A `SIGN()` of the forward return yields −1, 0 or 1, and the 0 (an unchanged close) quietly creates a third class that a binary classifier isn't expecting. Here, flat days count as "not up". If ties are common in your data (illiquid tickers, intraday bars), consider dropping them instead.

On the sample data (two synthetic tickers × 300 days), `dropna()` keeps 560 of 600 rows. It removes the first 19 rows of each ticker (partial 20-day window, which also covers the 1-day and 5-day lags) and each ticker's last row (no next-day target).

This pattern (build the full feature matrix in SQL, hand off a clean DataFrame to sklearn) keeps the data transformation logic in one place and makes it reproducible.

## Performance Tips

- **Filter early.** Put date and ticker filters in the query, not after `.df()`. DuckDB pushes filters into Parquet file statistics.
- **Use persistent connections for repeated queries.** `duckdb.connect("analytics.duckdb")` creates a persistent database file. Register Parquet views once, query them many times:

  ```python
  con = duckdb.connect("analytics.duckdb")
  con.execute("CREATE OR REPLACE VIEW prices AS SELECT * FROM read_parquet('data/parquet/prices.parquet')")
  con.sql("SELECT ticker, MAX(date) FROM prices GROUP BY ticker").show()
  ```

  The view stores only the query, not the data, so it always reflects the current Parquet file.
- **Parallelism is automatic.** DuckDB uses all available CPU cores by default. No configuration needed.

## Next Steps

- **[Working with Parquet and DuckDB](/article/working-with-parquet-and-duckdb/)** — Setup, file writes, and basic queries.
- **[Low-Hanging Data Sources for Stock Prediction](/article/low-hanging-data-sources-for-stock-prediction/)** — What signals to add to the feature matrix built above.
- **[Building Your First Data Pipeline](/article/building-your-first-data-pipeline/)** — Wrapping these queries in a reproducible pipeline.
