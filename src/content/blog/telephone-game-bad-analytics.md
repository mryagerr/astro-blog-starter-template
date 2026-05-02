---
title: 'The Telephone Game Is How Analytics Goes Wrong'
description: 'A request leaves the VP as one question, passes through four people, and arrives at the analyst as a different question entirely. The number that comes back answers the wrong thing — perfectly. Conversation, not tooling, is what stops this.'
pubDate: 'May 02 2026'
difficulty: 'low'
tags: ['culture']
---

A VP asks a director: *"How are our enterprise customers doing this quarter?"*

The director asks a manager: *"Can you pull enterprise customer health for Q2?"*

The manager messages a senior analyst: *"Need an enterprise customer health report by Friday."*

The senior analyst pings the data analyst: *"Build me a dashboard of enterprise health metrics."*

The data analyst opens a ticket and writes: *"Build enterprise health dashboard. Metrics: ARR, churn, NPS, support tickets."*

By the time the work begins, the original question has been replaced by a deliverable. The number that comes back will be impressive, well-formatted, and irrelevant to whatever the VP was actually trying to decide.

This is the analytics telephone game. It is the most common and least discussed source of bad analytics in any organization larger than ten people.

## What Gets Lost at Each Hop

The classic playground game distorts a message word by word. The corporate version is more interesting: the words often stay close to correct. What gets stripped at each hop is the *context* — the reason the question is being asked at all.

| Hop | What Gets Preserved | What Gets Lost |
|---|---|---|
| VP → Director | The general topic | The decision the answer feeds into |
| Director → Manager | The deliverable shape | The time horizon and definition of "enterprise" |
| Manager → Analyst | The list of metrics | Whether those metrics actually answer the question |
| Analyst → Engineer | The data sources | Any awareness that the question even exists |

The original question — *"How are our enterprise customers doing?"* — was asked because the VP is preparing for a board meeting where they need to defend the enterprise segment investment. They need one number with a story. They got a four-tab dashboard.

Each hop is well-intentioned. Each person is doing their job: translating an ambiguous request into something concrete enough to act on. The translations are individually reasonable. The cumulative effect is that the analysis answers a question nobody is asking.

## Why This Pattern Is So Resilient

Telephone-game analytics persists because the structure of most data organizations encourages it. The forces are not subtle:

**Layered org charts mean layered translation.** A VP does not file Jira tickets. An analyst does not get invited to the executive offsite. The chain is the chain because of how the org is wired.

**Each translator simplifies to protect the next person down.** The director removes ambiguity so the manager has something actionable. The manager strips uncertainty so the analyst can scope the work. By the time the request reaches the people who can answer it, all the productive ambiguity has been removed — and ambiguity was the part that contained the actual question.

**Tickets and Slack reward concreteness over correctness.** A vague ticket gets bounced back. A specific ticket gets done. The system pushes everyone toward specific-but-wrong over vague-but-recoverable.

**Nobody loops back.** The VP gets the dashboard, glances at it, and sends a follow-up question. The follow-up gets routed through the same chain. The pattern repeats, and the original misunderstanding is never named.

The longer the chain, the more confidently wrong the output becomes. Confidence is what specificity buys.

## The Tell: When the Output Is Beautiful and Useless

You can usually tell a telephone-game analysis by the shape of it. The work is not bad. The query is clean. The chart is correctly labeled. The methodology, if you ask, is defensible. The numbers reconcile.

And yet, when it gets to the person who asked the original question, they look at it for ten seconds and say something like *"this is great, but what I really wanted to know was..."* — and the real question comes out for the first time, three weeks into the project.

```
Original question:
  "Are we losing the enterprise segment to competitor X?"

Question that was answered:
  "What is the trailing 90-day ARR, churn rate, and NPS for accounts
   tagged 'enterprise' in Salesforce?"

Cost of the gap:
  Three weeks of analyst time, a dashboard nobody opens, and
  a board meeting where the VP improvises.
```

The analyst is not at fault. They built exactly what was specified. The specification was the problem, and the specification was downstream of four conversations the analyst was never part of.

## Conversation Is the Repair

The cure for telephone-game analytics is not better tools. It is shorter chains and more direct conversations. Specifically: **the analyst needs to talk to the person whose decision the work is actually feeding.**

This sounds obvious and is rarely done. The reasons it is not done are political, not technical:

- The org chart implies that the analyst should not be in the room with the VP.
- The intermediate layers feel skipped over when the analyst goes direct.
- The analyst feels presumptuous asking for ten minutes of the VP's time.
- Everyone assumes the requirements doc captures the intent.

None of these reasons survive contact with the cost of the alternative. Ten minutes with the VP at the start of the project is worth more than three weeks of work pointed in the wrong direction. The intermediate layers, if they have any judgment, will gladly trade a slightly bruised ego for a deliverable that lands.

The conversation does not need to be long. It needs to surface three things:

1. **What decision is this analysis going to inform?** Not what dashboard, not what metrics — what is the person going to *do differently* depending on what the data says.
2. **What would change the answer?** Which assumption, if wrong, would flip the recommendation. This is the question the analyst will be measured against later.
3. **What does "good" look like?** A single number? A trend? A comparison? A go/no-go? The shape of the answer is rarely what the request implied.

