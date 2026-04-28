import { getCollection } from 'astro:content';
import { VALID_TAGS, TAG_SLUGS } from '../utils/contentSchema';
import { sortByPubDateDesc } from '../utils/sort';

export const prerender = true;

const SITE = 'https://lowhangingdata.com';

function toDate(d: Date): string {
	return d.toISOString().split('T')[0];
}

function url(path: string, lastmod?: string): string {
	const loc = `<loc>${SITE}${path}</loc>`;
	return `  <url>\n    ${loc}${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n  </url>`;
}

export async function GET() {
	const articles = sortByPubDateDesc(await getCollection('blog'));

	const staticPages = [
		url('/'),
		url('/article/'),
		url('/about/'),
		url('/contact/'),
		url('/privacy/'),
		url('/terms/'),
	];

	const categoryPages = VALID_TAGS.map((tag) =>
		url(`/category/${TAG_SLUGS[tag]}/`),
	);

	const articlePages = articles.map((a) =>
		url(`/article/${a.id}/`, toDate(a.data.pubDate)),
	);

	const entries = [...staticPages, ...categoryPages, ...articlePages];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: { 'Content-Type': 'application/xml; charset=utf-8' },
	});
}
