import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE_TITLE, SITE_DESCRIPTION } from "../consts";
import { sortByPubDateDesc } from "../utils/sort";

export async function GET(context) {
	const posts = sortByPubDateDesc(await getCollection("blog"));
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		xmlns: {
			atom: "http://www.w3.org/2005/Atom",
		},
		customData: `<atom:link href="${new URL("rss.xml", context.site)}" rel="self" type="application/rss+xml"/>`,
		items: posts.map((post) => ({
			title: post.data.title,
			pubDate: post.data.pubDate,
			description: post.data.description,
			link: `/article/${post.id}/`,
		})),
	});
}
