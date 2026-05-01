# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal data-focused blog **Low Hanging Data** (https://lowhangingdata.com), built with Astro 5.x and deployed to Cloudflare Workers via the `@astrojs/cloudflare` adapter (SSR, `trailingSlash: "always"`). TypeScript strict mode, plain CSS (no Tailwind/preprocessor), Node `>=22`.

---

## Development Commands

```bash
npm run dev          # Dev server at localhost:4321
npm run build        # Production build → dist/
npm run preview      # Build + run with `wrangler dev` (Cloudflare-like env)
npm run check        # Full validation: vitest run + astro build + tsc + wrangler deploy --dry-run
npm run deploy       # astro build + wrangler deploy
npm run cf-typegen   # Regenerate worker-configuration.d.ts

npm run test         # vitest run (single pass)
npm run test:watch   # vitest watch mode
npx vitest run src/utils/search.test.ts   # Run a single test file
npx vitest run -t "fuzzyScore"            # Filter by test name
```

`npm run check` is the canonical "before deploy" gate — it runs tests, builds, type-checks, and dry-runs the Worker deploy in one shot.

**Vitest config** (`vitest.config.ts`): `environment: 'node'`, `include: ['src/**/*.test.ts']` — tests live alongside their source (`src/utils/*.test.ts`, `src/consts.test.ts`).

---

## Architecture

### Content collections

Defined in `src/content.config.ts`. **Two collections are registered — `blog` and `posts` — sharing the same `articleSchema`.** The schema lives in `src/utils/contentSchema.ts` (not in `content.config.ts`) so it can be unit-tested without depending on Astro's virtual modules.

```typescript
// src/content.config.ts
import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { articleSchema } from "./utils/contentSchema";

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
  schema: articleSchema,
});

const posts = defineCollection({
  loader: glob({ base: "./src/content/posts", pattern: "**/*.{md,mdx}" }),
  schema: articleSchema,
});

export const collections = { blog, posts };
```

| Collection | Path on disk | URL prefix | Page file | Purpose |
|---|---|---|---|---|
| `blog` | `src/content/blog/` | `/article/{id}/` | `src/pages/article/[...slug].astro` | Step-by-step technical guides; tagged, categorized, searchable, in RSS |
| `posts` | `src/content/posts/` | `/posts/{id}/` | `src/pages/posts/[...slug].astro` | Project write-ups, tool opinions, observations; NOT in RSS, search, or category pages |

The filename becomes the URL slug for both. The two collections are intentionally kept separate even though they share a schema — only `blog` participates in tag categorization, RSS, and search.

### `contentSchema.ts` exports

```typescript
VALID_TAGS         // ['collection', 'preparation', 'pipelines', 'analysis', 'culture', 'career'] as const
Tag                // typeof VALID_TAGS[number]
TAG_LABELS         // Tag → display label
TAG_SLUGS          // Tag → URL slug (e.g. culture → 'culture-and-communication')
TAG_DESCRIPTIONS   // Tag → category-page intro text
SLUG_TO_TAG        // Reverse of TAG_SLUGS
articleSchema      // Zod schema (title, description, pubDate required; updatedDate, heroImage, difficulty 'low'|'high', tags optional)
ArticleData        // z.infer<typeof articleSchema>
```

Anything that needs to map between tags and category URLs **must** go through `TAG_SLUGS` / `SLUG_TO_TAG` — slugs are not always identical to tag values (e.g. `culture` → `culture-and-communication`).

### Frontmatter shape

```yaml
---
title: 'Title'              # required
description: 'Summary.'     # required
pubDate: 'Mar 26 2026'      # required (Zod coerces to Date)
updatedDate: 'Mar 27 2026'  # optional
heroImage: '/blog-foo.png'  # optional, must be 1200×630 PNG (NOT SVG)
difficulty: 'low'           # optional, 'low' | 'high'
tags: ['collection']        # optional, from VALID_TAGS only
---
```

### Routing

File-based from `src/pages/`. SSR vs. prerender split is significant:

