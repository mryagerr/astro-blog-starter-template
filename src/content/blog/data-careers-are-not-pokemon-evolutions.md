---
title: 'Data Careers Are Not Pokemon Evolutions'
description: 'Data Analyst → Data Engineer → Data Scientist sounds like a clean progression, but the reality is messier, richer, and far more interesting than a linear evolution chain.'
pubDate: 'Oct 15 2025'
heroImage: '/blog-data-careers.png'
difficulty: 'low'
tags: ['career']
---

A persistent mental model in data career advice runs as follows:

> Start as a **Data Analyst**. Advance to **Data Engineer**. Progress into **Data Scientist**.

The framing is tidy. It implies growth. It has a narrative arc — from reading data, to building it, to predicting with it — that resembles the level-up progression familiar from video games and RPG character trees.

The framing does not match how the roles actually operate.

## Where the Linear Model Breaks Down

A linear progression assumes that each role is strictly more advanced than the one before it, that the skills required stack cleanly, and that the end-stage represents the highest expression of the craft. None of this holds up in practice.

- A **Data Scientist** at a startup typically spends 60% of their time writing SQL and building ETL jobs — work often categorized as Analyst or Engineer scope at a larger company.
- A **Data Engineer** at a hedge fund may require deeper statistical knowledge than a Data Scientist at a consumer app company.
- A **Data Analyst** who owns end-to-end data infrastructure, builds dashboards, and runs experiments often has more scope than Data Scientists at larger organizations.

The roles are not a ranked ladder. They are better described as three overlapping responsibility areas, each with a distinct center of gravity but substantial overlap in required skills.

## What Each Role Actually Owns

Rather than thinking about levels, think about what problem each role is primarily hired to solve.

### Data Analyst

The core job: **turn existing data into decisions**. This means writing SQL, building dashboards, understanding the business context, and communicating findings to stakeholders. The word "analyst" is load-bearing — the job is to analyze, not to build infrastructure or train models.

Strong Analysts develop sharp business intuition, identify which questions are worth answering, and become fluent in the specific data model the organization uses. That institutional knowledge is difficult to replicate and undervalued in most organizations.

Skills that are central: SQL, visualization (Tableau, Looker, or just Python/matplotlib), business communication, spreadsheets, basic statistics.

### Data Engineer

The core job: **make data available, reliable, and fast**. Engineers build the pipelines that move data from sources to storage, design schemas, manage orchestration, and ensure the whole system doesn't fall over. The Analyst and Scientist depend on the Engineer's output.

Data Engineering is software engineering applied to data problems. It borrows heavily from backend development — distributed systems, APIs, databases, infrastructure-as-code — but the domain knowledge is about data modeling, warehouse design, and pipeline reliability.

Skills that are central: Python, SQL (again — everyone needs SQL), Spark or similar, cloud platforms (AWS/GCP/Azure), orchestration tools (Airflow, Prefect, Dagster), data modeling.

### Data Scientist

The core job: **build models that generate predictions or automated insights**. This could mean a recommendation engine, a churn prediction model, a forecasting system, or a fraud detector. The Scientist owns the modeling lifecycle: feature engineering, training, evaluation, and monitoring.

In practice, a large part of the job is the same data wrangling that Analysts and Engineers do, just aimed at model inputs rather than business dashboards. The differentiating skill is statistical fluency and ML knowledge.

Skills that are central: Python, statistics, ML frameworks (scikit-learn, PyTorch, XGBoost), feature engineering, experiment design, model evaluation.

## The Overlapping Middle

The linear model obscures a substantial shared skill base across all three roles.

**SQL is universal.** Every data role requires SQL proficiency. Engineers write it to build pipelines. Analysts write it to answer questions. Scientists write it to construct training datasets. Positioning SQL as a junior-only skill misrepresents how production data teams operate.

**Python spans all three roles.** Analysts use pandas for manipulation. Engineers use Python to build pipelines. Scientists use it for modeling. The language does not signal seniority — it is a baseline expectation across the function.

