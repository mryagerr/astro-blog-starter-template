---
title: 'Not Everyone Is a Data Analyst (And Your Deliverables Should Reflect That)'
description: 'Most of your audience does not want to explore data. They want to know what to do next. Designing deliverables for the analyst in the room — when only one person in ten is an analyst — is a failure mode that looks like thoroughness.'
pubDate: 'Apr 10 2025'
heroImage: '/blog-not-everyone-analyst.png'
difficulty: 'low'
tags: ['culture']
---

There is a common mistake data teams make when they finally get good at their craft. They get excited about the data. They surface interesting patterns. They build flexible dashboards full of filters and drill-downs and cross-tabs. They hand it to a stakeholder with the implicit message: "Look at all of this. Isn't it fascinating?"

The stakeholder looks at it, nods politely, and asks: "So what should we do?"

This is not ingratitude. It is a completely reasonable response from someone who was never hired to be a data analyst.

## The Audience Is Not a Room Full of Analysts

Walk through the actual composition of the people who receive data deliverables in most organizations.

There is the executive who needs to make a decision this week about where to allocate resources. There is the operations manager who needs to know if the process is working or broken. There is the marketing lead who needs to know which campaign to scale and which to cut. There is the product manager who needs to know whether the feature shipped two months ago is having an effect.

One of those people, maybe, is the data analyst. The others are domain experts who happen to need information. They did not build careers around data exploration. They built careers around running businesses.

The default data deliverable — an interactive dashboard, a spreadsheet with pivot tables, a report with twenty pages of findings — is optimized for the analyst. It says: "Here are the raw materials. You figure out what matters."

For the analyst in the room, this is exciting. For everyone else, it is homework.

```
What analysts hear when given exploratory data:
  → "Here is a rich dataset. Let's dig in."

What most stakeholders hear when given exploratory data:
  → "Here is a problem. Please solve it before the next meeting."
```

The data is the same. The experience of receiving it is completely different.

## The Difference Between Data and Intelligence

Data is what happened. Intelligence is what it means and what to do about it.

A spreadsheet showing monthly sales by region by product by channel by rep is data. "The Northeast is underperforming on enterprise deals, and the gap opened up in Q3 after the pricing change — consider a targeted discount authority for that segment" is intelligence.

The analyst's job is to travel the distance between those two things. The problem is that most data teams stop at data delivery and call it done. They hand over the spreadsheet and wait to be asked follow-up questions. They treat the exploration as the deliverable rather than the input to the actual deliverable.

This feels rigorous. It is actually incomplete.

| What Was Delivered | What Was Needed | What Happens Next |
|---|---|---|
| Dashboard with 14 filters | One clear answer | Stakeholder guesses. Or asks for a meeting. |
| Report with every finding | The three that matter | Stakeholder reads two pages, loses the thread |
| Raw data export | Specific recommendation | Stakeholder ignores it or recreates your work badly |
| "Here's what the data shows" | "Here's what to do" | Decision gets delayed or made without data |

The common thread: the more exploration you hand to a non-analyst, the less likely they are to use it correctly — and the more likely they are to either ignore it or form the wrong conclusion from it.

## Why Data Teams Default to Exploration Anyway

It is not laziness. It is usually one of three things.

**Uncertainty about the right answer.** If the analyst is not sure what the data means, handing over an exploratory deliverable is a way to defer the judgment call. "I showed you everything. What you do with it is up to you." This protects the analyst from being wrong. It also transfers the analytical burden to someone who is worse-equipped to carry it.

**A desire to show the work.** Analysts know how much effort went into the analysis. Showing the full dataset, the breakdowns, the cross-tabs — this communicates effort. A single recommendation feels thin in comparison, even if it represents more thinking. The impulse to display comprehensiveness is understandable. It produces deliverables that obscure the recommendation rather than surface it.

**Genuine interest in the data.** Sometimes the analyst finds the data interesting and assumes everyone else will too. They do not. The operations manager is not going to fall in love with a cohort retention waterfall chart. They want to know if retention is good or bad, and what to do if it is bad.

