---
title: 'Building a Stock Prediction Pipeline: What We Did and What We Learned'
description: 'A project retrospective on predicting short-term stock moves from Reddit comment sentiment and 30-minute price data with an SVM classifier: what was built in 2020, what it found, and what a rebuild should change.'
pubDate: 'Apr 02 2026'
updatedDate: 'Oct 10 2026'
heroImage: '/blog-stock-prediction.png'
tags: ['projects', 'analysis']
financialDisclaimer: true
---

This is a write-up of the stock prediction project: what was built, what it found, where the design was weak, and what a rebuild should do differently. The technical how-to lives in the [Articles](/article/) section. This is the version that explains the decisions.

> **A note on numbers.** An earlier version of this write-up described a later multi-year reproduction (different tickers, three years of 30-minute bars, Google Trends and Wikipedia features) along with results from it. Those details couldn't be traced back to a reproducible run, so they have been removed. Everything below comes from the original 2020 project, which is documented in the thesis linked below. A new evaluation is being done and will be written up separately.

---

## What the Project Was

The starting point was Michael Petrillo's 2020 master's thesis at Colorado State University Global, *Stock Change Prediction Utilizing Social Media Pools* ([PDF](/petrillo-2020-thesis.pdf); code at [github.com/mryagerr/reddit_monitoring_capstone](https://github.com/mryagerr/reddit_monitoring_capstone)).

The question was narrow: does adding Reddit comment data to a support vector machine (SVM) classifier improve its accuracy at predicting short-term price changes, compared with the same model trained on price data alone?

- **Universe:** 10 symbols: the S&P 500 index (^GSPC), the VIX (^VIX), AAPL, AMZN, BA, DIS, NFLX, NVDA, TSLA and WMT.
- **Target:** the price change over the *next hour*, bucketed into five classes from −2 to +2 (decline, minor decline, flat, minor growth, growth). "Flat" covered −0.75% to +0.75%.
- **Control:** the same price-derived features with no Reddit data.
- **Experiment:** price features plus comment data from each of several finance subreddits, including r/investing, r/StockMarket and r/wallstreetbets, tested one subreddit (and combination) at a time.

The core hypothesis: Reddit discussion about a stock carries information about near-term price movement, if not because Reddit moves the market, then because it reflects the same information and mood traders are reacting to.

---

## The Data Stack

### Price data

OHLCV data pulled with `yfinance` at 30-minute intervals, from January 30 to April 23, 2020. Yahoo only serves about 60 days of 30-minute history, so that window was the most intraday data available. Features were percentage changes between the current and previous bars (open-to-close deltas and a volume delta) over the trailing hour and a half.

### Reddit comments

PRAW to pull posts, comments and replies from the subreddits, keyed on Reddit's unique IDs so re-runs didn't create duplicates. TextBlob scored each item's polarity and subjectivity. Each comment was also tagged with whether it mentioned one of the 10 symbols and whether it talked about buying or selling.

### Storage and scheduling

A Python 3.7 ETL script, triggered daily by Windows Task Scheduler, wrote everything to a local, password-protected MySQL database. Exploration and charts were done in Tableau.

---

## What the Thesis Found

- Three of the subreddits scored better on average than the price-only control group, so the Reddit data helped somewhat.
- r/StockMarket, one of the *least* active subreddits, gave the best average accuracy. r/wallstreetbets, the most active, gave the worst.
- Reddit data pushed the model to predict non-flat moves. The price-only model mostly predicted "flat", which was the safe bet for accuracy. The r/StockMarket model correctly predicted some negative moves the control model missed.
- No configuration did well on the most volatile symbols: TSLA, the VIX and BA.
- The best-scoring SVM used a polynomial kernel.

---

## Where the Design Was Weak

Looking back, several choices limit how much weight those findings can carry:

**Randomized train/test splits.** The thesis scored the model on scikit-learn's randomized train/test split. On time series, a random split lets the model train on bars from *after* the bars it is tested on, which inflates accuracy. A time-ordered split is the minimum for any result meant to say something about prediction.

**Very little data.** The price data amounted to 1,078 data points over 60 days. That's small for an SVM with this many features, and small enough that differences between subreddits could easily be noise. The thesis itself estimated that a regression model would need roughly 15 years of data at that rate.

**A wide "flat" band.** With ±0.75% counted as flat, most one-hour moves land in the middle class, so a model can score well by rarely predicting anything else.

**General-purpose sentiment.** TextBlob's default scorer is a general-purpose lexicon. Loughran & McDonald (2011) showed that general-purpose dictionaries misclassify financial language systematically: almost three-quarters of the words the Harvard dictionary tags as negative, such as *tax*, *cost*, *capital* and *liability*, are not negative in a financial context.

**Reddit's sampling.** PRAW returns "top" and "hot" listings, not every comment, and scores and reply counts are snapshots taken at pull time.

---

## What a Rebuild Should Change

**Ask the signal-quality question first.** Before building collection and storage, test whether lagged sentiment helps predict returns at all, for example with a Granger causality test on a training period, per ticker. That answer should shape everything after it.

**Use a time-ordered train/validation/test split.** Fit on the past, choose thresholds on a validation slice, and touch the test set once. The [classifier walkthrough](/article/building-a-stock-prediction-svm/) shows the pattern.

**Use a finance-aware lexicon.** VADER (Hutto & Gilbert, 2014) handles social-media text (slang, capitalization, emoji) better than TextBlob, and the Loughran-McDonald word lists handle financial vocabulary. They solve different problems, so it's worth testing both.

**Get more history.** Multi-year 30-minute bars need a different data vendor, or a collector that accumulates yfinance pulls every day going forward.

**Consider longer horizons.** Bollen et al. (2011) reported their Twitter-mood signal at 2–6 *day* horizons. One-hour prediction may simply be too noisy for social sentiment.

**Add parallel signals.** News headline sentiment (Tetlock, 2007, found that pessimistic language in a daily *Wall Street Journal* market column predicted next-day downward pressure on prices, followed by a reversal), Google Trends and Wikipedia page views are all candidates. The [data sources article](/article/low-hanging-data-sources-for-stock-prediction/) ranks them by integration effort and expected signal.

**Store prices as Parquet and query with DuckDB.** Building the feature matrix in one SQL query, as in [DuckDB for Financial Analysis](/article/duckdb-for-financial-analysis/), keeps the transformation logic inspectable and makes it easy to swap features.

---

## What's Next

The 2020 project showed that the plumbing works and hinted that some subreddits carry more signal than others. It didn't establish a usable predictive edge, and its evaluation design couldn't have. The rebuild described above is the way to find out.
