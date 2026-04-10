/**
 * Finds related posts by scoring them based on shared tags,
 * then falling back to most recent (by pubDate descending).
 * Returns up to `limit` related posts (default 3).
 */
export interface RelatedPostInput {
	id: string;
	data: {
		title: string;
		description: string;
		pubDate: Date;
		heroImage?: string;
		tags?: readonly string[];
	};
}

export interface RelatedPostOutput {
	id: string;
	title: string;
	description: string;
	pubDate: Date;
	heroImage?: string;
	href: string;
}

export function findRelatedPosts(
	currentId: string,
	currentTags: readonly string[],
	allPosts: RelatedPostInput[],
	hrefPrefix: string,
	limit: number = 3,
): RelatedPostOutput[] {
	const otherPosts = allPosts.filter((p) => p.id !== currentId);

	// Score each post by number of shared tags
	const scored = otherPosts.map((p) => {
		const sharedTags = (p.data.tags ?? []).filter((t) => currentTags.includes(t)).length;
		return { post: p, sharedTags };
	});

	// Sort by shared tags desc, then by pubDate desc
	scored.sort(
		(a, b) => b.sharedTags - a.sharedTags || b.post.data.pubDate.getTime() - a.post.data.pubDate.getTime(),
	);

	return scored.slice(0, limit).map((s) => ({
		id: s.post.id,
		title: s.post.data.title,
		description: s.post.data.description,
		pubDate: s.post.data.pubDate,
		heroImage: s.post.data.heroImage,
		href: `${hrefPrefix}${s.post.id}/`,
	}));
}
