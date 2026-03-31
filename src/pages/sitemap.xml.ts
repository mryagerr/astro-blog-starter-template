import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const SITE = 'https://lowhangingdata.com';

export const GET: APIRoute = async () => {
	const blogEntries = await getCollection('blog');
	const postEntries = await getCollection('posts');

	const staticPages = ['/', '/about', '/contact', '/article', '/posts'];

	const blogUrls = blogEntries.map(
		(e) => `${SITE}/article/${e.id}/`
	);
	const postUrls = postEntries.map(
		(e) => `${SITE}/posts/${e.id}/`
	);
	const staticUrls = staticPages.map((p) => `${SITE}${p}`);

	const allUrls = [...staticUrls, ...blogUrls, ...postUrls];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml',
		},
	});
};
