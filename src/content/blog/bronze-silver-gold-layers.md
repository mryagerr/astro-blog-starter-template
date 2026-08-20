---
title: 'Bronze, Silver, Gold: The Medallion Architecture Explained'
description: 'The medallion architecture organizes a data pipeline into three refinement layers — bronze, silver, and gold — so raw data, cleaned data, and business-ready data never get confused with each other.'
pubDate: 'Aug 20 2026'
heroImage: '/blog-bronze-silver-gold.png'
difficulty: 'low'
tags: ['pipelines', 'preparation']
---

Most data pipelines fail in the same quiet way: raw data, half-cleaned data, and report-ready data all end up living in the same place, and nobody can tell which is which. Six months later you have a table called `customers_final_v2_clean` and no idea whether it is safe to trust. The **medallion architecture** exists to prevent exactly this. It splits your pipeline into three named layers — **bronze**, **silver**, and **gold** — where each layer has one job and each step forward makes the data more refined.

The metaphor is medals, not metals: bronze is the entry point, silver is better, gold is best. Data flows in one direction only.

```
Source → [ BRONZE ] → [ SILVER ] → [ GOLD ] → Dashboards / ML / Reports
          raw           cleaned      business-ready
```

Nothing here requires a specific tool. You can implement the medallion pattern in a cloud warehouse, in DuckDB on your laptop, or with three folders of Parquet files. The value is in the *discipline*, not the technology.

---

## Bronze: Land It Raw, Change Nothing

The bronze layer is a faithful copy of the source. You extract data and write it down exactly as it arrived — same columns, same messy types, same duplicate rows, same nulls. The only things you are allowed to add are metadata: an ingestion timestamp, the source system name, maybe a batch ID.

The rule for bronze is simple: **do not transform.** Resist the urge to fix that obviously-wrong date column here. The moment you start cleaning in bronze, you lose your ability to answer the most important question in any pipeline: *what did the source actually send us?*

### Why an untouched layer matters

- **It is your replay button.** When a downstream bug corrupts a report, you can rebuild everything from bronze without re-hitting the source API — which may be rate-limited, may have changed, or may no longer serve last month's data at all.
- **It is your audit trail.** If a stakeholder insists the numbers are wrong, bronze is the evidence of what the source system said and when.
- **It absorbs schema surprises.** Sources add columns, rename fields, and change formats without warning. Bronze catches all of it unfiltered, so a schema change becomes a visible event instead of a silent data-loss bug.

Bronze is cheap storage and high trust in *provenance*, not in *quality*. Nobody should build a dashboard directly on bronze.

---

## Silver: Clean, Conform, and Join

The silver layer is where the actual work happens. You take the raw bronze data and turn it into something correct and consistent:

- **Fix types.** Strings that should be dates become dates. `"1,200.00"` becomes `1200.00`.
- **Handle nulls and duplicates.** Deduplicate records, drop or flag rows that fail validation, standardize the fifteen different spellings of a country name.
- **Conform schemas.** Rename cryptic source columns (`cust_id_x`) to consistent names (`customer_id`) so tables from different systems can be joined.
- **Enrich and join.** Combine the orders table with the customers table, attach reference data, derive obvious fields like `order_total`.

The result is a set of clean, well-typed, deduplicated tables that faithfully represent your business entities — customers, orders, events — without yet being shaped for any one report. Silver is the layer your data engineers and analysts actually query when they need trustworthy raw material.

### The silver boundary

The trap in silver is doing *too much*. Silver should answer "is this data clean and correct?" — not "what is our monthly revenue by region?" Business-specific aggregations belong in gold. Keeping silver at the entity level means many different gold tables can be built from the same silver foundation without duplicating cleaning logic.

A good test: if two teams would clean the data the same way but aggregate it differently, the cleaning belongs in silver and the aggregation belongs in gold.

---

## Gold: Shape It for the Consumer

The gold layer is built for a specific audience and a specific question. These are the tables that feed a dashboard, train a model, or land in an executive report. Gold tables are typically:

- **Aggregated.** Daily revenue by region, churn rate by cohort, average handle time by team.
- **Denormalized.** Joins are already done and flattened so a BI tool can read one wide table fast, without the consumer needing to understand the underlying schema.
- **Purpose-built.** A gold table for the finance dashboard and a gold table for the ML feature store may draw from the same silver tables but look completely different.

Because gold is derived entirely from silver, it is *disposable*. If a new metric definition arrives, you rewrite the gold table — you never touch bronze or silver. This is what makes the architecture resilient: the expensive, trustworthy layers stay stable while the presentation layer changes as often as the business needs it to.

---

## Why Three Layers Beat One

You could technically load data and clean-and-aggregate it in a single step. Teams do it all the time, and it works right up until it doesn't. The medallion split earns its keep in the moments that break single-step pipelines:

| Situation | One-step pipeline | Medallion |
|---|---|---|
| Source API changes format | Silent breakage, unclear where | Visible at bronze, isolated |
| A metric definition changes | Rewrite the whole pipeline | Rewrite one gold table |
| Report numbers are disputed | No record of source truth | Bronze is the receipt |
| A new team wants the same data shaped differently | Copy and fork the pipeline | Add a gold table on existing silver |
| A bug corrupts output | Re-extract from source | Replay from bronze |

The layers give every kind of change a single obvious home. That is the entire point: **when something goes wrong, you know which layer to look in.**

---

## Common Mistakes

- **Transforming in bronze.** The most frequent and most damaging error. Once bronze is "helpfully" cleaned, you can never reconstruct what the source sent. Keep it raw.
- **Business logic in silver.** Revenue rules, KPI definitions, and audience-specific shaping leak upstream and force you to maintain the same logic in five places. Push them down to gold.
- **Skipping silver.** Going bronze-straight-to-gold feels faster until two dashboards disagree because each re-cleaned the raw data slightly differently. Silver is the shared source of clean truth.
- **Treating gold as sacred.** Gold tables are meant to be rewritten. If changing a metric feels scary, your business logic has probably crept into silver.

---

## Where to Start

You do not need a data lakehouse to adopt this. On a small project, three schemas in the same database — `bronze`, `silver`, `gold` — is a complete, legitimate implementation. Land your raw extracts in bronze, build cleaned entity tables in silver, and let each dashboard own its gold table.

The medallion architecture is not a product you buy. It is a naming convention plus a rule about direction of flow: **raw in, refined out, one way only.** Adopt just that, and the next engineer who opens your project — including future you — will know exactly which table to trust and exactly where to make the next change.
