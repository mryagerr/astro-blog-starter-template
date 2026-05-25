export const prerender = false;

import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';
import { sortByPubDateDesc } from '../utils/sort';
import { TAG_LABELS } from '../utils/contentSchema';

export async function GET(context: APIContext) {
  const [articles, posts] = await Promise.all([
    getCollection('blog'),
    getCollection('posts'),
  ]);

  type RssEntry = { data: { pubDate: Date }; link: string; title: string; description: string; categories?: string[] };

  const articleEntries: RssEntry[] = articles.map((p) => ({
    data: p.data,
    link: `/article/${p.id}/`,
    title: p.data.title,
    description: p.data.description,
    categories: p.data.tags?.map((tag) => TAG_LABELS[tag]),
  }));

  const postEntries: RssEntry[] = posts.map((p) => ({
    data: p.data,
    link: `/posts/${p.id}/`,
    title: p.data.title,
    description: p.data.description,
  }));

  const items = sortByPubDateDesc([...articleEntries, ...postEntries]).map((entry) => ({
    title: entry.title,
    description: entry.description,
    pubDate: entry.data.pubDate,
    link: entry.link,
    ...(entry.categories ? { categories: entry.categories } : {}),
  }));

  const site = context.site!.toString();
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    customData: `<language>en-us</language><atom:link href="${site}rss.xml" rel="self" type="application/rss+xml"/>`,
    items,
  });
}
