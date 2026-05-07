# Hero Image Redesign Specs

Specs for the 10 hero images currently scoring under 8/10. Each spec is meant to be handed to whatever design tool produced the existing 8–9/10 images (Figma/Sketch/etc.) so the new versions stay visually consistent with the rest of the set.

## Shared brand tokens

All hero images are **1200 × 630 PNG** (OG-compatible).

| Token | Hex | Use |
|---|---|---|
| `bg` | `#0a1628` | Page background |
| `ink` | `#e6edf5` | Primary white text, plain-style title line |
| `accent` | `#22d3ee` | Cyan title highlight + cyan-outlined panels |
| `accent-soft` | `rgba(34,211,238,0.10)` | Cyan panel fill |
| `green` | `#22c55e` | "Good / low risk / after" |
| `amber` | `#f59e0b` | "Warn / medium / transform" |
| `red` | `#f43f5e` | "Bad / high risk / before" |
| `purple` | `#a78bfa` | Fourth category when needed |
| `muted` | `#64748b` | Captions, footer line |
| `panel-stroke` | category color | 2px rounded-rect outline, radius 12 |
| `panel-fill` | category color @ 10% | Panel interior |

**Typography (match the existing 8–9/10 images):**
- **Title line 1** — bold sans-serif, white (`ink`), ~52 px, centered, top-margin 56 px.
- **Title line 2** — JetBrains Mono Bold, `accent`, ~64 px, centered directly under line 1.
- **Panel headers** — JetBrains Mono Bold, 18 px, panel-stroke color.
- **Panel body** — JetBrains Mono Regular, 14 px, `ink`.
- **Footer caption** — JetBrains Mono Regular, 14 px, `muted`, centered, bottom-margin 28 px.

**Layout grid:** 56 px outer padding. Two-panel comparisons split with a 24 px central gutter and a vertical dashed `muted` rule with a "vs" badge centered on it. Three-panel layouts use 16 px gutters, no rule.

---

## 1. `blog-crawl-walk-run.png` — current 5/10

**Article:** Crawl, Walk, Run: Why Many Attempts Beat One Perfect Try
**Diagnosis:** "v1.1" circle overlaps the "cumulative impact" label; "vs" sits between unevenly weighted halves; the bar chart visually fights the circle row.

**Fix — single horizontal timeline, no overlap:**

```
Title:
  Line 1 (white sans):     Crawl. Walk. Run.
  Line 2 (cyan mono):      Many Attempts Beat One Perfect Try

Body — single row of 7 circles, evenly spaced, centered y=300:
  v0.1  v0.2  v0.3   |   v1.0  v1.1   |   v2.0  v2.1
  green green green  |   cyan cyan    |   amber amber
   "crawl"            |   "walk"      |   "run"
   (label above)      |   (above)     |   (above)

Below the row, a single bar that grows in height left→right
representing "cumulative impact" — height 20 → 110 px,
8 segments matching the circles, gradient green→cyan→amber.

Right side, separated by 80 px gutter, a single sad red
dashed circle labelled "perfecting forever — never shipped".
A faint arrow loops back into itself.

Footer caption:
  done & iterated beats perfect & waiting
```

**What to remove:** the bar chart from the current image (overlapping with circles), the "8 attempts = real impact" callout box (redundant), the "impact: 0" stub.

---

## 2. `blog-data-careers.png` — current 7/10

**Article:** Data Careers Are Not Pokemon Evolutions
**Diagnosis:** Crossing connector lines look messy; the graph reads as "everyone connects to everyone" without showing the article's point.

**Fix — clean radial layout, no crossing lines:**

```
Title:
  Line 1: Data Careers Are Not
  Line 2: Pokemon Evolutions

Body — central node "YOUR CURIOSITY" (cyan circle, 120 px),
ringed by 6 role boxes at evenly spaced angles:
  top:          Data Engineer        (green)
  top-right:    ML Engineer          (red)
  right:        Data Architect       (muted gray)
  bottom-right: Analytics Engineer   (purple)
  bottom-left:  Data Scientist       (amber)
  left:         Data Analyst         (cyan)

Each role connects to the center with a SINGLE radial line in
the role's color — no role-to-role edges. (This is the key
fix: removes all crossing lines from the current version.)

Footer caption:
  every path is valid — pick the one that fits your curiosity
```

