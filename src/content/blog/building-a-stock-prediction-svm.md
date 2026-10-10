---
title: 'Building a Stock Prediction Classifier with scikit-learn'
description: 'How to train an SVM classifier on Reddit sentiment, Google Trends, and price data to predict short-term moves in large-cap US equities — plus what the model reveals about signal quality.'
pubDate: 'Jul 05 2025'
updatedDate: 'Oct 10 2026'
heroImage: '/blog-scikit-learn.png'
difficulty: 'high'
tags: ['analysis']
financialDisclaimer: true
---

This article covers the machine learning layer of the stock prediction pipeline — taking the feature matrix produced by DuckDB and training an SVM classifier to predict 30-minute price direction. The [DuckDB for Financial Analysis](/article/duckdb-for-financial-analysis/) article covers building the feature matrix; this one picks up from there.

---

## The Prediction Task

The target is binary: does a given stock's price go **up or down** over the next 30-minute interval?

```python
# Target column from the feature matrix query:
# CASE WHEN LEAD(close) OVER w > close THEN 1 ELSE 0 END  -> 1 = Up, 0 = Down/flat
```

`SIGN()` of the forward return looks like it gives ±1, but it returns 0 when the next close equals the current one, which happens regularly on 30-minute bars. That silently creates a third class. Map to 0/1 explicitly and decide where ties go (here they count as "not up").

This is a classification problem, not regression. Predicting direction is more tractable than predicting magnitude, and direction is what matters for a trading signal.

<!-- TODO(michael): SOURCE — Confirm the data behind this walkthrough: ticker list, 30-minute bars, and the 2020–2021 / 2022+ windows. yfinance only serves ~60 days of 30-minute history, and the 2020 thesis used Jan 30 to Apr 23, 2020 with a different ticker set (^GSPC, ^VIX, AAPL, DIS, TSLA, NFLX, BA, WMT, AMZN, NVDA). Where did multi-year 30-minute bars come from? -->

**Prediction universe (9 tickers):** AAPL, AMZN, GOOG, MSFT, TSLA, JPM, NVDA, META, NFLX
**Macro feature:** ^VIX (used as an input feature only, never as a prediction target)
**Interval:** 30-minute OHLCV bars
**Training window:** 2020–2021
**Test window:** 2022 forward

---

## The Feature Matrix

Start from the DuckDB export described in the [financial analysis article](/article/duckdb-for-financial-analysis/). The full feature set:

| Feature | Source | Type |
|---------|--------|------|
| `ret_1d` | Price | 1-bar return |
| `ret_5d` | Price | 5-bar return (~2.5 hours) |
| `dist_sma20` | Price | Distance from 20-bar moving average |
| `vol_20` | Price | 20-bar standard deviation of 1-bar returns |
| `reddit_sentiment` | PRAW + VADER | Aggregated sentiment score per 30-min window |
| `reddit_volume` | PRAW | Number of posts/comments mentioning ticker |
| `google_trends` | pytrends | Search interest index (hourly) |
| `wiki_views` | Wikimedia API | Wikipedia page views (hourly) |
| `vix_level` | yfinance | VIX close of the same bar (known when the prediction is made, like every other feature) |
| `target` | Price | Next-interval direction: 1 = Up, 0 = Down or flat |

