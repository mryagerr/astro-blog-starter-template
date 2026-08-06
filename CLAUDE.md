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
npm run deploy       # wrangler deploy (assumes a fresh build)
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

Defined in `src/content.config.ts`. **Only one collection is registered — `blog`.** The schema lives in `src/utils/contentSchema.ts` (not in `content.config.ts`) so it can be unit-tested without depending on Astro's virtual modules.

```typescript
// src/content.config.ts
import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { articleSchema } from "./utils/contentSchema";

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
  schema: articleSchema,
});

export const collections = { blog };
```

| Collection | Path on disk | URL prefix | Page file | Purpose |
|---|---|---|---|---|
| `blog` | `src/content/blog/` | `/article/{id}/` | `src/pages/article/[...slug].astro` | All published articles: step-by-step guides, project write-ups, tool opinions, observations. Tagged, categorized, searchable, in RSS |

The filename becomes the URL slug. `src/content/posts/` exists on disk as historical content but is **not** loaded by any collection — there is no `posts` collection and no `/posts/` route. Do not add files to `src/content/posts/` expecting them to render.

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
| `/` | `index.astro` | prerender | Hero + Start Here (4 articles hardcoded in `START_HERE_IDS`: `getting-started-with-data`, `excel-to-sql-low-hanging-fruit`, `organizing-data-with-sql`, `python-pandas-data-wrangling`) + Browse by Topic (category tiles built from `VALID_TAGS` × `TAG_SLUGS` × per-tag counts) + Latest Articles (10 from `blog`) + author bio |
| `/article/` | `article/index.astro` | prerender | Listing of all `blog` entries with tag-filter chips (progressive-enhancement: chips are real links to `/category/{slug}/`, JS intercepts for instant client-side filtering) and clickable per-card tag chips |
| `/article/{id}/` | `article/[...slug].astro` | prerender | Computes `readingTime`, `wordCount`, `relatedPosts` (over `blog`), passes them to `BlogPost.astro` with `breadcrumb={{ href: '/article/', label: 'Articles' }}` |
| `/category/{slug}/` | `category/[slug].astro` | prerender | Per-tag landing page over `blog`; `getStaticPaths` iterates `VALID_TAGS` and emits `TAG_SLUGS[tag]`. First card in the grid is featured (full width). Includes a category-chip nav strip |
| `/projects/` | `projects/index.astro` | prerender | Hand-coded list of open-source project cards (NOT a content collection). Currently: Stack Overflow Monitoring, Plex Data Mining. Each card has title, tagline, description, highlights, tech tags, optional `href` for a detail page, and a GitHub link |
| `/projects/stackoverflow-monitoring/` | `projects/stackoverflow-monitoring/index.astro` | prerender | Project deep-dive; hand-authored page (not a `BlogPost` layout) |
| `/about/`, `/contact/`, `/privacy/`, `/terms/` | static `.astro` pages | prerender | Use `BlogPost.astro` layout for consistent styling |
| `/search/` | `search.astro` | **SSR** (`prerender = false`) | Reads `?q=`, fuzzy-ranks the `blog` collection (title score × 2 + description score), highlights matches via `<mark>` |
| `/rss.xml` | `rss.xml.ts` | **SSR** (`prerender = false`) | `@astrojs/rss` over the `blog` collection — must stay SSR for the Worker runtime |
| `/sitemap.xml` | `sitemap.xml.ts` | **prerender** | Hand-rolled XML enumerating static pages, all `category/{slug}/` URLs from `TAG_SLUGS`, and every `/article/{id}/` with `<lastmod>` from `pubDate`. **Not** generated by `@astrojs/sitemap` — that integration is not registered in `astro.config.mjs` |
| `/404` | `404.astro` | prerender | Custom 404 |

### Layout: `BlogPost.astro`

Used by every article page and every static content page (about/contact/privacy/terms). Props extend the article schema:

```typescript
type Props = CollectionEntry<'blog'>['data'] & {
  readingTime?: number;
  wordCount?: number;        // Threaded through to BaseHead for JSON-LD `wordCount`
  headings?: MarkdownHeading[];
  relatedPosts?: RelatedPost[];
  breadcrumb?: { href: string; label: string };
};
```

