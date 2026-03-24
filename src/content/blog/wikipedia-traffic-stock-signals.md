---
title: 'Wikipedia Page Views as a Stock Market Signal'
description: 'Pull free hourly Wikipedia traffic data for company pages using the Wikimedia API and use spikes in attention as features for stock prediction.'
pubDate: 'Mar 29 2025'
heroImage: '/blog-rest-apis.svg'
---

Before investors buy or sell a stock, they often research it. When something significant happens to a company — an earnings miss, a product launch, a scandal — Wikipedia page views for that company spike. Moat, Curme, Stanley, and Preis (2013) showed in *Scientific Reports* that these spikes preceded price movements, particularly downward moves following periods of elevated research activity.

The Wikimedia REST API is completely free, requires no API key, and returns hourly page view data going back to 2015.

## What You Need

```bash
pip install requests pandas
```

No authentication required.

## Pulling Page Views for a Single Article

```python
import requests
import pandas as pd

def get_pageviews(article: str, start: str, end: str, granularity: str = "hourly") -> pd.DataFrame:
    """
    article     — Wikipedia article title (e.g. 'Apple_Inc.')
    start/end   — format: YYYYMMDDHHMMSS (e.g. '2025010100' for Jan 1 2025 midnight)
    granularity — 'hourly' or 'daily'
    """
    url = (
        f"https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article"
        f"/en.wikipedia/all-access/all-agents/{article}/{granularity}/{start}/{end}"
    )
    headers = {"User-Agent": "stock-research-bot/1.0 (your@email.com)"}
    response = requests.get(url, headers=headers)
    response.raise_for_status()

    items = response.json().get("items", [])
    df = pd.DataFrame(items)[["timestamp", "views"]]
    df["timestamp"] = pd.to_datetime(df["timestamp"], format="%Y%m%d%H")
    df["article"] = article
    return df


# Pull hourly views for Apple Inc. for one week
df = get_pageviews(
    article="Apple_Inc.",
    start="2025031700",
    end="2025032400",
    granularity="hourly",
)
print(df.head())
```

| timestamp | views | article |
|---|---|---|
| 2025-03-17 00:00 | 1847 | Apple_Inc. |
| 2025-03-17 01:00 | 923 | Apple_Inc. |
| 2025-03-17 02:00 | 701 | Apple_Inc. |

## Wikipedia Article Names for Common Tickers

Wikipedia titles do not always match ticker symbols. Here is a mapping for common stocks:

```python
TICKER_TO_WIKI = {
    "AAPL":  "Apple_Inc.",
    "AMZN":  "Amazon_(company)",
    "NVDA":  "Nvidia",
    "TSLA":  "Tesla,_Inc.",
    "WMT":   "Walmart",
    "DIS":   "The_Walt_Disney_Company",
    "NFLX":  "Netflix",
    "BA":    "Boeing",
    "GSPC":  "S%26P_500",  # S&P 500 — ampersand must be encoded
}
```

## Collecting All Tickers

```python
import time

def collect_all_pageviews(ticker_map: dict, start: str, end: str) -> pd.DataFrame:
    frames = []
    for ticker, article in ticker_map.items():
        try:
            df = get_pageviews(article, start, end)
            df["ticker"] = ticker
            frames.append(df)
        except Exception as e:
            print(f"Failed for {ticker}: {e}")
        time.sleep(0.5)  # be polite to the API

    return pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()


views_df = collect_all_pageviews(
    TICKER_TO_WIKI,
    start="2025031700",
    end="2025032400",
)
```

## Computing the Signal: View Delta

Raw view counts are noisy — Apple's Wikipedia page always gets more traffic than Boeing's regardless of what is happening in the market. What matters is the *change* relative to baseline:

```python
def add_view_delta(df: pd.DataFrame) -> pd.DataFrame:
    df = df.sort_values(["ticker", "timestamp"])

    # Rolling 7-day average as baseline
    df["rolling_avg"] = (
        df.groupby("ticker")["views"]
        .transform(lambda x: x.rolling(168, min_periods=1).mean())  # 168 hours = 7 days
    )

    # Deviation from baseline
    df["view_zscore"] = (
        df.groupby("ticker")["views"]
        .transform(lambda x: (x - x.rolling(168, min_periods=1).mean())
                              / (x.rolling(168, min_periods=1).std() + 1))
    )

    # Simple period-over-period change
    df["view_pct_change"] = df.groupby("ticker")["views"].pct_change()

    return df


views_df = add_view_delta(views_df)
```

The `view_zscore` column tells you how many standard deviations above the typical hourly traffic the current hour is. A z-score above 2 or 3 indicates an unusual spike worth paying attention to.

## Resampling to 30-Minute Stock Intervals

Wikipedia returns hourly data. Forward-fill to match a 30-minute stock dataset:

```python
def resample_to_30min(df: pd.DataFrame) -> pd.DataFrame:
    df = df.set_index("timestamp")
    resampled = (
        df.groupby("ticker")
        .apply(lambda g: g.resample("30min").ffill())
        .reset_index(level=0, drop=True)
        .reset_index()
    )
    return resampled
```

## Merging with Stock Features

```python
stock_df = pd.read_csv("nyse_30min.csv", parse_dates=["datetime"])

wiki_pivot = views_df.pivot_table(
    index="timestamp",
    columns="ticker",
    values=["views", "view_zscore", "view_pct_change"],
)
wiki_pivot.columns = [f"wiki_{col}_{ticker}" for col, ticker in wiki_pivot.columns]
wiki_pivot = wiki_pivot.reset_index()

merged = stock_df.merge(
    wiki_pivot,
    left_on="datetime",
    right_on="timestamp",
    how="left",
)
```

## What the Research Shows

Moat et al. found that Wikipedia view spikes for financial topics preceded *downward* market moves more often than upward ones. The pattern is: concern → research → selling → price decline. A reasonable hypothesis is that spikes in page views for a specific company article signal that bad news is spreading and investors are investigating before deciding to sell.

In practice, use the z-score as a feature rather than trying to build a rule. Let the model learn whether a spike predicts up or down movement for each specific stock.

## Practical Notes

**User-Agent required** — The Wikimedia API requires a `User-Agent` header identifying your project. Requests without it may be rate-limited or blocked.

**Historical depth** — Hourly data is available from July 2015 onwards. This gives you nearly 10 years of data — far more than the 60-day window in many short-term models.

**Language editions** — The API supports any Wikipedia language edition. For US-listed stocks with international investor bases, consider pulling both `en.wikipedia` and `zh.wikipedia` (Chinese) or `de.wikipedia` (German) to capture non-US attention.

## References

- Moat, H. S., Curme, C., Avakian, A., Kenett, D. Y., Stanley, H. E., & Preis, T. (2013). Quantifying Wikipedia usage patterns before stock market moves. *Scientific Reports*, 3, 1801.
- Wikimedia Foundation. (2024). Wikimedia REST API. Retrieved from wikimedia.org/api/rest_v1.
