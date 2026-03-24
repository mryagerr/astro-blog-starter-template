---
title: 'Textual Analysis of SEC EDGAR Filings for Stock Signals'
description: 'Use the free SEC EDGAR API to pull 10-K and 10-Q filings, extract risk factor and MD&A sections, and score their tone as a low-frequency stock feature.'
pubDate: 'Mar 31 2025'
heroImage: '/blog-data-collection.svg'
---

Every publicly traded company is required to file 10-K (annual) and 10-Q (quarterly) reports with the SEC. These filings contain management discussion, risk factors, and forward-looking statements — all written by executives who have the most information about the company's prospects. Changes in the tone of these filings correlate with subsequent stock performance.

Loughran and McDonald (2011) showed that the proportion of negative words in 10-K filings predicts stock returns, trading volume, and return volatility in the weeks following the filing. More negative language year-over-year typically precedes underperformance.

The SEC EDGAR API is free, public, and does not require an API key.

## What You Need

```bash
pip install requests pandas beautifulsoup4 lxml
```

## Finding a Company's CIK

Every company has a Central Index Key (CIK) in EDGAR. You can look it up by ticker:

```python
import requests

def get_cik(ticker: str) -> str:
    url = "https://www.sec.gov/files/company_tickers.json"
    headers = {"User-Agent": "research-bot/1.0 (your@email.com)"}
    data = requests.get(url, headers=headers).json()

    for entry in data.values():
        if entry["ticker"].upper() == ticker.upper():
            return str(entry["cik_str"]).zfill(10)

    raise ValueError(f"Ticker {ticker} not found in EDGAR")


cik = get_cik("AAPL")
print(cik)  # 0000320193
```

## Pulling Filing History

```python
def get_filings(cik: str, form_type: str = "10-K") -> list[dict]:
    url = f"https://data.sec.gov/submissions/CIK{cik}.json"
    headers = {"User-Agent": "research-bot/1.0 (your@email.com)"}
    data = requests.get(url, headers=headers).json()

    filings = data["filings"]["recent"]
    results = []

    for i, form in enumerate(filings["form"]):
        if form == form_type:
            results.append({
                "form":         form,
                "filed":        filings["filingDate"][i],
                "accession":    filings["accessionNumber"][i].replace("-", ""),
                "primary_doc":  filings["primaryDocument"][i],
            })

    return results


filings = get_filings(cik, "10-K")
print(filings[:3])
```

## Downloading a Filing

```python
def download_filing(cik: str, accession: str, primary_doc: str) -> str:
    url = f"https://www.sec.gov/Archives/edgar/data/{int(cik)}/{accession}/{primary_doc}"
    headers = {"User-Agent": "research-bot/1.0 (your@email.com)"}
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.text
```

## Extracting Plain Text from HTML Filings

Most modern filings are HTML. Strip the tags to get scorable text:

```python
from bs4 import BeautifulSoup
import re

def extract_text(html: str) -> str:
    soup = BeautifulSoup(html, "lxml")

    # Remove script and style elements
    for tag in soup(["script", "style", "table"]):
        tag.decompose()

    text = soup.get_text(separator=" ")
    # Collapse whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text
```

## Extracting Key Sections

