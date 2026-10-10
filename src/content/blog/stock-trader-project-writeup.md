---
title: 'Building a Stock Prediction Pipeline: What We Did and What We Learned'
description: 'A project retrospective on combining Reddit sentiment, Google Trends, and US large-cap price data to predict short-term stock moves with an SVM classifier.'
pubDate: 'Apr 02 2026'
updatedDate: 'Oct 10 2026'
heroImage: '/blog-stock-prediction.png'
financialDisclaimer: true
---

This is a write-up of the stock prediction project — what we built, what worked, what didn't, and what we'd do differently. The technical how-to lives in the [Articles](/article/) section. This is the version that explains the decisions.

---

## What the Project Was

The starting point was my 2020 master's thesis at Colorado State University Global, *Stock Change Prediction Utilizing Social Media Pools*. It built a support vector machine (SVM) classifier on 30-minute market data and Reddit comment sentiment, predicting the next hour's price change for a set of US large caps and indexes as one of five classes (decline, minor decline, flat, minor growth, growth).

<!-- TODO(michael): SOURCE — Add a link to the thesis (PDF in public/ or an external URL). The thesis also cites github.com/mryagerr/reddit_monitoring_capstone: is that repo public, and should it be linked here? -->

The core hypothesis: Reddit discussion about a stock correlates with near-term price movement. Not because Reddit moves the market directly (most of the time), but because Reddit reflects the same information and mood that traders are already reacting to.

The 10 tickers were: AAPL, AMZN, GOOG, MSFT, TSLA, JPM, NVDA, META, NFLX, and ^VIX as a macro fear gauge.

<!-- TODO(michael): SOURCE — The thesis tracked ^GSPC, ^VIX, AAPL, DIS, TSLA, NFLX, BA, WMT, AMZN and NVDA over Jan 30 to Apr 23, 2020 (no META/FB, GOOG, MSFT or JPM). Is the list above from a later reproduction? If so, say when it was run; if not, replace it with the thesis list. -->

Our goal was to reproduce the pipeline, understand where it was strong and weak, and identify the highest-leverage improvements.

---

## The Data Stack

### Price data

OHLCV data pulled via `yfinance` at 30-minute intervals.

<!-- TODO(michael): SOURCE — yfinance only serves about 60 days of 30-minute history (the thesis used exactly that window). The "3 years of 30-minute data" below can't have come from yfinance alone: was it accumulated with repeated pulls, or from another vendor? --> Stored as Parquet files partitioned by ticker. DuckDB for all analytical queries against the price store — rolling averages, return calculations, the feature join with sentiment data. This was one of the better decisions: keeping the entire analysis layer in SQL made it easy to inspect intermediate results and swap out features without touching Python.

### Reddit sentiment

PRAW to pull posts and comments from finance subreddits (`r/stocks`, `r/investing`, `r/wallstreetbets`). TextBlob for sentiment scoring. Aggregated to 30-minute buckets aligned with the price intervals.

The thesis used TextBlob, whose default scorer is a general-purpose sentiment lexicon. We knew this was a limitation from the start: a word like *liability* or *tax* reads as negative to a general-purpose lexicon but is neutral in financial text. We matched the thesis methodology first before improving it.

### Google Trends

`pytrends` to pull hourly search interest for each ticker name. The Preis et al. (2013) paper showed that increases in finance-related search terms preceded market downturns. We added this as an additional feature column alongside the Reddit sentiment scores.

### Wikipedia page views

Wikimedia REST API for daily page views on each company's Wikipedia article (the per-article API doesn't offer hourly data). Another attention signal — when people are researching a company more than usual, something is happening. No API key required, easy to integrate.

---

## What Worked

**DuckDB for the feature matrix.** The final feature matrix for model training was built in a single SQL query: price data joined with sentiment CSVs, window functions for rolling indicators, `LEAD()` for the target variable (next 30-minute return direction). Handing a clean DataFrame to sklearn from one DuckDB query, with no intermediate files, made iteration fast.

