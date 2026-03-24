---
title: 'Google Trends as a Stock Market Signal'
description: 'Use pytrends to pull search volume data for tickers and fear terms, then use the resulting attention signal as features in a stock prediction model.'
pubDate: 'Mar 26 2025'
heroImage: '/blog-rest-apis.svg'
---

When retail investors get nervous about a stock, they search for it. When they are excited, they search for it. Before money moves, attention moves — and Google search volume captures that attention signal earlier than price data.

In 2013, Preis, Moat, and Stanley published research in *Scientific Reports* showing that increases in Google search volume for finance terms like "debt" and "portfolio" systematically preceded market downturns. The data is free, requires no API key, and is available at hourly granularity for recent periods.

## What You Need

```bash
pip install pytrends pandas
```

`pytrends` is an unofficial Python wrapper for Google Trends. It works by automating the same requests the Trends website makes.

## Basic Setup

```python
from pytrends.request import TrendReq
import pandas as pd

pytrends = TrendReq(hl="en-US", tz=360)
```

## Pulling Search Volume for a Ticker

```python
def get_ticker_trends(keywords: list[str], timeframe: str = "now 7-d") -> pd.DataFrame:
    """
    timeframe options:
      "now 1-H"   → last hour (hourly data)
      "now 4-H"   → last 4 hours
      "now 1-d"   → last day
      "now 7-d"   → last 7 days (hourly)
      "today 1-m" → last month (daily)
    """
    pytrends.build_payload(keywords, timeframe=timeframe, geo="US")
    df = pytrends.interest_over_time()

    if df.empty:
        return df

    # Drop the 'isPartial' flag column
    df = df.drop(columns=["isPartial"], errors="ignore")
    return df


# Example: track Apple and fear terms together
keywords = ["Apple stock", "AAPL", "recession", "market crash"]
trends = get_ticker_trends(keywords, timeframe="now 7-d")
print(trends.head())
```

Google Trends returns relative search volume — a value of 100 means peak popularity for that term in the window; 50 means half as popular as peak. Absolute volumes are not exposed.

## Two Signal Types to Collect

### 1. Ticker-Specific Terms

These capture investor attention for a specific company:

```python
TICKER_QUERIES = {
    "AAPL":  ["Apple stock", "buy AAPL"],
    "AMZN":  ["Amazon stock", "buy AMZN"],
    "NVDA":  ["Nvidia stock", "buy NVDA"],
    "TSLA":  ["Tesla stock", "buy TSLA"],
    "GSPC":  ["S&P 500", "SPY ETF"],
}
```

### 2. Macro Fear Terms

These capture broad market sentiment:

```python
FEAR_QUERIES = ["stock market crash", "recession", "sell stocks", "market correction"]
```

Preis et al. found that the fear terms — not the bullish ones — had the stronger predictive signal.

## Collecting All Signals

Google Trends only allows 5 keywords per request. Batch your queries:

```python
import time

def collect_all_trends(ticker_map: dict, fear_terms: list, timeframe: str = "now 7-d") -> pd.DataFrame:
    all_frames = []

    # Ticker-specific
    for ticker, queries in ticker_map.items():
        df = get_ticker_trends(queries, timeframe=timeframe)
        if df.empty:
            continue
        df["ticker"] = ticker
        df["signal_type"] = "ticker"
        all_frames.append(df)
        time.sleep(1)  # avoid rate limiting

    # Fear terms (one batch)
    df = get_ticker_trends(fear_terms, timeframe=timeframe)
    if not df.empty:
        df["ticker"] = "MARKET"
        df["signal_type"] = "fear"
        all_frames.append(df)

    return pd.concat(all_frames) if all_frames else pd.DataFrame()


trends_df = collect_all_trends(TICKER_QUERIES, FEAR_QUERIES)
```

## Computing the Delta Signal

Raw search volume is less useful than its *change*. A sudden spike in search volume for "Tesla stock" is more meaningful than a steady baseline:

```python
def add_trend_delta(df: pd.DataFrame, column: str) -> pd.DataFrame:
    df = df.sort_index()
    df[f"{column}_delta"] = df[column].pct_change()
    df[f"{column}_delta"] = df[f"{column}_delta"].fillna(0)
    return df


# Apply to each ticker column
for col in ["Apple stock", "AAPL", "recession"]:
    if col in trends_df.columns:
        trends_df = add_trend_delta(trends_df, col)
```

## Aligning to 30-Minute Stock Intervals

Google Trends at hourly resolution needs to be resampled to match 30-minute stock data:

```python
def resample_to_30min(df: pd.DataFrame) -> pd.DataFrame:
    df.index = pd.to_datetime(df.index)
    # Forward-fill hourly values into both 30-min slots
    df = df.resample("30min").ffill()
    return df


trends_30min = resample_to_30min(trends_df)
```

## Merging with Stock Features

```python
stock_df = pd.read_csv("nyse_30min.csv", parse_dates=["datetime"])
stock_df = stock_df.set_index("datetime")

merged = stock_df.join(trends_30min, how="left")

# Fill any gaps with 0 (no search activity recorded)
trend_cols = [c for c in trends_30min.columns if c not in ["ticker", "signal_type"]]
merged[trend_cols] = merged[trend_cols].fillna(0)
```

## Practical Notes

**Rate limiting** — `pytrends` can get blocked by Google if you make too many requests too quickly. Add `time.sleep(1)` between requests and retry on failure. For a production pipeline, run the collection once per hour rather than in real-time.

**Relative vs. absolute** — Because Trends returns relative values, comparisons across different time windows are unreliable. Keep your timeframe consistent (`now 7-d` gives hourly data for the past week) and always compute *deltas* rather than using raw values.

**Keyword overlap** — If two keywords in the same batch share search traffic, Trends normalizes them together. Test keywords in isolation first to understand their baseline before mixing them.

**Geographic filter** — The `geo="US"` parameter filters to US searches. For NYSE-focused research this is appropriate, but removing the filter captures global investor attention.

## References

- Preis, T., Moat, H. S., & Stanley, H. E. (2013). Quantifying trading behavior in financial markets using Google Trends. *Scientific Reports*, 3, 1684.
- Da, Z., Engelberg, J., & Gao, P. (2011). In search of attention. *Journal of Finance*, 66(5), 1461–1499.
