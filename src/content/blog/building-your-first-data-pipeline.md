---
title: 'Building Your First Data Pipeline'
description: 'Combine data collection, cleaning, and storage into a repeatable automated workflow that keeps your data fresh and organized.'
pubDate: 'Mar 22 2025'
heroImage: '/blog-placeholder-1.jpg'
---

A data pipeline is a sequence of steps that moves data from a source to a destination in a repeatable, automated way. At its simplest, it's just a script you can run on a schedule. This article shows how to combine the techniques from earlier articles in this series into a working end-to-end pipeline.

## The Anatomy of a Pipeline

Every pipeline has the same three stages:

```
[Source] → Extract → Transform → Load → [Destination]
```

This pattern is called **ETL** (Extract, Transform, Load). You may also see **ELT** (Extract, Load, Transform) where raw data is loaded first and transformed in the database — both are valid.

For our purposes:

| Stage | What Happens |
|-------|-------------|
| **Extract** | Pull data from the source (API, file, database) |
| **Transform** | Clean, normalize, and reshape the data |
| **Load** | Write to the destination (database, file, warehouse) |

## Project Structure

A clean folder layout makes pipelines easier to maintain:

```
project/
├── data/
│   ├── raw/        # unmodified source data
│   └── clean/      # transformed output
├── pipeline/
│   ├── extract.py  # source-specific fetching code
│   ├── transform.py# cleaning and reshaping
│   └── load.py     # writing to destination
├── run.py          # entry point that runs all stages
└── .env            # API keys and config (never commit this)
```

Keeping raw data separate from clean data is important: it means you can re-run the transform step without re-fetching everything.

## Step 1: Extract

The extract stage pulls data and saves it as raw files without modifying it.

```python
# pipeline/extract.py
import os
import json
import time
import requests

API_BASE = "https://api.example.com"
API_KEY  = os.environ["EXAMPLE_API_KEY"]
HEADERS  = {"Authorization": f"Bearer {API_KEY}"}

def fetch_users(output_path="data/raw/users.json"):
    records = []
    page = 1

    while True:
        resp = requests.get(
            f"{API_BASE}/users",
            headers=HEADERS,
            params={"page": page, "per_page": 100},
        )
        resp.raise_for_status()
        data = resp.json()

        batch = data.get("results", [])
        records.extend(batch)
        print(f"  Extract: page {page}, {len(batch)} users")

        if len(batch) < 100:
            break
        page += 1
        time.sleep(0.2)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(records, f, indent=2)

    print(f"Extracted {len(records)} users → {output_path}")
    return output_path
```

## Step 2: Transform

The transform stage reads raw data and produces clean data.

```python
# pipeline/transform.py
import json
import pandas as pd

def transform_users(raw_path="data/raw/users.json",
                    clean_path="data/clean/users.csv"):
    with open(raw_path) as f:
        records = json.load(f)

    df = pd.DataFrame(records)

    # Normalize column names
    df.columns = df.columns.str.lower().str.replace(" ", "_")

    # Drop rows without required fields
    df = df.dropna(subset=["id", "email"])

    # Clean strings
    df["email"] = df["email"].str.strip().str.lower()
    df["name"]  = df["name"].str.strip().str.title()

    # Parse dates
    df["created_at"] = pd.to_datetime(df["created_at"], errors="coerce")

    # Deduplicate on email, keep most recent
    df = df.sort_values("created_at", ascending=False, na_position="last")
    df = df.drop_duplicates(subset=["email"], keep="first")

    # Select and order final columns
    df = df[["id", "name", "email", "created_at", "status"]]

    import os
    os.makedirs(os.path.dirname(clean_path), exist_ok=True)
    df.to_csv(clean_path, index=False)
    print(f"Transformed {len(df)} users → {clean_path}")
    return clean_path
```

## Step 3: Load

The load stage writes clean data to the destination.

```python
# pipeline/load.py
import sqlite3
import pandas as pd

def load_users(clean_path="data/clean/users.csv",
               db_path="data/journal.db"):
    df = pd.read_csv(clean_path, parse_dates=["created_at"])

    conn = sqlite3.connect(db_path)
    df.to_sql("users", conn, if_exists="replace", index=False)

    count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    conn.close()

    print(f"Loaded {count} users into {db_path}/users")
```

For incremental loads (only new or updated records), use `if_exists="append"` and filter out records that already exist in the database before loading.

## Step 4: Wire It Together

```python
# run.py
import sys
from pipeline.extract   import fetch_users
from pipeline.transform import transform_users
from pipeline.load      import load_users

def run():
    print("=== Data Pipeline: Users ===")

    print("\n[1/3] Extract")
    raw_path = fetch_users()

    print("\n[2/3] Transform")
    clean_path = transform_users(raw_path)

    print("\n[3/3] Load")
    load_users(clean_path)

    print("\nDone.")

if __name__ == "__main__":
    run()
```

Running the pipeline:
```bash
python run.py
```

```
=== Data Pipeline: Users ===

[1/3] Extract
  Extract: page 1, 100 users
  Extract: page 2, 100 users
  Extract: page 3, 47 users
Extracted 247 users → data/raw/users.json

[2/3] Transform
Transformed 241 users → data/clean/users.csv

[3/3] Load
Loaded 241 users into data/journal.db/users

Done.
```

## Adding Error Handling

A pipeline that fails silently is worse than no pipeline. Add basic error handling:

```python
# run.py
import traceback
from pipeline.extract   import fetch_users
from pipeline.transform import transform_users
from pipeline.load      import load_users

def run():
    print("=== Pipeline Start ===")
    try:
        raw_path   = fetch_users()
        clean_path = transform_users(raw_path)
        load_users(clean_path)
        print("=== Pipeline Complete ===")
    except Exception as e:
        print(f"\nPipeline failed: {e}")
        traceback.print_exc()
        return 1
    return 0

if __name__ == "__main__":
    raise SystemExit(run())
```

## Scheduling the Pipeline

### Cron (Linux/macOS)

Run daily at 6am:
```bash
crontab -e
# Add:
0 6 * * * /usr/bin/python3 /path/to/project/run.py >> /path/to/logs/pipeline.log 2>&1
```

### Task Scheduler (Windows)

Use `schtasks` or the GUI Task Scheduler to run `python run.py` on a schedule.

### GitHub Actions (Cloud)

Run on a schedule without a server:
```yaml
# .github/workflows/pipeline.yml
name: Data Pipeline
on:
  schedule:
    - cron: '0 6 * * *'  # daily at 6am UTC

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install -r requirements.txt
      - run: python run.py
        env:
          EXAMPLE_API_KEY: ${{ secrets.EXAMPLE_API_KEY }}
```

## Keeping Raw Data

Always save the raw response before transforming it. Transformation logic evolves as you learn more about the data — having the raw file means you can re-run a fixed transform without re-fetching from the API.

A simple archiving pattern: add a timestamp to raw file names.

```python
from datetime import datetime

timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
raw_path = f"data/raw/users_{timestamp}.json"
```

## What to Build Next

Once your basic pipeline is running:

- **Add logging** — Replace `print()` with Python's `logging` module so you can control log levels and write to files.
- **Track run history** — Write a row to a `pipeline_runs` table with the run timestamp, record count, and any errors.
- **Add data validation** — Check that the row count is within expected bounds, that required columns have no nulls, and that types are correct before loading.
- **Handle incremental updates** — Track the last-fetched timestamp and only pull new or modified records on subsequent runs.

A pipeline that runs daily and validates its output will catch data quality issues before they reach your analysis — which is the whole point.