| Route | File | Mode | Notes |
|---|---|---|---|
| `/` | `index.astro` | prerender | Hero + Start Here (4 hardcoded `START_HERE_IDS`) + Browse by Topic + Latest Articles (10 from `blog`) + Project Writeups (3 from `posts`) + bio |
| `/article/` | `article/index.astro` | prerender | Listing of all `blog` entries |
| `/article/{id}/` | `article/[...slug].astro` | prerender | Computes `readingTime`, `wordCount`, `relatedPosts` (over `blog` only), passes them to `BlogPost.astro` |
| `/posts/` | `posts/index.astro` | prerender | Listing of all `posts` entries (project write-ups) |
| `/posts/{id}/` | `posts/[...slug].astro` | prerender | Renders `posts` entries via `BlogPost.astro`; computes `readingTime`/`wordCount` but does NOT pass `relatedPosts` |
| `/category/{slug}/` | `category/[slug].astro` | prerender | Per-tag landing page over `blog` only; `getStaticPaths` iterates `VALID_TAGS` and emits `TAG_SLUGS[tag]` |
| `/projects/` | `projects/index.astro` | prerender | Hand-coded project list (not a collection) |
| `/projects/stackoverflow-monitoring/` | `projects/stackoverflow-monitoring/index.astro` | prerender | Project deep-dive |
| `/about/`, `/contact/`, `/privacy/`, `/terms/` | static `.astro` pages | prerender | Use `BlogPost.astro` layout for consistent styling |
| `/search/` | `search.astro` | **SSR** (`prerender = false`) | Reads `?q=`, fuzzy-ranks **only the `blog` collection** (title score × 2 + description score), highlights matches via `<mark>` |
| `/rss.xml` | `rss.xml.ts` | **SSR** (`prerender = false`) | `@astrojs/rss` over the `blog` collection — must stay SSR for the Worker runtime |
| `/sitemap.xml` | `sitemap.xml.ts` | **prerender** | Hand-rolled XML emitting static pages (incl. `/posts/`), all `category/{slug}/` URLs from `TAG_SLUGS`, every `/article/{id}/` and every `/posts/{id}/` with `<lastmod>`. **Not** generated by `@astrojs/sitemap` (that integration was removed). |
| `/404` | `404.astro` | prerender | Custom 404 |

### Layout: `BlogPost.astro`

Used by every article page and every static content page (about/contact/privacy/terms). Props extend the article schema:

```typescript
type Props = ArticleData & {
  readingTime?: number;
  wordCount?: number;        // Threaded through to BaseHead for JSON-LD
  headings?: MarkdownHeading[];
  relatedPosts?: RelatedPost[];
  breadcrumb?: { href: string; label: string };
};
```

Required behaviors built in:
- Scroll progress bar (3px, fixed, accent-colored).
- Optional breadcrumb when `breadcrumb` prop is set.
- Reading time + difficulty badge in meta line.
- Table of Contents — desktop sticky sidebar (200px, hidden ≤900px) + mobile collapsible `<details>`. Activates only when ≥3 headings at depth ≤3. Active heading highlighted via scroll listener.
- Share bar (X/Twitter, LinkedIn).
- Related articles grid (3 cards) at end of prose.
- Newsletter CTA submitting to `/about/#contact`.

### `BaseHead.astro`

Single source of truth for `<head>`: SEO meta, OG/Twitter cards, JSON-LD `Article` (only when `type="article"` and `pubDate` is set), RSS auto-discovery, Google Fonts (progressive load), Atkinson font preloads, Google AdSense (article pages only). **If the `image` prop is an SVG or omitted, it auto-substitutes `/blog-og-default.png`** — never pass an SVG; pass a 1200×630 PNG or omit.

### Markdown pipeline

`astro.config.mjs` registers a custom rehype plugin (`src/utils/rehypeResponsiveImages.ts`) that adds `loading="lazy"` and `decoding="async"` to every `<img>` in Markdown/MDX (uses `??=` so it never overrides existing attrs). Extracted into `src/utils/` so it's unit-testable.

```javascript
// astro.config.mjs (current shape)
export default defineConfig({
  site: "https://lowhangingdata.com",
  trailingSlash: "always",
  integrations: [mdx()],
  markdown: { rehypePlugins: [rehypeResponsiveImages] },
  adapter: cloudflare({ platformProxy: { enabled: true } }),
});
```

`@astrojs/sitemap` is **not** an integration here — `src/pages/sitemap.xml.ts` builds the XML manually so category and article URLs can be enumerated explicitly.

### Utilities (`src/utils/`)

Each `.ts` here has a sibling `.test.ts`. Adding a utility without a test is a convention violation.

| File | Purpose |
|---|---|
| `contentSchema.ts` | Zod schema + `VALID_TAGS` + `TAG_LABELS` / `TAG_SLUGS` / `TAG_DESCRIPTIONS` / `SLUG_TO_TAG` |
| `sort.ts` | `sortByPubDateDesc()` — non-mutating newest-first sort. **Use this** for any content collection ordering; do not write inline `.sort()` calls. |
| `readingTime.ts` | `calculateWordCount()` and `calculateReadingTime()` (~200 wpm, min 1) |
| `relatedPosts.ts` | `findRelatedPosts(currentId, currentTags, allPosts, hrefPrefix, limit=3)` — scores 2 per shared direct tag + 1 per shared adjacent tag (`CATEGORY_ADJACENCY`: collection↔preparation, pipelines↔analysis, culture↔career); ties broken by pubDate desc, then id alphabetical for determinism |
| `search.ts` | `fuzzyScore(text, terms)` (word-boundary bonus) + `highlightMatch()` (regex-escapes terms, wraps in `<mark>`) |
| `formatDate.ts` | `formatDate()` ("Mar 15, 2024") + `getCurrentYear()` (mockable) |
| `activeLink.ts` | `isActiveLink(href, pathname, baseUrl)` — strips `baseUrl`; root `/` only matches exactly |
| `difficultyBadge.ts` | Maps `'low'`/`'high'` → label (with emoji) and CSS class |
| `rehypeResponsiveImages.ts` | The rehype plugin imported by `astro.config.mjs` |