---

## 3. `blog-data-quality-gaps.png` — current 5/10

**Article:** Leave the Ivory Castle: How SMEs Expose the Gaps Your Data Hides
**Diagnosis:** Right panel overflows; "paranoia is productive" callout overlaps the bottom caption; the "ivory castle" silhouette in the upper-left is too faint to read.

**Fix — clean two-panel comparison:**

```
Title:
  Line 1: Trust the Data?
  Line 2: Ask the People Who Live In It

Sub-title (mono, muted, centered): "Ivory Castle vs. The Gemba"

Two equal panels, 540 × 380 each, centered vertically at y=320:

LEFT — outline cyan, label "IVORY CASTLE":
  - small mock window: analyst_dashboard.sql
  - 3 rows: 001 | active | 1200.00
            002 | active |  875.00
            003 | active | 2100.00
  - footer ticks: ✓ no nulls  ✓ no dupes  ✓ joins ok
  - small caption under panel: "data looks great!"

RIGHT — outline amber, label "THE GEMBA — where work happens":
  - SME stick figure (left) with speech bubble:
    "status='active' just means the record wasn't deleted.
     half those accounts haven't transacted in 3 years."
  - small mock window: GAPS DISCOVERED (red header)
    rows showing same IDs but with last_txn dates,
    flagging DORMANT and TEST ACCT in red

Center between panels: an arrow → labelled "go to the GEMBA"
                       (cyan, 16 px, mono)

Footer caption:
  analyst + SME = real data quality
```

**What to remove:** the floating "paranoia is productive" badge and the redundant gray "ivory castle" silhouette in the current image. Keep all text inside panel boundaries — nothing floats over the footer.

---

## 4. `blog-cheerleader-quarterback.png` — current 6/10

**Article:** From Cheerleader to Quarterback
**Diagnosis:** All-text comparison. The football metaphor is invisible.

**Fix — keep the comparison, add visual anchors:**

```
Title:
  Line 1: From Cheerleader to Quarterback:
  Line 2: Data Pros Must Own the Field

Body — two panels with icon headers:
LEFT — outline muted gray, header "Cheerleader Role"
  Above the panel: small pom-pom icon (two crossed arcs in red)
  • waits to be asked questions
  • reports metrics after the fact
  • answers — doesn't frame problems
  • supports decisions made by others
  • on the sideline, not the field

RIGHT — outline cyan, header "Quarterback Role"
  Above the panel: small football icon (cyan ellipse with stitch lines)
  • proactively surfaces insights
  • frames the problem, not just data
  • defines KPIs with the business
  • drives decisions, doesn't just support
  • half analyst, half domain expert

Center: arrow with "grow into" label (current image already does this)

Below both panels (full width): a stylized football-field hash-mark
strip (10 evenly spaced cyan tick marks on a horizontal muted line)
to anchor the metaphor visually without dominating.

Footer caption:
  the data pro of tomorrow owns the problem — not just the query
```

**Key change:** the pom-pom + football icons + hash-mark strip are the only new elements. Layout otherwise mirrors the current image.

---

## 5. `blog-kpis-cultural.png` — current 7/10

**Article:** KPIs Are a Cultural Change, Not a Dashboard Project
**Diagnosis:** Dense and text-heavy; nothing visual sells the "cultural" thesis.

**Fix — add a timeline + outcome visualization:**

```
Title:
  Line 1: KPIs Are a Cultural Change,
  Line 2: Not a Dashboard Project

Body — horizontal timeline across the middle, y=320:
  WEEK 4 ────────── MONTH 6 ────────── MONTH 12
  green dot         amber dot          red/green branch

Above the timeline (top half), TWO PARALLEL TRACKS rendered as
horizontal lanes, not as side-by-side panels:

  TECHNICAL TRACK (green lane, top):
    icons left→right: ✓ workshop  ✓ pipeline  ✓ dashboard
                      ✓ training  ✓ scheduled
    lane terminates at WEEK 4 with a green checkmark

  CULTURAL TRACK (amber lane, below):
    icons left→right: □ leader owns each number
                      □ meetings reference metrics
                      □ decisions actually change
    lane keeps going past MONTH 6, unchecked, fading

Below timeline (bottom strip), TWO OUTCOMES branching from the
MONTH-12 split:
  LEFT (red, below technical-only path):
    "17 charts nobody opens"
  RIGHT (green, below technical+cultural path):
    "data-driven is a behavior, not a tool"

Footer caption:
  the dashboard is not the deliverable — the behavioral change is
```