All three tendencies produce the same outcome: a deliverable designed for an audience that does not exist.

## What Actionable Intelligence Actually Looks Like

The test for an actionable deliverable is simple: can the recipient take action on this without asking a follow-up question?

Not zero follow-up questions. Some clarification is normal and healthy. But the core question — **what should I do?** — should be answered by the deliverable itself.

This requires the analyst to make a judgment call and put it in writing. That is uncomfortable. It means being wrong sometimes. It means owning a recommendation rather than presenting findings and stepping back.

It is also the actual job.

```
Exploratory deliverable:
  "Here are the retention numbers broken down by cohort,
   acquisition channel, plan type, and region. The filters
   are at the top. Let me know if you have questions."

Actionable deliverable:
  "Retention is on track except for users acquired through
   paid social in Q4. That cohort churns at 2x the baseline
   rate by month three. Recommend pausing paid social
   acquisition until the onboarding flow for that segment
   is fixed — the problem appears to be activation, not fit."
```

The second deliverable takes a position. It draws a conclusion. It recommends an action. The recipient knows what to do without scheduling a meeting.

The first deliverable generates a meeting. Or three.

## The Analyst Is Still in the Room

None of this means the supporting data disappears. The exploration happened. The rigor is real. The cross-tabs exist. They just belong in an appendix, not in the headline.

The analyst who wants to be taken seriously in a business context needs to learn to collapse their work into a usable form without losing the structural integrity underneath it. That is not a communication skill bolted onto an analytical skill. It is a core part of what analysis means in an applied setting.

Think about what a doctor does. They run tests. They review the results. They synthesize a diagnosis. They give you a recommendation.

They do not hand you the lab printout and say: "Interesting data. What do you think?"

They made a judgment call. They are accountable for it. That accountability is what makes the recommendation trustworthy.

Data analysts working in organizations are in the same position. The people receiving the deliverable are not equipped to synthesize it. That is why the analyst exists. The synthesis is the product.

## Designing Deliverables for the Actual Audience

Practically, this means asking a different set of questions before producing any deliverable.

Before asking "What does the data show?" — ask **"What decision needs to be made, and by whom?"**

Before building a dashboard — ask **"What would make this dashboard unnecessary? Can I just answer the question directly?"**

Before writing a findings section — ask **"What is the one thing the reader needs to walk away knowing? Have I said it in the first paragraph?"**

Before adding another chart — ask **"Does this chart change what someone should do, or does it just show more?"**

Most analytical work can be collapsed to a simpler form than it is delivered in. The reason it is not is that the analyst either has not finished the thinking, or has not been trained to think of the deliverable as something that needs to drive action rather than inform understanding.

Both are fixable.

## The Low Hanging Fruit

The next time you finish an analysis, before you build the dashboard or write the report, write one sentence: **"Based on this analysis, [stakeholder] should [do this specific thing] because [key finding]."**

If you cannot write that sentence, you are not done with the analysis yet.

If you can write it, that sentence is the deliverable. Everything else is the appendix.

Your audience is not a room full of people who want to explore data. It is a room full of people who need to make decisions. Give them intelligence, not exploration. The exploration is your process. The intelligence is their product.

The distance between those two things is exactly the distance between a data team that gets ignored and one that gets listened to.

## Related Articles

- **[Write for the Executive. Survive the Analyst.](/article/write-for-the-executive-survive-the-analyst/)** — The structural discipline of building analysis that works for both fast executive decisions and deep analyst review.
- **[The Gas Gauge Is the Hardest Chart to Build](/article/gas-gauges-and-kpi-mastery/)** — A concrete example of what "actionable intelligence" looks like in visualization form.
- **[Dashboards Are Waiting Rooms: Interconnectivity Is the Endgame](/article/dashboards-are-waiting-rooms/)** — Where dashboard design leads when the goal shifts from informing humans to replacing manual handoffs.
