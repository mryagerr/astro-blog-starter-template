---
title: 'The Golden Age of API Access Is Over'
description: 'Free, open, and generous API access was a brief anomaly. Understand what changed, why it happened, and how to adapt your data collection strategies.'
pubDate: 'Aug 08 2025'
updatedDate: 'Oct 10 2026'
heroImage: '/blog-golden-age-api.png'
difficulty: 'low'
tags: ['collection']
---

For about a decade, getting data from the internet was almost embarrassingly easy. Twitter gave you a firehose. Reddit handed out API keys to anyone who asked. Google offered generous free tiers on Maps, Search, and Knowledge Graph. Financial data providers competed on openness. The assumption baked into every data project was that if a platform had data, you could probably pull it.

That era is over.

## What Happened

The shift wasn't sudden — it was a slow tightening that accelerated sharply around 2023. The proximate causes are well-documented: the rise of large language model training scraped platforms' data at industrial scale, and those same platforms realized their data had enormous commercial value they weren't capturing.

But the structural causes run deeper. The "free API as growth hack" strategy that defined Web 2.0 has exhausted itself. Platforms that opened their APIs to build developer ecosystems have matured. They've captured their users, and they no longer need third-party apps to grow. What they need is monetization — and their data is the most obvious asset.

The result is a cascade of changes that have made API access more expensive, more restricted, or simply gone:

- **Twitter/X** ended free *read* access in 2023. The free tier that remained is essentially write-only (posting, no meaningful reading or search). Reading tweets moved to paid tiers: Basic launched in 2023 at about $100/month with tight monthly read caps, the higher tiers cost thousands of dollars per month, and prices have gone up since.
- **Reddit** announced paid API access in April 2023, with pricing that took effect that July. The cost forced out most third-party clients (Apollo and others shut down on June 30, 2023) and triggered the subreddit blackouts that June.
- **Pushshift**, the Reddit archive that a large body of academic research depended on, lost its Reddit API access in May 2023. It was later restored only for approved subreddit moderators, which effectively ended it as a general research dataset. For data researchers, this was the most consequential casualty of the Reddit change.
- **LinkedIn** has never had a public API worth using and actively blocks scraping.
- **Google** has progressively narrowed free tiers and raised prices across its API portfolio.
- **Spotify** cut off new apps' access to its audio features, audio analysis and recommendations endpoints in November 2024, removing data that researchers had used for years.
- **Instagram** has been in steady API retreat since the Cambridge Analytica fallout.

<!-- TODO(michael): SOURCE — Add dated links for each bullet: X API tier announcement and current pricing (developer.x.com), Reddit's April 2023 API announcement and the Apollo shutdown, Pushshift's May 2023 access removal, and Spotify's November 2024 Web API changes post. Verify the dates and dollar figures against them. -->

Each individual decision had its own reasoning. The cumulative effect is a data landscape that looks nothing like it did five years ago.

## The Economics Are Rational (From Their Side)

It's worth understanding why this happened rather than just being angry about it.

APIs have real infrastructure costs. When a platform offers free access, they're subsidizing your data pipeline. As long as the platform was growing and needed developer goodwill, that subsidy made sense. When growth plateaus and the developer ecosystem is already built, the calculus changes.

More importantly, LLM training made the stakes explicit. When it became obvious that API data could be used to build competing AI products, every platform's legal and business teams started asking whether their API terms of service were defensible. Many of them weren't.

The tragedy of the commons applies here too. Legitimate researchers and small developers got priced out because a small number of large actors extracted enormous value from free access. The free tier couldn't survive that extraction rate.

## What This Means for Data Collection

If your data strategy was built on free or cheap third-party API access, you need to rethink it. Here's what the realistic landscape looks like now:

### Official APIs Are for Business Use Cases

If you're building a product and can justify the cost, official API access is still the right answer. The pricing is no longer friendly to individual researchers or hobbyists, but for a business use case with real revenue, paying for clean, reliable API access is often the right tradeoff.