**Why this is better:** turns a checklist comparison into a time-based story showing WHY culture matters — the technical track finishes, the cultural track is what actually changes outcomes.

---

## 6. `blog-telephone-game.png` — current 3/10 (highest priority)

**Article:** The Telephone Game Is How Analytics Goes Wrong
**Diagnosis:** Image is **cropped on the right** — the rightmost stick figure cuts off mid-figure. Title font breaks brand (looks sans-serif bold instead of the standard "white sans + cyan mono" two-line treatment). Subtitle missing.

**Fix — full re-render with brand title treatment, fit within canvas:**

```
Title:
  Line 1 (white): The Telephone Game
  Line 2 (cyan mono): Is How Analytics Goes Wrong

Body — five stick figures evenly spaced at y=380, x positions
at 100, 320, 540, 760, 980 (gives 100 px right margin so
nothing crops):

  1. CEO              speech bubble: "enterprise health"
  2. VP               speech bubble: "cust. health Q2"      (amber)
  3. Director         speech bubble: "health dashboard"     (orange)
  4. Manager          speech bubble: "ARR + churn + NPS?"   (red)
  5. Analyst          speech bubble: "??"                   (red)

Connectors: arrows between each pair, getting progressively
thinner / dashed / red as they move right (visual entropy).

Below figures, a horizontal "fidelity bar" green→amber→red
showing 100% → 80% → 55% → 30% → ??

Footer caption:
  information loss at every handoff
```

**Critical:** this image must be regenerated at 1200×630 with the standard brand title block. Current version's title is the wrong font and starts too high.

---

## 7. `blog-tool-job-fit.png` — current 6/10

**Article:** Stop Forcing Tools Into Jobs They Weren't Built For
**Diagnosis:** Title is serif (off-brand — every other image uses bold sans + cyan mono). Four parallel arrows in a stack feel repetitive.

**Fix — switch to brand title + a 2×2 quadrant:**

```
Title (in brand format — switch from serif to bold sans + mono):
  Line 1: Stop Forcing Tools
  Line 2: Into Jobs They Weren't Built For

Body — 2×2 quadrant grid, axes labelled:
  X axis (bottom):  prototype  →  production
  Y axis (left):    ad hoc     ↑  governed

Place 8 tool labels as small rounded pills in their correct
quadrants:

  Bottom-left  (prototype + ad hoc):
    Excel, local notebook, CSV, cron
  Top-right    (production + governed):
    SQL, cloud warehouse, Parquet, Airflow

Faint gray arrows connect each prototype tool to its production
counterpart at low opacity — same pairs as the current image
(Excel→SQL, CSV→Parquet, cron/Jenkins→Airflow/Dagster, notebook→
warehouse) but now arranged as movement across the quadrant
instead of stacked rows.

Mid-image label, muted: "the right tool depends on the phase"

Footer caption:
  Low Hanging Data
```

**Why better:** quadrant layout makes the article's actual point ("tools fit a phase, not a job") immediately legible instead of just listing migrations.

---

## 8. `blog-aws-iot.png` — current 1/10 (blank gradient)

**Post:** How BD Used AWS to Stop Guessing When Medical Devices Would Fail
**Diagnosis:** Currently a flat teal-to-navy gradient with no content.

**Fix — full design from scratch:**

```
Title:
  Line 1: AWS IoT for
  Line 2: Medical Device Telemetry

Body — three-stage pipeline, left to right:

LEFT panel (cyan outline, 280 px wide):
  Header: "DEVICE FLEET"
  Icon: small medical-device silhouette (rounded rectangle
        with status LED dots) repeated 4× in a 2×2 grid
  Caption: "12,000 devices · global"

MIDDLE panel (amber outline, 280 px wide):
  Header: "AWS IoT CORE"
  Body: stylized message stream — three rows of small
        rounded-rect "messages" flowing left to right with
        timestamps:
          t=0   device_42  temp=37.1  ok
          t=1   device_42  temp=39.8  warn
          t=2   device_42  fault=E07  alert (red)
  Caption: "MQTT · 2.3M msgs/day"

RIGHT panel (green outline, 280 px wide):
  Header: "PREDICTED FAILURE"
  Body: small line chart of "predicted failure probability"
        rising from 0.1 to 0.9 over time, with a red threshold
        line at 0.7
  Below chart: badge "FIELD TECH DISPATCHED · 6 days early"

Arrows between panels: cyan → amber → green

Footer caption:
  stream telemetry · model failure · ship before it breaks
```

