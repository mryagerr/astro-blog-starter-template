---
title: 'Using VIX Delta as a Market Fear Feature'
description: 'Go beyond the raw VIX level — compute VIX delta, term structure, and regime flags to build richer fear features for stock prediction models.'
pubDate: 'Apr 01 2025'
heroImage: '/blog-pandas.svg'
---

The VIX — the CBOE Volatility Index — measures expected 30-day volatility in the S&P 500 derived from options prices. A high VIX means the market expects large swings. A low VIX means the market is calm.

Using VIX as a raw price feature in a model is a reasonable start, but the *change* in VIX often carries more predictive signal than the level. Whaley (2009) showed that sudden VIX spikes are strongly associated with subsequent mean-reverting moves in the S&P 500. The market tends to overshoot fear, then recover.

This article shows how to compute several VIX-based features from existing Yahoo Finance data — most of which require only a one-line addition to an existing data pipeline.

## What You Need

```bash
pip install yfinance pandas numpy
```

## Pulling VIX Data

```python
import yfinance as yf
import pandas as pd

vix = yf.download("^VIX", period="6mo", interval="30m")
vix = vix[["Open", "High", "Low", "Close", "Volume"]].copy()
vix.columns = ["vix_open", "vix_high", "vix_low", "vix_close", "vix_volume"]
vix.index.name = "datetime"
print(vix.head())
```

## Feature 1: VIX Delta (Period-Over-Period Change)

The most basic enhancement — how much did VIX move in the last interval?

```python
vix["vix_delta"] = vix["vix_close"].diff()
vix["vix_pct_change"] = vix["vix_close"].pct_change()
```

A sudden spike of 5+ points in `vix_delta` within a single 30-minute window is a high-signal event. The pure level of VIX (e.g., 25 vs. 26) is less informative than an unexpected jump.

## Feature 2: Rolling Z-Score

Contextualize the current VIX level against recent history. A VIX of 25 means something very different in a calm market where 15 is normal vs. a volatile market where 35 is normal:

```python
WINDOW = 20  # 20 intervals = ~10 hours of trading

vix["vix_rolling_mean"] = vix["vix_close"].rolling(WINDOW).mean()
vix["vix_rolling_std"]  = vix["vix_close"].rolling(WINDOW).std()
vix["vix_zscore"] = (
    (vix["vix_close"] - vix["vix_rolling_mean"])
    / (vix["vix_rolling_std"] + 1e-6)
)
```

`vix_zscore` is scale-invariant — it tells the model whether the current fear level is elevated relative to recent norms, regardless of the absolute level.

## Feature 3: VIX Regime Flag

Classification models benefit from explicit regime labels. Define three regimes:

```python
import numpy as np

def vix_regime(vix_level: float) -> int:
    if vix_level < 15:
        return 0   # low fear / complacency
    elif vix_level < 25:
        return 1   # moderate concern
    elif vix_level < 35:
        return 2   # elevated fear
    else:
        return 3   # panic


vix["vix_regime"] = vix["vix_close"].apply(vix_regime)
```

These thresholds are based on historical VIX behavior — below 15 is historically calm, above 35 is crisis territory (COVID crash, GFC, etc.).

## Feature 4: VIX Spike Flag

Flag windows where VIX jumped unusually fast — these are often the most actionable moments:

```python
SPIKE_THRESHOLD = 2.0  # standard deviations

vix["vix_spike"] = (vix["vix_zscore"] > SPIKE_THRESHOLD).astype(int)
vix["vix_crash"] = (vix["vix_zscore"] < -SPIKE_THRESHOLD).astype(int)  # sudden calm
```

## Feature 5: Intraday VIX Range

The spread between the high and low VIX within a 30-minute window captures uncertainty about uncertainty:

```python
vix["vix_intraday_range"] = vix["vix_high"] - vix["vix_low"]
vix["vix_range_pct"] = vix["vix_intraday_range"] / vix["vix_close"]
```

A high `vix_range_pct` means the market oscillated rapidly in its fear assessment within that window — a sign of indecision.

