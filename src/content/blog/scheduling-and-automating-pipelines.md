---
title: 'Scheduling and Automating Data Pipelines'
description: 'Move from manually running scripts to pipelines that run on a schedule — using cron, Python schedulers, and lightweight orchestration tools.'
pubDate: 'Mar 25 2025'
heroImage: '/blog-pipeline.svg'
difficulty: 'high'
---

A script you run manually is a chore. A script that runs on a schedule is a pipeline. Automation is what turns a one-off data pull into a reliable data feed. This article covers the progression from simple cron jobs to lightweight orchestration — with the right tool for each stage.

## When to Automate

Not every script needs a schedule. Automate when:

- The data needs to be fresh (daily prices, hourly API polls, real-time feeds)
- The script runs more than once a week
- Other people or systems depend on the output being available

Don't automate scripts that are still changing or that fail intermittently. Fix the script first, then put it on a schedule.

## Option 1: Cron (Linux/macOS)

Cron is the simplest scheduler available on any Unix system. It requires no installation and has zero runtime overhead.

### Basic Cron Syntax

```
┌───────── minute (0-59)
│ ┌───────── hour (0-23)
│ │ ┌───────── day of month (1-31)
│ │ │ ┌───────── month (1-12)
│ │ │ │ ┌───────── day of week (0-6, Sunday=0)
│ │ │ │ │
* * * * * command
```

Common patterns:

```cron
# Every day at 6:00 AM
0 6 * * * /usr/bin/python3 /home/user/scripts/fetch_prices.py

# Every hour
0 * * * * /usr/bin/python3 /home/user/scripts/poll_api.py

# Every 15 minutes
*/15 * * * * /usr/bin/python3 /home/user/scripts/check_feed.py

# Every weekday at market close (4 PM ET, UTC-4 = 8 PM UTC)
0 20 * * 1-5 /usr/bin/python3 /home/user/scripts/daily_close.py
```

Edit your crontab with `crontab -e`. Always use absolute paths — cron runs in a minimal environment with no PATH.

### Capturing Output

```cron
# Redirect stdout and stderr to a log file
0 6 * * * /usr/bin/python3 /home/user/scripts/fetch.py >> /home/user/logs/fetch.log 2>&1
```

Rotate logs with `logrotate` to prevent them from growing indefinitely.

### Cron Limitations

- No built-in retry on failure
- No dependency management between jobs
- Difficult to monitor across multiple machines
- Doesn't handle daylight saving time transitions well

For simple single-machine pipelines, cron is the right tool. For anything more complex, use a proper scheduler.

## Option 2: APScheduler (In-Process Python)

If your pipeline is already a Python script, `APScheduler` lets you add scheduling inside the process — no cron setup required.

```python
from apscheduler.schedulers.blocking import BlockingScheduler
from datetime import datetime

scheduler = BlockingScheduler()

@scheduler.scheduled_job("interval", minutes=30)
def fetch_data():
    print(f"Running fetch at {datetime.now()}")
    # your data collection logic here

@scheduler.scheduled_job("cron", hour=6, minute=0)
def daily_report():
    print("Running daily report")
    # your report logic here

scheduler.start()
```

Install with `pip install apscheduler`. APScheduler supports interval, cron-style, and one-shot schedules. It runs in-process, so it lives and dies with your script.

Useful for:
- Long-running processes that also poll on a schedule
- Development environments where you don't want to configure system cron
- Scripts that need to pass in-memory state between runs

## Option 3: Prefect (Lightweight Orchestration)

When your pipeline has multiple steps, dependencies, and you want observability, a proper orchestrator is worth the setup cost. Prefect is the most approachable option for solo and small-team projects.

### Installing and Running Locally

```bash
pip install prefect
prefect server start   # starts the local UI at http://localhost:4200
```

### Defining a Flow

```python
from prefect import flow, task
import pandas as pd
import requests

@task(retries=3, retry_delay_seconds=60)
def fetch_prices(ticker: str) -> list:
    response = requests.get(f"https://api.example.com/prices/{ticker}")
    response.raise_for_status()
    return response.json()["prices"]

@task
def clean_prices(prices: list) -> pd.DataFrame:
    df = pd.DataFrame(prices)
    df["price"] = pd.to_numeric(df["price"], errors="coerce")
    df.dropna(subset=["price"], inplace=True)
    return df

@task
def save_prices(df: pd.DataFrame, ticker: str):
    df.to_csv(f"data/cleaned/{ticker}_prices.csv", index=False)
    print(f"Saved {len(df)} rows for {ticker}")

@flow(name="daily-price-pipeline")
def price_pipeline(tickers: list = ["AAPL", "MSFT", "GOOG"]):
    for ticker in tickers:
        prices = fetch_prices(ticker)
        df = clean_prices(prices)
        save_prices(df, ticker)

if __name__ == "__main__":
    price_pipeline()
```

