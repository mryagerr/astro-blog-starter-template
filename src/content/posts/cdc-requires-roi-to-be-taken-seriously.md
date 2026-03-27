---
title: 'Change Data Capture Requires an ROI to Be Taken Seriously'
description: 'CDC is powerful infrastructure, but it carries real costs in complexity, maintenance, and operational overhead. If you cannot articulate the return, you will not get buy-in — and you probably should not build it.'
pubDate: 'Mar 27 2026'
heroImage: '/blog-placeholder-3.jpg'
difficulty: 'high'
---

Change Data Capture is one of those technologies that data engineers love talking about more than organizations love funding. The pitch is compelling: instead of batch-loading entire tables on a schedule, you stream every row-level change — inserts, updates, deletes — in near real-time, directly from the database transaction log. It's elegant. It solves real problems. And it is genuinely difficult to justify to anyone who controls a budget.

This article is about why CDC projects stall, and what it actually takes to make the case.

## What CDC Does (and What It Costs)

The technical premise is straightforward. Relational databases like PostgreSQL and MySQL maintain a transaction log — a sequential record of every committed change — primarily for replication and crash recovery. CDC tools like Debezium tap into this log, parse the change events, and publish them to a downstream system (usually Kafka, sometimes a cloud queue or direct database sink).

The result is a stream of change events that downstream consumers can use to maintain derived datasets, trigger workflows, keep caches synchronized, or replicate data to analytical systems without the latency or load of periodic full-table scans.

The costs are not hidden, but they are underestimated:

**Operational complexity.** CDC pipelines have more moving parts than batch ETL. You're managing a connector, a message broker, schema evolution, consumer lag, and failure modes that don't exist in a world where you just `SELECT *` on a schedule. Each of those components can fail independently.

**Schema evolution.** When the source schema changes — a column is added, a type is altered, a table is renamed — your CDC pipeline needs to handle it gracefully. This is harder than it sounds. Debezium has schema history topics for a reason, and the reason is that schema changes break things in ways that are painful to diagnose.

**Infrastructure cost.** Running Kafka (or Confluent, or MSK, or Redpanda) for CDC is not free. The managed services make it easier, but the cost is real. For small data volumes, it's expensive infrastructure for a modest benefit.

**Expertise requirements.** CDC systems require people who understand distributed systems, database internals, and stream processing. That's a narrower skill set than "person who writes SQL and Python." When something goes wrong at 2am, you need someone who can read a Kafka consumer group lag graph and understand what a `TOAST` overflow means for PostgreSQL replication.

**Source database impact.** Reading from the replication slot keeps the WAL alive until the slot is consumed. A stalled consumer can cause WAL accumulation that fills your disk and takes down the database. This is not a theoretical risk.

## Why CDC Projects Stall

Most CDC projects don't fail because the technology doesn't work. They stall at the proposal stage, or die in the maintenance phase, because the ROI was never clearly articulated.

The typical CDC proposal sounds like this: *"We should set up change data capture so our data warehouse is more up-to-date and we can reduce load on production databases."*

That's not a business case. "More up-to-date" and "reduced load" are properties, not outcomes. They don't answer the question that every infrastructure investment actually needs to answer: **what decision gets made differently, or what problem gets solved, because of this?**

When the ROI is fuzzy, a few things happen:

- Engineering leadership approves the project but assigns it low priority, so it drags for months.
- The project gets built but never fully operationalized because no one owns it.
- The first time it breaks in production, no one has clear ownership and it stays broken.
- It gets abandoned in favor of a batch process that "works well enough."

## Building the ROI Case

A credible CDC ROI case has three components: a specific problem, a quantified cost of that problem, and a specific mechanism by which CDC solves it.

### Identify the Problem That Requires Low Latency

CDC is a solution to a latency problem. If your batch jobs run hourly and that's sufficient, CDC doesn't help you — it just adds complexity. The case for CDC starts with a use case that genuinely requires fresher data than batch can provide.

Common legitimate use cases:

**Fraud detection and risk scoring** — Hours-old data means hours of exposure. If a compromised account generates transactions for three hours before the next batch job catches the pattern, the cost is real and quantifiable: fraud losses that CDC would have reduced.

**Operational dashboards that drive SLA decisions** — If customer support uses a dashboard to triage issues, and that dashboard is fed by an hourly batch job, they're making SLA decisions on stale data. The cost is escalations, SLA breaches, and customer churn. Those can be estimated.

