---
title: 'Using Twitter Sentiment to Predict Stock Movements'
description: 'Pull finance-related tweets with Tweepy, score their sentiment, and feed the aggregated signal into a stock prediction model.'
pubDate: 'Mar 25 2025'
heroImage: '/blog-rest-apis.svg'
---

In 2011, researchers Johan Bollen, Huina Mao, and Xiao-Jun Zeng published a paper showing that Twitter mood predicted Dow Jones movements 2–6 days in advance with roughly 87% directional accuracy. The core insight is simple: when millions of people express anxiety, uncertainty, or excitement about markets, that collective emotion shows up in prices — often before the price move happens.

This article shows how to collect finance-related tweets, score their sentiment, and aggregate the signal into features for a machine learning model.

## What You Need

```bash
pip install tweepy vaderSentiment pandas
```

You also need a Twitter Developer account and a Bearer Token from the Twitter Developer Portal. The free tier (Basic) gives 10,000 tweet reads per month — enough for research.

## Connecting to the Twitter API v2

```python
import tweepy

BEARER_TOKEN = "your_bearer_token_here"

client = tweepy.Client(bearer_token=BEARER_TOKEN)
```

## Pulling Finance Tweets by Cashtag

Cashtags (`$AAPL`, `$SPY`) are more precise than keywords. Users who write `$AAPL` are almost always talking about Apple stock specifically.

```python
import pandas as pd
from datetime import datetime, timezone, timedelta

def fetch_tweets(cashtag: str, hours_back: int = 1, max_results: int = 100) -> pd.DataFrame:
    end_time = datetime.now(timezone.utc)
    start_time = end_time - timedelta(hours=hours_back)

    response = client.search_recent_tweets(
        query=f"{cashtag} lang:en -is:retweet",
        start_time=start_time,
        end_time=end_time,
        max_results=max_results,
        tweet_fields=["created_at", "public_metrics", "text"],
    )

    if not response.data:
        return pd.DataFrame()

    records = []
    for tweet in response.data:
        records.append({
            "id": tweet.id,
            "text": tweet.text,
            "created_at": tweet.created_at,
            "retweet_count": tweet.public_metrics["retweet_count"],
            "like_count": tweet.public_metrics["like_count"],
            "reply_count": tweet.public_metrics["reply_count"],
            "cashtag": cashtag,
        })

    return pd.DataFrame(records)
```

## Scoring Sentiment with VADER

VADER (Valence Aware Dictionary and sEntiment Reasoner) was designed for social media text. It handles slang, capitalization, punctuation, and emoji better than general-purpose tools like TextBlob.

```python
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

analyzer = SentimentIntensityAnalyzer()

def score_sentiment(df: pd.DataFrame) -> pd.DataFrame:
    scores = df["text"].apply(lambda text: analyzer.polarity_scores(text))
    df["vader_neg"]      = scores.apply(lambda s: s["neg"])
    df["vader_neu"]      = scores.apply(lambda s: s["neu"])
    df["vader_pos"]      = scores.apply(lambda s: s["pos"])
    df["vader_compound"] = scores.apply(lambda s: s["compound"])
    return df
```

The `compound` score runs from -1 (most negative) to +1 (most positive). It is the most useful single feature for downstream ML.

## Aggregating to a Time Window

Your stock data is likely bucketed into 30-minute intervals. Aggregate the tweets to match:

```python
def aggregate_to_window(df: pd.DataFrame, freq: str = "30min") -> pd.DataFrame:
    df["created_at"] = pd.to_datetime(df["created_at"], utc=True)
    df = df.set_index("created_at")

    agg = df.resample(freq).agg(
        tweet_count=("vader_compound", "count"),
        avg_compound=("vader_compound", "mean"),
        avg_pos=("vader_pos", "mean"),
        avg_neg=("vader_neg", "mean"),
        total_likes=("like_count", "sum"),
        total_retweets=("retweet_count", "sum"),
    ).reset_index()

    return agg
```

## Putting It Together

```python
TICKERS = ["$AAPL", "$AMZN", "$NVDA", "$TSLA", "$SPY"]

all_frames = []
for ticker in TICKERS:
    raw = fetch_tweets(ticker, hours_back=2)
    if raw.empty:
        continue
    scored = score_sentiment(raw)
    windowed = aggregate_to_window(scored)
    windowed["ticker"] = ticker
    all_frames.append(windowed)

twitter_features = pd.concat(all_frames, ignore_index=True)
print(twitter_features.head())
```

| created_at | tweet_count | avg_compound | avg_neg | avg_pos | ticker |
|---|---|---|---|---|---|
| 2025-03-25 09:30 | 47 | 0.312 | 0.041 | 0.189 | $AAPL |
| 2025-03-25 10:00 | 61 | -0.108 | 0.134 | 0.091 | $AAPL |

## Merging with Stock Features

```python
stock_df = pd.read_csv("nyse_30min.csv", parse_dates=["datetime"])
stock_df["datetime"] = stock_df["datetime"].dt.tz_localize("UTC")

merged = stock_df.merge(
    twitter_features,
    left_on=["datetime", "ticker"],
    right_on=["created_at", "ticker"],
    how="left",
)

# Fill windows with no tweets with neutral values
merged["avg_compound"] = merged["avg_compound"].fillna(0)
merged["tweet_count"]  = merged["tweet_count"].fillna(0)
```

## Practical Notes

**Rate limits** — The free Twitter API tier limits you to 10,000 reads per month. For continuous collection, run the fetch on a scheduler (cron or GitHub Actions) and store results in a database so you never re-fetch the same window.

**Retweets** — Filter them out (`-is:retweet` in the query). Retweets amplify one piece of content and skew your sentiment distribution without adding new signal.

**Engagement weighting** — Tweets with more likes and retweets carry more community signal. Consider weighting `avg_compound` by `like_count + retweet_count` rather than treating each tweet equally.

**Language** — Add `lang:en` to the query to avoid mixing languages, which confuses the sentiment scorer.

## References

- Bollen, J., Mao, H., & Zeng, X. (2011). Twitter mood predicts the stock market. *Journal of Computational Science*, 2(1), 1–8.
- Hutto, C., & Gilbert, E. (2014). VADER: A parsimonious rule-based model for sentiment analysis of social media text. *Proceedings of ICWSM*.
