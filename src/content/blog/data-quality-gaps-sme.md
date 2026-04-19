---
title: 'Leave the Ivory Castle: How SMEs Expose the Gaps Your Data Hides'
description: 'Clean schemas and passing validation checks give analysts a false sense of security. The real data quality gaps live in the heads of subject matter experts — and paranoia is the skill that surfaces them.'
pubDate: 'Dec 06 2025'
heroImage: '/blog-data-quality-gaps.png'
difficulty: 'low'
tags: ['culture']
---

Your data looks fine. The joins don't produce duplicates. There are no nulls in the required columns. Row counts match expectations. The validation script is green.

Now go sit down with the person who actually enters that data every day.

There is a very high probability that within fifteen minutes, you will learn something that fundamentally changes how you interpret a field you thought you understood completely. This is not a failure of your analysis. It is how data quality work actually gets done.

## The Ivory Castle Problem

Data analysts and engineers spend most of their time in a clean, abstract world: schemas, queries, pipelines, dashboards. The data arrives already shaped. The tools provide structure. The numbers have column names.

This environment trains you to ask a specific kind of question: *Is the data technically valid?* Does it conform to the schema? Are the foreign keys intact? Can the transformation run without errors?

These are not the wrong questions. They just aren't the only questions. The more dangerous question — the one the tools can't answer — is: *Does the data mean what you think it means?*

Staying in the castle means you only ever ask the first kind. You build models, dashboards, and reports on definitions that exist nowhere except inside your own head and inside the CREATE TABLE statement. You optimize for technical correctness while the semantic gaps compound quietly beneath the surface.

## What the Gemba Is and Why It Matters

In lean manufacturing, *gemba* (現場) means "the actual place" — the shop floor, the warehouse, the point of production. The core insight is that you cannot fully understand a process by reading about it at a desk. You have to go where the work happens.

The same principle applies to data. The gemba for data quality is wherever the data originates: the intake form, the warehouse receiving terminal, the customer service ticket system, the ERP screen that a logistics coordinator fills out forty times a day.

Go there. Watch the process. Ask questions. Then ask paranoid follow-up questions.

| Question You Think You're Asking | What You Should Also Ask |
|---|---|
| "Is `status` populated?" | "What does each status value actually mean in practice?" |
| "Do the order counts match?" | "Are there order types that get excluded before this point?" |
| "Is the timestamp populated?" | "Is this when it happened, or when someone got around to entering it?" |
| "Are customer IDs unique?" | "Are there test accounts, internal accounts, or dummy records mixed in?" |
| "Does `amount` sum correctly?" | "Are adjustments, credits, or reversals captured separately?" |

Every one of these has burned someone. Often someone smart who thought the data was clean.

## Paranoia Is a Professional Skill

There is a specific mental posture that makes this kind of discovery work well: productive paranoia. Not anxiety, not distrust of colleagues — a disciplined habit of assuming that every field has at least one exception the documentation didn't mention.

When you look at a field called `is_active`, the paranoid analyst's first thought is not *great, a boolean, easy*. It's:

- Active as of when? As of the last update? As of this morning's batch job?
- Who sets this to true? Who sets it to false? Is it ever set back to true?
- Are there rows where this is technically true but practically inactive?
- What happens to records when something is deleted — are they removed or just flipped to false?

These questions feel excessive. They aren't. They are the difference between a metric that reflects business reality and one that quietly counts things that should not be counted.

The most damaging data quality issues are not the ones that produce errors. They are the ones that produce plausible-looking wrong numbers. A `status = 'active'` filter that includes dormant accounts from 2019 will never throw an exception. It will just make your retention metrics look better than they are, and someone will make a business decision based on them.

## What Happens When You Go to the Gemba

Here is a concrete example of the pattern. You are building a report on active customer revenue. The data shows:

```sql
SELECT
  customer_id,
  SUM(transaction_amount) AS total_revenue
FROM orders
WHERE customer_status = 'active'
GROUP BY customer_id
```

The query runs cleanly. The numbers look reasonable.

You go sit with the team that manages customer accounts and ask: *What does `customer_status = 'active'` actually mean?*

What you learn:

1. **"Active" is never automatically changed.** When a customer stops ordering, no one updates the status. It only changes if someone manually archives it, which happens inconsistently.
2. **Test accounts are in the production table.** They have realistic-looking data because the team uses them to demo the system to new hires.
3. **Refunded orders are not removed.** They appear as negative transactions but still count toward the customer record.
4. **There is a second status field** called `account_type` that distinguishes real customers from internal accounts. Nobody told you because it's been there so long they forgot it needed explaining.

