---
title: 'How BD Used AWS to Stop Guessing When Medical Devices Would Fail'
description: "A look at Becton Dickinson's MPAR system — a real-world example of turning device telemetry into proactive maintenance intelligence using AppFlow, Lambda, Athena, and QuickSight."
pubDate: 'Mar 22 2026'
heroImage: '/blog-aws-iot.png'
---

Michael Petrillo — the same data scientist behind the Reddit-based stock prediction work covered [elsewhere on this site](/posts/stock-trader-project-writeup/) — published an AWS case study in 2022 that deserves more attention than it got. It's a clean, real-world example of the low-hanging-fruit philosophy applied to a high-stakes domain: keeping medical devices online in hospitals.

The article: [Reducing Device Downtime Using Actionable Intelligence on AWS](https://aws.amazon.com/blogs/industries/reducing-device-downtime-using-actionable-intelligence-on-aws/), co-authored with Stephanie Dattoli of AWS.

---

## The Problem

Becton Dickinson (BD) makes medication management devices used in hospitals — the kind of equipment nurses depend on to deliver care to patients. Like all physical devices, they require maintenance. Unlike a laptop that you can swap out, a medication management system going offline mid-shift creates a real patient care problem.

The tension is obvious: devices need maintenance, but maintenance requires downtime, and downtime is unacceptable. BD's field service technicians were being dispatched reactively — showing up to diagnose a problem, then fixing it, all while the device sat offline. The diagnosis step was the waste.

The hypothesis was straightforward: **if you know what's wrong before you arrive, you spend less time figuring it out and more time fixing it.** That's not a radical idea. It's just good operations. The hard part is building the data pipeline to support it.

---

## The Solution: MPAR

BD's DataOps team built the **Machine Performance Assessment Report (MPAR)** — a system that generates plain-language intelligence reports for field technicians before they arrive on-site.

The workflow is worth walking through because it's a good example of composing AWS managed services rather than building from scratch:

1. **Amazon AppFlow** monitors Salesforce for new work order assignments. When a technician is dispatched, AppFlow fires.
2. **AWS Lambda** (first function) pulls device telemetry, runs it through pre-built ML models, and translates the outputs into a readable summary — not a dashboard, an *email* the technician can read on the way to the site.
3. **AWS Lambda** (second function) generates a prioritized list of proactive maintenance opportunities — things the technician can fix while already on-site, before they become the next work order.
4. **Amazon Athena + QuickSight** handle the fleet-level view — ad hoc queries against device telemetry data, surfaced in dashboards for the DataOps and Global Support teams to monitor trends and spot potentially unreported usability issues.
5. **Amazon CloudWatch** monitors the reporting pipeline itself.

The system now deploys hundreds of emails daily to field service teams.

---

## What's Actually Interesting Here

A few things stand out from a data practice perspective.

**They shipped emails, not dashboards.** This is underrated. A technician heading to a customer site doesn't open a BI dashboard. They open their phone. The decision to translate ML outputs into plain-language email reports — rather than building a portal nobody would log into — is the kind of call that separates projects that get used from projects that get demoed once and abandoned.

**The ML outputs feed humans, not automation.** MPAR doesn't auto-schedule maintenance or auto-dispatch technicians. It gives field service humans better information before they make decisions. This is a defensible design choice for a medical device context — you want a person in the loop — but it's also just a more achievable first version of a system. Automating the decision comes later, after you've validated that the insights are reliable.

**Two Lambda functions with distinct jobs.** One handles reactive diagnosis (what's wrong with this specific device on this work order), one handles proactive opportunity identification (what else should we fix while we're there). Keeping those concerns separate means each can be improved independently. This is the kind of architectural discipline that pays off when requirements change.

**They measured adoption, not just accuracy.** The article notes "substantial adoption by field-services teams" after 12 months. This is the right metric. A model with 90% accuracy that nobody uses is worth less than a model with 80% accuracy that changes how technicians work every day.

---

## The Quote That Captures It

> "We only code the parts that aren't already done for us (by AWS) and that saves us so much time... It's like Legos and you can build great things for pennies on the dollar — that's the beauty — do it quickly, at a low cost, so we can focus on delivering a better customer experience."
>
> — Warren Hall, Software Engineering Manager at BD

This is exactly the low-hanging-fruit argument applied to infrastructure. Don't rebuild the event trigger, the workflow integration, the query engine, or the visualization layer. Those are solved problems. Use AppFlow, Lambda, Athena, and QuickSight. Code the part that's uniquely yours: the ML model that understands your device telemetry, and the business logic that turns its output into something a technician can act on.

---

## The Broader Pattern

The MPAR project follows a pattern that comes up repeatedly in successful DataOps work:

1. **Start with the human workflow.** BD began by engaging deeply with field technicians and customers to understand what they actually needed — not what data science could theoretically provide.
2. **Use existing data first.** The solution leverages telemetry already collected by in-field devices. No new sensors, no new data collection infrastructure.
3. **Ship something people will actually use.** An email. Not a dashboard, not an app, not a portal. An email that shows up when a work order is assigned.
4. **Measure operational impact, not model metrics.** Device uptime and field service efficiency, not AUC.

The field service technician quote that closes the article says it best:

> "When our field service technicians demand to know when they can start using the tool, we'll know we've got it right." — Michael Petrillo

That's the bar. Not whether the model is statistically significant. Whether the people who need it are asking for it.

---

**Further reading:**
- [Low-Hanging Data Sources for Stock Prediction](/article/low-hanging-data-sources-for-stock-prediction/) — more work from the same author, applying a similar data-driven approach to financial markets.
- Original article: *Reducing Device Downtime Using Actionable Intelligence on AWS* — Petrillo, Dattoli & McCallion, AWS Industries Blog, May 2022.
