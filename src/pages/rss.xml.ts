export const prerender = false;

import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';
import { sortByPubDateDesc } from '../utils/sort';
import { TAG_LABELS } from '../utils/contentSchema';

export async function GET(context: APIContext) {
  const posts = sortByPubDateDesc(await getCollection('blog'));
  const site = context.site!.toString();
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    customData: `<language>en-us</language><atom:link href="${site}rss.xml" rel="self" type="application/rss+xml"/>`,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/article/${post.id}/`,
      categories: post.data.tags?.map((tag) => TAG_LABELS[tag]),
    })),
  });
}
