---
title: 'The Age of Free Web Scraping Is Over'
description: 'Reddit killed its free API. Pushshift is gone. Web scraping is increasingly blocked, litigated, or paywalled. What this means for data projects that assumed free access.'
pubDate: 'Mar 26 2026'
---

When we built the stock prediction pipeline, one of the core data sources was Reddit. PRAW — the Python Reddit API Wrapper — made it straightforward: a few lines of code, a free developer account, and you had access to posts and comments from any subreddit going back years. It felt like it would always be there.

It isn't anymore.

---

## What Happened to Reddit

In June 2023, Reddit announced it was moving its API to a paid model. The free tier was gutted: rate limits that made real data collection impractical, and a pricing structure that cost third-party apps and researchers hundreds of thousands of dollars per year to maintain their existing usage.

The backlash was significant. Thousands of subreddits went dark in protest. Apollo, one of the most popular third-party Reddit clients, shut down rather than pay. Reddit's CEO gave interviews that made clear the policy wasn't changing.

The practical result: any project that relied on pulling Reddit data at scale — for research, for ML pipelines, for anything — was broken or priced out overnight.

But Reddit wasn't the only thing that died.

**Pushshift** — the archival service that had indexed every Reddit post and comment since 2011 and made it available for free to researchers — was also shut down, first suspended by Reddit and then effectively ended. Years of bulk historical data that researchers had relied on for NLP and social science work: gone.

---

## This Isn't Just Reddit

Reddit's API lockdown is the loudest example, but the pattern is everywhere:

**Twitter/X** killed free API access in early 2023. The Basic tier is $100/month for read-only access to 10,000 tweets. The tier that actually supports research-level collection is thousands of dollars per month. The Bollen et al. (2011) paper — the one showing Twitter mood predicts the Dow — was built on data that you simply cannot collect for free anymore.

**LinkedIn** has aggressively litigated scraping, including a successful (then partially reversed) case against hiQ Labs that established that even publicly visible data can be protected from automated collection under the CFAA.

**Google Trends** via `pytrends` still works, but it's an unofficial library hitting an API Google never meant to expose. It breaks periodically. There is no SLA, no documentation, and no guarantee it works next month.

**Wikipedia page views** remain genuinely free and open via the Wikimedia REST API — a rare exception, and worth appreciating as such.

News headline APIs — `newsapi.org` and others — have tightened their free tiers. What was 1,000 requests/day is now 100. Historical access, which you need for training data, requires paid plans.

The era when you could build a meaningful data pipeline out of free public APIs and a Python script was a specific window in internet history. That window is mostly closed.

---

## What This Means for the Stock Pipeline

The data sources article on this site ranked Reddit sentiment as a medium-effort, medium-return addition. That ranking assumed free access. Under the current API pricing, Reddit collection at research scale is a cost decision, not a technical one.

More practically: the stock prediction pipeline we built was trained on Reddit data from 2020–2022. Collecting an equivalent dataset today would require either:

1. Paying for API access at a tier that supports bulk collection
2. Using a third-party data vendor that has already paid and resells cleaned Reddit data
3. Finding a different signal entirely

Option 3 is probably the right answer for a personal or research project. The Granger causality tests showed Reddit sentiment had weak predictive power for 30-minute stock moves anyway. The signal-to-cost ratio is poor.

---

## What's Actually Still Free

Not everything is locked down. The genuinely free, stable, and well-documented sources:

- **SEC EDGAR** — All public filings, full-text search, REST API, no key required. This is government data and it's staying free.
- **Wikimedia REST API** — Page views, article revisions, free and open. The Moat et al. (2013) attention signal still works.
- **FRED (Federal Reserve Economic Data)** — Macroeconomic indicators, interest rates, employment data. Free API, generous rate limits.
- **Yahoo Finance via `yfinance`** — Still works, still free, still unofficial. Has broken before and will break again.
- **EDGAR full-text search** — `https://efts.sec.gov/LATEST/search-index?q=...` — free keyword search across all filings.
- **RSS feeds** — Reuters, AP, MarketWatch, Bloomberg (limited). `feedparser` still works. This is probably the best free path to headline sentiment data now that NewsAPI's free tier is hobbled.

---

## The Broader Lesson

The assumption baked into a lot of data projects — that public-facing platforms would stay freely accessible because they always had been — was never a guarantee. It was a business model that lasted until it didn't.

Platforms tolerated scrapers and API usage when they needed developers to build on top of them. Once the platforms were large enough to monetize the data directly, or once they needed to cut costs, free access was the first thing to go.

For anyone building a data project today: design around data sources you control or that have stable, paid, contractual access. Free APIs are a liability disguised as an asset. They work until they don't, and they often don't when you need them most — like when you're mid-project and the training set you were building is now behind a paywall.

The stock pipeline would have been designed differently if we'd assumed from the start that Reddit access would cost money. The architecture is still sound. The specific data dependency was a mistake.