Required behaviors built in:
- Scroll progress bar (3px, fixed, accent-colored).
- Optional breadcrumb when `breadcrumb` prop is set (also drives JSON-LD `BreadcrumbList` in `BaseHead`).
- Reading time + difficulty badge in meta line.
- Table of Contents — desktop sticky sidebar (200px, hidden ≤900px) + mobile collapsible `<details>`. Activates only when ≥3 headings at depth ≤3. Active heading highlighted via scroll listener.
- Share bar (X/Twitter, LinkedIn).
- Related articles grid (3 cards) at end of prose.
- Newsletter CTA submitting to `/about/#contact`.

### `BaseHead.astro`

Single source of truth for `<head>`: SEO meta, OG/Twitter cards, JSON-LD `Article` (only when `type="article"` and `pubDate` is set), JSON-LD `BreadcrumbList` (only when `type="article"` and both `pubDate` and `breadcrumb` are set), RSS auto-discovery, Google Fonts (progressive load), Atkinson font preloads, Google Analytics gtag (`G-JHF6ZRP3MZ`, loaded on every page), Google AdSense (article pages only). **If the `image` prop is an SVG or omitted, it auto-substitutes `/blog-og-default.png`** — never pass an SVG; pass a 1200×630 PNG or omit. Canonical URL is normalized to always include the trailing slash to match `trailingSlash: "always"`.

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

`@astrojs/sitemap` is **not** an integration here — `src/pages/sitemap.xml.ts` builds the XML manually so category and article URLs can be enumerated explicitly. The `@astrojs/sitemap` package still appears in `package.json` as a dependency but is **not registered in `astro.config.mjs`** and must not be added back.

### `src/consts.ts`

Global site constants imported throughout the project:

```typescript
SITE_TITLE        // "Low Hanging Data"
SITE_DESCRIPTION  // One-line site tagline used in BaseHead and homepage
```

### Utilities (`src/utils/`)

Each `.ts` here has a sibling `.test.ts`. Adding a utility without a test is a convention violation.

| File | Purpose |
|---|---|
| `contentSchema.ts` | Zod schema + `VALID_TAGS` + `TAG_LABELS` / `TAG_SLUGS` / `TAG_DESCRIPTIONS` / `SLUG_TO_TAG` |
| `sort.ts` | `sortByPubDateDesc()` — non-mutating newest-first sort. **Use this** for any content collection ordering; do not write inline `.sort()` calls |
| `readingTime.ts` | `calculateWordCount(body)` and `calculateReadingTime(body)` (~200 wpm, min 1). `wordCount` is passed into `BaseHead` for the JSON-LD `wordCount` property |
| `relatedPosts.ts` | `findRelatedPosts(currentId, currentTags, allPosts, hrefPrefix, limit=3)` — scores 2 per shared direct tag + 1 per shared adjacent tag (`CATEGORY_ADJACENCY`: collection↔preparation, pipelines↔analysis, culture↔career); ties broken by pubDate desc, then id alphabetical for determinism. Exports `RelatedPostInput` and `RelatedPostOutput` interfaces |
| `search.ts` | `fuzzyScore(text, terms)` (word-boundary bonus) + `highlightMatch()` (regex-escapes terms, wraps in `<mark>`) |
| `formatDate.ts` | `formatDate()` ("Mar 15, 2024") + `getCurrentYear()` (mockable) |
| `activeLink.ts` | `isActiveLink(href, pathname, baseUrl)` — strips `baseUrl`; root `/` only matches exactly |
| `difficultyBadge.ts` | Maps `'low'`/`'high'` → label (with emoji) and CSS class |
| `rehypeResponsiveImages.ts` | The rehype plugin imported by `astro.config.mjs` |

### Other notable files

- `docs/hero-image-specs.md` — specifications for creating 1200×630 PNG hero images (dimensions, safe zones, naming convention). Consult before creating new hero images.
- `public/ads.txt` — Google AdSense publisher ID declaration; do not modify without coordinating AdSense account settings.
- `public/robots.txt` — crawler rules.
- `worker-configuration.d.ts` — auto-generated by `npm run cf-typegen`; do not edit manually.

---

## Required UX behaviors

These are project conventions enforced in code review — do not regress them:

- **Header (`Header.astro`)** has exactly **3 tabs**: Home (`/`), Articles (`/article/`), About (`/about/`). Plus an integrated search form (action `/search/`) and a hamburger button (mobile only). Contact, Privacy, and Terms live in the footer, not the header.
- Header is `position: sticky; top: 0` with `backdrop-filter: blur(8px)` and `z-index: 100`. Do not use `position: fixed` (breaks SSR document flow).
- All nav links must have visible `:hover` styles (the header uses an underline slide-in animation).
- **Footer (`Footer.astro`)** links: Home, Articles, About, Contact, Privacy, Terms. No RSS link, no GitHub link (the projects page is the only place external repo links appear).
- **Homepage (`index.astro`)** must keep: the Start Here section (4 articles by ID in `START_HERE_IDS`), the Browse by Topic grid (driven by `VALID_TAGS` × `TAG_SLUGS` × `TAG_DESCRIPTIONS` × per-tag counts, filtered to tags that have ≥1 article), and Latest Articles (10 from `blog`). The author bio blockquote closes the page.
- **Article reading width** is capped at `max-width: 680px` on `.prose`; the outer `.article-layout` allows up to `960px` to fit the ToC. Do not widen `.prose`.
- **Dark mode** is required: every CSS custom property added to `:root` in `src/styles/global.css` must have a counterpart inside the `@media (prefers-color-scheme: dark)` block.
- The scroll progress bar and ToC behavior in `BlogPost.astro` are required — do not remove.
- **Category page (`category/[slug].astro`)** must render a category-chip nav (linking to every other `TAG_SLUGS[t]`), a featured first card (full width), and a fallback empty state. Breadcrumb is Home › Articles › {label}.

CSS custom properties are defined in `src/styles/global.css` (imported by `BaseHead.astro`). Key tokens: `--ink`, `--paper`, `--accent` (#0891b2 cyan), `--accent-dark`, `--accent-muted`, `--rule`, `--caption`, `--header-bg` (semi-transparent for blur). Fonts: `--font-display` (Playfair Display), `--font-body` (Source Serif 4 / Atkinson fallback), `--font-mono` (JetBrains Mono).

---

## Deployment

Cloudflare Workers via Wrangler. `wrangler.json` points `main` at `./dist/_worker.js/index.js` (built by `@astrojs/cloudflare`) and serves `./dist` as the `ASSETS` binding. `compatibility_date: "2026-04-18"` with `nodejs_compat`, `observability` enabled, `upload_source_maps: true`. Cloudflare env types are generated into `worker-configuration.d.ts` via `npm run cf-typegen`.

`npm run deploy` runs `wrangler deploy` directly without a fresh build — always run `npm run check` (or at least `npm run build`) before `npm run deploy` so `dist/` is up to date.

---

## What not to do

- Do not re-introduce a `posts` collection or a `/posts/` route — the site has been consolidated onto a single `blog` collection. `src/content/posts/` on disk is dormant historical content, not a live source.
- Do not register `@astrojs/sitemap` as an Astro integration; the sitemap is generated by `src/pages/sitemap.xml.ts` so category URLs can be enumerated. The package still exists in `package.json` but must remain unregistered.
- Do not add `export const prerender = true` to `rss.xml.ts` or `search.astro` — both must remain SSR on the Worker.
- Do not bypass `TAG_SLUGS` / `SLUG_TO_TAG` when building category URLs — slugs differ from tag values for `culture`.
- Do not write inline `.sort()` over content collections — use `sortByPubDateDesc()`.
- Do not define the content schema inline in `content.config.ts` — it lives in `src/utils/contentSchema.ts` so it can be unit-tested.
- Do not add a utility to `src/utils/` without a sibling `.test.ts`.
- Do not add Tailwind or another CSS framework — this project uses plain CSS by design.
- Do not pass an SVG to `BaseHead`'s `image` prop or use SVG hero images — social scrapers reject SVG; hero images must be 1200×630 PNG.
- Do not change `Header.astro` to have more or fewer than 3 nav tabs, remove the search form, or remove the hamburger menu.
- Do not add a GitHub link to `index.astro`, `Header.astro`, or `Footer.astro` (the projects page is the only place external repo links appear).
- Do not change `astro.config.mjs`'s `site` URL without coordinating DNS.
- Do not place test files outside the source's directory — `src/consts.test.ts` sits next to `src/consts.ts`; utility tests live in `src/utils/`.
- Do not put new article content anywhere other than `src/content/blog/` — that is the only registered collection directory.
- Do not skip `npm run check` before deploying.