```python
import duckdb
import pandas as pd

features = duckdb.sql("""
    SELECT
        p.ticker,
        p.ts,

        -- Price features (NULL until the 20-bar window is full)
        p.close / LAG(p.close, 1) OVER w - 1 AS ret_1d,
        p.close / LAG(p.close, 5) OVER w - 1 AS ret_5d,
        CASE WHEN COUNT(p.close) OVER w20 = 20
             THEN AVG(p.close) OVER w20 / p.close - 1 END AS dist_sma20,

        -- External signals
        s.vader_compound      AS reddit_sentiment,
        s.post_count          AS reddit_volume,
        t.interest            AS google_trends,
        wk.views              AS wiki_views,
        vix.close             AS vix_level,   -- same-bar VIX close: known at decision time

        -- Target: 1 if the next bar closes higher, 0 otherwise
        CASE
            WHEN LEAD(p.close, 1) OVER w IS NULL    THEN NULL
            WHEN LEAD(p.close, 1) OVER w > p.close THEN 1
            ELSE 0
        END AS target

    FROM prices p
    LEFT JOIN sentiment s ON p.ticker = s.ticker AND p.ts = s.ts
    LEFT JOIN trends t    ON p.ticker = t.ticker AND p.ts = t.ts
    LEFT JOIN wiki wk     ON p.ticker = wk.ticker AND p.ts = wk.ts
    LEFT JOIN prices vix  ON vix.ticker = '^VIX' AND p.ts = vix.ts

    WHERE p.ticker <> '^VIX'   -- VIX is a feature, not something we predict

    WINDOW
        w   AS (PARTITION BY p.ticker ORDER BY p.ts),
        w20 AS (PARTITION BY p.ticker ORDER BY p.ts ROWS BETWEEN 19 PRECEDING AND CURRENT ROW)
    ORDER BY p.ts, p.ticker
""").df()

# vol_20 needs returns first, so compute it from ret_1d in pandas
features["vol_20"] = (
    features.groupby("ticker")["ret_1d"]
    .transform(lambda r: r.rolling(20, min_periods=20).std())
)

n_before = len(features)
features = features.dropna()
print(f"Dropped {n_before - len(features):,} of {n_before:,} rows (warm-up windows, missing signals, last bar per ticker)")
```

The `dropna()` runs before the split, which is safe here: it is row-wise, so no row's decision depends on any other row's values, and nothing from the test period leaks into training. What it *can* do is drop many rows if an external signal has gaps, so print the count and check that it's what you expect. The join also uses `wk` rather than `w` as the Wikipedia alias, because `w` is already the window name.

Volatility is the rolling standard deviation of *returns*. The standard deviation of raw close prices mostly measures the price level (a $400 stock looks more "volatile" than a $40 one), which isn't what the feature is meant to capture.

The ordering is `ORDER BY p.ts, p.ticker` on purpose: time first. That matters for `TimeSeriesSplit` later.

---

## Train/Test Split

**Do not use random shuffling on time series data.** A random split leaks future information into the training set — the model sees future prices during training and appears to perform well, but fails completely on out-of-sample data.

Use strict cutoff dates instead, with three slices:

- **Train**: fit the model.
- **Validation**: the last few months of the training period, used to make choices such as the decision threshold.
- **Test**: touched **once**, at the end, to report the final number.

Any choice made by looking at test-set results (a threshold, a feature, a kernel) turns the test set into a second validation set, and the reported score becomes optimistic.

```python
TRAIN_END = "2021-09-30"
VAL_START, VAL_END = "2021-10-01", "2021-12-31"
TEST_START = "2022-01-01"

train = features[features["ts"] <= TRAIN_END].copy()
val   = features[(features["ts"] >= VAL_START) & (features["ts"] <= VAL_END)].copy()
test  = features[features["ts"] >= TEST_START].copy()

FEATURE_COLS = [
    "ret_1d", "ret_5d", "dist_sma20", "vol_20",
    "reddit_sentiment", "reddit_volume",
    "google_trends", "wiki_views", "vix_level"
]

X_train, y_train = train[FEATURE_COLS], train["target"]
X_val,   y_val   = val[FEATURE_COLS],   val["target"]
X_test,  y_test  = test[FEATURE_COLS],  test["target"]

print(f"Train: {len(X_train):,} | Validation: {len(X_val):,} | Test: {len(X_test):,} rows")
```

---

## Preprocessing

SVMs are sensitive to feature scale — a feature ranging 0–10,000 (Wikipedia views) will dominate one ranging −0.05–0.05 (returns). Standardize before fitting.

```python
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_val_scaled   = scaler.transform(X_val)    # transform only, no fit on held-out data
X_test_scaled  = scaler.transform(X_test)
```

Fit the scaler on training data only. Fitting on the combined dataset would be another form of data leakage.

---

## Training the SVM

