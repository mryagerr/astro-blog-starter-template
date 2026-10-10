# Editorial TODOs

Questions only Michael can answer. Each one is an invisible `<!-- TODO(michael): … -->` comment in the source (`{/* … */}` in `.astro` files), so `grep -rn "TODO(michael)" src/` finds them all. Replace each comment with real content, or delete the sentence it qualifies. Line numbers are as of this commit.

## Placeholders in content

| Slug | Line | Type | Question |
|---|---|---|---|
| `article/agent-harness-for-data-engineering` | 195 | EXPERIENCE | Have you run an agent against a real pipeline? What did it catch, what scared you? |
| `article/call-your-shot-feedback-loops` | 92 | EXPERIENCE | A time you (or a team) wrote a prediction down and missed. What was predicted, the actual result, and what you learned? |
| `article/cdc-requires-roi-to-be-taken-seriously` | 93 | EXPERIENCE | A real CDC proposal you saw funded or killed, and the number that decided it. |
| `article/data-product-decay` | 14 | EXPERIENCE | Confirm the claim above matches your experience. Then: a real orphaned dashboard or pipeline you found. How long was it wrong, and how was it caught? |
| `article/from-cheerleader-to-quarterback` | 152 | EXPERIENCE | Confirm the claim above matches your experience. Then: the domain you learned on the job and the moment it changed an analysis. |
| `article/gas-gauges-and-kpi-mastery` | 78 | EXPERIENCE | A real KPI where defining the red/yellow/green thresholds exposed disagreement. Who disagreed and how was it resolved? |
| `article/low-hanging-data-sources-for-stock-prediction` | 80 | SOURCE | Re-verify NewsAPI free-tier limits (requests/day, delay, look-back, production use) against newsapi.org/pricing and confirm which publisher RSS feeds (Reuters, AP, MarketWatch) still exist. |
| `article/low-hanging-data-sources-for-stock-prediction` | 99 | SOURCE | Add a citation for a replication attempt. Candidate to confirm: Lachanski, M., & Pav, S. (2017), "Shy of the Character Limit: 'Twitter Mood Predicts the Stock Market' Revisited," Econ Journal Watch 14(3). |
| `article/low-hanging-data-sources-for-stock-prediction` | 103 | SOURCE | Re-verify current X API tiers and pricing (developer.x.com) and add the date checked. |
| `article/low-hanging-fruit-reduces-risk-and-builds-expertise` | 16 | EXPERIENCE | Confirm the claim above (teams that deliver impact usually start small). |
| `article/telephone-game-bad-analytics` | 25 | EXPERIENCE | A real request that got distorted through handoffs. Original ask vs what got built. |
| `article/the-golden-age-of-api-access-is-over` | 31 | SOURCE | Add dated links for each bullet: X API tier announcement and current pricing (developer.x.com), Reddit's April 2023 API announcement and the Apollo shutdown, Pushshift's May 2023 access removal, and Spotify's November 2024 Web API changes post. Verify the dates and dollar figures against them. |
| `article/the-golden-age-of-api-access-is-over` | 65 | SOURCE | Link the Ninth Circuit's 2022 hiQ v. LinkedIn opinion and a report of the December 2022 settlement. |
| `article/think-rest-create` | 20 | SOURCE | Cite the default mode network research, or soften. Candidate to confirm: Raichle, M. E., et al. (2001), "A default mode of brain function," PNAS. |
| `article/think-rest-create` | 52 | SOURCE | Cite the incubation research. Candidate to confirm: Sio, U. N., & Ormerod, T. C. (2009), "Does incubation enhance problem solving? A meta-analytic review," Psychological Bulletin. |
| `article/think-rest-create` | 58 | SOURCE | Cite the sleep replay/consolidation and sleep-and-insight claims in this section. Candidate to confirm: Wagner, U., et al. (2004), "Sleep inspires insight," Nature. |
| `article/think-rest-create` | 84 | SOURCE | Find a citation for "intention before sleep improves consolidation for that problem", or cut the sentence. |
| `article/tool-job-fit` | 60 | EXPERIENCE | Is the "$30,000/month for ~40 GB" case (and the "under two seconds on an m5.xlarge" benchmark) something you saw or ran? If yes, restore the specific numbers with context (anonymized company, query shape, how it was measured). |
| `article/write-for-the-executive-survive-the-analyst` | 16 | EXPERIENCE | A real exec readout where a reviewer found a hole (or didn't). Anonymized numbers. |
| `page: index` | 47 | EXPERIENCE | Senior Staff data scientist; what you've built, in one line (for the hero). |

Total: 20 (11 EXPERIENCE, 9 SOURCE).

## Site-wide decisions

| Question | Answer | What was done |
|---|---|---|
| LinkedIn URL `linkedin.com/in/michealpetrillo` correct? | Yes | Added to `AUTHOR_SAME_AS` (Person JSON-LD `sameAs`) |
| MailerLite form details? | Unknown | The fake form (a `mailto:` disguised as a signup) was replaced with plain RSS and email links. **Still open:** once a MailerLite form exists, replace the CTA in `src/layouts/BlogPost.astro` with a real `<form>` posting to it. |
| Posts vs Articles | Option 1 | Posts merged into Articles under "Project Writeups" (`projects` tag), "Welcome to Posts" deleted, `/posts/…` 301-redirected (`public/_redirects`), Posts nav tab removed, CLAUDE.md updated |
| Source of the multi-year 30-min data and the 54% / 37,636-row results? | Unknown | Unverifiable numbers, feature ranking and Granger conclusions removed from the SVM article and the write-up; both now say the evaluation is being redone. The write-up was rebuilt around the 2020 thesis, the one verifiable source. |
| Publish the thesis PDF and link the repo? | Yes | `public/petrillo-2020-thesis.pdf`, linked from `/about/`, the SVM article, the data-sources article and the write-up; repo linked from the write-up |
| First person? | No | bd-mpar post stays third person. First-person phrasing added in the earlier pass ("my thesis", "in my experience") and the homepage bio were converted to third person / neutral wording. First person that was already in older articles was left alone. |

## Unaudited — findings

The external audit read 24 of the 48 articles. The other 24 articles and 3 posts got the C0 voice diagnostics, a syntax check of every Python block (`ast.parse`) and SQL block (DuckDB parser), and a read-through. All blocks parsed. Two verified code bugs were fixed in this PR; everything else is listed here for you to decide.

### Fixed in this PR (verified by running)

| Slug | Bug | Fix |
|---|---|---|
| `article/data-cleaning-and-validation` | `df["price"].fillna(..., inplace=True)` (3 lines) silently does nothing under pandas Copy-on-Write (default in pandas 3.x); confirmed with pandas 3 (`ChainedAssignmentError`, values unchanged) | Assign back: `df["price"] = df["price"].fillna(...)` |
| `article/scheduling-and-automating-pipelines` | `df.to_sql(..., method="ignore")` raises `ValueError: Invalid parameter method: ignore` | Replaced with SQLite `INSERT OR IGNORE` / `INSERT OR REPLACE` examples (tested) |

### Code issues (not edited; your call)

| Slug | Issue |
|---|---|
| `article/scheduling-and-automating-pipelines` | Cron comment "4 PM ET, UTC-4 = 8 PM UTC" is only true during daylight saving time. In winter (EST, UTC-5), `0 20 * * 1-5` fires at 3 PM ET, an hour *before* the close. Same for the Prefect `cron="0 20 * * 1-5"`. Use a timezone-aware scheduler or `CRON_TZ`. |
| `article/scheduling-and-automating-pipelines` | `from prefect.schedules import CronSchedule` is unused and may not exist in current Prefect versions (not verified; Prefect isn't installed here). `serve(cron=...)` doesn't need it. |
| `article/working-with-websockets-and-streaming-data` | Alpaca's stream sends a `[{"T":"success","msg":"connected"}]` welcome message on connect. `authenticate()` reads the *next* message after sending auth, which is that welcome message, so the success check passes even when auth fails, and `subscribe()` then reads the auth reply instead of the subscription reply. Read and check the welcome message first (not verified live; based on Alpaca's documented protocol). |
| `article/working-with-websockets-and-streaming-data` | `monitor_health()` uses `timedelta.seconds` (ignores days; use `.total_seconds()`), never updates `last_message_at` in the snippet, and `datetime.utcnow()` is deprecated since Python 3.12. API keys are hard-coded, contradicting the env-var advice in other articles. |
| `article/pulling-data-from-apis` | No `timeout=` on any `requests.get` (a hung server hangs the script forever). `int(resp.headers["Retry-After"])` breaks when the header is an HTTP date, which the spec allows. The full-script `fetch_records` retries 429s forever with no cap. |
| `article/working-with-parquet-and-duckdb` | `write_to_dataset(..., partition_cols=["year", "ticker"])` uses a `df` with no `year` column; add `df["year"] = df["date"].dt.year` first. `query_prices` interpolates `ticker`/`start_date` into SQL with an f-string; parameter binding would be safer. |
| `article/python-pandas-data-wrangling` | Several examples (`df["score"].fillna(0)`, `df.dropna()`) don't assign the result, so readers may think they modify `df`. `df["age"].astype(int)` raises if the column has NaN. |
| `article/building-your-first-data-pipeline` | The incremental `fetch_events_incremental` snippet relies on `requests`, `time`, `API_BASE`, `HEADERS` from the earlier file without saying so; the watermark uses `>` on ISO strings, which only works if every timestamp has the same format and timezone. |
| `article/working-with-csv-and-json` | The JSONL reader calls `json.loads` on blank lines (common trailing newline) and crashes; skip empty lines. |

### Unsourced statistics and absolutes (not edited)

| Slug | Claim | Suggested action |
|---|---|---|
| `article/dashboards-are-waiting-rooms` | "Build time: 20–40 hours", "Maintenance time: 1–3 hours/week", "typically 24–72 hours in a meeting-driven organization" | Mark as illustrative estimates, or confirm from experience |
| `article/low-hanging-fruit-reduces-risk-and-builds-expertise` | "the gap in analytical work is almost never methodological" | Frame as opinion |
| `article/how-to-be-a-data-champion` | "Most organizations do not have a data problem. They have a data champion problem." | Frame as opinion |
| `article/kpis-are-a-cultural-change` | "Most organizations do not do this" | Frame as opinion |
| `article/excel-to-sql-low-hanging-fruit` | "these six patterns cover the vast majority of everyday data work" | Soften ("much of") |
| `article/data-trust-and-time-the-real-currencies-of-roi` | "and when the error surfaces — and it always surfaces" | Soften |
| `article/fear-the-black-box` | "In most cases there will be at least three" (undocumented steps found when tracing a metric) | Frame as experience with a TODO, or soften |
| `article/tool-job-fit` | Repeated absolutes ("always at 3 AM…", "almost never the people who…") | Fine as rhetoric if you're comfortable owning it as opinion |
| `article/visualizing-data-with-python` | "Roughly 8% of men and 0.5% of women have some form of color vision deficiency" | Accurate for people of Northern European descent; add that qualifier and a source (e.g. the National Eye Institute) |

### Unlabeled hypotheticals

None found in the unaudited essays: they open with generic framing ("A common failure pattern…", "Consider a small analytics team…"). `article/data-trust-and-time-the-real-currencies-of-roi` uses "$500K data platform" and "$5K project" as clearly hypothetical contrasts; no label needed.