---

## Required UX behaviors

These are project conventions enforced in code review — do not regress them:

- **Header (`Header.astro`)** has exactly **4 tabs**: Home (`/`), Articles (`/article/`), Posts (`/posts/`), About (`/about/`). Plus an integrated search form (action `/search/`) and a hamburger button (mobile only). Contact lives in the footer, not the header.
- Header is `position: sticky; top: 0` with `backdrop-filter: blur(8px)` and `z-index: 100`. Do not use `position: fixed` (breaks SSR document flow).
- All nav links must have visible `:hover` styles (the header uses an underline slide-in animation).
- **Homepage (`index.astro`)** must keep: the Start Here section (4 articles by ID in `START_HERE_IDS`), the Browse by Topic grid (driven by `VALID_TAGS` × `TAG_SLUGS` × tag counts, computed from `blog` only), Latest Articles (10 from `blog`), and Project Writeups (3 from `posts`).
- **Article reading width** is capped at `max-width: 680px` on `.prose`; the outer `.article-layout` allows up to `960px` to fit the ToC. Do not widen `.prose`.
- **Dark mode** is required: every CSS custom property added to `:root` in `src/styles/global.css` must have a counterpart inside the `@media (prefers-color-scheme: dark)` block.
- The scroll progress bar and ToC behavior in `BlogPost.astro` are required — do not remove.

CSS custom properties are defined in `src/styles/global.css` (imported by `BaseHead.astro`). Key tokens: `--ink`, `--paper`, `--accent` (#0891b2 cyan), `--accent-dark`, `--accent-muted`, `--rule`, `--caption`, `--header-bg` (semi-transparent for blur). Fonts: `--font-display` (Playfair Display), `--font-body` (Source Serif 4 / Atkinson fallback), `--font-mono` (JetBrains Mono).

---

## Deployment

Cloudflare Workers via Wrangler. `wrangler.json` points `main` at `./dist/_worker.js/index.js` (built by `@astrojs/cloudflare`) and serves `./dist` as the `ASSETS` binding. `compatibility_date: "2026-04-18"` with `nodejs_compat`. Cloudflare env types are generated into `worker-configuration.d.ts` via `npm run cf-typegen`.

Always run `npm run check` before `npm run deploy`.

---

## What not to do

- Do not add the `posts` collection to RSS, search, category pages, or related-post calculations — `posts` is intentionally limited to its own `/posts/` listing, the `/posts/{id}/` detail page, the homepage Project Writeups section, and the sitemap. Articles (`blog`) are the canonical taxonomy-bearing content.
- Do not re-add `@astrojs/sitemap`; the sitemap is generated by `src/pages/sitemap.xml.ts` so category URLs can be enumerated.
- Do not add `export const prerender = true` to `rss.xml.ts` or `search.astro` — both must remain SSR on the Worker.
- Do not bypass `TAG_SLUGS` / `SLUG_TO_TAG` when building category URLs — slugs differ from tag values for `culture`.
- Do not write inline `.sort()` over content collections — use `sortByPubDateDesc()`.
- Do not define the content schema inline in `content.config.ts` — it lives in `src/utils/contentSchema.ts` so it can be unit-tested.
- Do not add a utility to `src/utils/` without a sibling `.test.ts`.
- Do not add Tailwind or another CSS framework — this project uses plain CSS by design.
- Do not pass an SVG to `BaseHead`'s `image` prop or use SVG hero images — social scrapers reject SVG; hero images must be 1200×630 PNG.
- Do not change `Header.astro` to have more or fewer than 4 nav tabs, remove the search form, or remove the hamburger menu.
- Do not add a GitHub link to `index.astro`, `Header.astro`, or `Footer.astro` (the projects page is the only place external repo links appear).
- Do not change `astro.config.mjs`'s `site` URL without coordinating DNS.
- Do not place test files outside the source's directory — `src/consts.test.ts` sits next to `src/consts.ts`; utility tests live in `src/utils/`.
- Do not put new content outside `src/content/blog/` (technical articles) or `src/content/posts/` (project write-ups) — those are the only two registered collection directories.
- Do not skip `npm run check` before deploying.