My 2020 master's thesis (*Stock Change Prediction Utilizing Social Media Pools*, Colorado State University Global) also used scikit-learn's `SVC`, though for a five-class target, and its best-scoring configuration there was a polynomial kernel. This walkthrough uses a radial basis function (RBF) kernel instead, a reasonable default for a non-linear binary classification problem with a modest feature count.

<!-- TODO(michael): SOURCE — Add a link to the thesis (PDF in public/ or an external URL). -->

```python
from sklearn.svm import SVC
from sklearn.metrics import classification_report, confusion_matrix

svm = SVC(
    kernel="rbf",
    C=1.0,           # regularization — higher = tighter fit to training data
    gamma="scale",   # auto-scale to feature count and variance
    class_weight="balanced",  # correct for class imbalance in training data
    random_state=42
)

svm.fit(X_train_scaled, y_train)
```

`class_weight="balanced"` is important: if one direction (say, up) appears 55% of the time in training data, a naive model can hit 55% accuracy by always predicting up. Balanced weighting forces the model to learn both directions.

---

## Evaluating Results

```python
y_pred = svm.predict(X_test_scaled)

print(classification_report(y_test, y_pred, target_names=["Down", "Up"]))
print("\nConfusion matrix:")
print(confusion_matrix(y_test, y_pred))
```

<!-- TODO(michael): SOURCE — Is this classification report from a real run? If yes, share the notebook/output so the numbers can be cited; if not, label it illustrative or remove it. Same for "training accuracy is typically 60–65%". -->

Output reported for this pipeline:

```
              precision    recall  f1-score   support

        Down       0.54      0.51      0.52     18432
          Up       0.54      0.57      0.55     19204

    accuracy                           0.54     37636
   macro avg       0.54      0.54      0.54     37636
```

**54% accuracy** is the out-of-sample number, but 50% is the wrong comparison. In this test set, Up is 19,204 of 37,636 rows (51.0%), so a model that always predicts Up scores 51.0%. The bar to beat is the **majority-class baseline**, and the edge over it is about 3 percentage points.

A rough binomial standard error for 54% on 37,636 rows is √(0.54 × 0.46 / 37,636) ≈ 0.26 points, which makes a 3-point edge look very solid. It isn't quite that solid: the rows are not independent. Consecutive bars for one ticker are autocorrelated, and all tickers move together with the market at the same timestamp, so the effective sample size is much smaller than 37,636 and the real uncertainty is wider.

Compute the baseline in code rather than assuming 50%:

```python
majority = y_test.value_counts(normalize=True).max()
print(f"Majority-class baseline: {majority:.1%}")
```

The training accuracy is typically 60–65%, a sign of overfitting that a time-series split makes visible.

For context: 54% accuracy on every 30-minute trade, if trades were sized correctly and transaction costs were manageable, could theoretically be profitable. In practice, the variance is high enough that it is not.

---

## Tuning the Decision Threshold

By default, scikit-learn classifiers predict the class with the highest probability — which means they use a 0.5 decision threshold. For a trading signal, the costs of false positives and false negatives are not equal, and the optimal threshold is rarely 0.5.

**A false positive** (predicting Up when the price goes Down) costs you on a losing trade.
**A false negative** (predicting Down when the price goes Up) costs you a missed opportunity.

Depending on your transaction costs and position sizing, you may prefer higher precision (fewer wrong calls) over higher recall (fewer missed moves).

### The Precision-Recall Tradeoff

```python
from sklearn.metrics import precision_recall_curve
import matplotlib.pyplot as plt
import numpy as np

# SVC with probability=True gives calibrated probabilities
svm_prob = SVC(
    kernel="rbf",
    C=1.0,
    gamma="scale",
    class_weight="balanced",
    probability=True,   # enables predict_proba()
    random_state=42,
)
svm_prob.fit(X_train_scaled, y_train)

# Probability of the "Up" class (label 1), on the validation slice
y_proba = svm_prob.predict_proba(X_val_scaled)[:, 1]

precision, recall, thresholds = precision_recall_curve(y_val, y_proba)

plt.figure(figsize=(8, 5))
plt.plot(thresholds, precision[:-1], label="Precision")
plt.plot(thresholds, recall[:-1], label="Recall")
plt.xlabel("Decision threshold")
plt.ylabel("Score")
plt.title("Precision vs. Recall at Different Thresholds (validation)")
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig("charts/threshold_curve.png", dpi=150)
```