If those three things are clear, the analyst can build something useful even if every other detail in the original request was wrong.

## What to Do When You Are Mid-Chain

Most analysts cannot restructure the org chart. They can, however, change how they handle a request that arrives from upstream. Two practices, applied consistently, prevent most telephone-game failures:

**Write the question back.** Before any work starts, restate the request in your own words and send it back up the chain. *"My understanding is that you need X to decide Y by Z. The output will be A. If that is not right, please push back before I start."* About a third of the time, this surfaces a misalignment that would have cost a week of work. The other two-thirds, you have a written agreement to point at when the requirements shift.

**Ask for the originator.** When a request has clearly been translated through multiple people, ask who originally raised it and whether you can get fifteen minutes with them. Frame it as protecting their time: *"I want to make sure I'm building something that answers the actual question. Can I get a brief check-in with the requester before I scope this?"* People rarely refuse this when it is framed as quality control rather than chain-jumping.

These practices are not glamorous. They are also the difference between an analyst whose work gets used and one whose dashboards quietly accumulate in a folder.

## Where the Telephone Game Hides in Tools

Tooling does not cause this problem, but it can disguise it. A few places where the chain gets longer without anyone noticing:

- **Self-serve dashboards.** A dashboard built for one VP gets shared, forked, and re-purposed by people who never spoke to the original requester. Each downstream user assumes the metrics mean what they would mean in their own context. They usually don't.
- **Auto-generated requirements docs.** A meeting note gets turned into a ticket gets turned into a spec. Each transformation is lossy. The spec reads as authoritative because it is the most specific document, not because it is the most accurate.
- **AI summarization of stakeholder requests.** A model converts a Slack thread into a tidy bullet list. The hedges, the half-formed concerns, the "I'm not sure if this matters but..." — all the things that hint at the real question — get smoothed away in the name of clarity.
- **Standardized intake forms.** A form forces a request into a fixed shape: requester, deliverable, due date, priority. None of those fields ask *what decision this informs*. The form is the chain, compressed into a UI.

In each case, the tool produces a cleaner artifact than the conversation it replaced. Cleanliness is not the same as fidelity. The conversation contained signal that the artifact does not.

## The Difference Between Requirements and Understanding

A useful distinction: requirements are what the person can articulate. Understanding is what they actually need. The two are correlated but not identical, and the gap between them is exactly the place where analytics earns its keep.

A requirements-driven analyst delivers what was asked for, on time, in the requested format. The work is judged on whether it matched the spec. Telephone-game analytics is the natural output of this posture, because the spec is downstream of the actual question.

An understanding-driven analyst treats the request as a starting point and the conversation as the work. The spec is something that emerges from the dialogue, not something that arrives at the start of it. This posture takes longer at the front and saves disproportionately more time at the back, because rework gets prevented rather than performed.

The same principle [shows up in data quality work](/article/data-quality-gaps-sme/): the gaps live in the conversations that did not happen. The schema is fine. The query runs. The numbers look reasonable. Nobody asked the warehouse manager what the field actually meant.

## What Healthy Looks Like

In an organization that has shortened the chain, a few things look different:

- The analyst knows the name of the person whose decision their next analysis informs, and has spoken to them at least once about it.
- Tickets include a "what decision does this support" field, and the field is taken seriously.
- The first deliverable on any non-trivial analysis is a one-paragraph restatement of the question, sent back up before the work starts.
- It is normal — not awkward — for a VP to say "let me grab the analyst" rather than "let me email my director who will email the analyst's manager."
- Analysts are present in the meetings where the questions originate, even if they do not speak.

None of these requires a reorg. All of them require giving analysts the explicit permission to talk to the people whose questions they are answering, and giving those people the explicit expectation that they should make themselves available.

## The Low Hanging Fruit

For the next request that lands on your desk: before opening a query window, write the question back to the requester in one paragraph. Name the decision it feeds. Name what would change the answer. Name what "good" looks like.

If the requester confirms it, you have removed three weeks of risk. If they correct it, you have caught a telephone-game distortion before it became a deliverable. If they cannot answer at all, you have surfaced — early and cheaply — that the request itself is upstream of a real question that nobody has formed yet.

The output of analytics looks like numbers and charts. The actual product is a chain of conversations between the person who has a question and the person who can answer it. The shorter and more direct that chain, the better the analytics. There is no tool, framework, or dashboard that beats two people in a room agreeing on what the question is.

## Related Articles

- **[Leave the Ivory Castle: How SMEs Expose the Gaps Your Data Hides](/article/data-quality-gaps-sme/)** — The other half of the conversation problem: when the data itself means something different from what the schema implies.
- **[Write for the Executive. Survive the Analyst.](/article/write-for-the-executive-survive-the-analyst/)** — Once the question is right, how to package the answer so it survives both the decision and the review.
- **[Not Everyone Is a Data Analyst](/article/not-everyone-is-a-data-analyst/)** — Why the audience determines the shape of the deliverable, and why analyst-built artifacts often fail with non-analyst readers.
- **[From Cheerleader to Quarterback: Why Data Professionals Must Be Half Subject Matter Expert](/article/from-cheerleader-to-quarterback/)** — The domain fluency that makes the originator-conversation productive instead of awkward.
