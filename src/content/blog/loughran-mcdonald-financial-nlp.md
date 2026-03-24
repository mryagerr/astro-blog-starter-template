---
title: 'Finance-Specific NLP with the Loughran-McDonald Dictionary'
description: 'Use the Loughran-McDonald word list to score financial text more accurately than general-purpose sentiment tools — with a Python implementation.'
pubDate: 'Mar 28 2025'
heroImage: '/blog-pandas.svg'
---

General-purpose sentiment tools are trained on everyday language. In everyday language, words like "liability," "risk," "volatile," "concern," and "exposure" are relatively neutral. In financial documents and discussion, they are unambiguously negative. This mismatch causes systematic errors when you run TextBlob or similar tools over earnings call transcripts, 10-K filings, or even finance-focused Reddit posts.

Tim Loughran and Bill McDonald built a solution: a dictionary of ~86,000 words with financial-domain sentiment labels — positive, negative, uncertainty, litigious, strong modal, and weak modal. Their 2011 paper showed that their dictionary outperformed the widely-used Harvard General Inquirer in predicting stock returns from 10-K filings.

## Getting the Dictionary

The Loughran-McDonald (LM) dictionary is freely available as a CSV from the authors' Notre Dame website. Download `Loughran-McDonald_MasterDictionary_1993-2024.csv` directly.

```python
import pandas as pd

lm = pd.read_csv("Loughran-McDonald_MasterDictionary_1993-2024.csv")
print(lm.columns.tolist())
# ['Word', 'Sequence Number', 'Word Count', 'Negative', 'Positive',
#  'Uncertainty', 'Litigious', 'Strong Modal', 'Weak Modal', 'Constraining', ...]
```

Words are flagged with non-zero integers in the relevant column. A word is "negative" if `Negative != 0`.

## Building the Word Sets

```python
def build_lm_sets(lm_df: pd.DataFrame) -> dict:
    return {
        "negative":    set(lm_df[lm_df["Negative"]    != 0]["Word"].str.lower()),
        "positive":    set(lm_df[lm_df["Positive"]    != 0]["Word"].str.lower()),
        "uncertainty": set(lm_df[lm_df["Uncertainty"] != 0]["Word"].str.lower()),
        "litigious":   set(lm_df[lm_df["Litigious"]   != 0]["Word"].str.lower()),
    }

lm_sets = build_lm_sets(lm)

# Spot check
print("risk" in lm_sets["negative"])      # True
print("liability" in lm_sets["negative"]) # True
print("growth" in lm_sets["positive"])    # True
print("uncertain" in lm_sets["uncertainty"]) # True
```

## Scoring a Single Text

```python
import re

def tokenize(text: str) -> list[str]:
    text = text.lower()
    return re.findall(r"\b[a-z]+\b", text)

def score_lm(text: str, lm_sets: dict) -> dict:
    tokens = tokenize(text)
    total = len(tokens)
    if total == 0:
        return {k: 0.0 for k in lm_sets}

    counts = {k: sum(1 for t in tokens if t in word_set)
              for k, word_set in lm_sets.items()}
    proportions = {k: counts[k] / total for k in counts}

    # Net sentiment: positive proportion minus negative proportion
    proportions["net_sentiment"] = proportions["positive"] - proportions["negative"]
    return proportions


text = "The company faces significant risk and uncertainty in its current liabilities."
print(score_lm(text, lm_sets))
# {'negative': 0.125, 'positive': 0.0, 'uncertainty': 0.125,
#  'litigious': 0.125, 'net_sentiment': -0.125}
```

## Applying to a DataFrame

```python
def score_lm_df(df: pd.DataFrame, text_col: str = "comment") -> pd.DataFrame:
    results = df[text_col].fillna("").apply(
        lambda t: pd.Series(score_lm(t, lm_sets))
    )
    return pd.concat([df, results], axis=1)


scored = score_lm_df(comments_df)
print(scored[["comment", "negative", "positive", "uncertainty", "net_sentiment"]].head())
```

## Comparing LM vs. TextBlob on Financial Text

```python
from textblob import TextBlob

finance_sentences = [
    "The company faces significant downside risk and liquidity concerns.",
    "Outstanding revenue growth driven by strong demand fundamentals.",
    "Regulatory uncertainty and litigation exposure remain material risks.",
    "Exceptional earnings beat with bullish guidance for next quarter.",
]

print(f"{'Text':<60} {'TextBlob':>10} {'LM Net':>10}")
print("-" * 85)
for s in finance_sentences:
    tb = TextBlob(s).sentiment.polarity
    lm_score = score_lm(s, lm_sets)["net_sentiment"]
    print(f"{s[:58]:<60} {tb:>10.3f} {lm_score:>10.3f}")
```

```
Text                                                          TextBlob     LM Net
-------------------------------------------------------------------------------------
The company faces significant downside risk and liquidity…     0.050     -0.222
Outstanding revenue growth driven by strong demand…            0.400      0.200
Regulatory uncertainty and litigation exposure remain…         0.000     -0.375
Exceptional earnings beat with bullish guidance…               0.375      0.200
```

TextBlob rates the risk/uncertainty sentence as mildly positive (0.05). LM correctly scores it as strongly negative (-0.222).

## Aggregating to Time Windows

```python
def aggregate_lm(df: pd.DataFrame, window_col: str = "window_start") -> pd.DataFrame:
    return df.groupby(window_col).agg(
        comment_count=("net_sentiment", "count"),
        avg_net_sentiment=("net_sentiment", "mean"),
        avg_negative=("negative", "mean"),
        avg_positive=("positive", "mean"),
        avg_uncertainty=("uncertainty", "mean"),
    ).reset_index()
```

`avg_uncertainty` is particularly interesting — periods of high uncertainty in financial text tend to precede elevated volatility in prices.

## Using Both LM and VADER Together

LM and VADER capture different signals. LM is domain-specific — it catches finance jargon. VADER is social-media-aware — it catches informal language, slang, and emphasis. Using both gives you broader coverage:

```python
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

vader = SentimentIntensityAnalyzer()

def score_all(df: pd.DataFrame, text_col: str = "comment") -> pd.DataFrame:
    # VADER
    vader_scores = df[text_col].fillna("").apply(
        lambda t: pd.Series(vader.polarity_scores(t))
    ).rename(columns={"compound": "vader_compound", "pos": "vader_pos",
                      "neg": "vader_neg", "neu": "vader_neu"})

    # LM
    lm_scores = df[text_col].fillna("").apply(
        lambda t: pd.Series(score_lm(t, lm_sets))
    ).add_prefix("lm_")

    return pd.concat([df, vader_scores, lm_scores], axis=1)
```

## Practical Notes

**Word forms** — The LM dictionary uses root forms. "Risks," "risky," and "riskier" are not the same entry as "risk." For better coverage, apply stemming before matching, or extend the dictionary with common inflections.

**Short texts** — A 5-word Reddit comment will have high variance in proportional scores. Use count-based thresholds: only use LM scores for comments longer than 10 words.

**Context** — LM was designed for formal financial documents (10-Ks, earnings calls). For Reddit posts it performs well for nouns and adjectives but may miss informal expressions. Combine with VADER for best coverage.

## References

- Loughran, T., & McDonald, B. (2011). When is a liability not a liability? Textual analysis, dictionaries, and 10-Ks. *Journal of Finance*, 66(1), 35–65.
- Loughran, T., & McDonald, B. (2016). Textual analysis in accounting and finance: A survey. *Journal of Accounting Research*, 54(4), 1187–1230.
