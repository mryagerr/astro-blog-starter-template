---
title: 'How to Be a Data Champion'
description: 'A data champion does not wait for perfect requirements, hoard certainty, or ship in the dark. They pull direction out of the business, buy room to experiment, make the case for telemetry, and sequence the whole thing crawl, walk, run.'
pubDate: 'Jul 24 2026'
difficulty: 'high'
tags: ['culture', 'career']
---

Most organizations do not have a data problem. They have a data champion problem. There is data, there are tools, there is even a team — but nobody whose job it is to stand between the messy ambition of the business and the literal requirements a system needs to run. The work stalls in the gap. Requests arrive half-formed, experiments get killed before they produce a signal, telemetry gets cut as "nice to have," and every initiative is expected to arrive fully formed on day one.

A data champion closes that gap. Not by being the best modeler or the fastest SQL writer in the building — those help, but they are not the job. The job is to convert vague business intent into buildable direction, protect the space to experiment, argue for the instrumentation that makes the work observable, and stage the whole effort so it delivers value before it is finished. This article is about how to actually do that.

## Requirements Are Not Handed to You — You Extract Them

The most common thing a stakeholder says is some version of: *"Can you pull the numbers on this?"* That is not a requirement. It is a symptom of a question they have not finished asking. If you build to it literally, you produce a deliverable that is technically correct and practically useless, and the request comes back three more times with "actually, can you also…"

A data champion treats the initial ask as the opening of a conversation, not the specification. The move is to work backward from the decision. Not "what data do you want," but "what are you going to do differently depending on what this shows?" If there is no decision on the other end — if the answer changes nothing — that is worth surfacing early, before anyone builds a pipeline for a report nobody will act on.

Extracting requirements looks like:

- **Naming the decision.** "So if this number is high, we hire; if it's low, we hold. Is that the call this feeds?" Forcing the stakeholder to confirm or correct the decision is where the real requirement lives.
- **Bounding the scope.** "Do you need this for last quarter, or do you need it to keep updating?" A one-time answer and a standing metric are entirely different builds. Guessing wrong wastes weeks.
- **Establishing the threshold of good enough.** "Is a rough directional number this week more useful than an exact one next month?" The answer is almost always yes, and it changes everything about how you sequence the work.
- **Writing it back to them.** State the requirement in a sentence and hand it back: "You need a weekly view of X, broken out by Y, accurate enough to decide Z." If they nod, you have direction. If they flinch, you just saved yourself a rebuild.

This is the part people skip because it feels like it is slowing things down. It is the opposite. Every hour spent turning a vague ask into a stated requirement saves days of building the wrong thing. The business does not hand you direction; a champion pulls it out of them and gets it confirmed before writing a line of code.

## Buy Ground to Experiment — Then Actually Use It

You cannot know in advance whether a data source is clean, whether a signal is real, or whether an approach will hold up at scale. The only way to find out is to try it, and trying it means spending time that might not produce a shippable result. In most organizations, that time is the first thing questioned: "You spent two days and there's nothing to show?"

A data champion negotiates for that ground explicitly, up front, instead of apologizing for it after the fact. The framing that works is honest and bounded: *"Give me two days to see if this data even supports the question. If it does, here's what we build. If it doesn't, we've spent two days instead of two weeks finding out the hard way."* You are not asking for open-ended research budget. You are scoping a spike — a small, time-boxed investigation whose deliverable is a decision, not a dashboard.

The discipline that earns you the next experiment is what you do with the ground you bought:

- **Time-box it.** An experiment without an end date is not an experiment, it is a black hole. Two days, one week, whatever — the box is the promise that keeps the door open next time.
- **Define what a negative result looks like.** "If the join rate is below 60%, this source isn't usable" means a failed experiment still produces a clear, reportable outcome. A spike that ends in "I dunno, maybe?" burns the credibility you need for the next one.
- **Report the finding, not the effort.** "This source won't work, here's why, here's the alternative" is a win. It closes a path so the team stops wondering about it. Framed that way, a negative result is a deliverable.

Protecting experimentation is not just protecting your own time. It is protecting the team's. A champion makes it culturally safe to say "we tried it and it didn't pan out," because a team that cannot fail a small experiment safely will never attempt the ambitious one that matters.

## Make the Case for Telemetry Before Anyone Asks for It

Telemetry — the instrumentation that lets a system report on its own behavior — is the single most under-argued-for thing in data work. It is invisible when it is working, it costs effort to build, and it produces nothing a stakeholder can screenshot. So it gets cut. And then the pipeline fails silently on a Tuesday, feeds a stale number into a decision on Wednesday, and someone spends Thursday trying to figure out when it broke and what it touched.

