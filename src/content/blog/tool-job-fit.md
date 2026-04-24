---
title: 'Stop Forcing Tools Into Jobs They Weren''t Built For'
description: 'Most data pain is not a bad-tool problem. It is a phase-transition problem. A decision framework for four forks where teams pick wrong and stay wrong.'
pubDate: 'Apr 24 2026'
heroImage: '/blog-placeholder-1.png'
difficulty: 'high'
tags: ['pipelines']
---

Consider a small analytics team that spends three weeks building a revenue forecasting model. It lives in a single Jupyter notebook on a staff scientist's laptop. Input data comes from a CSV a finance analyst emails over every Friday. The cleaning is pandas, the model is a light statsforecast routine, and the output is a chart the CFO's office has been asking about for two quarters. It works. It is legitimately good analysis.

The celebration lasts about a week. Then come the follow-up questions, all variations of the same theme: can we run this every Monday? Can we break it out by region? Can we email it to the VPs? Can the sales team see it too? The scientist who built it does not have time to rebuild, so the notebook stays. Someone bolts on a cron job that runs `jupyter nbconvert --execute` at 6 AM. When a region is missing data one week, the notebook runs anyway, produces silent garbage, and the regional VP calls a meeting about "forecasting reliability." When pandas deprecates an argument, the Monday email stops cold. Six months in, the company has a load-bearing business process depending on a notebook nobody wants to own.

The notebook was the right tool to earn a *yes* from the CFO. It was the wrong tool to run the business. Nobody picked the wrong tool on purpose. The job changed and nobody noticed.

## Tools Have Native Jobs

Every tool is built for a specific job. When you use it for that job, the work is simple. When you stretch it past that job, complexity compounds: brittle workarounds, tribal knowledge, performance cliffs, and a migration nobody wants to fund. Excel is the canonical example. The moment a team treats an `.xlsx` file as the source of truth for operational data, complete with lookups, version conflicts, and macros patching macros, they have taken on database problems without database tools. The fix is not *Excel is bad*. The fix is recognizing when the job changed and the tool did not.

Most tool-fit failures are really phase-transition failures. There are two phases in every data project, and they want different tools.

**Phase 1 is proving the thing works.** You stitch together a CSV, build a model in a notebook, and put a number in front of a stakeholder they care about. Speed matters more than rigor. The goal is a believable demo, the currency is political capital, and almost any tool that gets you there is the right tool.

**Phase 2 is running the business.** Reliability matters more than speed. Someone is going to be paged at 3 AM if it breaks. Multiple people need to edit, run, and trust the output. Tools that survived Phase 1 on their charm start generating weekly incidents.

The mistake is not using Excel, CSVs, or notebooks in Phase 1. The mistake is staying in them once you have entered Phase 2, because the prototype already works and rewriting feels like a step backward to everyone who is not going to maintain it when things break. Every fork below has a Phase 1 tool and a Phase 2 tool. Knowing which phase you are in is the actual skill.

## Fork One: SQL vs Excel

Excel is a spreadsheet. Its native job is individual analysis and ad-hoc modeling: one analyst, one file, one decision. For Phase 1 work it is unbeatable. You can type a number, see it ripple through a model, and explain the whole thing to a VP in ten minutes. That immediacy is the product.

SQL's native job is shared, structured, queryable data that a team can trust. It assumes multiple readers, typed columns, and a workload that has to be reproducible tomorrow. That is Phase 2 work by definition.

The phase transition tells are boringly consistent. Two people are editing the same workbook at the same time. There is a VLOOKUP chain crossing three files, one of which lives on a Sharepoint link that only works on Karen's laptop. Someone asks "can we run this weekly?" and the honest answer is "only if Karen is in the office." A 900,000-row tab has started crashing on open, and the workaround is deleting historical months to get under a million. Each of those is a signal that the job has outgrown the tool, and the signal gets louder every week you ignore it.

The lazy argument against SQL is "our team does not know it." The honest answer is that your team learns SQL in two weeks or lives with Excel pain forever. VLOOKUP to JOIN is a day. GROUP BY is a day. Window functions, which replace most of the pivot-table gymnastics analysts do by hand, take maybe a week to get comfortable with. Two weeks of invested training pays back before the next quarter-end close. The cost of not doing it is a file someone is afraid to touch for the next three years.

## Fork Two: CSV vs Parquet

CSV's native job is human-readable interchange. It is what you use when you need to email someone a file, load something into Excel to eyeball it, or hand a non-engineer a copy of a table. Those are real jobs. They are also Phase 1 jobs.

Parquet's native job is columnar analytical storage: repeated reads, typed columns, large volumes, compression. Every analytical warehouse and query engine built in the last decade reads it natively. It is the default storage format for anything you plan to hit more than once.

The transition tells are obvious once you know what to look for. Files routinely exceed a few hundred megabytes. You have a recurring bug where dates come back as strings, or leading zeros on zip codes get silently dropped, or booleans turn into `"TRUE"` and `"FALSE"`. The same CSV is being read by more than one job, and every job has its own parsing quirks. Storage costs on your object store are growing faster than your data is. Jobs that used to take ninety seconds now take fifteen minutes because every read is a full-file scan.

The performance gap is not subtle. On a typical analytical workload, Parquet is five to ten times smaller than the equivalent CSV and an order of magnitude faster to query, because columnar storage lets the reader skip everything it does not need. Types are preserved. Schema is embedded in the file. No more date-parsing bugs, no more leading-zero horror stories.

Most teams default to CSV because it is what they know and because `pd.read_csv` was the second thing they ever learned. That is not a reason. The only defensible reason to keep a file as CSV is that a human needs to open it. If the only readers are machines, you are paying for the privilege of being slower, larger, and bug-prone.

