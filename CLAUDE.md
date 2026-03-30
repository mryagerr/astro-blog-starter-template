# CLAUDE.md — AI Assistant Guide for astro-blog-starter-template

## Project Overview

This is a personal blog and data-focused content site called **Low Hanging Data**, built with [Astro](https://astro.build) and deployed to **Cloudflare Workers**. It publishes technical articles on data collection, processing, and analysis, alongside shorter blog posts and project writeups.

- **Live site:** https://lowhangingdata.com
- **Framework:** Astro 5.x (output: SSR via Cloudflare adapter)
- **Deployment:** Cloudflare Workers via Wrangler
- **Language:** TypeScript (strict mode)
- **Styling:** Plain CSS (no Tailwind or preprocessor)

---

## Brand Identity

### Philosophy
- **Tagline:** "Ask what the data already shows before reaching for complexity"
- **Three Principles:** Concise. Transparent. Low Hanging Fruit First.
- These principles should be reflected in both content AND design — clean, honest, no unnecessary decoration.

### Aesthetic Direction: Editorial Minimalism with Technical Character
Think: *The Economist* meets *Stripe Docs*. Ink-on-paper feel. Designed by someone who *reads* data, not by a marketer. Confident negative space. Sharp typographic hierarchy. One bold accent color used sparingly.

### Audience
Data practitioners — analysts, engineers, developers who value clarity over flash. The above-the-fold hook should make this immediately clear: "For [audience] who want [outcome]."

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
| `Header.astro` | Site header with navigation links (Home, Articles, About, Contact) + GitHub ↗ external link |
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

## UX & Navigation Standards

These are required behaviors. Do not remove or regress them.

### Hover States

All navigation links in `Header.astro` and `HeaderLink.astro` must have visible `:hover` styles. Use `color: var(--accent)` with a 2px solid underline CSS transition slide-in — never leave nav links with no hover feedback.

### Sticky Header

`Header.astro` must use `position: sticky; top: 0` so the nav remains visible while scrolling. Background on scroll: `rgba(247,245,240,0.95)` with `backdrop-filter: blur(8px)`. Apply a `z-index` high enough to sit above page content. Do not use `position: fixed` (breaks document flow for SSR).

### Reading-Width Constraint

Body text on article and post pages must be constrained to a comfortable reading width of **680px** max. Do not widen prose containers beyond this on article routes (`/article/*`, `/posts/*`). If a layout change would break this constraint, restore it.

### Dark Mode

Dark mode is a future enhancement. Structure CSS custom properties in `:root` to make adding a dark mode easy later (use variables for all colors), but do not add `@media (prefers-color-scheme: dark)` overrides unless explicitly asked. Do not remove existing dark mode blocks if present.

### Scroll Progress Indicator

Article pages (`/article/[...slug].astro`) must include a scroll progress bar — a thin fixed element at the top of the viewport whose width tracks `scrollY` relative to document height. Implement it as a `<div>` with `position: fixed; top: 0; left: 0; height: 3px; background: var(--accent)` driven by an inline `<script>` that listens to the `scroll` event and updates `style.width`. Do not remove this from article pages.

### Micro-Interactions & Polish

- `scroll-behavior: smooth` on `<html>`
- Page load: staggered fade-in on hero (opacity 0→1, translateY 8px→0, 600ms ease, 100ms delay per element)
- Card hover: lift with `box-shadow` + 3px `--accent` left border slides in via transition
- One or two well-placed transitions beat many janky ones — do not over-animate
- All interactive elements must have visible `:focus` states for keyboard accessibility

### Accessibility

- Proper heading hierarchy (`h1` → `h2` → `h3`, no skipping)
- Alt text on all images
- Focus states on all interactive elements
- Minimum 4.5:1 color contrast ratio for body text
- Semantic HTML elements: `<nav>`, `<main>`, `<article>`, `<aside>`, `<footer>`

---

## Design System

### Typography

```
Display / Headings:  "Playfair Display" or "Libre Baskerville" — editorial, serious
Body copy:           "Source Serif 4" or "Lora" — readable, warm, not techy
Monospace accents:   "JetBrains Mono" — for labels, categories, tags, code
```

**Sizing rules:**
- H1: 56–64px, `letter-spacing: -0.02em`, `--ink` color
- H2: 32–40px
- Body: 18–20px, `line-height: 1.7`, `max-width: 680px` for article reading
- Labels/tags/categories: 11px uppercase monospace, `letter-spacing: +0.12em`
- All page content constrained to `max-width: 1100px`, centered

### Color Palette

```css
:root {
  --ink:          #1a1a18;   /* near-black, warm undertone — primary text */
  --paper:        #f7f5f0;   /* off-white, warm parchment — page background */
  --accent:       #c8522a;   /* burnt orange — the "fruit" color, used sparingly */
  --accent-muted: #e8d5c4;   /* hover states, highlights */
  --rule:         #d4cfc6;   /* horizontal rules, borders */
  --caption:      #7a7568;   /* muted text: dates, metadata, excerpts */
}
```

Use `--accent` sparingly for maximum impact. Do not add new brand colors without discussion.

### Spacing & Layout

- Page padding: `clamp(1.5rem, 5vw, 4rem)`
- Section gaps: `3rem` between major sections
- Horizontal rules: `1px solid var(--rule)`, `margin: 3rem 0`
- Article reading width: `max-width: 680px`
- Card grid: 2-column on desktop (min 500px per col), 1-column on mobile
- Responsive breakpoint: `720px`

### Component Specifications

#### Navigation

```
[Low Hanging Data wordmark]     Home  Articles  About  Contact     [GitHub ↗]
```

- Wordmark: Playfair Display, 20px, `--ink` color, left-aligned
- Nav links: small-caps Source Serif, `--accent` 2px underline slide-in on hover
- GitHub: text link with `↗` arrow (NOT icon-only), right-aligned; must point to actual repo/profile
- Bottom border: `1px var(--rule)`
- Sticky: `rgba(247,245,240,0.95)` background with `backdrop-filter: blur(8px)`

#### Hero Section

- Full-width, `--paper` background
- Subtle grain texture overlay (SVG noise filter or CSS)
- Large display heading: site name (Playfair Display)
- Tagline below in smaller italic weight
- Thin horizontal rule, then the three principles as a single inline sentence
- Optional: very faint fruit/tree silhouette watermark (SVG, ~4% opacity)
- **Above-the-fold hook required:** one sentence for the target audience

#### Article Cards

- 2-column grid on desktop, 1-column on mobile
- Display existing SVG thumbnails at 16:9 or 4:3 aspect ratio with `object-fit: cover`
- Date: monospace, small, `--caption` color
- Title: Playfair Display, 22px, `--ink`
- Excerpt: body serif, 15px, `--caption`, clamped to 3 lines (`-webkit-line-clamp: 3`)
- Hover: subtle lift with `box-shadow` + `--accent` 3px left border slides in via transition

#### Workflow Category Navigation

Covers the data workflow: **Collect → Clean → Query → Visualize → Automate**

- Styled as pill tabs or horizontal chips
- Each label: monospace uppercase with `--accent` dot prefix
- Light `--accent-muted` background section to visually separate from article grid
- Links as inline chips with hover state

#### Footer

Three-column layout:

```
[Wordmark + tagline]    [Nav links]    [External: GitHub ↗, RSS]
──────────────────────────────────────────────────────────────
© 2026 Low Hanging Data · Concise. Transparent. Low Hanging Fruit First.
```

#### Individual Article Pages

- Reading width: `max-width: 680px`
- Sticky table-of-contents sidebar on desktop
- Author byline at top
- Scroll progress bar (see UX Standards)

## Styling Conventions

- **No Tailwind** — use plain CSS only.
- **Scoped styles** in `.astro` components via `<style>` tags (Astro automatically scopes these).
- **Global styles** in `src/styles/global.css`, imported in `BaseHead.astro`.
- **CSS custom properties** defined in `:root` in `global.css` — see Color Palette above.
- **Font:** Playfair Display (headings), Source Serif 4 or Lora (body), JetBrains Mono (labels/code). Preload critical fonts in `BaseHead.astro`. System font fallbacks for performance.
- **Max page content width:** 1100px (centered)
- **Article reading width:** 680px
- **Responsive breakpoint:** 720px (max-width media queries)
- **Performance:** Lazy-load images, minimize CLS, minimal JS

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

## Page-Specific Notes

| Page | Instructions |
|---|---|
| **Homepage** (`index.astro`) | Hero section + workflow category nav + latest articles grid + newsletter/email CTA. Author bio (even one line + avatar) builds trust. Show only `blog` collection articles. |
| **Articles listing** (`/article`) | Same card grid as homepage. Add filter bar for workflow categories (Collect / Clean / Query / Visualize / Automate). |
| **Individual articles** (`/article/[...slug].astro`) | Reading width 680px max; sticky ToC sidebar on desktop; author byline at top; scroll progress bar required. |
| **About** | Personal voice — who writes this, a photo/avatar, brief backstory, link to GitHub for credibility. |
| **Contact** | Static page using BlogPost layout. |

---

## What Not to Do

### Navigation & Structure
- Do not add, remove, or rename navigation tabs in `Header.astro` — the header must have exactly these tabs: **Home** (`/`), **Articles** (`/article`), **About** (`/about`), **Contact** (`/contact`), and a **GitHub ↗** external link (right-aligned, text with arrow). The GitHub link must point to the actual repo or profile, NOT `github.com` root.
- Do not display `posts` collection content on the main page (`index.astro`) — the homepage shows only `blog` collection (technical articles).
- Do not add floating social share buttons, modal dialogs, pop-ups, or ads anywhere on the site.

### Design & Styling
- Do not add Tailwind or other CSS frameworks without discussion — this project uses plain CSS intentionally.
- Do not use generic AI aesthetics: no purple gradients, no Inter font as the primary typeface, no cookie-cutter card designs.
- Do not add new brand colors without discussion — work within the defined palette (`--ink`, `--paper`, `--accent`, `--accent-muted`, `--rule`, `--caption`).
- Do not over-animate — one or two well-placed transitions beat twenty janky ones.
- Do not widen prose containers on article or post pages beyond 680px — reading-width constraint must be preserved.
- Do not remove `:hover` styles from navigation links — all nav links must have visible hover feedback.
- Do not change `Header.astro` from `position: sticky` to `position: static` or `position: relative` — the header must remain sticky.
- Do not sacrifice readability for style — the site's strength is clarity.

### Code & Infrastructure
- Do not change the `astro.config.mjs` site URL without updating DNS/Cloudflare configuration.
- Do not add environment variables to source files — use `.env` (gitignored) or Cloudflare secrets.
- Do not skip `npm run check` before deploying — it validates tests, the full build pipeline, and dry-run deploy.
- Do not add content files outside of `src/content/blog/` or `src/content/posts/` — content collections are scoped to those directories.
- Do not write inline sort logic for content collections — use `sortByPubDateDesc()` from `src/utils/sort.ts`.
- Do not add utility functions without a corresponding `.test.ts` file in `src/utils/`.
- Do not define the content collection schema inline in `content.config.ts` — it lives in `src/utils/contentSchema.ts` so it can be unit-tested independently.
- Do not place test files outside of their source file's directory — `src/consts.test.ts` tests `src/consts.ts`; utility tests live alongside their source in `src/utils/`.
- Do not remove the scroll progress indicator from article pages (`/article/[...slug].astro`) — it is a required UX feature.
