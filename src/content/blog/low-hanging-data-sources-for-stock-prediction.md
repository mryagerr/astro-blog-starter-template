---
title: 'Low-Hanging Data Sources for Stock Market Prediction'
description: 'A curated list of freely accessible data sources and their supporting research literature for augmenting stock prediction models — starting with the easiest wins.'
pubDate: 'Mar 24 2025'
updatedDate: 'Oct 10 2026'
heroImage: '/blog-stock-data-sources.png'
difficulty: 'high'
tags: ['collection', 'analysis']
financialDisclaimer: true
---

When building a machine learning model for short-term stock prediction, as in Michael Petrillo's 2020 master's thesis (*Stock Change Prediction Utilizing Social Media Pools*, [PDF](/petrillo-2020-thesis.pdf)), the biggest gains often come from adding more signal before tuning model parameters. The sources below are accessible with Python libraries or APIs, and each is paired with published research (peer-reviewed papers, plus that thesis, which is not peer-reviewed, where it's referenced). They are ordered to match the priority ranking at the end, which weighs integration effort against expected lift.

---

## 1. Replacing TextBlob with Finance-Specific NLP

**Core reference:** Loughran, T., & McDonald, B. (2011). *When is a liability not a liability? Textual analysis, dictionaries, and 10-Ks.* Journal of Finance, 66(1), 35–65.

The 2020 thesis used TextBlob for sentiment analysis. TextBlob's default scorer is a general-purpose lexicon, not one built for financial language. Loughran and McDonald's central finding is that general-purpose dictionaries misfire on financial text: almost three-quarters of the words the widely used Harvard dictionary classifies as negative (words like *tax*, *cost*, *capital* and *liability*) are not negative in a financial context. A 10-K that discusses "tax liability" isn't expressing pessimism. The Loughran-McDonald (LM) dictionary was purpose-built for financial documents, with separate negative, positive, uncertainty and litigious word lists.

**Why it's low-hanging:** The LM dictionary is freely downloadable as a CSV. Integrating it is a drop-in replacement — load the word lists, score each Reddit comment against them, and replace the `polarity` column.

**Also consider:** VADER (Hutto, C. & Gilbert, E., 2014. *VADER: A parsimonious rule-based model for sentiment analysis of social media text.* ICWSM.) — optimized for social media text, handles slang, caps, and punctuation weighting better than TextBlob. Available via `pip install vaderSentiment`.

---

## 2. Google Trends

**Core reference:** Preis, T., Moat, H. S., & Stanley, H. E. (2013). *Quantifying trading behavior in financial markets using Google Trends.* Scientific Reports, 3, 1684.

The researchers found that increases in Google search volume for finance-related terms (e.g., "debt," "portfolio," "stocks") preceded market downturns. The signal is an attention indicator — when more people are searching for a term, it reflects rising concern or interest before it materializes in price action.

**Why it's low-hanging:** Google Trends data is free to view, and the `pytrends` library pulls it into Python with no API key. Note that `pytrends` is an unofficial, third-party library, not a Google product: it scrapes the Trends website, so it can break when Google changes the site and it is frequently rate-limited (HTTP 429). Cache everything you pull. The data aligns naturally with the 30-minute interval structure since Trends can be queried at hourly granularity for recent periods.

```python
from pytrends.request import TrendReq

pytrends = TrendReq()
pytrends.build_payload(["stocks", "recession", "buy stocks"], timeframe="now 7-d")
df = pytrends.interest_over_time()
```

**Integration tip:** Query ticker-specific terms (`"Apple stock"`, `"NVDA"`) alongside broad fear terms (`"market crash"`) to get both stock-level and macro-level signals.

---

## 3. Wikipedia Page Traffic

**Core reference:** Moat, H. S., Curme, C., Avakian, A., Kenett, D. Y., Stanley, H. E., & Preis, T. (2013). *Quantifying Wikipedia usage patterns before stock market moves.* Scientific Reports, 3, 1801.

Wikipedia page view counts for company articles and financial concepts were shown to precede stock price changes — when view counts for a stock's Wikipedia page spike, a price move (typically downward) follows within weeks. It captures a different form of attention than search volume: deeper research intent rather than casual curiosity.

**Why it's low-hanging:** The Wikimedia REST API is fully public and requires no key. The per-article endpoint returns **daily** or **monthly** page views only. Hourly page views exist, but only in the bulk pageview dump files, which you download and parse yourself.

```python
import requests

url = "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia.org/all-access/all-agents/Apple_Inc./daily/2020010100/2020042300"
# Wikimedia's API policy requires a descriptive User-Agent with contact info;
# requests with generic or missing agents can be blocked.
headers = {"User-Agent": "stock-research/0.1 (you@example.com)"}
response = requests.get(url, headers=headers, timeout=30)
response.raise_for_status()
data = response.json()["items"]   # one dict per day: {"timestamp": ..., "views": ...}
```

**Integration tip:** Pull views for each of the 10 ticker company pages (Apple Inc., Amazon, Tesla, etc.) and use the delta in views as a feature alongside the existing Reddit metrics.

---

## 4. Financial News Headline Sentiment

**Core reference:** Tetlock, P. C. (2007). *Giving content to investor sentiment: The role of media in the stock market.* Journal of Finance, 62(3), 1139–1168.

Tetlock found that high media pessimism (the fraction of negative words in the Wall Street Journal's "Abreast of the Market" column) predicted downward pressure on next-day market prices followed by a reversal, and that unusually high or low pessimism predicted high trading volume. Separately from Tetlock's finding, professionally written headlines are arguably a less noisy signal than forum posts; that is an editorial judgment here, not a tested result.

**Why it's low-hanging:** `newsapi.org` offers a free developer tier with keyword search over article headlines and descriptions. It does not return full article text (content is truncated), and as of October 2026 the free tier was limited to about 100 requests per day, delayed results, a short look-back window, and non-production use. The `feedparser` library can also pull publishers' RSS feeds without authentication, where feeds are still offered.

<!-- TODO(michael): SOURCE — Re-verify NewsAPI free-tier limits (requests/day, delay, look-back, production use) against newsapi.org/pricing and confirm which publisher RSS feeds (Reuters, AP, MarketWatch) still exist. -->

```python
from newsapi import NewsApiClient

newsapi = NewsApiClient(api_key="YOUR_KEY")
articles = newsapi.get_everything(q="Apple stock", language="en", sort_by="publishedAt")
```

**Integration tip:** Score headlines with the LM dictionary (see above) and aggregate by ticker within each 30-minute window to create a `headline_sentiment` feature that runs parallel to the Reddit sentiment features.

---

## 5. Twitter / X Sentiment

**Core reference:** Bollen, J., Mao, H., & Zeng, X. (2011). *Twitter mood predicts the stock market.* Journal of Computational Science, 2(1), 1–8.

One of the most cited papers in computational finance. The authors ran Granger causality tests between Twitter mood scores (calm, alert, sure, vital, kind, happy) and the Dow Jones Industrial Average — finding that certain mood dimensions predicted market moves 2–6 days out with ~87% accuracy. That figure needs context: it is the accuracy of predicting the daily up/down direction of the DJIA *index* (not individual stocks), over a short test window of a few weeks in December 2008, and later replication attempts have not found an effect of that size.

<!-- TODO(michael): SOURCE — Add a citation for a replication attempt. Candidate to confirm: Lachanski, M., & Pav, S. (2017), "Shy of the Character Limit: 'Twitter Mood Predicts the Stock Market' Revisited," Econ Journal Watch 14(3). --> The methodology maps directly onto a Reddit-based pipeline: replace PRAW with the Twitter API v2, swap subreddits for finance-adjacent hashtags or accounts, and feed the sentiment scores into the same SVM feature set.

**Why it's no longer low-hanging:** The `tweepy` Python library mirrors PRAW in structure, but API access changed in 2023. X's free tier is now essentially write-only (posting, no meaningful read or search access), and reading tweets requires a paid tier: Basic launched at $100/month in 2023 with tight monthly read caps, and prices have risen since. For research on a budget, this source has moved from "easy" to "expensive".

<!-- TODO(michael): SOURCE — Re-verify current X API tiers and pricing (developer.x.com) and add the date checked. -->

**Integration tip:** Filter by cashtags (`$AAPL`, `$SPY`) rather than keywords to reduce noise and match the stock-specific focus of the existing model.

---

## 6. VIX and Macro Fear Indicators

**Already in the dataset:** the 2020 thesis includes `^VIX` as one of the 10 tracked symbols. The research below supports expanding how it is used:

**Core reference:** Whaley, R. E. (2009). *Understanding the VIX.* Journal of Portfolio Management, 35(3), 98–105.

Rather than using VIX as a raw price level, computing the **VIX delta** (day-over-day change) and the **VIX term structure** (short vs. long dated implied volatility) provides richer features. Rapid VIX spikes are systematically associated with mean-reverting moves in the S&P 500.

**Integration tip:** Add `vix_delta` as a feature alongside the existing `^VIX` price — this is a one-line change to the existing NYSE metrics pipeline.

---

## 7. SEC EDGAR Filings

**Core reference:** Loughran, T., & McDonald, B. (2016). *Textual analysis in accounting and finance: A survey.* Journal of Accounting Research, 54(4), 1187–1230.

10-K and 10-Q filings contain forward-looking statements, risk factors, and management discussion sections that carry predictive content. Changes in the tone of these filings — more negative language year-over-year — correlate with subsequent stock underperformance.

**Why it's (mostly) low-hanging:** SEC EDGAR is a free, public API, though the SEC asks for a `User-Agent` that identifies you (name and email) and limits request rates. Third-party wrappers exist, but the raw endpoints are simple enough to call directly. This source is lower-frequency (quarterly) so it serves as a baseline feature rather than a real-time signal.

The submissions endpoint returns filing **metadata** (form types, dates, accession numbers, document names), not the filing text. Getting the 10-K itself takes a second request to the EDGAR archive:

```python
import requests

HEADERS = {"User-Agent": "Your Name you@example.com"}  # SEC requires identification
CIK = "0000320193"  # Apple

resp = requests.get(f"https://data.sec.gov/submissions/CIK{CIK}.json", headers=HEADERS, timeout=30)
resp.raise_for_status()
recent = resp.json()["filings"]["recent"]

# Find the most recent 10-K in the metadata
i = recent["form"].index("10-K")
accession = recent["accessionNumber"][i].replace("-", "")
document = recent["primaryDocument"][i]

# Second request: the filing document itself (HTML)
doc_url = f"https://www.sec.gov/Archives/edgar/data/{int(CIK)}/{accession}/{document}"
filing_html = requests.get(doc_url, headers=HEADERS, timeout=30).text
```

From there, strip the HTML and score the risk-factor and MD&A sections with the LM word lists.

---

## Priority Ranking for Implementation

| Priority | Source | Effort | Expected Lift |
|----------|--------|--------|---------------|
| 1 | VADER replacement for TextBlob | Low — `pip install` swap | Medium — better social text scoring |
| 2 | Google Trends (`pytrends`) | Low — no API key (unofficial library) | Documented association (single study) |
| 3 | Wikipedia page views | Low — no API key (daily granularity) | Medium — attention signal |
| 4 | LM Financial Dictionary | Low — CSV download | High — finance-specific NLP |
| 5 | News headlines (`newsapi`) | Medium — free key needed | High — professional signal |
| 6 | Twitter/X (`tweepy`) | High — paid API tier for read access | High — real-time sentiment |
| 7 | VIX delta feature | Trivial — existing data | Low-Medium — refinement |
| 8 | SEC EDGAR filings | High — parsing complexity | Medium — low-frequency signal |

## Aligning Different Frequencies

These sources don't share a clock. Price bars may be 30-minute, Google Trends hourly (for recent windows), Wikipedia daily, filings quarterly. Joining them on an exact timestamp (`p.ts = w.ts`) silently produces `NULL` for most rows of the slower sources.

The fix is an **as-of join**: for each price bar, take the most recent value of each slower signal that was *already available* at that bar. DuckDB supports this directly:

```sql
SELECT p.ticker, p.ts, p.close, w.views AS wiki_views_prev_day
FROM prices p
ASOF LEFT JOIN wiki_daily w
    ON p.ticker = w.ticker
   AND p.ts >= w.available_at
```

Define `available_at` as when the value could actually have been known, not the period it describes. A day's Wikipedia total isn't complete until that day ends, so for daily views set `available_at = date + INTERVAL 1 DAY`. Otherwise a 10:00 bar would "see" the full day's views, which is look-ahead.

---

## References

- Bollen, J., Mao, H., & Zeng, X. (2011). Twitter mood predicts the stock market. *Journal of Computational Science*, 2(1), 1–8.
- Hutto, C., & Gilbert, E. (2014). VADER: A parsimonious rule-based model for sentiment analysis of social media text. *Proceedings of ICWSM*.
- Loughran, T., & McDonald, B. (2011). When is a liability not a liability? Textual analysis, dictionaries, and 10-Ks. *Journal of Finance*, 66(1), 35–65.
- Loughran, T., & McDonald, B. (2016). Textual analysis in accounting and finance: A survey. *Journal of Accounting Research*, 54(4), 1187–1230.
- Moat, H. S., Curme, C., Avakian, A., Kenett, D. Y., Stanley, H. E., & Preis, T. (2013). Quantifying Wikipedia usage patterns before stock market moves. *Scientific Reports*, 3, 1801.
- Petrillo, M. (2020). *Stock change prediction utilizing social media pools* [Master's thesis, not peer-reviewed]. Colorado State University – Global Campus.
- Preis, T., Moat, H. S., & Stanley, H. E. (2013). Quantifying trading behavior in financial markets using Google Trends. *Scientific Reports*, 3, 1684.
- Tetlock, P. C. (2007). Giving content to investor sentiment: The role of media in the stock market. *Journal of Finance*, 62(3), 1139–1168.
- Whaley, R. E. (2009). Understanding the VIX. *Journal of Portfolio Management*, 35(3), 98–105.

---

## Related Articles

- **[DuckDB for Financial Data Analysis](/article/duckdb-for-financial-analysis/)** — Storing and querying the market data these sources generate, without spinning up a full database server.
- **[Pulling Data from REST APIs](/article/pulling-data-from-apis/)** — The underlying patterns for fetching paginated data, handling rate limits, and saving raw responses.
- **[Building a Stock Prediction Classifier with scikit-learn](/article/building-a-stock-prediction-svm/)** — Putting these data sources to work in an actual prediction model.
