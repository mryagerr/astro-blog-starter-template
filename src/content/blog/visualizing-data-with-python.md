---
title: 'Visualizing Data with Python'
description: 'Turn raw numbers into charts that reveal patterns — using matplotlib, seaborn, and plotly for static and interactive visualizations.'
pubDate: 'Mar 25 2025'
heroImage: '/blog-pandas.svg'
difficulty: 'low'
---

Numbers in a spreadsheet hide their patterns. A well-chosen chart reveals them instantly. Visualization is not decoration — it is the fastest way to find outliers, understand distributions, and communicate findings. This article covers the three Python libraries that cover most visualization needs, and when to use each.

## The Three Libraries

| Library | Best for | Output |
|---------|----------|--------|
| **matplotlib** | Full control, publication figures, subplots | Static image |
| **seaborn** | Statistical plots, clean defaults | Static image |
| **plotly** | Interactive charts, dashboards, web embedding | Interactive HTML |

Install them:

```bash
pip install matplotlib seaborn plotly pandas
```

Most data work starts with seaborn for quick exploration and graduates to plotly when you need interactivity or matplotlib when you need precise control.

## matplotlib: The Foundation

Everything in Python visualization ultimately runs on matplotlib. Knowing the basics prevents confusion when seaborn or pandas charts behave unexpectedly.

### The Figure/Axes Model

```python
import matplotlib.pyplot as plt
import pandas as pd

df = pd.read_csv("data/cleaned/prices.csv", parse_dates=["date"])

fig, ax = plt.subplots(figsize=(12, 5))

ax.plot(df["date"], df["close"], linewidth=1.5, color="#2563eb", label="Close")
ax.set_title("AAPL Daily Close Price", fontsize=14)
ax.set_xlabel("Date")
ax.set_ylabel("Price (USD)")
ax.legend()
ax.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig("charts/aapl_close.png", dpi=150)
plt.show()
```

`fig` is the whole figure window. `ax` is the plot area inside it. Most customization happens on the `ax` object.

### Multiple Subplots

```python
fig, axes = plt.subplots(2, 2, figsize=(14, 8))
axes = axes.flatten()

tickers = ["AAPL", "MSFT", "GOOG", "AMZN"]
for i, ticker in enumerate(tickers):
    subset = df[df["ticker"] == ticker]
    axes[i].plot(subset["date"], subset["close"])
    axes[i].set_title(ticker)
    axes[i].grid(True, alpha=0.3)

plt.suptitle("Close Prices", fontsize=16)
plt.tight_layout()
plt.savefig("charts/grid.png", dpi=150)
```

## seaborn: Statistical Visualization

seaborn sits on top of matplotlib and adds sensible defaults and statistical plot types. It is the fastest way to go from a DataFrame to a meaningful chart.

### Distribution Plots

```python
import seaborn as sns
import matplotlib.pyplot as plt

# Set a clean theme
sns.set_theme(style="whitegrid")

fig, axes = plt.subplots(1, 2, figsize=(12, 5))

# Histogram with density curve
sns.histplot(df["daily_return"], bins=60, kde=True, ax=axes[0])
axes[0].set_title("Distribution of Daily Returns")

# Box plots by group
sns.boxplot(data=df, x="ticker", y="daily_return", ax=axes[1])
axes[1].set_title("Return Distribution by Ticker")

plt.tight_layout()
plt.savefig("charts/distributions.png", dpi=150)
```

### Correlation Heatmap

```python
import seaborn as sns
import matplotlib.pyplot as plt

# Pivot to wide format: one column per ticker
pivot = df.pivot(index="date", columns="ticker", values="close")
corr = pivot.pct_change().corr()

fig, ax = plt.subplots(figsize=(8, 6))
sns.heatmap(
    corr,
    annot=True,
    fmt=".2f",
    cmap="coolwarm",
    vmin=-1,
    vmax=1,
    ax=ax,
)
ax.set_title("Return Correlation Matrix")
plt.tight_layout()
plt.savefig("charts/correlation.png", dpi=150)
```

### Scatter Plot with Regression