None of these show up in the schema. None of them fail a validation check. All of them corrupt your analysis.

The query you actually want looks something like:

```sql
SELECT
  customer_id,
  SUM(transaction_amount) AS total_revenue
FROM orders
WHERE
  customer_status = 'active'
  AND account_type NOT IN ('internal', 'test')
  AND last_transaction_date >= DATEADD(year, -2, CURRENT_DATE)
  AND transaction_amount > 0  -- exclude refunds
GROUP BY customer_id
```

You didn't find those filters in a data dictionary. You found them by asking.

## How to Actually Do This: A Practical Approach

Going to the gemba is not just "talk to people." It's a structured investigation. The goal is to surface the implicit rules, exceptions, and domain knowledge that never made it into any documentation.

### 1. Map the Origin

Before you start querying, find out where each field comes from. Who enters it? What system generates it? What downstream process relies on it? This context alone will tell you where the bodies are buried.

### 2. Ask About the Exceptions

Every SME knows about the exceptions. They may not think to mention them because from their perspective, "everyone knows" about the April migration or the test accounts or the legacy import that left 200 bad rows. Ask directly: *"Is there anything unusual about this data that I should know before I start analyzing it?"*

And then ask again, more specifically: *"Are there any records in here that should be excluded but might not be obvious from the data itself?"*

### 3. Bring the Data to the Conversation

Don't ask people to describe data in the abstract. Show them a sample. Pull 20–30 rows that cover the range of values and walk through them together. Rows that look totally normal to you will often prompt a reaction: *"Oh, that one — that's a manual override, those get entered differently."*

This technique surfaces more issues in 20 minutes than most data quality documentation reviews surface in a month.

### 4. Treat Every Field Definition as a Hypothesis

Document what you think each field means before the conversation. Then treat that documentation as a hypothesis to be tested, not a fact to be confirmed. If the SME says the field works exactly the way you expected, great — you've validated the hypothesis. If they look puzzled and say "well, mostly, except...", you've just found a gap.

### 5. Look for the Invisible Filters

One of the most common hidden gaps is the filter that domain experts apply automatically without realizing it's a filter. The warehouse manager looks at the orders table and mentally excludes the "VOID" records, the "SAMPLE" records, and the orders from before the system migration — not because those are documented as exclusions, but because they've always ignored them. Your query doesn't know to do the same.

Ask: *"When you think about [metric], are there any records you'd never include?"*

## The Signals That Tell You There's a Gap

You don't always have time for a full SME interview before every analysis. But certain signals should trigger immediate investigation:

- **The number looks suspiciously clean.** Real business data has noise. If every category sums to a round number or the percentages add up too perfectly, something is filtering things you might not intend to filter.
- **The SME's gut reaction doesn't match your number.** When you present a metric and the domain expert says "that seems high" or "that doesn't sound right" — believe them first. Investigate second.
- **A field has a small number of distinct values.** Enum-like fields (`status`, `type`, `category`) are where business logic lives in hiding. Each value has a history.
- **There's a field you can't find documentation for.** Its existence means someone needed it at some point. Find out why.
- **The data history shows a sudden change.** A discontinuity in a time series is almost always a process change, a migration, or a definitional shift. The data didn't change randomly; something changed in the world.

## The Cost of Skipping This

The math here is not complicated. A data quality gap that goes undetected until it reaches a strategic decision costs orders of magnitude more than the conversation that would have caught it.

The uncomfortable version: every analyst who has worked in industry for more than a few years has a story about a report they were proud of, that was cited in a meeting, that turned out to be measuring something subtly different from what everyone thought. The numbers weren't wrong in a way the system could detect. They were wrong in a way that only the person who ran the process every day would recognize.

That person was available. They just weren't asked.

## Closing: Productively Paranoid, Not Perpetually Anxious

The goal is not to be paralyzed by uncertainty or to treat every dataset as hopelessly corrupt. It is to approach unfamiliar data with calibrated skepticism — assuming that there are things you don't know, building the habit of asking, and treating the first clean result as the beginning of the investigation rather than the end of it.

The ivory castle is comfortable. The data there always looks good. But good-looking data that doesn't reflect operational reality isn't an asset — it's a liability that just hasn't failed yet.

Leave the castle. Go find the person who owns the process. Sit with them for an hour. Ask the paranoid questions.

The gaps are waiting to be found. The only question is whether you find them before or after someone builds something important on top of them.
