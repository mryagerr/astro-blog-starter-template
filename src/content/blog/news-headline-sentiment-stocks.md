---
title: 'News Headline Sentiment for Stock Prediction'
description: 'Collect financial news headlines with NewsAPI, score them with VADER and the Loughran-McDonald dictionary, and merge the signal into a stock feature set.'
pubDate: 'Mar 30 2025'
heroImage: '/blog-rest-apis.svg'
---

Reddit comments reflect retail investor opinion. News headlines reflect professional information flow — earnings reports, analyst upgrades, regulatory decisions, executive changes. Paul Tetlock's 2007 *Journal of Finance* paper showed that the proportion of negative words in Wall Street Journal columns predicted next-day S&P returns and trading volume. Headlines move faster than forum posts and carry more factual weight.

This article shows how to collect financial headlines from a free API and turn them into features alongside social media signals.

## What You Need

```bash
pip install newsapi-python vaderSentiment pandas
```

Sign up at newsapi.org for a free API key (100 requests/day on the free tier).

## Connecting to NewsAPI

```python
from newsapi import NewsApiClient

NEWS_API_KEY = "your_key_here"
newsapi = NewsApiClient(api_key=NEWS_API_KEY)
```

## Pulling Headlines by Ticker

```python
from datetime import datetime, timedelta
import pandas as pd

def fetch_headlines(query: str, hours_back: int = 2) -> pd.DataFrame:
    from_time = (datetime.utcnow() - timedelta(hours=hours_back)).strftime("%Y-%m-%dT%H:%M:%S")

    response = newsapi.get_everything(
        q=query,
        language="en",
        sort_by="publishedAt",
        from_param=from_time,
        page_size=100,
    )

    articles = response.get("articles", [])
    if not articles:
        return pd.DataFrame()

    records = [{
        "published_at": a["publishedAt"],
        "source":       a["source"]["name"],
        "title":        a["title"],
        "description":  a["description"] or "",
        "query":        query,
    } for a in articles]

    return pd.DataFrame(records)


# Combine title and description for scoring
df = fetch_headlines("Apple stock AAPL", hours_back=2)
df["text"] = df["title"].fillna("") + ". " + df["description"].fillna("")
```

## Scoring Headlines

Headlines are formal English, so a combination of VADER (for emphasis and intensity) and the Loughran-McDonald dictionary (for finance-specific tone) gives the best coverage.

```python
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import re

vader = SentimentIntensityAnalyzer()

# --- VADER ---
def score_vader(df: pd.DataFrame, col: str = "text") -> pd.DataFrame:
    scores = df[col].apply(lambda t: vader.polarity_scores(t))
    df["vader_compound"] = scores.apply(lambda s: s["compound"])
    df["vader_pos"]      = scores.apply(lambda s: s["pos"])
    df["vader_neg"]      = scores.apply(lambda s: s["neg"])
    return df

# --- LM (load dictionary first — see Loughran-McDonald article) ---
def score_lm_simple(text: str, negative_words: set, positive_words: set) -> dict:
    tokens = re.findall(r"\b[a-z]+\b", text.lower())
    total = max(len(tokens), 1)
    neg = sum(1 for t in tokens if t in negative_words) / total
    pos = sum(1 for t in tokens if t in positive_words) / total
    return {"lm_neg": neg, "lm_pos": pos, "lm_net": pos - neg}

def score_lm_df(df: pd.DataFrame, negative_words: set, positive_words: set, col: str = "text") -> pd.DataFrame:
    lm = df[col].apply(lambda t: pd.Series(score_lm_simple(t, negative_words, positive_words)))
    return pd.concat([df, lm], axis=1)
```

## Aggregating Headlines to 30-Minute Windows

```python
def aggregate_headlines(df: pd.DataFrame, freq: str = "30min") -> pd.DataFrame:
    df["published_at"] = pd.to_datetime(df["published_at"], utc=True)
    df = df.set_index("published_at")

    return df.resample(freq).agg(
        headline_count=("vader_compound", "count"),
        avg_vader=("vader_compound", "mean"),
        avg_lm_net=("lm_net", "mean"),
        pct_negative_vader=("vader_compound", lambda x: (x < -0.05).mean()),
        pct_negative_lm=("lm_neg", lambda x: (x > 0.1).mean()),
    ).reset_index()
```

