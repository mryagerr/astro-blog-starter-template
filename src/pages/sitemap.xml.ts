import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
	const base = site ? site.toString().replace(/\/$/, '') : 'https://lowhangingdata.com';
	return Response.redirect(`${base}/sitemap-index.xml`, 301);
};
