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
npm run check        # Full validation: astro build + tsc + wrangler deploy --dry-run
npm run deploy       # Deploy to Cloudflare Workers (requires Wrangler auth)
npm run cf-typegen   # Regenerate Cloudflare environment type definitions
```

**Node.js requirement:** >= v22

### Type Checking

TypeScript is in strict mode. Always run `npm run check` before committing to validate the full build pipeline. There is no separate type-check script; type checking is bundled into the `check` command.

### Testing

There is no test runner configured (no Jest, Vitest, etc.). Validation is done via the `check` script which runs a full build and dry-run deploy.

---

## Directory Structure

```
astro-blog-starter-template/
├── public/                  # Static assets (served as-is)
│   ├── fonts/               # Atkinson web font files
│   ├── blog-placeholder-*.jpg/svg  # Hero image placeholders
│   ├── favicon.svg
│   └── robots.txt
├── src/
│   ├── components/          # Reusable .astro components
│   ├── content/             # Markdown/MDX content files
│   │   ├── blog/            # Technical articles (~14 files)
│   │   └── posts/           # Short blog posts (~3 files)
│   ├── layouts/
│   │   └── BlogPost.astro   # Shared layout for articles and posts
│   ├── pages/               # File-based routing
│   │   ├── index.astro      # Homepage
│   │   ├── about.astro      # About page
│   │   ├── blog/            # Articles section (/blog/*)
│   │   ├── posts/           # Blog posts section (/posts/*)
│   │   └── rss.xml.js       # RSS feed endpoint
│   ├── styles/
│   │   └── global.css       # Global CSS (Bear Blog-inspired)
│   ├── consts.ts            # SITE_TITLE, SITE_DESCRIPTION
│   ├── content.config.ts    # Content collection schemas
│   └── env.d.ts             # TypeScript environment declarations
├── astro.config.mjs         # Astro configuration
├── wrangler.json            # Cloudflare Workers config
├── worker-configuration.d.ts # Cloudflare env type definitions (auto-generated)
├── tsconfig.json            # TypeScript config (extends astro/tsconfigs/strict)
└── package.json
```

---

## Content Collections

Defined in `src/content.config.ts`. Both collections share the same schema.

### Schema

```typescript
{
  title: string;           // Required
  description: string;     // Required
  pubDate: Date;           // Required (coerced from string)
  updatedDate?: Date;      // Optional
  heroImage?: string;      // Optional — path to image in public/
  difficulty?: 'low' | 'high';  // Optional — shows a badge in layout
}
```

### Collections

| Collection | Directory | Route | Purpose |
|---|---|---|---|
| `blog` | `src/content/blog/` | `/blog/{id}` | Technical data articles |
| `posts` | `src/content/posts/` | `/posts/{id}` | Short blog posts & writeups |

### Adding Content

Create a `.md` or `.mdx` file in the appropriate collection directory with valid frontmatter:

```yaml
---
title: 'Your Article Title'
description: 'A concise summary of the content.'
pubDate: 'Mar 26 2026'
updatedDate: 'Mar 27 2026'   # optional
heroImage: '/blog-placeholder-1.jpg'  # optional
difficulty: 'low'             # optional: 'low' or 'high'
---
```

The filename becomes the URL slug (e.g., `my-article.md` → `/blog/my-article`).

---

## Components

Located in `src/components/`. All are `.astro` files.

| Component | Purpose |
|---|---|
| `BaseHead.astro` | `<head>` tags: charset, viewport, SEO meta, OG tags, Twitter cards, font preloading |
| `Header.astro` | Site header with navigation links (Home, Articles, Blog, About) and GitHub link |
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

The only layout. Used by both `/blog/[...slug].astro` and `/posts/[...slug].astro`.

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
| `blog/index.astro` | `/blog` | Grid listing of all technical articles |
| `blog/[...slug].astro` | `/blog/{id}` | Dynamic article page |
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

1. `npm run build` — compile site to `dist/`
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

### Content Sorting

Articles are always sorted by `pubDate` descending:

```typescript
posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
```

### Site Constants

Global values live in `src/consts.ts`:

```typescript
export const SITE_TITLE = 'Low Hanging Data';
export const SITE_DESCRIPTION = '...';
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
| `wrangler` (dev) | Cloudflare CLI for deployment and local preview |

---

## What Not to Do

- Do not add, remove, or rename navigation tabs in `Header.astro` — the header must have exactly 3 tabs: **Home** (`/`), **Articles** (`/article`), and **About** (`/about`). No other tabs should be added.
- Do not add Tailwind or other CSS frameworks without discussion — this project uses plain CSS intentionally.
- Do not change the `astro.config.mjs` site URL without updating DNS/Cloudflare configuration.
- Do not add environment variables to source files — use `.env` (gitignored) or Cloudflare secrets.
- Do not skip `npm run check` before deploying — it validates the full build pipeline.
- Do not add content files outside of `src/content/blog/` or `src/content/posts/` — content collections are scoped to those directories.
- Do not add a testing framework without also updating the `check` script to run tests.