The question to ask: does your use case generate enough value to pay for the data? If yes, pay for it. If no, you need a different source.

### Government and Academic Data Is More Valuable Than Ever

The free and open data that actually remains free and open is mostly from governments, academic institutions, and nonprofits. Census Bureau, BLS, FRED, NASA, SEC EDGAR, OpenStreetMap, Wikipedia — these sources haven't closed off, and they're now relatively more valuable because so much commercial data has.

If your problem can be approached with public data, that's increasingly the smart path.

### Web Scraping Has a New Risk Profile

Scraping data directly from websites has become more fraught. Anti-bot systems are more sophisticated, and the legal exposure has shifted rather than disappeared. *hiQ Labs v. LinkedIn* is the case usually cited. The Ninth Circuit held (in 2019, and again in 2022 after a Supreme Court remand) that scraping publicly accessible pages likely isn't "access without authorization" under the federal Computer Fraud and Abuse Act. But that wasn't the end of it: in late 2022 the district court found that hiQ had breached LinkedIn's user agreement, and the case settled with hiQ agreeing to stop scraping. The practical lesson is that public data may be outside anti-hacking law, but scraping it against a site's terms can still lose you a contract case.

<!-- TODO(michael): SOURCE — Link the Ninth Circuit's 2022 hiQ v. LinkedIn opinion and a report of the December 2022 settlement. -->

Scraping still works for many use cases, but it's not a permanent solution. It's a tactic that works until it doesn't, and you should build your pipelines to expect that instability.

### Data Partnerships and Purchases Are Underpriced by Comparison

For serious commercial use cases, negotiated data partnerships and data purchases from specialized vendors are often more cost-effective than they appear. The friction of negotiating a data deal is high, but the unit economics can be better than API pricing at scale.

If you need financial data, ESG data, or consumer behavior data at meaningful scale, buying from a data vendor is often cheaper and more reliable than trying to assemble it from APIs.

### Your Own First-Party Data Is the Most Defensible Asset

The most durable data strategy is collecting your own first-party data. If your product generates behavioral signals, transaction records, or user interactions, that data is yours. No platform can change their API terms and take it away from you.

This isn't relevant for every use case, but if you're building a data-dependent business, the long-term answer is creating a product that generates the data you need.

## The Practical Adjustments

For people building data pipelines today, a few concrete adjustments:

**Audit your API dependencies.** Know which of your pipelines depend on third-party API access, what you're paying for it, and what your fallback is if it goes away. "It's been free for years" is not a risk assessment.

**Diversify your sources.** Single-source pipelines are fragile. Where possible, triangulate across multiple sources. If one closes off, you're not starting from zero.

**Budget for data costs.** If you're building something that depends on external data, data access should be a line item in your budget, not an assumption of free. What it costs to maintain access is part of your operating cost.

**Invest in data quality over data volume.** When data is cheap, it's tempting to collect everything. When data costs money, you focus on what matters. That's actually a useful discipline — high-quality, well-understood data beats large, messy datasets in most real applications.

## This Isn't the End of External Data Collection

The point isn't that pulling data from external sources is no longer viable. It's that the naive assumption — that data will be available, free, and stable — is no longer reliable.

The developers and data teams that adapt well will be the ones who treat data access as a strategic decision rather than an infrastructure given. They'll know what they're paying for data (even when it's nominally free), they'll have fallback strategies, and they'll build for the reality that access terms change.

The golden age was real. It was also anomalous. Building as if it's coming back is the mistake to avoid.

---

- **[Building Your First Data Pipeline](/article/building-your-first-data-pipeline/)** — Structuring pipelines to handle source instability.
- **[Working with CSV and JSON](/article/working-with-csv-and-json/)** — Working with data once you've collected it.
- **[Pulling Data from REST APIs](/article/pulling-data-from-apis/)** — Practical patterns for handling the rate limits and instability that make this problem real.