---

## 9. `blog-stock-prediction.png` — current 1/10 (blank gradient)

**Post:** Building a Stock Prediction Pipeline: What We Did and What We Learned
**Diagnosis:** Flat blue gradient with no content.

**Fix — pipeline + outcome visualization:**

```
Title:
  Line 1: Building a
  Line 2: Stock Prediction Pipeline

Body — top half: 4-stage pipeline, left to right:
  COLLECT    →    FEATURE     →    TRAIN       →    PREDICT
  (cyan)          (amber)          (purple)         (green)

  Each stage = 200 × 100 panel with a tiny inline icon:
    COLLECT:  3 stacked horizontal lines (data sources)
    FEATURE:  bracketed list "[ lag · diff · roll ]"
    TRAIN:    small SVM-style scatter with a boundary line
    PREDICT:  upward arrow on a faint chart

Bottom half: results panel, full width, dark with cyan outline:
  Header (mono cyan): "WHAT WE LEARNED"
  Two columns:
    LEFT (green check rows):
      ✓ pipeline ran daily for 90 days
      ✓ 61% directional accuracy on test
      ✓ feature engineering > model choice
    RIGHT (red x rows):
      ✗ live trading lost money — slippage
      ✗ regime change in week 7 broke model
      ✗ "alpha" decayed within 2 weeks

Footer caption:
  the pipeline shipped · the alpha didn't
```

---

## 10. `blog-welcome.png` — current 1/10 (blank gradient)

**Post:** Welcome to Posts
**Diagnosis:** Flat dark gradient with no content. Lower stakes than the article-style heroes since this is a single landing post, but should still be on-brand.

**Fix — minimal but on-brand:**

```
Title:
  Line 1: Welcome to
  Line 2: Posts

Subtitle (mono, muted, centered, 18 px):
  "project write-ups · tool opinions · field notes"

Body — three small panels in a row, 240 × 160 each, centered y=380:

  LEFT (cyan outline):
    icon: small "/posts/" URL pill
    label: "PROJECT WRITE-UPS"
    sub:   "what we built and why"

  MIDDLE (amber outline):
    icon: small magnifying-glass on a chart
    label: "TOOL OPINIONS"
    sub:   "what worked, what didn't"

  RIGHT (green outline):
    icon: small notebook with a pen
    label: "FIELD NOTES"
    sub:   "shorter than articles"

Footer caption:
  for the long-form technical guides, see /article/
```

---

## Implementation order (by impact)

1. **`blog-telephone-game.png`** — currently broken (cropped + off-brand). Fixes a regression visible to every reader of that article.
2. **`blog-aws-iot.png`, `blog-stock-prediction.png`, `blog-welcome.png`** — three blank gradients. Largest absolute quality jump per unit of work.
3. **`blog-data-quality-gaps.png`, `blog-crawl-walk-run.png`** — overlapping-element fixes. Same layout, just clean up.
4. **`blog-cheerleader-quarterback.png`, `blog-kpis-cultural.png`, `blog-tool-job-fit.png`, `blog-data-careers.png`** — design improvements. The articles are still readable with the current heroes; lowest urgency.

## QA checklist (before replacing any file)

- [ ] Exported as **1200 × 630 PNG** (NOT SVG — see `CLAUDE.md`).
- [ ] Title uses bold-sans (line 1) + JetBrains Mono cyan (line 2). No serif titles.
- [ ] No element crops outside the 1200 × 630 frame.
- [ ] No element overlaps the footer caption strip (bottom 60 px reserved).
- [ ] Background is `#0a1628` (matches the rest of the set).
- [ ] All panel outlines are 2 px, radius 12, with 10% accent fill.
- [ ] Reads at thumbnail size (test at 600 × 315 — homepage card size).
