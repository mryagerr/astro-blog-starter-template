# Editorial TODOs

Questions only Michael can answer. Each one is an invisible `<!-- TODO(michael): … -->` comment in the source (`{/* … */}` in `.astro` files), so `grep -rn "TODO(michael)" src/` finds them all. Replace each comment with real content, or delete the sentence it qualifies. Line numbers are as of this commit.

## Placeholders in content

| Slug | Line | Type | Question |
|---|---|---|---|
| `article/agent-harness-for-data-engineering` | 195 | EXPERIENCE | Have you run an agent against a real pipeline? What did it catch, what scared you? |
| `article/building-a-stock-prediction-svm` | 29 | SOURCE | Confirm the data behind this walkthrough: ticker list, 30-minute bars, and the 2020–2021 / 2022+ windows. yfinance only serves ~60 days of 30-minute history, and the 2020 thesis used Jan 30 to Apr 23, 2020 with a different ticker set (^GSPC, ^VIX, AAPL, DIS, TSLA, NFLX, BA, WMT, AMZN, NVDA). Where did multi-year 30-minute bars come from? |
| `article/building-a-stock-prediction-svm` | 175 | SOURCE | Add a link to the thesis (PDF in public/ or an external URL). |
| `article/building-a-stock-prediction-svm` | 206 | SOURCE | Is this classification report from a real run? If yes, share the notebook/output so the numbers can be cited; if not, label it illustrative or remove it. Same for "training accuracy is typically 60–65%". |
| `article/building-a-stock-prediction-svm` | 332 | SOURCE | The ranking below was described as "typically" coming out this way. Was it from a real run, and with which method (train-set RF importances or validation permutation importance)? Replace with actual output or label it illustrative. |
| `article/building-a-stock-prediction-svm` | 369 | SOURCE | The original text said "for most tickers and time periods, the p-values do not reject the null", but the code only tested AAPL. Paste the actual per-ticker p-value table from a training-period run, or keep the claim conditional as written below. |
| `article/call-your-shot-feedback-loops` | 92 | EXPERIENCE | A time you (or a team) wrote a prediction down and missed. What was predicted, the actual result, and what you learned? |
| `article/cdc-requires-roi-to-be-taken-seriously` | 93 | EXPERIENCE | A real CDC proposal you saw funded or killed, and the number that decided it. |
| `article/data-product-decay` | 14 | EXPERIENCE | Confirm this is from your own experience. Then: a real orphaned dashboard or pipeline you found. How long was it wrong, and how was it caught? |
| `article/from-cheerleader-to-quarterback` | 152 | EXPERIENCE | Confirm the claim above is from your experience. Then: the domain you learned on the job and the moment it changed an analysis. |
| `article/gas-gauges-and-kpi-mastery` | 78 | EXPERIENCE | A real KPI where defining the red/yellow/green thresholds exposed disagreement. Who disagreed and how was it resolved? |
| `article/low-hanging-data-sources-for-stock-prediction` | 80 | SOURCE | Re-verify NewsAPI free-tier limits (requests/day, delay, look-back, production use) against newsapi.org/pricing and confirm which publisher RSS feeds (Reuters, AP, MarketWatch) still exist. |
| `article/low-hanging-data-sources-for-stock-prediction` | 99 | SOURCE | Add a citation for a replication attempt. Candidate to confirm: Lachanski, M., & Pav, S. (2017), "Shy of the Character Limit: 'Twitter Mood Predicts the Stock Market' Revisited," Econ Journal Watch 14(3). |
| `article/low-hanging-data-sources-for-stock-prediction` | 103 | SOURCE | Re-verify current X API tiers and pricing (developer.x.com) and add the date checked. |
| `article/low-hanging-fruit-reduces-risk-and-builds-expertise` | 16 | EXPERIENCE | Confirm the "in my experience" claim above (teams that deliver impact usually start small). |
| `article/telephone-game-bad-analytics` | 25 | EXPERIENCE | A real request that got distorted through handoffs. Original ask vs what got built. |
| `article/the-golden-age-of-api-access-is-over` | 31 | SOURCE | Add dated links for each bullet: X API tier announcement and current pricing (developer.x.com), Reddit's April 2023 API announcement and the Apollo shutdown, Pushshift's May 2023 access removal, and Spotify's November 2024 Web API changes post. Verify the dates and dollar figures against them. |
| `article/the-golden-age-of-api-access-is-over` | 65 | SOURCE | Link the Ninth Circuit's 2022 hiQ v. LinkedIn opinion and a report of the December 2022 settlement. |
| `article/think-rest-create` | 20 | SOURCE | Cite the default mode network research, or soften. Candidate to confirm: Raichle, M. E., et al. (2001), "A default mode of brain function," PNAS. |
| `article/think-rest-create` | 52 | SOURCE | Cite the incubation research. Candidate to confirm: Sio, U. N., & Ormerod, T. C. (2009), "Does incubation enhance problem solving? A meta-analytic review," Psychological Bulletin. |
| `article/think-rest-create` | 58 | SOURCE | Cite the sleep replay/consolidation and sleep-and-insight claims in this section. Candidate to confirm: Wagner, U., et al. (2004), "Sleep inspires insight," Nature. |
| `article/think-rest-create` | 84 | SOURCE | Find a citation for "intention before sleep improves consolidation for that problem", or cut the sentence. |
| `article/tool-job-fit` | 60 | EXPERIENCE | Is the "$30,000/month for ~40 GB" case (and the "under two seconds on an m5.xlarge" benchmark) something you saw or ran? If yes, restore the specific numbers with context (anonymized company, query shape, how it was measured). |
| `article/write-for-the-executive-survive-the-analyst` | 16 | EXPERIENCE | A real exec readout where a reviewer found a hole (or didn't). Anonymized numbers. |
| `posts/stock-trader-project-writeup` | 18 | SOURCE | Add a link to the thesis (PDF in public/ or an external URL). The thesis also cites github.com/mryagerr/reddit_monitoring_capstone: is that repo public, and should it be linked here? |
| `posts/stock-trader-project-writeup` | 24 | SOURCE | The thesis tracked ^GSPC, ^VIX, AAPL, DIS, TSLA, NFLX, BA, WMT, AMZN and NVDA over Jan 30 to Apr 23, 2020 (no META/FB, GOOG, MSFT or JPM). Is the list above from a later reproduction? If so, say when it was run; if not, replace it with the thesis list. |
| `posts/stock-trader-project-writeup` | 36 | SOURCE | yfinance only serves about 60 days of 30-minute history (the thesis used exactly that window). The "3 years of 30-minute data" below can't have come from yfinance alone: was it accumulated with repeated pulls, or from another vendor? |
| `posts/stock-trader-project-writeup` | 62 | SOURCE | Add the before/after numbers for the TextBlob → VADER swap (accuracy, majority-class baseline, test-set size), or remove "noticeably" if they aren't available. |
| `posts/stock-trader-project-writeup` | 70 | SOURCE | Add the Granger results (tickers, lags, p-values, period), or soften to what was actually run. |
| `page: index` | 48 | EXPERIENCE | Senior Staff data scientist; what you've built, in one line (for the hero). |

Total: 30 (11 EXPERIENCE, 19 SOURCE).
## Open questions (site-wide, not tied to one line)

1. **LinkedIn URL.** `/about/` links to `https://www.linkedin.com/in/michealpetrillo` ("Micheal"). Is that the correct, live profile? Once confirmed, add it to `AUTHOR_SAME_AS` in `src/consts.ts` so it appears in the Person JSON-LD `sameAs`.
2. **MailerLite.** What is the embedded-form action URL (or account and form IDs), and do you want double opt-in? The "Subscribe →" form in `src/layouts/BlogPost.astro` still opens a `mailto:` until this is answered.
3. **Posts vs Articles (A5).** Option 1: merge the two real posts into Articles under a "Project Writeups" category, 301-redirect `/posts/…`, delete "Welcome to Posts", and drop the Posts nav tab (this also means changing the CLAUDE.md rules that require exactly 4 header tabs and a separate `posts` collection). Option 2: keep Posts and fix only its intro copy.
4. **Stock project data provenance (critical).** Where did the multi-year 30-minute bars in the SVM article and the stock writeup come from? yfinance only serves about 60 days of 30-minute history. The 2020 thesis used Jan 30 to Apr 23, 2020 and a different ticker set. Are the 54% accuracy, the 37,636-row test set, the feature ranking, and the Granger results from a real run (notebook or output available)? If not, the honest fix is to remove the numbers and say the evaluation is being redone.
5. **Thesis PDF and repo.** May `Stock Change Prediction Utilizing Social Media Pools.pdf` (currently in the repo root, which isn't served) be copied to `public/` and linked from `/about/`, the SVM article, the data-sources article and the writeup? Is `github.com/mryagerr/reddit_monitoring_capstone` (cited in the thesis) public and OK to link?
6. **bd-mpar post voice.** `posts/bd-mpar-aws-device-downtime` describes you in the third person ("Michael Petrillo — the same data scientist behind…") on your own site. Rewrite in the first person?

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