```python
sns.lmplot(
    data=df,
    x="volume_log",
    y="abs_return",
    hue="ticker",
    height=5,
    aspect=1.4,
    scatter_kws={"alpha": 0.3},
)
plt.title("Volume vs. Absolute Return")
plt.savefig("charts/scatter.png", dpi=150)
```

## plotly: Interactive Charts

Static PNGs are fine for reports and papers. For dashboards, notebooks, or any output that will be viewed in a browser, plotly's interactivity (hover tooltips, zoom, pan, click-to-filter) makes a significant difference.

```bash
pip install plotly
```

### Line Chart

```python
import plotly.express as px

fig = px.line(
    df[df["ticker"] == "AAPL"],
    x="date",
    y="close",
    title="AAPL Daily Close",
    labels={"close": "Close Price (USD)", "date": "Date"},
    template="plotly_white",
)

# Save as interactive HTML
fig.write_html("charts/aapl_close.html")

# Display in a Jupyter notebook
fig.show()
```

### Multi-ticker Comparison

```python
fig = px.line(
    df,
    x="date",
    y="close_normalized",  # normalized to 100 at start
    color="ticker",
    title="Normalized Price Performance",
    template="plotly_white",
)
fig.update_layout(legend_title="Ticker")
fig.write_html("charts/comparison.html")
```

### Candlestick Chart

```python
import plotly.graph_objects as go

aapl = df[df["ticker"] == "AAPL"].copy()

fig = go.Figure(data=[go.Candlestick(
    x=aapl["date"],
    open=aapl["open"],
    high=aapl["high"],
    low=aapl["low"],
    close=aapl["close"],
)])

fig.update_layout(
    title="AAPL — OHLC Candlestick",
    xaxis_title="Date",
    yaxis_title="Price (USD)",
    xaxis_rangeslider_visible=False,
    template="plotly_white",
)
fig.write_html("charts/aapl_candlestick.html")
```

### Volume Bar Chart Overlay

```python
from plotly.subplots import make_subplots
import plotly.graph_objects as go

fig = make_subplots(
    rows=2, cols=1,
    shared_xaxes=True,
    row_heights=[0.7, 0.3],
    vertical_spacing=0.04,
)

aapl = df[df["ticker"] == "AAPL"]

fig.add_trace(go.Scatter(x=aapl["date"], y=aapl["close"], name="Close"), row=1, col=1)
fig.add_trace(go.Bar(x=aapl["date"], y=aapl["volume"], name="Volume", marker_color="rgba(37,99,235,0.4)"), row=2, col=1)

fig.update_layout(title="AAPL Price and Volume", template="plotly_white")
fig.write_html("charts/aapl_price_volume.html")
```

## Saving Chart Output Consistently

Organize charts by date and type to keep the output directory manageable.

```python
from pathlib import Path
from datetime import date

CHART_DIR = Path("charts") / str(date.today())
CHART_DIR.mkdir(parents=True, exist_ok=True)

def save_fig(fig, name: str, formats=("png", "html")):
    for fmt in formats:
        path = CHART_DIR / f"{name}.{fmt}"
        if fmt == "png":
            fig.write_image(str(path), scale=2)   # requires kaleido: pip install kaleido
        elif fmt == "html":
            fig.write_html(str(path))
        print(f"Saved {path}")
```

## Chart Choice Guide

| Question to answer | Recommended chart |
|-------------------|------------------|
| How does a value change over time? | Line chart |
| How is a numeric value distributed? | Histogram, box plot |
| Are two variables correlated? | Scatter plot |
| How do categories compare? | Bar chart |
| What fraction does each part represent? | Stacked bar (not pie) |
| How do many variables correlate? | Heatmap |
| What is the price range over time? | Candlestick |

Avoid pie charts for more than four categories — bar charts communicate proportions more accurately.

## Next Steps

- **[Python Pandas Data Wrangling](/blog/python-pandas-data-wrangling)** — Preparing the DataFrame before you plot it.
- **[Low-Hanging Data Sources for Stock Market Prediction](/blog/low-hanging-data-sources-for-stock-prediction)** — Finding more signals worth visualizing.