**Domain knowledge compounds.** The most effective data practitioners, regardless of title, understand the business deeply. Why does a given metric spike on Tuesdays? What does "conversion" mean in this specific funnel? This knowledge is role-agnostic and accumulates with time in the organization.

## The Roles That Don't Fit the Chain at All

The linear model also ignores entire categories of data work:

**Analytics Engineer** — A hybrid role that lives between Analyst and Engineer. The job is building clean, reliable data models in the warehouse (usually with dbt) so Analysts can self-serve without needing Engineering tickets. This role didn't exist as a job title a decade ago and now it's one of the most in-demand positions on data teams.

**ML Engineer** — Closer to Software Engineer than Data Scientist. The job is deploying, scaling, and maintaining ML systems in production. A Data Scientist hands off a model; an ML Engineer makes it run reliably at scale. Heavy on software engineering fundamentals.

**Data Platform Engineer** — Focused on the infrastructure that data teams run on. Manages the warehouse, the orchestration system, the compute, the access controls. Closer to DevOps or SRE than to a traditional Data Engineer.

**Quantitative Analyst / Research Scientist** — Roles common in finance, pharma, and research institutions where the statistical and domain depth far exceeds what a typical "Data Scientist" job requires. These often demand PhD-level expertise in specific fields.

None of these roles fit the Analyst → Engineer → Scientist chain. They emerged from distinct requirements and skill bases.

## Why the Linear Model Persists

The linear model is appealing because it provides a roadmap. "I'm a Data Analyst, I want to grow, what should I do?" is an easier question to answer when the response is "become an Engineer or Scientist." Career content is simpler to write in stages and levels.

The model also reflects how some careers did develop in the early 2010s, when data teams were small and practitioners performed every function before specialization was possible. One person might have started in analysis, built pipelines out of necessity, and eventually prototyped models. That progression is a valid path through the role space — it is not the only one, and it does not describe the function as it operates today.

## A More Useful Mental Model

Instead of a linear chain, think of data roles as defined by two axes:

**Axis 1: Analysis ↔ Engineering** — How much of the work is about understanding and interpreting data versus building systems that process it?

**Axis 2: Breadth ↔ Depth** — Is the role expected to touch many things at a moderate level, or go very deep in a narrow domain?

A Data Analyst sits toward the Analysis end and often toward Breadth (many metrics, many stakeholders, many business questions). A Data Engineer sits toward the Engineering end. A Data Scientist can sit anywhere depending on company size and team structure — at a small company they're everywhere, at a large company they're deep in modeling only.

The best career moves happen when you identify which direction you want to move on those axes, not when you chase a title that supposedly represents a higher evolution stage.

## The Low-Hanging Fruit

For a Data Analyst considering whether to move into Engineering or Science, the relevant questions are not about progression but about fit:

- Which problems are you most effective at solving?
- Which skills produce your highest-impact work?
- Which gaps on the current team align with your capabilities?

Engineering is the appropriate direction for practitioners who find systems work more compelling than business-facing analysis. Science is appropriate for those focused on prediction problems and statistical depth. Staying in Analysis — while going deeper on SQL, dbt modeling, or Python — is an equally valid path and often the highest-leverage one in business-critical roles.

There is no final role. The objective is to identify the combination of skills and problems where the practitioner is most effective, then develop that combination deliberately rather than defaulting to a linear progression narrative.

## Related Articles

- **[From Cheerleader to Quarterback: Why Data Professionals Must Be Half Subject Matter Expert](/article/from-cheerleader-to-quarterback/)** — How domain expertise shapes career trajectory far more than role titles do.
- **[Low Hanging Fruit Reduces Risk and Builds the Expertise to Climb Higher](/article/low-hanging-fruit-reduces-risk-and-builds-expertise/)** — The strategy for building domain knowledge and credibility across any data role.
- **[Organizing Data with SQL](/article/organizing-data-with-sql/)** — The universal skill that spans every data role — the one place the career chain actually converges.
