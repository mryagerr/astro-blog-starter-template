# CLAUDE.md — AI Assistant Guide for astro-blog-starter-template

## Project Overview

This is a personal blog and data-focused content site called **Low Hanging Data**, built with [Astro](https://astro.build) and deployed to **Cloudflare Workers**. It publishes technical articles on data collection, processing, and analysis, alongside shorter blog posts and project writeups.

- **Live site:** https://lowhangingdata.com
- **Framework:** Astro 5.x (output: SSR via Cloudflare adapter)
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
│   ├── blog-*.svg           # Hero image placeholder SVGs
│   ├── favicon.svg
│   └── robots.txt
├── src/
│   ├── components/          # Reusable .astro components (5 files)
│   ├── content/             # Markdown/MDX content files
│   │   ├── blog/            # Technical articles (~30 files)
│   │   └── posts/           # Short blog posts (~3 files)
│   ├── layouts/
│   │   └── BlogPost.astro   # Shared layout for articles and posts
│   ├── pages/               # File-based routing
│   │   ├── index.astro      # Homepage
│   │   ├── about.astro      # About page
│   │   ├── article/         # Articles section (/article/*)
│   │   ├── posts/           # Blog posts section (/posts/*)
│   │   └── rss.xml.js       # RSS feed endpoint
│   ├── styles/
│   │   └── global.css       # Global CSS (Bear Blog-inspired)
│   ├── utils/               # Shared utility functions + Vitest tests
│   │   ├── activeLink.ts    # Active nav link detection
│   │   ├── activeLink.test.ts
│   │   ├── contentSchema.ts    # Shared Zod schema (articleSchema + ArticleData type)
│   │   ├── contentSchema.test.ts
│   │   ├── difficultyBadge.ts  # Difficulty badge labels/classes
│   │   ├── difficultyBadge.test.ts
│   │   ├── formatDate.ts    # Date formatting helpers
│   │   ├── formatDate.test.ts
│   │   ├── sort.ts          # Content sorting helpers
│   │   └── sort.test.ts
│   ├── consts.ts            # SITE_TITLE, SITE_DESCRIPTION
│   ├── consts.test.ts       # Tests for site constants
│   ├── content.config.ts    # Content collection definitions (imports schema from utils)
│   └── env.d.ts             # TypeScript environment declarations
├── astro.config.mjs         # Astro configuration
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
export const articleSchema = z.object({
  title: z.string(),           // Required
  description: z.string(),     // Required
  pubDate: z.coerce.date(),    // Required (coerced from string)
  updatedDate: z.coerce.date().optional(),
  heroImage: z.string().optional(),
  difficulty: z.enum(['low', 'high']).optional(),
});

export type ArticleData = z.infer<typeof articleSchema>;
```

### Collections

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
heroImage: '/blog-placeholder-1.svg'  # optional
difficulty: 'low'             # optional: 'low' or 'high'
---
```

The filename becomes the URL slug (e.g., `my-article.md` → `/article/my-article`).

---

## Components

Located in `src/components/`. All are `.astro` files.

| Component | Purpose |
|---|---|
| `BaseHead.astro` | `<head>` tags: charset, viewport, SEO meta, OG tags, Twitter cards, font preloading |
| `Header.astro` | Site header with navigation links (Home, Articles, About, Contact) |
| `HeaderLink.astro` | Nav link that auto-applies active styles based on current route |
| `Footer.astro` | Site footer with dynamic copyright year and site tagline |
| `FormattedDate.astro` | Renders a `Date` object as a `<time>` element (format: "Mar 03 2025") |

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

The only layout. Used by both `/article/[...slug].astro` and `/posts/[...slug].astro`.

**Props:** Same as the content collection schema (`title`, `description`, `pubDate`, `updatedDate`, `heroImage`, `difficulty`).

**Features:**
- Hero image with drop shadow
- Custom SVG mascot displayed above the title
- Difficulty badge: green for `'low'`, yellow for `'high'`
- Updated date display if `updatedDate` is provided
- Slot for rendered Markdown content

---

## Pages & Routing

Astro uses file-based routing from `src/pages/`.

| File | Route | Description |
|---|---|---|
| `index.astro` | `/` | Homepage with featured articles and philosophy section |
| `about.astro` | `/about` | Static about page (uses BlogPost layout) |
| `contact.astro` | `/contact` | Static contact page (uses BlogPost layout) |
| `article/index.astro` | `/article` | Grid listing of all technical articles |
| `article/[...slug].astro` | `/article/{id}` | Dynamic article page |
| `posts/index.astro` | `/posts` | List of blog posts |
| `posts/[...slug].astro` | `/posts/{id}` | Dynamic blog post page |
| `rss.xml.js` | `/rss.xml` | RSS feed (blog collection only) |

### Dynamic Routes

Dynamic pages use `getStaticPaths()` with `getCollection()`:

```typescript
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({
    params: { slug: post.id },
    props: post,
  }));
}
```

---

## Utility Functions

Located in `src/utils/`. All utilities have corresponding Vitest test files.

### `contentSchema.ts`

```typescript
articleSchema   // Zod schema for content frontmatter (used by both collections)
ArticleData     // Inferred TypeScript type from the schema
```

Imported by `src/content.config.ts` for both the `blog` and `posts` collections. Extracting the schema here avoids Astro virtual module dependencies so it can be unit-tested directly.

### `formatDate.ts`

```typescript
formatDate(date: Date): string        // Returns "Mar 15 2024"
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

---

## Styling Conventions

- **No Tailwind** — use plain CSS only.
- **Scoped styles** in `.astro` components via `<style>` tags (Astro automatically scopes these).
- **Global styles** in `src/styles/global.css`, imported in `BaseHead.astro`.
- **CSS custom properties** defined in `:root` in `global.css`:
  - `--accent: #0891b2` (cyan)
  - `--accent-dark: #0e7490`
  - `--black`, `--gray`, `--gray-light`, `--gray-dark`
  - `--box-shadow`
- **Responsive breakpoint:** `720px` (max-width media queries)
- **Font:** Atkinson (loaded from `/public/fonts/`, preloaded in `BaseHead.astro`)
- **Max content width:** 720px

---

## Deployment

The site deploys to **Cloudflare Workers** using `wrangler`.

### Cloudflare Config (`wrangler.json`)

```json
{
  "name": "astro-blog-starter-template",
  "compatibility_date": "2025-10-08",
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

`BaseHead.astro` handles all SEO metadata. Pass `title`, `description`, and optionally `image` to it. It generates canonical URLs, OG tags, and Twitter card meta.

### RSS

The RSS feed at `/rss.xml` is generated from the `blog` collection only. If you add a new collection and want it in the feed, update `src/pages/rss.xml.js`.

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

- Do not add, remove, or rename navigation tabs in `Header.astro` — the header must have exactly 4 tabs: **Home** (`/`), **Articles** (`/article`), **About** (`/about`), and **Contact** (`/contact`). No other tabs should be added.
- Do not add a GitHub link anywhere on the main page (`index.astro`), in `Header.astro`, or in `Footer.astro` — external social/repo links are not part of the site navigation.
- Do not display `posts` collection content on the main page (`index.astro`) — the homepage shows only `blog` collection (technical articles).
- The only links permitted on the front page (`index.astro`) are: Home, About, Articles, Contact, and RSS Feed. Do not add article chip links, article card grids, or any other inline content links to the homepage.
- Do not add Tailwind or other CSS frameworks without discussion — this project uses plain CSS intentionally.
- Do not change the `astro.config.mjs` site URL without updating DNS/Cloudflare configuration.
- Do not add environment variables to source files — use `.env` (gitignored) or Cloudflare secrets.
- Do not skip `npm run check` before deploying — it validates tests, the full build pipeline, and dry-run deploy.
- Do not add content files outside of `src/content/blog/` or `src/content/posts/` — content collections are scoped to those directories.
- Do not write inline sort logic for content collections — use `sortByPubDateDesc()` from `src/utils/sort.ts`.
- Do not add utility functions without a corresponding `.test.ts` file in `src/utils/`.
- Do not define the content collection schema inline in `content.config.ts` — it lives in `src/utils/contentSchema.ts` so it can be unit-tested independently.
- Do not place test files outside of their source file's directory — `src/consts.test.ts` tests `src/consts.ts`; utility tests live alongside their source in `src/utils/`.