**Inventory and fulfillment synchronization** — If your warehouse management system and your e-commerce platform are out of sync by hours, you oversell inventory. Each oversell event has a cost: refunds, customer service time, damaged relationships.

**Cache invalidation** — Serving stale data from a cache because your invalidation mechanism is a scheduled job is a product quality problem. If that stale data causes user-visible bugs or incorrect pricing, it has a cost.

The pattern in each case: there is a real, existing cost to data latency that a business already feels. CDC is the mechanism to reduce it.

### Quantify the Current Cost

"We think stale data is causing some problems" is not enough. You need a number.

Fraud losses attributable to detection latency. Percentage of customer service tickets that involve stale data. Number of oversell events per month and average cost per event. Estimated revenue impact of product quality issues caused by cache staleness.

These numbers don't have to be precise. A rough estimate — "we lose approximately $40,000/month in fraud that earlier detection would prevent" — is enough to work with. The point is that you're anchoring the ROI conversation to something real.

If you can't find a number, it's worth asking whether the problem is real enough to justify the investment.

### Estimate the CDC Implementation and Operating Cost

Once you have a problem and a cost, you need the other side of the equation: what does CDC actually cost to build and operate?

A realistic estimate includes:

- Engineering time to implement (connector setup, schema handling, consumer development, testing) — typically 4–12 weeks for a first production deployment
- Ongoing engineering time for maintenance — schema evolution events, incident response, capacity management
- Infrastructure costs — Kafka cluster or managed service, additional monitoring
- On-call burden — CDC pipelines need monitoring and someone responsible for them

If your problem costs $40,000/month and CDC costs $8,000/month in infrastructure and engineering overhead, the ROI is clear. If your problem is a vague improvement in "data freshness" with no attached cost, and CDC would cost $8,000/month, the project is not going to get funded — and shouldn't.

## The Conversation You're Actually Having

Presenting a CDC project to engineering leadership or a business stakeholder is, at its core, a conversation about whether a problem is worth solving and whether this is the right solution.

The questions that will come up:

**"Why can't we just run the batch job more frequently?"** — This is a legitimate question. If running your ETL every five minutes instead of every hour solves the problem, that's a much cheaper answer. CDC is justified when more-frequent batching doesn't work: because it still introduces too much latency, because it creates too much load on the source, or because you need event-level granularity (not just the latest state).

**"What happens when this breaks?"** — Have an answer. Who gets paged? What's the runbook? What's the fallback if the CDC pipeline is down for four hours? If you can't answer this, the project will be seen as a liability.

**"Is this the priority?"** — Even a good ROI case competes with other investments. Be prepared to articulate why CDC is higher priority than the other items on the roadmap. This usually comes back to the magnitude of the problem it solves.

## When CDC Is Not the Answer

For completeness: CDC is often proposed when it's not the right tool.

If you need data freshness but your bottleneck is actually query performance or data model complexity, CDC won't help. If the source system doesn't have a replication log (some legacy databases, file-based sources, external APIs), CDC isn't applicable. If you have a small data volume and a batch pipeline that runs every few minutes, you probably don't need CDC.

The right question isn't "should we use CDC?" It's "what's the cheapest way to solve our latency problem?" Sometimes CDC is that answer. Often it isn't.

## Practical Starting Point

If you believe CDC is the right answer for a specific problem, the path forward is:

1. Document the specific use case and its current cost.
2. Verify that the source database supports CDC (PostgreSQL logical replication, MySQL binlog, SQL Server CDC — all work; older systems may not).
3. Run a proof of concept with Debezium against a non-production database, with a simple consumer that writes to a local file or database table. Understand the failure modes before proposing production deployment.
4. Build a cost model: infrastructure, engineering time, and ongoing maintenance.
5. Present the case with a specific problem, a quantified cost, a realistic implementation estimate, and an operational plan.

That's a proposal that gets funded. Vague appeals to "real-time data" don't.

---

- **[Building Your First Data Pipeline](/blog/building-your-first-data-pipeline)** — Foundational pipeline concepts before adding streaming complexity.
- **[Scheduling and Automating Pipelines](/blog/scheduling-and-automating-pipelines)** — Often the right answer before reaching for CDC.
