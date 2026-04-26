# CLAUDE.md — AI Assistant Guide for astro-blog-starter-template

## Project Overview

This is a personal blog and data-focused content site called **Low Hanging Data**, built with [Astro](https://astro.build) and deployed to **Cloudflare Workers**. It publishes technical articles on data collection, processing, and analysis, alongside shorter blog posts and project writeups.

- **Live site:** https://lowhangingdata.com
- **Framework:** Astro 5.x (output: SSR via Cloudflare adapter, `trailingSlash: "always"`)
- **Deployment:** Cloudflare Workers via Wrangler
- **Language:** TypeScript (strict mode)
- **Styling:** Plain CSS (no Tailwind or preprocessor)

---

## Development Workflows

### Local Development

```bash
npm run dev          # Start dev server at localhost:4321
npm run build        # Production build (outputs to dist/)
npm run preview      # Build + run with Wrangler dev (Cloudflare-like env)
npm run check        # Full validation: vitest run + astro build + tsc + wrangler deploy --dry-run
npm run deploy       # Deploy to Cloudflare Workers (requires Wrangler auth)
npm run cf-typegen   # Regenerate Cloudflare environment type definitions
```

**Node.js requirement:** >= v22

### Type Checking

TypeScript is in strict mode. Always run `npm run check` before committing to validate the full build pipeline. Type checking is bundled into the `check` command alongside tests and build.

### Testing

Unit tests use **Vitest**. Test files live alongside their source in `src/utils/*.test.ts`.

```bash
npm run test         # Run all tests once (vitest run)
npm run test:watch   # Watch mode for development (vitest)
```

The `check` script runs tests first (`vitest run`) before building. Always ensure tests pass before deploying.

**Vitest config** (`vitest.config.ts`):
- Environment: `node`
- Test file pattern: `src/**/*.test.ts` (covers all test files under `src/`, including `src/consts.test.ts` and `src/utils/*.test.ts`)

---

## Directory Structure

```
astro-blog-starter-template/
├── public/                  # Static assets (served as-is)
│   ├── fonts/               # Atkinson web font files
│   ├── blog-*.png           # Hero images (1200×630 PNG)
│   ├── blog-og-default.png  # Default OG/social sharing image
│   ├── favicon.svg
│   ├── apple-touch-icon.svg
│   ├── ads.txt
│   └── robots.txt
├── src/
│   ├── components/          # Reusable .astro components (5 files)
│   ├── content/             # Markdown/MDX content files
│   │   ├── blog/            # Technical articles (~35 files)
│   │   └── posts/           # Short blog posts (~3 files)
│   ├── layouts/
│   │   └── BlogPost.astro   # Shared layout for articles (with ToC, related posts, share bar)
│   ├── pages/               # File-based routing
│   │   ├── index.astro      # Homepage (hero + article card grid)
│   │   ├── about.astro      # About page
│   │   ├── contact.astro    # Contact page
│   │   ├── privacy.astro    # Privacy Policy page
│   │   ├── terms.astro      # Terms of Use page
│   │   ├── search.astro     # Site search page (SSR, prerender = false)
│   │   ├── rss.xml.ts       # RSS feed endpoint (uses @astrojs/rss + blog collection)
│   │   ├── sitemap.xml.ts   # Custom prerendered XML sitemap (all routes + lastmod)
│   │   ├── 404.astro        # Custom 404 error page
│   │   ├── article/         # Articles section (/article/*)
│   │   ├── category/        # Tag/category pages (/category/{slug})
│   │   └── posts/           # Blog posts section (/posts/*)
│   ├── styles/
│   │   └── global.css       # Global CSS (editorial minimalist palette)
│   ├── utils/               # Shared utility functions + Vitest tests
│   │   ├── activeLink.ts    # Active nav link detection
│   │   ├── activeLink.test.ts
│   │   ├── contentSchema.ts    # Shared Zod schema (articleSchema + ArticleData type + VALID_TAGS)
│   │   ├── contentSchema.test.ts
│   │   ├── difficultyBadge.ts  # Difficulty badge labels/classes
│   │   ├── difficultyBadge.test.ts
│   │   ├── formatDate.ts    # Date formatting helpers
│   │   ├── formatDate.test.ts
│   │   ├── readingTime.ts   # calculateReadingTime() — word count → minutes
│   │   ├── readingTime.test.ts
│   │   ├── rehypeResponsiveImages.ts  # Rehype plugin for lazy-loading images
│   │   ├── rehypeResponsiveImages.test.ts
│   │   ├── relatedPosts.ts  # findRelatedPosts() — tag-scored related articles
│   │   ├── relatedPosts.test.ts
│   │   ├── search.ts        # fuzzyScore() + highlightMatch() for site search
│   │   ├── search.test.ts
│   │   ├── sort.ts          # Content sorting helpers
│   │   └── sort.test.ts
│   ├── consts.ts            # SITE_TITLE, SITE_DESCRIPTION
│   ├── consts.test.ts       # Tests for site constants
│   ├── content.config.ts    # Content collection definitions (imports schema from utils)
│   └── env.d.ts             # TypeScript environment declarations
├── astro.config.mjs         # Astro configuration (includes rehypeResponsiveImages plugin)
├── vitest.config.ts         # Vitest configuration
├── wrangler.json            # Cloudflare Workers config
├── worker-configuration.d.ts # Cloudflare env type definitions (auto-generated)
├── tsconfig.json            # TypeScript config (extends astro/tsconfigs/strict)
├── package.json
└── *.pdf                    # Research papers (not part of build; referenced by content)
```

---

## Content Collections

Defined in `src/content.config.ts`. Both collections use the shared `articleSchema` imported from `src/utils/contentSchema.ts`.

### Schema

The Zod schema is defined in `src/utils/contentSchema.ts` and exported as `articleSchema` (with inferred type `ArticleData`). Extracting it here allows independent unit testing without Astro's virtual modules.

```typescript
// src/utils/contentSchema.ts
export const VALID_TAGS = [
  'collection', 'preparation', 'pipelines',
  'analysis', 'culture', 'career',
] as const;

export type Tag = typeof VALID_TAGS[number];

export const TAG_LABELS: Record<Tag, string> = {
  collection: 'Collection',
  preparation: 'Preparation',
  pipelines: 'Pipelines',
  analysis: 'Analysis',
  culture: 'Culture & Communication',
  career: 'Career',
};

// URL-safe slugs for each tag (used in /category/{slug} routes)
export const TAG_SLUGS: Record<Tag, string> = {
  collection: 'collection',
  preparation: 'preparation',
  pipelines: 'pipelines',
  analysis: 'analysis',
  culture: 'culture-and-communication',  // note: hyphenated
  career: 'career',
};

// Human-readable descriptions shown on category pages
export const TAG_DESCRIPTIONS: Record<Tag, string> = { /* ... */ };

// Reverse map: slug → Tag (used in category/[slug].astro)
export const SLUG_TO_TAG: Record<string, Tag> = /* derived from TAG_SLUGS */;

export const articleSchema = z.object({
  title: z.string(),           // Required
  description: z.string(),     // Required
  pubDate: z.coerce.date(),    // Required (coerced from string)
  updatedDate: z.coerce.date().optional(),
  heroImage: z.string().optional(),
  difficulty: z.enum(['low', 'high']).optional(),
  tags: z.array(z.enum(VALID_TAGS)).optional(),
});

export type ArticleData = z.infer<typeof articleSchema>;
```

### Collections

Both collections are defined using Astro 5's content layer API with the `glob` loader:

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

| Collection | Directory | Route | Purpose |
|---|---|---|---|
| `blog` | `src/content/blog/` | `/article/{id}` | Technical data articles |
| `posts` | `src/content/posts/` | `/posts/{id}` | Short blog posts & writeups |

### Adding Content

Create a `.md` or `.mdx` file in the appropriate collection directory with valid frontmatter:

```yaml
---
title: 'Your Article Title'
description: 'A concise summary of the content.'
pubDate: 'Mar 26 2026'
updatedDate: 'Mar 27 2026'   # optional
heroImage: '/blog-placeholder-1.png'  # optional (must be 1200×630 PNG)
difficulty: 'low'             # optional: 'low' or 'high'
tags: ['collection', 'pipelines']  # optional: from VALID_TAGS
---
```

The filename becomes the URL slug (e.g., `my-article.md` → `/article/my-article`).

---

## Components

Located in `src/components/`. All are `.astro` files.

| Component | Purpose |
|---|---|
| `BaseHead.astro` | `<head>` tags: charset, viewport, SEO meta, OG tags, Twitter cards, JSON-LD structured data, Google Fonts (progressive load), Atkinson font preloads, RSS auto-discovery, Google Analytics (GA4), Google AdSense (article pages only). SVG images auto-fall back to `/blog-og-default.png`. Props: `title`, `description`, `image?`, `type?`, `pubDate?`, `updatedDate?`, `wordCount?`, `breadcrumb?`. |
| `Header.astro` | Site header with 3 nav tabs (Home, Articles, About), integrated search form, and hamburger mobile menu |
| `HeaderLink.astro` | Nav link that auto-applies active styles based on current route |
| `Footer.astro` | Site footer with brand section, nav links (Home, Articles, About, Contact, Privacy, Terms, RSS Feed, Sitemap), and copyright |
| `FormattedDate.astro` | Renders a `Date` object as a `<time>` element (format: "Mar 03, 2025") |

### Component Pattern

```astro
---
interface Props {
  propName: string;
  optionalProp?: string;
}
const { propName, optionalProp } = Astro.props;
---

<element>{propName}</element>

<style>
  /* Scoped CSS — only applies within this component */
</style>
```

---

## Layouts

### `BlogPost.astro`

The shared layout used by `/article/[...slug].astro` and `/posts/[...slug].astro`.

**Props:** Content collection schema fields plus optional enhancements:

```typescript
type Props = CollectionEntry<'blog'>['data'] & {
  readingTime?: number;          // Minutes to read (computed from word count)
  wordCount?: number;            // Raw word count (displayed alongside reading time)
  headings?: MarkdownHeading[];  // Used to render Table of Contents
  relatedPosts?: RelatedPost[];  // Up to 3 related articles shown at bottom
  breadcrumb?: { href: string; label: string }; // Breadcrumb trail
};
```

**Features:**
- Scroll progress bar (fixed, 3px, accent-colored — always present)
- Breadcrumb navigation (rendered when `breadcrumb` prop is passed)
- Hero image with border-radius and drop shadow
- Custom SVG mascot displayed above the title
- Reading time in meta line (rendered when `readingTime` prop is passed)
- Difficulty badge: green for `'low'`, yellow for `'high'`
- Updated date display if `updatedDate` is provided
- Share bar (X/Twitter and LinkedIn sharing links)
- Table of Contents — desktop sticky sidebar + mobile collapsible `<details>` (shown when article has ≥3 headings at depth ≤3; ToC links highlight as user scrolls)
- Related articles grid (3 cards) at end of prose
- Newsletter CTA form (submits to `/about#contact`)

---

## Pages & Routing

Astro uses file-based routing from `src/pages/`.

| File | Route | Description |
|---|---|---|
| `index.astro` | `/` | Homepage: hero section + Start Here list + Browse by Topic grid + Latest Articles grid (10 articles) + author bio |
| `about.astro` | `/about` | Static about page (uses BlogPost layout) |
| `contact.astro` | `/contact` | Static contact page (uses BlogPost layout) |
| `privacy.astro` | `/privacy` | Privacy policy (uses BlogPost layout) |
| `terms.astro` | `/terms` | Terms of use (uses BlogPost layout) |
| `search.astro` | `/search` | Full-text search across blog + posts (SSR; `prerender = false`) |
| `rss.xml.ts` | `/rss.xml` | RSS feed of blog collection (SSR, `prerender = false`; uses `@astrojs/rss`) |
| `sitemap.xml.ts` | `/sitemap.xml` | Prerendered custom XML sitemap (all static + category + article + post routes with `<lastmod>`) |
| `404.astro` | `/404` | Custom 404 error page |
| `article/index.astro` | `/article` | Grid listing of all technical articles with client-side tag filtering |
| `article/[...slug].astro` | `/article/{id}` | Dynamic article page |
| `category/[slug].astro` | `/category/{tag-slug}` | Tag/category listing (one route per VALID_TAG, slug from `TAG_SLUGS`) |
| `posts/index.astro` | `/posts` | List of blog posts |
| `posts/[...slug].astro` | `/posts/{id}` | Dynamic blog post page |

### Dynamic Routes

Dynamic pages use `getStaticPaths()` with `getCollection()`. In Astro 5's content layer API, `render()` is a standalone function imported from `astro:content` (not a method on the entry):

```typescript
import { type CollectionEntry, getCollection, render } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({
    params: { slug: post.id },
    props: post,
  }));
}

type Props = CollectionEntry<'blog'>;
const post = Astro.props;
const { Content, headings } = await render(post);
```

### Article Page Enhancements

`/article/[...slug].astro` computes extra props before passing to the layout using extracted utilities:

```typescript
import { calculateReadingTime, calculateWordCount } from '../../utils/readingTime';
import { findRelatedPosts } from '../../utils/relatedPosts';

const readingTime = calculateReadingTime(post.body);
const wordCount = calculateWordCount(post.body);

const allPosts = sortByPubDateDesc(await getCollection('blog'));
const relatedPosts = findRelatedPosts(
  post.id,
  post.data.tags ?? [],
  allPosts,
  '/article/',
);
```

Related posts are scored by shared tags (2 pts each) plus adjacent-category tags (1 pt each), then sorted by score desc → pubDate desc → id alphabetical. The `findRelatedPosts()` function lives in `src/utils/relatedPosts.ts`.

### Posts Page Enhancements

`/posts/[...slug].astro` uses a simpler related-posts strategy: the 3 most recent posts from the `posts` collection (excluding the current one), with no tag-based scoring.

### Category Pages

`/category/[slug].astro` generates one page per tag using `getStaticPaths()` over `VALID_TAGS`. The URL slug comes from `TAG_SLUGS` (e.g., `culture` → `/category/culture-and-communication/`). Each page shows the tag's description, article count, navigation chips for all other categories, a featured first article, and a 2-column grid for the rest.

### Search Page

`/search` is an SSR page (`export const prerender = false`). It reads `?q=` from the URL and uses fuzzy scoring via `fuzzyScore()` from `src/utils/search.ts` to rank results across both `blog` and `posts` collections. Title matches are weighted 2x. Results are sorted by relevance score (ties broken by pubDate descending). Matching query terms are highlighted in results using `highlightMatch()` which wraps terms in `<mark>` tags. Results display type badge (Article / Post), date, title, and description.

---

## Utility Functions

Located in `src/utils/`. All utilities have corresponding Vitest test files.

### `contentSchema.ts`

```typescript
VALID_TAGS         // Const tuple of allowed tag values
Tag                // Union type of valid tag strings
TAG_LABELS         // Record<Tag, string> — display label per tag
TAG_SLUGS          // Record<Tag, string> — URL-safe slug per tag ('culture' → 'culture-and-communication')
TAG_DESCRIPTIONS   // Record<Tag, string> — paragraph description per tag (used on category pages)
SLUG_TO_TAG        // Record<string, Tag> — reverse map from slug back to Tag
articleSchema      // Zod schema for content frontmatter (used by both collections)
ArticleData        // Inferred TypeScript type from the schema
```

Imported by `src/content.config.ts` for both the `blog` and `posts` collections, and by `src/pages/category/[slug].astro` for route generation. Extracting the schema here avoids Astro virtual module dependencies so it can be unit-tested directly.

### `formatDate.ts`

```typescript
formatDate(date: Date): string        // Returns "Mar 15, 2024"
getCurrentYear(): number              // Returns current year (mockable in tests)
```

### `sort.ts`

```typescript
sortByPubDateDesc<T extends { data: { pubDate: Date } }>(entries: T[]): T[]
// Sorts content entries newest-first. Does not mutate the input array.
```

Use this instead of inline `.sort()` calls when ordering content collections.

### `activeLink.ts`

```typescript
isActiveLink(href: string | undefined, rawPathname: string, baseUrl: string): boolean
// Returns true if href matches the current pathname exactly, or as a top-level section.
// Strips baseUrl prefix before comparing. Root "/" only matches exactly.
```

### `difficultyBadge.ts`

```typescript
getDifficultyLabel(difficulty: 'low' | 'high'): string
// 'low'  → '🍎 Low Hanging Fruit'
// 'high' → '🌳 High Hanging Fruit'

getDifficultyClass(difficulty: 'low' | 'high'): string
// Returns CSS class: 'difficulty-badge difficulty-low' or 'difficulty-badge difficulty-high'
```

### `readingTime.ts`

```typescript
calculateWordCount(body: string | null | undefined): number
// Splits on whitespace and counts non-empty tokens.

calculateReadingTime(body: string | null | undefined): number
// Calculates estimated reading time in minutes (~200 wpm). Always returns at least 1.
// Calls calculateWordCount() internally.
```

### `rehypeResponsiveImages.ts`

```typescript
rehypeResponsiveImages(): (tree: HastNode) => void
// Rehype plugin that adds loading="lazy" and decoding="async" to all <img> elements.
// Uses ??= so it never overrides existing attributes.
```

Imported by `astro.config.mjs`. Extracted from the config file so it can be unit-tested independently.

### `relatedPosts.ts`

```typescript
// Exported constant — tag adjacency pairs for cross-category fallback:
//   Collection ↔ Preparation, Pipelines ↔ Analysis, Culture ↔ Career
export const CATEGORY_ADJACENCY: Record<string, string[]>

findRelatedPosts(
  currentId: string,
  currentTags: readonly string[],
  allPosts: RelatedPostInput[],
  hrefPrefix: string,
  limit?: number,  // default: 3
): RelatedPostOutput[]
// Scoring: 2 pts per shared direct tag + 1 pt per shared adjacent-category tag.
// Sort order: score desc → pubDate desc → id alphabetical (deterministic tiebreaker).
// Returns up to `limit` results as RelatedPostOutput[].
```

### `search.ts`

```typescript
fuzzyScore(text: string, terms: string[]): number
// Returns a relevance score for how well text matches the query terms.
// Word-boundary matches get a bonus.

highlightMatch(text: string, queryStr: string): string
// Wraps matching query terms in <mark> tags. Regex-escapes terms to prevent injection.
```

---

## UX & Navigation Standards

These are required behaviors. Do not remove or regress them.

### Homepage Start Here Section

`index.astro` includes a **Start Here** section above the Browse by Topic grid. It shows 4 curated onboarding articles in a numbered list, hardcoded by ID in `START_HERE_IDS`:

```typescript
const START_HERE_IDS = [
  'getting-started-with-data',
  'excel-to-sql-low-hanging-fruit',
  'organizing-data-with-sql',
  'python-pandas-data-wrangling',
];
```

Do not remove this section or change it to use dynamic/tag-based selection without updating the curated list intentionally.

### Homepage Browse by Topic Grid

`index.astro` includes a **Browse by Topic** section between Start Here and Latest Articles. It renders all 6 tags as clickable cards, each showing the tag label, article count, and description. Each card links to `/category/{TAG_SLUGS[tag]}/`. Do not remove this section.

### Header Navigation

`Header.astro` has **3 nav tabs**: **Home** (`/`), **Articles** (`/article`), **About** (`/about`). Contact is accessible from the footer but is not a header tab. The header also includes:
- An integrated search form (links to `/search?q=`) with an expanding input field
- A hamburger button (visible on mobile only) that toggles the nav panel open/closed

### Hover States

All navigation links in `Header.astro` and `HeaderLink.astro` must have visible `:hover` styles. The header uses an underline slide-in animation on hover/active. Never leave nav links with no hover feedback.

### Sticky Header

`Header.astro` must use `position: sticky; top: 0` so the nav remains visible while scrolling. It uses `backdrop-filter: blur(8px)` over a semi-transparent `var(--header-bg)` background and `z-index: 100`. Do not use `position: fixed` (breaks document flow for SSR).

### Reading-Width Constraint

Article prose is constrained to `max-width: 680px` within the `.prose` element inside `BlogPost.astro`. The outer `.article-layout` allows up to `960px` to accommodate the optional ToC sidebar. Do not widen the `.prose` container beyond 680px on article routes.

### Dark Mode

The site supports dark mode via `@media (prefers-color-scheme: dark)` in `src/styles/global.css`. Dark mode must define equivalent values for all `:root` CSS custom properties. Do not remove the dark mode media query block. When adding new CSS custom properties to `:root`, always add a dark-mode equivalent in the dark media query.

### Scroll Progress Indicator

Article pages (`/article/[...slug].astro`) include a scroll progress bar via `BlogPost.astro` — a 3px fixed div at `top: 0` with `background: var(--accent)`, updated on `scroll` events. Do not remove this from the layout.

### Table of Contents

`BlogPost.astro` renders a ToC when the article has 3 or more headings at depth ≤ 3. Desktop: sticky sidebar (200px wide, hidden at ≤900px). Mobile: collapsible `<details>` element. Active heading is highlighted via scroll listener. Do not remove this behavior.

---

## Styling Conventions

- **No Tailwind** — use plain CSS only.
- **Scoped styles** in `.astro` components via `<style>` tags (Astro automatically scopes these).
- **Global styles** in `src/styles/global.css`, imported in `BaseHead.astro`.
- **CSS custom properties** defined in `:root` in `global.css`:
  - `--ink: #1a1a18` (body text)
  - `--paper: #f7f5f0` (background)
  - `--accent: #0891b2` (cyan)
  - `--accent-dark: #0e7490`
  - `--accent-muted: #bae6fd` (light cyan for backgrounds/badges)
  - `--rule: #d4cfc6` (dividers/borders)
  - `--caption: #625d52` (secondary text)
  - `--header-bg: rgba(247, 245, 240, 0.95)` (semi-transparent for backdrop blur)
  - `--black`, `--gray`, `--gray-light`, `--gray-dark` (RGB triplets for `rgba()`)
  - `--box-shadow`
- **Typography:**
  - `--font-display: 'Playfair Display', Georgia, serif` (headings)
  - `--font-body: 'Source Serif 4', 'Atkinson', Georgia, serif` (body text)
  - `--font-mono: 'JetBrains Mono', 'Courier New', monospace` (code, labels, meta)
- **Responsive breakpoints:** `720px` (main layout), `900px` (ToC sidebar), `480px` (compact padding)
- **Max content widths:**
  - Homepage and listing pages: `1100px`
  - Article prose: `680px` (`.prose` inside `.article-layout`)
  - Article layout (prose + ToC): `960px`
- **Font:** Atkinson loaded from `/public/fonts/` as a fallback; primary fonts are `Playfair Display` and `Source Serif 4`

---

## Astro Config

`astro.config.mjs` imports the `rehypeResponsiveImages` plugin from `src/utils/rehypeResponsiveImages.ts` and applies it as a Rehype plugin. It automatically adds `loading="lazy"` and `decoding="async"` to all `<img>` elements in Markdown/MDX content on every build. Do not remove it.

The config also sets `trailingSlash: "always"` — all internal links must include a trailing slash (e.g., `/article/my-post/`).

```javascript
import { rehypeResponsiveImages } from './src/utils/rehypeResponsiveImages.ts';

export default defineConfig({
  site: 'https://lowhangingdata.com',
  trailingSlash: 'always',
  integrations: [
    mdx(),
    sitemap({ customPages: ['https://lowhangingdata.com/ads.txt'] }),
  ],
  markdown: { rehypePlugins: [rehypeResponsiveImages] },
  adapter: cloudflare({ platformProxy: { enabled: true } }),
});
```

---

## Deployment

The site deploys to **Cloudflare Workers** using `wrangler`.

### Cloudflare Config (`wrangler.json`)

```json
{
  "name": "astro-blog-starter-template",
  "compatibility_date": "2026-04-18",
  "compatibility_flags": ["nodejs_compat"],
  "main": "./dist/_worker.js/index.js",
  "assets": { "directory": "./dist", "binding": "ASSETS" },
  "observability": { "enabled": true },
  "upload_source_maps": true
}
```

### Deploy Steps

1. `npm run check` — run tests, build, and validate (must pass first)
2. `npm run deploy` — push to Cloudflare Workers via Wrangler
3. Or use `npm run preview` to test in a Cloudflare-like local environment

### Environment Variables

Sensitive config goes in `.env` files (gitignored). Cloudflare environment bindings are typed in `worker-configuration.d.ts` (regenerated via `npm run cf-typegen`).

---

## Key Conventions

### TypeScript

- Strict mode is enforced (`astro/tsconfigs/strict` + `strictNullChecks: true`).
- Use `CollectionEntry<'blog'>` and `CollectionEntry<'posts'>` types for content.
- Props interfaces are declared inside the frontmatter fence of `.astro` files.

### Naming

- **Components/Layouts:** PascalCase (`BaseHead.astro`, `BlogPost.astro`)
- **Pages/routes:** lowercase with hyphens
- **Content files:** lowercase with hyphens (filename = URL slug)
- **Constants:** SCREAMING_SNAKE_CASE (`SITE_TITLE`, `SITE_DESCRIPTION`)
- **Utility files:** camelCase (`formatDate.ts`, `activeLink.ts`)

### Content Sorting

Always use `sortByPubDateDesc()` from `src/utils/sort.ts` to sort content collections:

```typescript
import { sortByPubDateDesc } from '../utils/sort';
const sorted = sortByPubDateDesc(await getCollection('blog'));
```

### Site Constants

Global values live in `src/consts.ts`:

```typescript
export const SITE_TITLE = 'Low Hanging Data';
export const SITE_DESCRIPTION = 'Data analysis should be concise, transparent, and focused on the low hanging fruit first.';
```

### SEO

`BaseHead.astro` handles all SEO metadata. Props: `title`, `description`, `image?`, `type?` (`'website'` | `'article'`, default `'website'`), `pubDate?`, `updatedDate?`, `wordCount?`, `breadcrumb?`. It generates:
- Canonical URL
- OG + Twitter card meta tags
- JSON-LD `Article` structured data (when `type === 'article'` and `pubDate` is set)
- JSON-LD `BreadcrumbList` (when `breadcrumb` prop is passed)
- RSS feed auto-discovery link
- Google Analytics (GA4)
- Google AdSense script (article pages only)
- Google Fonts progressive load (`media="print"` → `"all"` + `<noscript>` fallback)

**SVG fallback:** If `image` is an SVG or omitted, `BaseHead.astro` automatically substitutes `/blog-og-default.png` as the OG image. Never pass an SVG as the `image` prop — pass a PNG or omit it.

### RSS

The RSS feed is served at `/rss.xml` via `src/pages/rss.xml.ts`. It is an **SSR endpoint** (`export const prerender = false`) — rendered on-request by the Cloudflare Worker, not pre-built as a static file. It uses `@astrojs/rss` and publishes all `blog` collection entries sorted by `sortByPubDateDesc()`, with links pointing to `/article/{id}/`.

### Sitemap

`src/pages/sitemap.xml.ts` is a **prerendered** endpoint (`export const prerender = true`) that generates a custom XML sitemap served at `/sitemap.xml`. It includes all static pages, all category pages (using `TAG_SLUGS`), all article pages, and all post pages. Article and post entries include `<lastmod>` dates from their `pubDate`. Do not replace this with a redirect — the custom sitemap is intentional so that category routes are included.

---

## Dependencies

| Package | Purpose |
|---|---|
| `astro` | Core framework |
| `@astrojs/mdx` | MDX support for content |
| `@astrojs/rss` | RSS feed generation |
| `@astrojs/sitemap` | Automatic sitemap at `/sitemap-index.xml` |
| `@astrojs/cloudflare` | Cloudflare Workers SSR adapter |
| `typescript` | Type checking |
| `vitest` (dev) | Unit testing framework |
| `wrangler` (dev) | Cloudflare CLI for deployment and local preview |

---

## What Not to Do

- Do not add, remove, or rename navigation tabs in `Header.astro` — the header must have exactly **3 tabs**: **Home** (`/`), **Articles** (`/article`), and **About** (`/about`). Contact is in the footer only.
- Do not remove the integrated search form from `Header.astro` — it links to `/search` and is part of the core navigation.
- Do not remove the hamburger mobile menu from `Header.astro` — it is required for mobile navigation.
- Do not add a GitHub link anywhere on the main page (`index.astro`), in `Header.astro`, or in `Footer.astro` — external social/repo links are not part of the site navigation.
- Do not display `posts` collection content on the main page (`index.astro`) — the homepage shows only `blog` collection (technical articles).
- Do not remove the Start Here section from `index.astro` — it is a required onboarding feature. Changing the curated article IDs (`START_HERE_IDS`) is acceptable with intent.
- Do not add `export const prerender = true` to `rss.xml.ts` — the RSS feed must be SSR to work correctly in the Cloudflare Worker environment.
- Do not add Tailwind or other CSS frameworks without discussion — this project uses plain CSS intentionally.
- Do not change the `astro.config.mjs` site URL without updating DNS/Cloudflare configuration.
- Do not add environment variables to source files — use `.env` (gitignored) or Cloudflare secrets.
- Do not skip `npm run check` before deploying — it validates tests, the full build pipeline, and dry-run deploy.
- Do not add content files outside of `src/content/blog/` or `src/content/posts/` — content collections are scoped to those directories.
- Do not write inline sort logic for content collections — use `sortByPubDateDesc()` from `src/utils/sort.ts`.
- Do not add utility functions without a corresponding `.test.ts` file in `src/utils/`.
- Do not define the content collection schema inline in `content.config.ts` — it lives in `src/utils/contentSchema.ts` so it can be unit-tested independently.
- Do not place test files outside of their source file's directory — `src/consts.test.ts` tests `src/consts.ts`; utility tests live alongside their source in `src/utils/`.
- Do not remove `:hover` styles from navigation links — all nav links must have visible hover feedback.
- Do not change `Header.astro` from `position: sticky` to `position: static` or `position: relative` — the header must remain sticky.
- Do not widen the `.prose` container in `BlogPost.astro` beyond 680px — reading-width constraint must be preserved.
- Do not remove the `@media (prefers-color-scheme: dark)` block from `global.css` — dark mode support is required.
- Do not remove the scroll progress indicator from `BlogPost.astro` — it is a required UX feature on all article pages.
- Do not remove the Table of Contents logic from `BlogPost.astro` — it activates automatically for articles with ≥3 headings.
- Do not remove the `rehypeResponsiveImages` plugin from `astro.config.mjs` — it ensures all Markdown images are lazy-loaded.
- Do not use SVG format for hero images — all hero images in `public/` must be **1200×630 PNG** files. SVG is not supported by social-media scrapers (Reddit, Twitter, etc.) and PNG is the required format for OG/hero images.
- Do not remove `src/pages/category/[slug].astro` — category pages are linked from the homepage Browse by Topic grid, article cards, and the article listing page.
- Do not remove the Browse by Topic section from `index.astro` — it links to all category pages and is a required navigation feature.
- Do not replace `sitemap.xml.ts` with a redirect to `/sitemap-index.xml` — the custom sitemap is required to include category routes that `@astrojs/sitemap` does not automatically discover.
- Do not define new tag slugs without updating both `TAG_SLUGS` and the route in `category/[slug].astro` — they must stay in sync.