### Scheduling a Flow

```python
from prefect.schedules import CronSchedule

price_pipeline.serve(
    name="daily-prices",
    cron="0 20 * * 1-5",  # weekdays at 8 PM UTC
)
```

Prefect gives you:
- **Automatic retries** with configurable backoff
- **Run history** with success/failure status per task
- **Parameter passing** between tasks without global state
- **A web UI** showing every run, its logs, and its duration

## Handling Failures Gracefully

Scheduled jobs fail silently by default. Add alerting so failures don't go unnoticed.

### Simple Email Alert (via smtplib)

```python
import smtplib
from email.message import EmailMessage

def send_alert(subject: str, body: str):
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = "pipeline@example.com"
    msg["To"] = "you@example.com"
    msg.set_content(body)

    with smtplib.SMTP("smtp.gmail.com", 587) as smtp:
        smtp.starttls()
        smtp.login("pipeline@example.com", "your-app-password")
        smtp.send_message(msg)

# Wrap your main function
if __name__ == "__main__":
    try:
        run_pipeline()
    except Exception as e:
        send_alert("Pipeline failed", str(e))
        raise
```

### Logging to File

```python
import logging

logging.basicConfig(
    filename="logs/pipeline.log",
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)

logger = logging.getLogger(__name__)

logger.info("Pipeline started")
# ... pipeline code ...
logger.info("Pipeline finished: %d rows written", row_count)
```

## Idempotency: Safe to Re-Run

Automated pipelines will run multiple times. Some will overlap or run twice due to bugs or retries. Write your pipeline so running it twice produces the same result as running it once.

```python
# Idempotent insert: replace existing rows by primary key
df.to_sql(
    "prices",
    con=engine,
    if_exists="append",
    index=False,
    method="ignore",   # skip rows that already exist
)

# Or use INSERT OR REPLACE in SQLite
conn.executemany(
    "INSERT OR REPLACE INTO prices (ticker, date, close) VALUES (?, ?, ?)",
    rows,
)
```

An idempotent pipeline is safe to re-run from any point. This makes debugging and recovery vastly simpler.

## Secrets Management

Scheduled pipelines almost always need credentials — API keys, database passwords, email app passwords. How you store and access those secrets matters.

### What Not to Do

Never put secrets directly in source code or commit them to a repository:

```python
# BAD — visible to anyone with repo access
API_KEY = "sk-live-abc123..."
```

### Local Development: .env Files

Store secrets in a `.env` file in the project root and load them with `python-dotenv`. The `.env` file is listed in `.gitignore` so it is never committed.

```bash
pip install python-dotenv
```

```ini
# .env  (never commit this file)
EXAMPLE_API_KEY=sk-live-abc123...
SMTP_PASSWORD=app-password-here
DB_PASSWORD=secret
```

```python
# At the top of run.py or any script that needs credentials
from dotenv import load_dotenv
import os

load_dotenv()   # reads .env into environment variables

API_KEY = os.environ["EXAMPLE_API_KEY"]
```

### GitHub Actions: Repository Secrets

For pipelines that run in GitHub Actions, store secrets in the repository settings under **Settings → Secrets and variables → Actions**, then reference them in the workflow:

```yaml
# .github/workflows/pipeline.yml
jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: python run.py
        env:
          EXAMPLE_API_KEY: ${{ secrets.EXAMPLE_API_KEY }}
          SMTP_PASSWORD: ${{ secrets.SMTP_PASSWORD }}
```

Secrets set this way are never exposed in logs — GitHub redacts them automatically.

### Production Servers: Environment Variables

On a VPS or cloud VM, set environment variables at the system or service level rather than using a `.env` file. For `systemd` services:

```ini
# /etc/systemd/system/pipeline.service
[Service]
Environment="EXAMPLE_API_KEY=sk-live-abc123..."
ExecStart=/usr/bin/python3 /opt/pipeline/run.py
```

Or export them in the shell profile (`.bashrc` / `.profile`) if running from cron.

The principle in all cases is the same: secrets live in the environment, not in the code. The script reads them with `os.environ["KEY"]` — if the variable is missing, the pipeline fails immediately with a clear `KeyError` rather than silently using a wrong value.

## Choosing the Right Tool

| Situation | Recommended Tool |
|-----------|-----------------|
| Single script, simple schedule | Cron |
| Python process with in-built scheduling | APScheduler |
| Multi-step pipeline, need retries + UI | Prefect |
| Large team, complex dependencies | Airflow or Dagster |

Start simple. Cron handles 80% of cases. Add complexity only when you hit a concrete limitation.

## Next Steps

- **[Building Your First Data Pipeline](/article/building-your-first-data-pipeline)** — End-to-end pipeline structure before adding scheduling.
- **[Data Cleaning and Validation](/article/data-cleaning-and-validation)** — Ensuring your scheduled pulls produce clean output.
