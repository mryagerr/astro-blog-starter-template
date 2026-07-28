---
title: 'How to Start Maintaining an Ontology as a Non-Technical Business Owner'
description: 'An ontology is just the written-down meaning of the words your business runs on — what a customer is, when a sale counts, what "active" means. You do not need to code to own it. You need to decide, write it down, and keep it current. Here is how to start.'
pubDate: 'Jul 28 2026'
heroImage: '/blog-ontology-maintenance.png'
difficulty: 'low'
tags: ['culture', 'analysis']
---

If you own a business, you already own an ontology. You just have not written it down. Every time you say "that's not really a customer yet" or "we don't count a deal until the contract is signed," you are stating a rule about what your words mean. An **ontology** is nothing more exotic than the collected set of those rules — the definitions of the concepts your business runs on, written down where everyone can see them.

The word sounds like something that belongs to a data team or a philosophy department, and the technical version can get complicated. But the version that matters to a business owner is not technical at all. It is a document. It says what a *customer* is, when a *sale* counts, what makes a lead *qualified*, and what *active* means when someone says "active accounts." Maintaining it is a business responsibility, not a coding one — and if you leave it to whoever happens to write the next dashboard query, you have handed one of the most important decisions in your company to whoever is closest to the keyboard.

This article is about how to start owning that document, in plain terms, without touching a database.

## Why This Is Your Job, Not the Data Team's

The instinct is to assume that defining a "customer" is a technical question, so it belongs to whoever manages the data. It is exactly backwards. The data team can tell you *how many rows* match a definition. They cannot tell you *which definition is right* — that is a business judgment, and it is yours.

Here is what happens when the business owner opts out. Someone needs to build a report on active customers. They open the database, they see a `status` column, and they make a reasonable-looking choice: `status = 'active'`. Except `status = 'active'` might just mean the record was never deleted. It might include free trials, dormant accounts, and the test account your developer created in 2021. Now that definition is baked into a report an executive reads every Monday, and nobody in the room decided it — it was a side effect of how the software happened to store things.

The person who should decide what "active customer" means is the person who understands what the business is trying to do with that number. That is you. The data team's job is to *implement* your definition faithfully and tell you when reality does not match it. Your job is to *make* the definition. An ontology is where that division of labor gets written down.

## Start With the Words You Argue About

You do not begin by mapping your entire business. You begin with the handful of words that cause confusion, because those are the ones already costing you money.

Listen for the moments in meetings when two people use the same word and clearly mean different things. Sales says "we closed 40 deals"; finance says "we recognized 31." Marketing reports "2,000 leads"; sales says "we got maybe 300 real ones." Nobody is lying. They are using different definitions of *closed*, *deal*, and *lead*, and no written definition exists to settle it. Every one of those disagreements is a candidate for your ontology.

A good starting list for most businesses is short:

- **Customer** — Is someone a customer when they sign, when they pay, or when they first use the product? Does a churned customer still count as a customer?
- **Sale / Deal / Order** — At what moment does one exist? Signed contract? First payment? Delivery? Does a refund undo it?
- **Lead / Prospect** — What makes someone a lead versus just a name in a spreadsheet? What makes a lead *qualified*?
- **Active** — Active in the last 30 days? Ever logged in? Currently paying? "Active" is the single most abused word in business data.
- **Revenue** — Does it count when invoiced or when collected? Gross or net of discounts and refunds?

Pick the three that cause the most arguments. That is your first draft. You are not trying to be comprehensive; you are trying to stop the bleeding on the definitions that already hurt.

## Write Each Definition Like You're Settling a Bet

A definition that only covers the obvious case is not worth writing down, because the obvious case was never the problem. The value is entirely in the edge cases — the situations where reasonable people disagree. Write each definition as if you are refereeing a dispute, because eventually you will be.

A weak definition: *"An active customer is a customer who is active."* This is circular and settles nothing.

A strong definition: *"An active customer is an account that has both a paid subscription in good standing AND at least one product login in the trailing 90 days. Free trials are not active customers. Paused accounts are not active. An account that paid but never logged in is not active — it is 'paid-inactive,' which we track separately because it signals a churn risk."*

Notice what the strong version does. It states the main rule, and then it walks through the awkward cases and rules on each one: trials, pauses, paid-but-never-used. Those rulings are the whole point. The next time someone builds a report, they are not guessing about trials — you already decided.

For each concept, aim to capture four things in plain language:

1. **The one-sentence definition.** What it is, in the simplest true form.
2. **What it explicitly excludes.** The tempting-but-wrong cases. ("Trials are not customers.")
3. **The edge case rulings.** The three or four situations people actually argue about.
4. **Who owns it.** One named person who gets the final say when a new edge case appears.

