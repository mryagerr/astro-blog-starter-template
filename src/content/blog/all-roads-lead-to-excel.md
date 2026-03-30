---
title: 'All Roads Lead to Excel'
description: 'No matter how sophisticated your data stack is, when you are working with non-executive stakeholders the final destination is almost always a spreadsheet. Stop fighting it. Start designing for it.'
pubDate: 'Mar 30 2026'
heroImage: '/blog-all-roads-excel.svg'
difficulty: 'low'
---

The ancient Romans did not set out to build a road network that would outlast their empire by two thousand years. They built roads because armies needed to move, grain needed to arrive, and tax collectors needed a reliable route home. The roads were practical. The metaphor came later.

There is a version of this happening inside every data team right now.

You built the pipeline. You set up the warehouse. You learned dbt, stood up a dashboard in Looker, wrote clean SQL, scheduled the refresh. The infrastructure is real. The craft went into it. And then a stakeholder emails you at 3pm on a Thursday and asks if you can just send them the numbers in a spreadsheet.

Every road leads to Excel.

## The Distinction That Matters

Before going further, a distinction needs to be clear: this is not about executive audiences.

Executives operate differently. They receive briefings, not spreadsheets. They want the recommendation on the first slide, one number to anchor it, and a direct line to a decision. The tools and formats that serve executives are different — structured, visual, compressed. If you are writing for a C-suite audience, the guidance is elsewhere.

This is about everyone else.

The finance manager reconciling actuals to forecast. The operations lead who wants to slice headcount by region. The marketing coordinator building a campaign tracker. The HR business partner who needs tenure data by department. The procurement analyst who asked for vendor spend and will use it to build their own pivot table.

These are stakeholders. They are not analysts, but they are not executives either. They live in the middle of the organization where work gets done, and the tool they use to do that work is almost always Excel.

## Why Excel Won

Excel did not win by accident. It won because it solved a real problem for a real population of users.

Spreadsheets give non-technical users something that no dashboard or data platform has ever fully replicated: direct manipulation. You can see the data, touch it, sort it, filter it, add a column, write a formula, copy a range and paste it into a slide. There is no query to write, no access request to submit, no support ticket to open. The data is right there and you can do things with it.

This matters enormously for the stakeholder in the middle of the org chart. They do not need the full power of your warehouse. They need to answer one specific question this week, then a different question next week, and they need to be able to share their work with their manager in a format their manager can also open and touch.

Excel is the universal format of working knowledge. It is not a database. It is not a reporting tool. It is a collaboration medium for people who need to get things done with numbers.

No amount of dashboard sophistication has displaced it, because dashboards answer the questions you anticipated. Spreadsheets answer the questions nobody thought to pre-build a filter for.

## The Paths That All Converge

Here is what happens in practice, regardless of how advanced your stack is.

**The Python path.** You wrote a script. It pulls from the API, cleans the data, runs the model, outputs a result. You are proud of it. The stakeholder asks if they can have the output. You send them a CSV. They open it in Excel.

**The SQL path.** You wrote a beautiful query — joins, window functions, CTEs nested inside CTEs. You ran it in your warehouse tool. The stakeholder asks for the results. You export to CSV. They open it in Excel.

**The dashboard path.** You built a Power BI or Tableau report. The stakeholder uses it for two weeks. Then their manager asks them to put the numbers in the quarterly review deck. They click export. Excel.

**The pipeline path.** You set up scheduled data delivery to a reporting table. The stakeholder has read access. They never use it directly. They ask you to pull the data for them once a quarter. You send it in Excel.

Every road leads to Excel. Not because the other roads are wrong, but because Excel is where non-technical stakeholders do their work. It is the final mile of your data infrastructure, whether you designed it that way or not.

## The Mistake of Resistance

A common reaction is frustration. You built something better. Why are they not using it?

The frustration is understandable and mostly beside the point.

The stakeholder asking for a spreadsheet is not telling you your pipeline was wasted. They are telling you how they work. The pipeline produced clean, reliable data. That is exactly what it was supposed to do. The fact that the clean, reliable data ends up in a spreadsheet is not a failure of the pipeline — it is the pipeline doing its job.

