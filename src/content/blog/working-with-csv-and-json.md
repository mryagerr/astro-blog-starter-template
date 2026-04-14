---
title: 'Working with CSV and JSON'
description: 'The two most common data formats explained — how to read, write, convert, and handle the edge cases that always come up.'
pubDate: 'Mar 06 2025'
heroImage: '/blog-csv-json.svg'
difficulty: 'low'
tags: ['collection', 'preparation']
---

CSV and JSON account for the majority of data files you will encounter in the wild. Each has a simple concept and a surprising number of edge cases. This article covers both formats from the ground up, with practical code for reading, writing, and converting between them.

## CSV: Comma-Separated Values

A CSV file is a plain-text table. Each line is a row; commas separate the columns. The first line is usually a header.

```
name,age,city
Alice,31,New York
Bob,25,Chicago
Carol,29,Austin
```

Simple. But here's where it gets complicated:

### Edge Cases You Will Hit

**Commas inside values** — If a value contains a comma, it must be quoted:
```
name,bio
Alice,"Engineer, writer, and occasional baker"
```

**Newlines inside values** — A quoted field can span multiple lines. Most parsers handle this correctly; most manual string splits do not.

**Encoding** — Older files are often ISO-8859-1 or Windows-1252, not UTF-8. You'll know when you hit a `UnicodeDecodeError`.

**Trailing whitespace / inconsistent quoting** — Real-world exports are messy. Columns may have extra spaces; some values may be quoted unnecessarily.

### Reading CSV in Python

Always use the `csv` module or pandas rather than splitting on commas manually.

**With the standard library:**
```python
import csv

with open("data.csv", newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(row["name"], row["age"])
```

`DictReader` maps each row to a dictionary using the header row as keys — almost always what you want.

**With pandas:**
```python
import pandas as pd

df = pd.read_csv("data.csv")
print(df.head())
print(df.dtypes)
```

Pandas infers types automatically: numbers become `int64` or `float64`, dates stay as strings unless you tell it otherwise.

### Common `read_csv` Options

```python
df = pd.read_csv(
    "data.csv",
    encoding="latin-1",        # for non-UTF-8 files
    sep=";",                   # for semicolon-delimited files
    skiprows=2,                # skip header garbage at the top
    parse_dates=["created_at"],# parse date columns
    na_values=["N/A", "null"], # treat these as NaN
    dtype={"zip_code": str},   # prevent leading zeros from being dropped
)
```

### Writing CSV in Python

```python
import csv

records = [
    {"name": "Alice", "age": 31, "city": "New York"},
    {"name": "Bob", "age": 25, "city": "Chicago"},
]

with open("output.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["name", "age", "city"])
    writer.writeheader()
    writer.writerows(records)
```

Always pass `newline=""` to `open()` when writing CSVs on Windows — otherwise you get double line endings.

---

## JSON: JavaScript Object Notation

JSON stores structured data as key-value pairs and arrays. It's the default format for most APIs.

```json
{
  "users": [
    {"id": 1, "name": "Alice", "active": true},
    {"id": 2, "name": "Bob",   "active": false}
  ],
  "total": 2
}
```

### Reading JSON in Python

```python
import json

with open("data.json", encoding="utf-8") as f:
    data = json.load(f)

users = data["users"]
for user in users:
    print(user["name"])
```

For API responses (already a string, not a file):
```python
import requests

response = requests.get("https://api.example.com/users")
data = response.json()   # equivalent to json.loads(response.text)
```

### Handling Nested JSON

The harder case is deeply nested JSON, where the field you want is buried several levels down. Flatten it explicitly:

```python
raw = {
    "id": 42,
    "author": {"name": "Alice", "email": "alice@example.com"},
    "stats": {"views": 1200, "likes": 87}
}

flat = {
    "id": raw["id"],
    "author_name": raw["author"]["name"],
    "author_email": raw["author"]["email"],
    "views": raw["stats"]["views"],
    "likes": raw["stats"]["likes"],
}
```

For deeply nested or variable structures, `pandas.json_normalize()` handles most cases:

```python
import pandas as pd

records = [
    {"id": 1, "author": {"name": "Alice"}, "stats": {"views": 1200}},
    {"id": 2, "author": {"name": "Bob"},   "stats": {"views": 540}},
]

df = pd.json_normalize(records)
# columns: id, author.name, stats.views
```

### Writing JSON

```python
import json

data = {"users": [{"id": 1, "name": "Alice"}]}

with open("output.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
```

`indent=2` makes the output human-readable. `ensure_ascii=False` preserves non-ASCII characters (accents, CJK characters, etc.) instead of escaping them.

---

## Converting Between CSV and JSON

**JSON to CSV (flatten and write):**
```python
import json
import pandas as pd

with open("data.json") as f:
    records = json.load(f)

df = pd.json_normalize(records)
df.to_csv("output.csv", index=False)
```

**CSV to JSON:**
```python
import pandas as pd

df = pd.read_csv("data.csv")
df.to_json("output.json", orient="records", indent=2)
```

`orient="records"` produces a JSON array of objects — the most useful shape for downstream consumption.

---

## A Note on Line-Delimited JSON (JSONL)

Some APIs and log systems emit one JSON object per line rather than a single array. This format is called JSONL (or ndjson):

```
{"id": 1, "name": "Alice"}
{"id": 2, "name": "Bob"}
```

Read it like this:
```python
import json

records = []
with open("data.jsonl") as f:
    for line in f:
        records.append(json.loads(line.strip()))
```

Or with pandas:
```python
df = pd.read_json("data.jsonl", lines=True)
```

## Next Steps

- **[Pulling Data from REST APIs](/article/pulling-data-from-apis/)** — Fetch live JSON data from HTTP endpoints.
- **[Organizing Data with SQL](/article/organizing-data-with-sql/)** — Load your CSV/JSON into a database for proper querying.
- **[Python & Pandas for Data Wrangling](/article/python-pandas-data-wrangling/)** — Reshaping and cleaning the CSV and JSON data you have loaded.