## Fork Three: DuckDB vs a Cloud Warehouse

DuckDB's native job is single-node analytical queries. It runs in-process, reads Parquet and CSV directly off disk or object storage, and executes SQL at speeds that embarrass most cloud warehouses for any dataset that fits on one machine. "Fits on one machine" is a larger set than people assume. A modern laptop with 32 GB of RAM will happily query a hundred gigabytes of compressed Parquet. A mid-range EC2 instance will do a terabyte.

A cloud warehouse, whether Snowflake, BigQuery, or Redshift, is built for a different job: multi-user concurrent access, governed enterprise data, workloads that genuinely do not fit on one machine, and the compliance machinery that comes with all of that. It is late-Phase-2 infrastructure.

The transition tells for needing a warehouse are specific, not rhetorical. Dozens of analysts are hitting the same tables concurrently. You have real compliance requirements: row-level security, audit logs, data-masking policies you cannot fake with filesystem permissions. Your datasets are in the multi-terabyte range after compression, not before. Without two or more of those conditions, you are likely paying warehouse prices for a laptop-sized workload.

It is common to see companies paying more than $30,000 a month to Snowflake to run queries over roughly forty gigabytes of data, because "that is what data teams use." The same workload runs in under two seconds on a single `m5.xlarge` with DuckDB reading Parquet out of S3. That is not an edge case. That is most analytical workloads at most mid-sized companies.

Try DuckDB first. You can always migrate up when the concurrency or governance requirements actually arrive. Migrating down, after a warehouse has accreted dashboards, dbt models, and vendor contracts around it, is orders of magnitude harder.

## Fork Four: Jenkins vs Airflow (vs cron)

Cron's native job is simple time-based scheduling. It runs a thing at a time. It does not know what the thing does, it does not know if the thing succeeded in any meaningful sense, and it does not know what should run next. For a single job that does not have dependencies, cron is fine. That is Phase 1 scheduling.

Jenkins's native job is CI/CD: building, testing, and deploying code. It is very good at that. It was never built to orchestrate data pipelines, and every team that uses it that way eventually learns why.

Airflow's native job, along with its modern cousins Dagster and Prefect, is data pipeline orchestration: DAGs of tasks with real dependencies, typed retries, backfills, SLAs, and visibility into which step failed and why.

The tells that you have outgrown cron and should never have been on Jenkins are painful to read aloud. You have a Jenkins job with `sleep 1800` in the middle of it, waiting for an upstream export to finish. You have three cron jobs chained by convention: the second one runs at 2 AM because the first one "usually finishes by then." Nobody can tell you which step of last night's run failed without SSH-ing into a box and reading a log file. There is no backfill story; if yesterday's run was wrong, somebody manually re-runs today and hopes. The model you shipped last quarter needs to run for twelve regions now, and adding a region means editing a shell script that has outlived its original author.

Jenkins running your data pipelines is the adult version of Excel running your database. It works until it does not, and the failure mode is always at 3 AM, always during a quarter-close, and always in front of someone who signs budget.

## The Experience Gap

The same mistake repeats across companies because the people building Phase 1 are almost never the people who have to run Phase 2 a year later. A senior data scientist ships a notebook that forecasts revenue. Leadership loves it. Six months later, a data engineer inherits it and is told to make it run daily, feed a dashboard, and survive the original author's vacation. The prototype was not wrong. The handoff was.

Experience in this field is mostly pattern recognition on that exact transition. Engineers who have lived through it twice can smell Phase 2 coming. They know the question after "can you build this?" is always "can you run this every day?" — and they start picking tools that survive the second question from the beginning, even when the first version is a sketch. That is not over-engineering. That is knowing what the next conversation will be.

The cost of skipping that judgment is asymmetric. Building in Phase 2 tools from day one costs you maybe 20% more upfront: an hour writing to Parquet instead of CSV, an afternoon standing up a minimal Airflow instance, a week learning enough SQL to stop reaching for pivot tables. Rebuilding in Phase 2 tools after the fact costs you the original build, plus the rebuild, plus the migration, plus the trust you lose when the Phase 1 version breaks in front of a stakeholder. It is the kind of interest you do not see on any invoice.

## A Framework You Can Actually Use

There is no flowchart that will save you. There are a handful of diagnostic questions that will.

*What was this tool originally built for?* Read the first paragraph of its docs, not the marketing page. Excel's docs talk about spreadsheets. Jenkins's docs talk about builds. If the job you are using it for is not in that first paragraph, you are off-label.

*Is this Phase 1 or Phase 2?* Phase 1 is proving the thing works. Phase 2 is running the business. The answer changes which tool is correct.

*Has a stakeholder already asked the scale question, or are they about to?* Every successful prototype earns a "can we run this every day?" within weeks. If you are close to a demo, you are close to that question.

*How far has the actual job drifted from what this tool was designed for?* A little drift is normal. A lot of drift is a migration waiting to happen.

*What is the cost of switching now versus switching in two years, after three more systems depend on it?* That cost is almost always lower today, and almost always underestimated.

The cost of using the wrong tool is rarely visible in the moment. It shows up months later, as tribal knowledge, 3 AM pages, brittle handoffs, and the senior engineer who is the only person who "understands the pipeline." Picking the right tool is not about being trendy. It is about recognizing which phase you are in and not paying compounding interest on a Phase 1 decision you made in a hurry.

The first working version is precious. Protect it. But the day a stakeholder asks to scale it is the day the tooling conversation starts, not six months later, when the prototype is already load-bearing and the migration is somebody else's problem.