That fourth item matters more than it looks. A definition without an owner drifts, because when a new edge case shows up — and it will — there is no one whose job it is to rule on it. Name the owner. It is often you, and that is fine.

## Keep It Somewhere Boring and Shared

The format does not matter nearly as much as the *findability*. Your ontology can live in a shared doc, a wiki page, a spreadsheet with one row per term, or a channel everyone knows to check. What it cannot be is a file on your laptop, a decision that lives only in your head, or an email thread from last spring that nobody can find.

The test is simple: when a new hire asks "wait, what counts as a customer here?", can someone point them to one place that answers it without a meeting? If yes, you have an ontology. If the answer is "ask Dana, she knows," then Dana *is* your ontology — and Dana is going to leave, take a vacation, or simply forget which edge case she ruled on last quarter. A written definition is insurance against the day the knowledge walks out the door.

Keep the structure flat and plain. One term, one definition, one owner, a short list of edge-case rulings, and the date it was last reviewed. Resist the urge to make it fancy. A boring document that people actually read beats an elaborate system that only the person who built it can navigate.

## Maintenance Is a Habit, Not a Project

Here is the part the word "maintaining" is doing in the title. An ontology is not something you write once and frame on the wall. Your business changes — you launch a product line, enter a new market, change how you bill — and every one of those changes can quietly break a definition that used to be true. Maintenance is the discipline of keeping the written meaning in sync with the actual business.

The good news is that maintenance is cheap if you make it a habit and expensive if you let it lapse. A few practices keep it light:

- **Review on a schedule.** Once a quarter, read through the definitions and ask: is any of these no longer true? Put a "last reviewed" date on each so you can see what has gone stale. Fifteen minutes a quarter prevents a year of confusion.
- **Update when the business changes, not after.** When you decide to start offering annual contracts, that is the moment to ask "does this change what a *sale* is?" — not six months later when finance and sales are arguing about it again. Tie definition updates to business decisions.
- **Capture new edge cases as they surface.** The first time someone asks "well, does a partial refund count?", that question has an answer, and the answer belongs in the document. Every argument you settle is a ruling worth saving so you never have to settle it twice.
- **Version the changes.** When a definition changes, note what it was, what it became, and when. A number that "went up 20%" might just mean the definition got wider. Anyone reading a trend needs to know when the ruler changed length.

That last point is the one businesses miss most often. If you quietly redefine "active customer" to include a new tier, your active-customer count jumps — and it looks like growth. It is not growth. It is a measurement change. Recording *when* a definition changed is what lets you tell a real trend from an accounting artifact.

## What You Get for the Effort

The payoff is not abstract. A maintained ontology is what makes every number in your business comparable to every other number. It is what lets two dashboards agree. It is what stops the Monday meeting from spending its first fifteen minutes reconciling whose "revenue" is correct. It is what lets you hand a question to your data team and trust that the answer counts the things you meant.

Most importantly, it keeps the meaning of your business under *your* control instead of leaking, one query at a time, into decisions made by whoever last touched the data. You do not need to learn to code to protect that. You need to decide what your words mean, write it down where people can find it, name who owns each one, and revisit it when things change. That is a business owner's job, and it is one of the highest-leverage hours you will spend all quarter.

## The Low Hanging Data Take

The reason ontology maintenance gets neglected is that it never feels urgent. No customer is lost, no invoice goes unpaid, on the day a definition drifts. The cost shows up later and diffusely — in a meeting that runs long, a report that gets rebuilt, a "growth" number that turns out to be a redefinition. Because the cost is spread out, it is easy to never pay attention to it, and easy to convince yourself it is someone else's technical problem.

It is not a technical problem. It is a decision problem, and decisions are what owners are for. Start with three words you argue about. Write down what they mean, including the awkward cases. Name who owns each one. Put it somewhere everyone can find. Read it once a quarter. That is the entire practice, and it does not require a single line of code — just the willingness to decide what your business actually means when it speaks.

## Next Steps

- **[Ontology vs Semantic Layer: What Each One Actually Is](/article/ontology-vs-semantic-layer/)** — Once your definitions are written down, this is how they get enforced inside the data stack.
- **[The Telephone Game of Bad Analytics](/article/telephone-game-bad-analytics/)** — What happens to a number when shared meaning erodes across every handoff.
- **[Leave the Ivory Castle: How SMEs Expose the Gaps Your Data Hides](/article/data-quality-gaps-sme/)** — Why the people doing the work often know your definitions are wrong before the data does.
- **[KPIs Are a Cultural Change, Not a Dashboard Project](/article/kpis-are-a-cultural-change/)** — Why agreeing on what a metric means is a behavioral commitment, not a technical deliverable.