## Collecting Multiple Tickers

```python
import time

TICKER_QUERIES = {
    "AAPL":  "Apple stock AAPL earnings",
    "AMZN":  "Amazon stock AMZN",
    "NVDA":  "Nvidia stock NVDA",
    "TSLA":  "Tesla stock TSLA",
    "GSPC":  "S&P 500 stock market",
}

all_headlines = []
for ticker, query in TICKER_QUERIES.items():
    df = fetch_headlines(query, hours_back=2)
    if df.empty:
        continue
    df["text"] = df["title"].fillna("") + ". " + df["description"].fillna("")
    df = score_vader(df)
    df["ticker"] = ticker
    all_headlines.append(df)
    time.sleep(1)

headlines_df = pd.concat(all_headlines, ignore_index=True)
```

## Free RSS as an Alternative (No API Key)

If you exhaust the NewsAPI free tier, major outlets publish RSS feeds that require no authentication:

```bash
pip install feedparser
```

```python
import feedparser
import pandas as pd

RSS_FEEDS = {
    "reuters":    "https://feeds.reuters.com/reuters/businessNews",
    "marketwatch": "https://feeds.marketwatch.com/marketwatch/topstories/",
    "ap_finance": "https://rsshub.app/apnews/topics/financial-markets",
}

def fetch_rss(feed_url: str, source_name: str) -> pd.DataFrame:
    feed = feedparser.parse(feed_url)
    records = []
    for entry in feed.entries:
        records.append({
            "published_at": entry.get("published", ""),
            "title":        entry.get("title", ""),
            "description":  entry.get("summary", ""),
            "source":       source_name,
            "link":         entry.get("link", ""),
        })
    return pd.DataFrame(records)


rss_frames = [fetch_rss(url, name) for name, url in RSS_FEEDS.items()]
rss_df = pd.concat(rss_frames, ignore_index=True)
rss_df["text"] = rss_df["title"] + ". " + rss_df["description"]
rss_df = score_vader(rss_df)
```

## Filtering for Relevance

Headlines must be filtered to only those relevant to the stock you are predicting. A simple keyword match works for initial filtering:

```python
TICKER_KEYWORDS = {
    "AAPL":  ["apple", "aapl", "iphone", "tim cook"],
    "AMZN":  ["amazon", "amzn", "aws", "jeff bezos", "andy jassy"],
    "TSLA":  ["tesla", "tsla", "elon musk", "electric vehicle"],
}

def filter_relevant(df: pd.DataFrame, ticker: str, keywords: list[str]) -> pd.DataFrame:
    pattern = "|".join(keywords)
    mask = df["text"].str.lower().str.contains(pattern, regex=True, na=False)
    df_filtered = df[mask].copy()
    df_filtered["ticker"] = ticker
    return df_filtered
```

## Merging with Stock Features

```python
stock_df = pd.read_csv("nyse_30min.csv", parse_dates=["datetime"])

news_agg = aggregate_headlines(headlines_df)

merged = stock_df.merge(
    news_agg,
    left_on="datetime",
    right_on="published_at",
    how="left",
)

# Fill windows with no headlines as neutral
merged["avg_vader"]     = merged["avg_vader"].fillna(0)
merged["headline_count"] = merged["headline_count"].fillna(0)
```

## Practical Notes

**Headline vs. body text** — NewsAPI's free tier only returns headlines and descriptions, not full article bodies. This is actually fine for real-time prediction — headlines are available immediately while full articles lag by minutes.

**Duplicate headlines** — Wire services (AP, Reuters) syndicate the same story across hundreds of outlets. Deduplicate on the headline text before aggregating to avoid one story dominating a window.

**Publication lag** — A headline timestamped at 10:32 AM is only available to investors from 10:32 AM onwards. Be careful not to leak future information by aligning headlines to windows where they would not yet have been readable.

## References

- Tetlock, P. C. (2007). Giving content to investor sentiment: The role of media in the stock market. *Journal of Finance*, 62(3), 1139–1168.
- Tetlock, P. C., Saar-Tsechansky, M., & Macskassy, S. (2008). More than words: Quantifying language to measure firms' fundamentals. *Journal of Finance*, 63(3), 1437–1467.