A data champion argues for telemetry in the language of the person who has to approve it, which is never "observability" — it is risk and time.

- **Silent failure is the expensive kind.** A pipeline that crashes loudly gets fixed in an hour. A pipeline that quietly produces wrong numbers gets discovered weeks later, after decisions have been made on it, and the cleanup costs far more than the alerting would have. Telemetry is what converts a silent failure into a loud one.
- **Trust is the actual product.** The moment a stakeholder catches one wrong number, they discount every number after it. Instrumentation — freshness checks, row-count sanity, alerting on anomalies — is what lets you catch the wrong number before they do. You are not instrumenting the pipeline; you are protecting its credibility.
- **It's the difference between watching one thing and watching everything.** A person can eyeball one dashboard. They cannot manually verify fifty. Telemetry is what lets a single person keep tabs on far more systems than they could ever check by hand — the leverage that lets the data function scale past its headcount.

The champion's move is to build telemetry in from the start and bake its cost into the estimate, rather than presenting it as an optional add-on to be negotiated away. When you scope a pipeline, the instrumentation is part of the pipeline, the same way brakes are part of the car. You do not ship a data product you cannot observe, because a data product you cannot observe is one you cannot trust, and one nobody can trust is worth nothing regardless of how elegant the transformation logic is.

## Align the Whole Thing: Crawl, Walk, Run

Everything above — extracting requirements, buying experiment room, arguing for telemetry — comes together in how you sequence delivery. The failure mode a champion is fighting is the all-or-nothing project: months of work behind a curtain, a big reveal, and a business that has either lost interest or moved on. The antidote is to stage the work so it produces value at every phase.

**Crawl is the smallest thing that answers the question.** For requirements, this is the manual pull, the rough number, the one-off query that confirms the decision is real and the direction is right. For experimentation, it is the two-day spike. For telemetry, it is a single freshness check and a Slack alert. Crawl exists to start the feedback loop and prove the thing is worth doing at all. It is allowed to be ugly. It is not allowed to be late.

**Walk is the version informed by what crawl surfaced.** Now that the decision is confirmed and the data is known to support it, you build the repeatable version — the scheduled pipeline, the real deliverable, the instrumentation that covers the failure modes crawl revealed. Walk is where the requirements you extracted earlier become a system, and where the experiments that panned out become production.

**Run is the high-confidence version that only walking makes possible.** Full telemetry, handled edge cases, a deliverable trusted enough that the business builds standing process on top of it. Run cannot be reached directly — you do not get to a trusted, observable, production-grade data product by starting there. You get there by crawling first, learning, walking, learning again, and only then running.

The alignment that matters is keeping all four disciplines in the same phase. Do not build run-grade telemetry for a crawl-grade experiment you might throw away next week. Do not extract exhaustive run-level requirements for something you have not yet crawled enough to know is possible. A data champion matches the weight of the requirements, the size of the experiment, and the depth of the instrumentation to the phase the work is actually in — and moves all of them forward together.

## The Job Underneath the Job

None of this is a technical skill in the usual sense. Extracting requirements is a conversation. Buying experiment ground is a negotiation. Arguing for telemetry is persuasion. Sequencing crawl-walk-run is judgment. The SQL and the pipelines are the easy part — genuinely, they are the part with the most documentation and the fewest surprises.

Being a data champion is the work of standing in the gap between what the business wants and what a system can actually do, and refusing to let either side pretend the gap isn't there. You translate ambition into requirements, you protect the room to find out what's true, you insist on being able to see what you've built, and you ship it in pieces that earn trust as they go. Do that consistently and you stop being the person who gets handed tickets. You become the person the business comes to before there is a ticket — which is the only position from which data work ever actually changes what the organization does.

## Related Articles

- **[Crawl, Walk, Run: Why Many Attempts Beat One Perfect Try](/article/crawl-walk-run-building-engagement/)** — The staging framework in depth, and why volume of attempts beats the quality of any single one.
- **[From Cheerleader to Quarterback](/article/from-cheerleader-to-quarterback/)** — Why the champion has to operate inside the business, not alongside it.
- **[Operational Telemetry, Explained for the Person Reading the Dashboard](/article/operational-telemetry-explained/)** — What the instrumentation you're arguing for actually does for the person consuming it.
- **[KPIs Are a Cultural Change, Not a Dashboard Project](/article/kpis-are-a-cultural-change/)** — Why direction from the business is a behavioral commitment, not a data deliverable.