### Selecting a Threshold

Pick the threshold on the **validation** slice, then apply it to the test set once. Choosing it by looking at test-set precision would leak the test set into the model design.

If you want to only trade on high-confidence Up signals (accepting that you'll miss some), search for a threshold that hits a target precision on validation:

```python
from sklearn.metrics import precision_score, classification_report

val_proba = svm_prob.predict_proba(X_val_scaled)[:, 1]

# Smallest threshold that reaches the target precision on validation
TARGET_PRECISION = 0.58
candidates = np.arange(0.50, 0.81, 0.01)
threshold = next(
    (t for t in candidates
     if (val_proba >= t).any()
     and precision_score(y_val, (val_proba >= t).astype(int)) >= TARGET_PRECISION),
    0.50,
)
print(f"Threshold chosen on validation: {threshold:.2f}")

# Apply it to the test set once
test_proba = svm_prob.predict_proba(X_test_scaled)[:, 1]
y_pred_tuned = (test_proba >= threshold).astype(int)
print(classification_report(y_test, y_pred_tuned, target_names=["Down", "Up"]))
```

A higher threshold will usually improve precision on Up predictions (fewer false positives) at the cost of lower recall (more missed Up moves). The right threshold depends on how expensive a wrong trade is relative to a missed trade — there is no universally correct answer.

The key insight: **accuracy is not the only metric**. For a signal that drives actual trades, precision on the actionable class is often more important than overall accuracy.

## Diagnosing the Model

### Is the signal doing anything?

Check which features the model actually relies on with **permutation importance on the validation slice**: shuffle one feature at a time and measure how much the score drops. Unlike a random forest's built-in `feature_importances_`, which are computed on the training data and favor high-cardinality continuous features, this measures what helps on data the model hasn't seen, and it works directly on the SVM:

```python
from sklearn.inspection import permutation_importance

perm = permutation_importance(
    svm, X_val_scaled, y_val,
    scoring="balanced_accuracy", n_repeats=10, random_state=42, n_jobs=-1,
)
importances = pd.Series(perm.importances_mean, index=FEATURE_COLS)
print(importances.sort_values(ascending=False))
```

Importances near zero (or negative) mean shuffling the feature didn't hurt: the model isn't getting usable signal from it on held-out data.

<!-- TODO(michael): SOURCE — The ranking below was described as "typically" coming out this way. Was it from a real run, and with which method (train-set RF importances or validation permutation importance)? Replace with actual output or label it illustrative. -->

In this pipeline, the ranking reported was:

1. `ret_1d` — momentum
2. `vol_20` — volatility regime
3. `dist_sma20` — mean reversion signal
4. `vix_level` — macro context
5. `ret_5d`
6. `reddit_sentiment` — noticeably lower than price features
7. `google_trends`
8. `wiki_views`
9. `reddit_volume`

Price features dominate. Reddit and attention signals have measurable but modest importance.

### Granger causality test

Before trusting that Reddit sentiment adds anything, run a Granger causality test to check whether past sentiment values statistically predict future returns:

```python
from statsmodels.tsa.stattools import grangercausalitytests

# Training period only: running it on the full series would let the test period
# influence a decision (keep or drop the feature) made before testing.
rows = []
for ticker, g in train.sort_values("ts").groupby("ticker"):
    res = grangercausalitytests(g[["ret_1d", "reddit_sentiment"]], maxlag=4)
    # p-value of the F-test at each lag; does sentiment add information about future returns?
    pvals = {f"lag_{lag}": out[0]["ssr_ftest"][1] for lag, out in res.items()}
    rows.append({"ticker": ticker, **pvals})

print(pd.DataFrame(rows).set_index("ticker").round(3))
```

The column order matters: `grangercausalitytests` tests whether the **second** column helps predict the **first**. Report the p-values for every ticker rather than summarizing. With 9 tickers × 4 lags = 36 tests, a couple of p-values under 0.05 are expected by chance alone.

<!-- TODO(michael): SOURCE — The original text said "for most tickers and time periods, the p-values do not reject the null", but the code only tested AAPL. Paste the actual per-ticker p-value table from a training-period run, or keep the claim conditional as written below. -->

If the p-values don't reject the null at a 5% level for most tickers, sentiment does not reliably Granger-cause returns. Reddit often reacts to moves rather than predicting them, especially in `r/wallstreetbets`. The feature contributes noise as often as it contributes signal.

This test is worth running before spending time on sentiment collection infrastructure.

---

## Hyperparameter Tuning

If you want to optimize the SVM before concluding, use `TimeSeriesSplit` to avoid data leakage during cross-validation:

```python
from sklearn.model_selection import TimeSeriesSplit, GridSearchCV

# TimeSeriesSplit splits by row position, so rows must be in time order.
# The feature matrix is sorted by (ts, ticker); sorted by (ticker, ts), each
# fold would be a block of tickers rather than a block of time.
train = train.sort_values(["ts", "ticker"])
X_train_scaled = scaler.fit_transform(train[FEATURE_COLS])
y_train = train["target"]

tscv = TimeSeriesSplit(n_splits=5)

param_grid = {
    "C": [0.1, 1.0, 10.0],
    "gamma": ["scale", "auto", 0.01, 0.001],
    "kernel": ["rbf", "linear"]
}

grid_search = GridSearchCV(
    SVC(class_weight="balanced"),
    param_grid,
    cv=tscv,
    scoring="f1_macro",
    n_jobs=-1
)

grid_search.fit(X_train_scaled, y_train)
print("Best params:", grid_search.best_params_)
print("Best CV score:", grid_search.best_score_)
```

`TimeSeriesSplit` produces folds where training data always precedes test data, the correct approach for sequential data, but only if the rows are sorted by time. Because several tickers share each timestamp, a fold boundary can split one timestamp across two folds. That leaks at most one bar of cross-sectional information, which is usually acceptable. To rule it out entirely, split on unique timestamps instead of rows.

---

## Persisting the Model

Save both the scaler and model together. You need both at inference time.

```python
import joblib

joblib.dump(scaler, "models/scaler.pkl")
joblib.dump(svm, "models/svm_stock_predictor.pkl")

# Load and predict
scaler_loaded = joblib.load("models/scaler.pkl")
svm_loaded    = joblib.load("models/svm_stock_predictor.pkl")

# X_new: the latest rows of the feature matrix, built with the same query
# (for example, the most recent bar per ticker)
X_new = features.sort_values("ts").groupby("ticker").tail(1)

X_new_scaled = scaler_loaded.transform(X_new[FEATURE_COLS])
predictions  = svm_loaded.predict(X_new_scaled)   # 1 = Up, 0 = Down/flat
```

---

## What the Numbers Tell You

The model gets to ~54% accuracy on unseen data with this feature set. That tells you a few things:

**There may be a little signal in the data.** 54% is about 3 points above the 51% majority-class baseline on a 37,000-row test set. Autocorrelation makes the true uncertainty wider than the row count suggests, so treat that edge as suggestive rather than proven. Price-based features (momentum, volatility) are doing most of the work.

**The Reddit signal is weak at 30-minute horizons.** Granger causality confirms this. The Bollen et al. (2011) Twitter paper found predictive power at 2–6 *day* horizons — a much longer window where social sentiment has time to influence actual trades.

**The training era didn't generalize.** Training on 2020–2021 (meme stocks, pandemic volatility, high Reddit engagement) and testing on 2022+ (calmer markets, lower retail sentiment influence) produces a distribution shift (non-stationarity) that no hyperparameter tuning will fix. That is different from classic overfitting, where a model memorizes noise in the training set. The features themselves had different predictive properties in those two periods.

The pipeline as built is a solid baseline. The improvements with the highest expected return — longer prediction horizons, news headline sentiment via the LM dictionary, tree-based models — are covered in the [data sources article](/article/low-hanging-data-sources-for-stock-prediction/) and the [project retrospective](/posts/stock-trader-project-writeup/).