**Partitioned Parquet for price data.** Storing prices as Parquet partitioned by ticker meant that queries filtering to a single stock read only that ticker's files. For 10 tickers over 3 years of 30-minute data, the full dataset fits in under 200MB compressed — fast to query, easy to version.

**Switching TextBlob to VADER.** The first sentiment change was replacing TextBlob with VADER (Hutto & Gilbert, 2014), which is tuned for social media text (slang, capitalization, punctuation, emoji). It improved classification accuracy noticeably without changing anything else in the pipeline, and it was the best reward-for-effort improvement we made. VADER is still a general-purpose lexicon, though, so it doesn't fix the financial-vocabulary problem described below. That needs the Loughran-McDonald dictionary, which we never got to.

<!-- TODO(michael): SOURCE — Add the before/after numbers for the TextBlob → VADER swap (accuracy, majority-class baseline, test-set size), or remove "noticeably" if they aren't available. -->

---

## What Didn't Work

**Reddit as a real-time signal.** The thesis's timing assumption is that Reddit discussions in a 30-minute window predict the price change over the *next hour*. In practice, the lag is noisy. Reddit often reacts *to* price moves rather than predicting them, especially in `r/wallstreetbets`. The Granger causality tests we ran showed weak predictive power in most windows.

<!-- TODO(michael): SOURCE — Add the Granger results (tickers, lags, p-values, period), or soften to what was actually run. -->

**General-purpose sentiment on financial text.** Loughran & McDonald (2011) showed that general-purpose dictionaries misclassify financial language systematically. Almost three-quarters of the words the Harvard dictionary tags as negative, such as *tax*, *cost*, *capital* and *liability*, are not negative in a financial context, so a lexicon built for everyday English sees pessimism in routine financial language. Neither TextBlob nor VADER corrects for that. We should have added a finance-specific lexicon earlier.

**A training window that didn't generalize across regimes.** The SVM trained on 2020–2021 data (high volatility, pandemic-era Reddit frenzy) generalized poorly to 2023–2024 data. The Reddit-price correlation that existed during meme stock mania wasn't there in calmer markets. That is distribution shift (the relationship itself changed between regimes) rather than classic overfitting (memorizing noise in the training set), and more regularization or tuning won't fix it.

---

## What We'd Do Differently

**Start with the signal quality question before building the pipeline.** We spent significant time building the data collection and storage layer before seriously asking: *does Reddit sentiment actually predict 30-minute stock moves?* Running the Granger causality test first would have reframed the project earlier.

**Use the LM financial dictionary from day one.** It's a free CSV download. VADER was the right fix for slang-heavy Reddit text, but for financial vocabulary (and for news headlines, below) LM is the better fit, and there was no good reason to start without it.

**Longer prediction horizons.** 30-minute prediction is hard — the signal-to-noise ratio is terrible at that frequency. The Bollen et al. (2011) paper found predictive power at 2–6 *day* horizons. That's where social sentiment is more likely to add information.

**Add news headlines as a parallel signal.** Tetlock (2007) found that pessimistic language in a daily Wall Street Journal market column predicted next-day downward pressure on prices (followed by a reversal) and unusual trading volume. My expectation, not something we tested, is that professionally written headlines are a less noisy signal than forum posts. `feedparser` against publisher RSS feeds is a low-effort addition (check which publishers still offer them; several major outlets have retired public feeds).

---

## What's Next

The pipeline as built is a good foundation. The parts worth keeping: the Parquet/DuckDB price store, the VADER-based sentiment scoring, and the feature matrix construction pattern.

The parts worth revisiting: the prediction horizon (move from 30 minutes to daily), the sentiment source mix (add headlines, reduce Reddit weight), and the model itself (an SVM with fixed kernel is a reasonable baseline but tree-based models handle the non-linear feature interactions better).

The data sources article covers the full ranked list of what to add next, ordered by integration effort and expected signal quality.