The trap is treating Excel delivery as a concession. Something you do when the real solution did not take hold. That framing leads to two bad outcomes: you stop investing in the quality of the Excel you produce because it feels like a fallback, and you create friction for stakeholders by trying to push them toward tools that do not serve their actual workflow.

The better frame: Excel delivery is a designed output, not a fallback. Treat it like one.

## Designing for the Real Destination

If every road leads to Excel, the question is not how to reroute the roads. The question is: what does a well-built Excel file look like?

**Structure the data, not just the output.** A raw data dump is not a deliverable. Structure the file so the stakeholder can use it without needing you to explain it. Column headers should be self-explanatory. Dates should be actual date values, not strings. Numbers should be numbers, not text. A file that needs a one-paragraph explanation before use is not finished.

**One tab for data, one tab for analysis.** If you are producing a deliverable with any calculations in it, separate the raw data from the derived work. The stakeholder can pivot off the raw tab without breaking the formulas in the analysis tab. This also makes it easier to refresh the file next quarter — swap the data tab, and the analysis updates.

**Anticipate the first three things they will do.** Most stakeholders have a predictable workflow. They will filter by region, or sort by date, or sum by category. Think about what they are actually going to do with the data and structure the file to make the first three moves easy. This is not complicated — it is paying attention.

**Label the version and the date.** Stakeholders pass spreadsheets around. By the time a file has been forwarded twice and edited by three people, the original source is lost. Put the extraction date, the data source, and a version in a visible place — top of the first tab, not buried in a comment. When they ask you to "update the file from last quarter," they will actually be able to find it.

**Know what you are not responsible for.** Once the file leaves your hands, the stakeholder will add columns, change formulas, and modify things. That is their right. Your responsibility ends at delivering clean, well-structured source data. The pivot tables they build on top of it are theirs. Do not try to lock the file or control downstream use. Deliver clean data and let them work.

## The Misuse to Watch For

Excel is not a database. This distinction matters and it breaks down regularly.

When stakeholders discover that Excel is powerful enough to do real analysis, some of them build real analysis pipelines in Excel — formulas referencing other formulas referencing other files, VLOOKUP chains that span three workbooks, pivot tables refreshing from ranges that nobody remembers creating. This is where the wheels come off.

Your job, when you see it happening, is not to scold them for using Excel wrong. It is to understand what they are actually trying to do and determine whether there is a better-structured solution. Sometimes the answer is a better-designed Excel file. Sometimes it is a simple query they can run themselves. Sometimes it is a lightweight data product that gets scheduled delivery to their inbox.

The signal is brittleness. If the analysis breaks every time someone sends the wrong version of a file, or fails when a column shifts by one, or requires a specific person to manually update it — that is the moment to step in and offer something more durable.

But you do that by understanding their workflow and building something better, not by making them feel bad for using the tool that was available to them.

## The Low Hanging Fruit

The data team's job is to make good data accessible to the people who need it, in the form they can use.

For non-executive stakeholders, that form is usually Excel. Not because they are unsophisticated. Because Excel is the working medium of the middle of organizations, and it has been for thirty years, and no amount of infrastructure investment has changed that.

The ancient Romans understood that a road is not the destination — it is the infrastructure that makes the destination reachable. Your pipeline, your warehouse, your models and transforms: those are the roads. Excel is where the stakeholder lives.

Build roads that get there cleanly.

---

- **[Write for the Executive. Survive the Analyst.](/article/write-for-the-executive-survive-the-analyst)** — When your audience is not the stakeholder but the C-suite, the delivery format changes entirely.
- **[Excel to SQL: Low Hanging Fruit](/article/excel-to-sql-low-hanging-fruit)** — When an Excel workflow has grown into something that needs to be a real pipeline.
- **[Not Everyone Is a Data Analyst](/article/not-everyone-is-a-data-analyst)** — Understanding who is actually on the receiving end of your data work.