## Feature 6: VIX vs. Realized Volatility (VRP)

The Volatility Risk Premium (VRP) is the difference between implied volatility (VIX) and realized volatility (actual price swings). When implied volatility exceeds realized, sellers of options (and therefore market makers) are paid a premium. When realized exceeds implied, it signals an unexpected shock:

```python
spy = yf.download("SPY", period="6mo", interval="30m")["Close"]

realized_vol = spy.pct_change().rolling(20).std() * (252 * 13) ** 0.5 * 100
# Annualized: sqrt(252 trading days * 13 half-hour intervals per day) * 100

vix["spy_realized_vol"] = realized_vol.values[:len(vix)]
vix["vrp"] = vix["vix_close"] - vix["spy_realized_vol"]
```

Positive VRP (VIX > realized) is the normal state. Negative VRP often precedes volatility spikes.

## Putting All Features Together

```python
def build_vix_features(period: str = "6mo", interval: str = "30m") -> pd.DataFrame:
    vix = yf.download("^VIX", period=period, interval=interval)
    vix = vix[["Open", "High", "Low", "Close"]].copy()
    vix.columns = ["vix_open", "vix_high", "vix_low", "vix_close"]

    vix["vix_delta"]         = vix["vix_close"].diff()
    vix["vix_pct_change"]    = vix["vix_close"].pct_change()
    vix["vix_rolling_mean"]  = vix["vix_close"].rolling(20).mean()
    vix["vix_rolling_std"]   = vix["vix_close"].rolling(20).std()
    vix["vix_zscore"]        = (vix["vix_close"] - vix["vix_rolling_mean"]) / (vix["vix_rolling_std"] + 1e-6)
    vix["vix_regime"]        = vix["vix_close"].apply(vix_regime)
    vix["vix_spike"]         = (vix["vix_zscore"] >  2.0).astype(int)
    vix["vix_crash"]         = (vix["vix_zscore"] < -2.0).astype(int)
    vix["vix_intraday_range"] = vix["vix_high"] - vix["vix_low"]

    return vix.drop(columns=["vix_open", "vix_high", "vix_low"])


vix_features = build_vix_features()
```

## Merging with Stock Features

```python
stock_df = pd.read_csv("nyse_30min.csv", parse_dates=["datetime"])
stock_df = stock_df.set_index("datetime")

merged = stock_df.join(vix_features, how="left")
merged = merged.fillna(method="ffill")  # forward-fill any gaps
```

## What These Features Add to a Model

| Feature | What It Captures |
|---|---|
| `vix_delta` | Momentum in fear — is fear rising or falling? |
| `vix_zscore` | Whether current fear is unusual given recent context |
| `vix_regime` | Market state label — calm / concern / fear / panic |
| `vix_spike` | Binary flag for sudden fear events |
| `vix_intraday_range` | Uncertainty about uncertainty within the window |
| `vrp` | Whether implied volatility is over- or under-pricing actual moves |

In a Support Vector Machine model, regime flags and z-scores give the classifier context about *what kind* of market environment it is operating in — information that pure price metrics do not provide.

## Practical Notes

**VIX is not tradeable directly** — VIX measures S&P 500 implied volatility. It cannot be traded directly; instruments like VIX futures and VXX ETF have significant roll costs that make them behave differently from spot VIX. For prediction features, spot VIX is what you want.

**Overnight gaps** — VIX can gap significantly at market open due to overnight events. The first 30-minute interval of the day often has the largest `vix_delta`. Consider adding an `is_market_open` flag or treating the opening interval separately.

**Intraday seasonality** — VIX is systematically higher near market open and close. This creates a daily pattern that can confuse a model if not accounted for. Add `hour_of_day` as a feature or normalize VIX within each hour across the dataset.

## References

- Whaley, R. E. (2009). Understanding the VIX. *Journal of Portfolio Management*, 35(3), 98–105.
- Simon, D. P. (2003). The Nasdaq volatility index during and after the bubble. *Journal of Derivatives*, 11(2), 9–24.
