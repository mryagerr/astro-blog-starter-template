export const prerender = false;

import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';
import { sortByPubDateDesc } from '../utils/sort';

export async function GET(context: APIContext) {
  const posts = sortByPubDateDesc(await getCollection('blog'));
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site!.toString(),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/article/${post.id}/`,
    })),
  });
}
