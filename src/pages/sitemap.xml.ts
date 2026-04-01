import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ site }) => {
	const base = site ? site.toString().replace(/\/$/, '') : 'https://lowhangingdata.com';

	const blogEntries = await getCollection('blog');
	const postEntries = await getCollection('posts');

	const staticPages = [
		{ url: `${base}/`, priority: '1.0' },
		{ url: `${base}/article/`, priority: '0.9' },
		{ url: `${base}/posts/`, priority: '0.8' },
		{ url: `${base}/about/`, priority: '0.7' },
		{ url: `${base}/contact/`, priority: '0.5' },
		{ url: `${base}/privacy/`, priority: '0.3' },
		{ url: `${base}/terms/`, priority: '0.3' },
	];

	const blogUrls = blogEntries.map((entry) => ({
		url: `${base}/article/${entry.id}/`,
		lastmod: entry.data.updatedDate ?? entry.data.pubDate,
		priority: '0.8',
	}));

	const postUrls = postEntries.map((entry) => ({
		url: `${base}/posts/${entry.id}/`,
		lastmod: entry.data.updatedDate ?? entry.data.pubDate,
		priority: '0.6',
	}));

	const allUrls = [
		...staticPages.map((p) => ({ ...p, lastmod: undefined })),
		...blogUrls,
		...postUrls,
	];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
	.map(
		(entry) => `  <url>
    <loc>${entry.url}</loc>${
		entry.lastmod
			? `\n    <lastmod>${entry.lastmod.toISOString().split('T')[0]}</lastmod>`
			: ''
	}
    <priority>${entry.priority}</priority>
  </url>`
	)
	.join('\n')}
</urlset>`;

	return new Response(xml, {
		status: 200,
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
		},
	});
};
