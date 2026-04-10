---
title: 'ETL vs ELT: Choosing the Right Pipeline Pattern'
description: 'ETL and ELT both move data from source to destination, but they make very different trade-offs between cost, flexibility, and setup complexity.'
pubDate: 'Apr 06 2026'
heroImage: '/blog-etl-vs-elt.svg'
difficulty: 'low'
tags: ['pipelines']
---

Every data pipeline answers the same question: how do you get raw data from a source into a place where you can actually use it? The two dominant patterns — **ETL** and **ELT** — answer that question in opposite order, and the difference matters more than it first appears.

## What the Letters Mean

**ETL** stands for **Extract, Transform, Load**. You pull data from the source, clean and reshape it in a separate processing step, then load the tidy result into your destination.

**ELT** stands for **Extract, Load, Transform**. You pull data from the source, dump it raw into your destination first, then transform it there using the warehouse's own compute.

```
ETL:  Source → [Extract] → [Transform] → [Load] → Warehouse
ELT:  Source → [Extract] → [Load] → Warehouse → [Transform]
```

The transformation step moves from outside the warehouse to inside it. That one shift changes everything about cost, tooling, and complexity.

---

## ETL: Transform Before You Store

In a classic ETL setup, a dedicated transformation engine — a Python script, an Apache Spark job, or a tool like Apache Airflow — sits between your source and your destination. It reads raw data, applies business logic, cleans nulls, normalizes types, and only then writes clean records to the warehouse.

### Advantages

- **Storage is cheap.** You only land data you actually need. Raw rows with 40 columns become clean tables with 12. You pay to store less.
- **Sensitive data can be scrubbed in transit.** PII can be masked or dropped before it ever hits the warehouse, which simplifies compliance.
- **Works with any destination.** ETL does not require a powerful warehouse — the transformation happens outside, so even a humble Postgres instance can be the destination.

### Disadvantages

- **More infrastructure to maintain.** The transform layer is its own system. You need to run it, monitor it, version it, and debug it separately from the warehouse.
- **Schema rigidity.** Because you define transformations before loading, schema changes at the source can break your pipeline mid-stream. You have to update the transform logic every time the source changes shape.
- **Raw data is gone.** Once transformed, the original is discarded. If your transformation logic had a bug, you have to re-extract from the source to fix it — assuming the source still has the data.

---

## ELT: Load Raw, Transform Later

With ELT you load everything raw into a cloud data warehouse — Snowflake, BigQuery, Redshift, DuckDB — and then run SQL or a tool like **dbt** to build the clean models on top of the raw tables. The warehouse does the heavy lifting.

### Advantages

- **Much easier to get started.** You do not need a separate transform engine. Load raw data with a simple connector (Fivetran, Airbyte, or even a curl command), then write SQL to shape it. Most teams can go from zero to working models in a day.
- **Raw data is always there.** Because nothing is discarded on ingestion, you can re-run transformations at any time. Bug in your revenue model from six months ago? Re-run the dbt job. The raw data is still sitting in the warehouse.
- **Schema flexibility.** When the source adds a column, the raw table gets the new column automatically. You decide later whether to use it in a downstream model. Nothing breaks on ingestion.
- **Warehouse compute is powerful.** Modern cloud warehouses are built to process enormous datasets efficiently. SQL transformations at scale are often faster inside the warehouse than in a standalone Python job.

### Disadvantages

- **Storage and compute costs scale fast.** You store every raw row ever ingested, including duplicates, nulls, and columns you will never use. Cloud warehouses charge for storage and query compute separately — both grow as your data grows.
- **PII discipline requires extra effort.** Raw data lands in the warehouse before you have a chance to mask anything. You need row-level security, column masking, or a separate pre-load scrub to keep sensitive data out of the wrong hands.
- **Transformation is visible to everyone.** Your messy intermediate tables and half-finished dbt models live in the same warehouse as your production analytics. Access controls and naming conventions become critical.

---

## Side-by-Side Comparison

| Dimension | ETL | ELT |
|---|---|---|
| Where transform runs | External engine | Inside the warehouse |
| Setup complexity | Higher | Lower |
| Infrastructure to manage | Transform layer + warehouse | Warehouse only |
| Storage cost | Lower (clean data only) | Higher (raw everything) |
| Warehouse compute cost | Lower | Higher |
| Raw data preserved | No (unless you archive it) | Yes |
| Schema change tolerance | Low | High |
| Getting started speed | Slower | Faster |
| PII / compliance | Easier to handle in transit | Requires warehouse-level controls |

---

## Which One Should You Use?

Start with ELT if you are early-stage, moving fast, or working with a cloud warehouse that already has the compute to handle it. The lower barrier to entry means you get value faster, and keeping raw data around is genuinely useful when your transformation logic is still evolving — which it always is at the start.

Shift toward ETL, or add a pre-load transform step, when:

- **Cost becomes a problem.** If your raw tables are ballooning in size with data you never query, you are paying for storage you do not need.
- **Compliance requires it.** If you cannot let PII land in the warehouse at all, you must transform (and mask) before loading.
- **Your sources are stable and well-understood.** Once schemas stop changing frequently and your business logic is mature, pre-transforming data is cleaner and cheaper.

Many production pipelines are actually a hybrid: a lightweight pre-load filter strips obvious garbage and masks sensitive fields, then ELT handles the rest inside the warehouse. The patterns are not mutually exclusive.

---

## The Low Hanging Data Take

ELT wins on ease of setup, and that matters. Getting real data in front of stakeholders quickly is almost always worth more than running a perfectly optimized pipeline on data no one has seen yet. Start with ELT, use dbt or plain SQL to build your models, and let the warehouse prove its worth.

When the bills arrive, look at what you are actually storing. If half your raw tables are noise, add a pre-load filter. That is ETL creeping back in — and that is fine. The goal is useful data at a defensible cost, not ideological purity about which three-letter acronym you follow.

Pick the pattern that fits where you are today. You can always evolve it.

## Next Steps

- **[Building Your First Data Pipeline](/article/building-your-first-data-pipeline)** — An end-to-end pipeline implementation that puts the ETL structure into practice.
- **[Scheduling and Automating Data Pipelines](/article/scheduling-and-automating-pipelines)** — Once you have chosen your pattern, running it reliably on a schedule.
- **[Working with Parquet and DuckDB](/article/working-with-parquet-and-duckdb)** — A practical look at ELT-style in-warehouse transformations using DuckDB as the compute layer.