The most signal-rich sections are **Item 1A (Risk Factors)** and **Item 7 (Management's Discussion and Analysis)**. Extract them by searching for their headers:

```python
def extract_section(text: str, start_marker: str, end_marker: str) -> str:
    start = text.lower().find(start_marker.lower())
    if start == -1:
        return ""
    end = text.lower().find(end_marker.lower(), start + len(start_marker))
    if end == -1:
        return text[start:]
    return text[start:end]


raw_html = download_filing(cik, filings[0]["accession"], filings[0]["primary_doc"])
full_text = extract_text(raw_html)

risk_factors = extract_section(full_text, "item 1a", "item 1b")
mda          = extract_section(full_text, "item 7.", "item 7a")
```

## Scoring with the Loughran-McDonald Dictionary

```python
import pandas as pd

lm = pd.read_csv("Loughran-McDonald_MasterDictionary_1993-2024.csv")
negative_words  = set(lm[lm["Negative"]    != 0]["Word"].str.lower())
positive_words  = set(lm[lm["Positive"]    != 0]["Word"].str.lower())
uncertainty_words = set(lm[lm["Uncertainty"] != 0]["Word"].str.lower())

def score_section(text: str) -> dict:
    tokens = re.findall(r"\b[a-z]+\b", text.lower())
    total = max(len(tokens), 1)
    return {
        "word_count":   total,
        "pct_negative": sum(1 for t in tokens if t in negative_words)  / total,
        "pct_positive": sum(1 for t in tokens if t in positive_words)  / total,
        "pct_uncertain": sum(1 for t in tokens if t in uncertainty_words) / total,
        "net_sentiment": (
            sum(1 for t in tokens if t in positive_words) -
            sum(1 for t in tokens if t in negative_words)
        ) / total,
    }


risk_scores = score_section(risk_factors)
mda_scores  = score_section(mda)
print("Risk Factors:", risk_scores)
print("MD&A:", mda_scores)
```

## Building a Feature Table Across Filings

Track how tone changes over time — a year-over-year increase in negativity is the key signal:

```python
def build_filing_features(ticker: str, form_type: str = "10-K") -> pd.DataFrame:
    cik = get_cik(ticker)
    filings = get_filings(cik, form_type)
    rows = []

    for filing in filings[:8]:  # last 8 filings
        html = download_filing(cik, filing["accession"], filing["primary_doc"])
        text = extract_text(html)

        risk = extract_section(text, "item 1a", "item 1b")
        mda  = extract_section(text, "item 7.", "item 7a")

        row = {"ticker": ticker, "filed": filing["filed"], "form": filing["form"]}
        row.update({f"risk_{k}": v for k, v in score_section(risk).items()})
        row.update({f"mda_{k}":  v for k, v in score_section(mda).items()})
        rows.append(row)

        import time; time.sleep(0.5)

    df = pd.DataFrame(rows).sort_values("filed")
    df["risk_neg_yoy"] = df["risk_pct_negative"].pct_change()
    df["mda_neg_yoy"]  = df["mda_pct_negative"].pct_change()
    return df


features = build_filing_features("AAPL", "10-K")
print(features[["filed", "risk_pct_negative", "mda_net_sentiment", "risk_neg_yoy"]])
```

## Using Filing Scores as Features

Because 10-K and 10-Q filings are quarterly or annual, their scores are low-frequency signals. The appropriate way to use them in a model that predicts hourly or daily price changes is to **carry the score forward** until the next filing:

```python
def merge_filing_features(stock_df: pd.DataFrame, filing_df: pd.DataFrame) -> pd.DataFrame:
    filing_df["filed"] = pd.to_datetime(filing_df["filed"])
    stock_df["datetime"] = pd.to_datetime(stock_df["datetime"])

    # Merge-asof: each stock row gets the most recent filing score
    merged = pd.merge_asof(
        stock_df.sort_values("datetime"),
        filing_df.sort_values("filed"),
        left_on="datetime",
        right_on="filed",
        by="ticker",
        direction="backward",
    )
    return merged
```

## Practical Notes

**Rate limiting** — The SEC requests that automated tools make no more than 10 requests per second. Add `time.sleep(0.1)` between requests and always include a descriptive `User-Agent` header.

**Filing formats vary** — Older filings (pre-2010) may be in plain text or SGML rather than HTML. The extraction code above may need adjustments for older filings.

**10-Q vs. 10-K** — 10-Q filings are quarterly and shorter. Use them for more frequent signals. The year-over-year tone comparison works best on 10-Ks where the same sections appear consistently.

**Earnings call transcripts** — Not available through EDGAR, but Seeking Alpha and Motley Fool publish transcripts that can be scraped. These are higher-frequency (quarterly) and even more forward-looking than the filings themselves.

## References

- Loughran, T., & McDonald, B. (2011). When is a liability not a liability? Textual analysis, dictionaries, and 10-Ks. *Journal of Finance*, 66(1), 35–65.
- Loughran, T., & McDonald, B. (2016). Textual analysis in accounting and finance: A survey. *Journal of Accounting Research*, 54(4), 1187–1230.
- U.S. Securities and Exchange Commission. (2024). EDGAR full-text search. Retrieved from efts.sec.gov.
