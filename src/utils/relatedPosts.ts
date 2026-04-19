/**
 * Category adjacency map for cross-category related article fallback.
 * When a category has fewer than `limit` other articles, slots are filled
 * from the adjacent category before falling back to fully unrelated content.
 *
 * Map: Collection ↔ Preparation, Pipelines ↔ Analysis, Culture ↔ Career
 */
export const CATEGORY_ADJACENCY: Record<string, string[]> = {
	collection: ['preparation'],
	preparation: ['collection'],
	pipelines: ['analysis'],
	analysis: ['pipelines'],
	culture: ['career'],
	career: ['culture'],
};

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

	// Build adjacent tag set for cross-category fallback
	const adjacentTags = new Set<string>();
	for (const tag of currentTags) {
		for (const adj of CATEGORY_ADJACENCY[tag] ?? []) {
			adjacentTags.add(adj);
		}
	}

	// Score: 2 per shared direct tag, 1 per shared adjacent tag
	const scored = otherPosts.map((p) => {
		const postTags = p.data.tags ?? [];
		const directScore = postTags.filter((t) => currentTags.includes(t)).length * 2;
		const adjacentScore = adjacentTags.size > 0
			? postTags.filter((t) => adjacentTags.has(t)).length
			: 0;
		return { post: p, score: directScore + adjacentScore };
	});

	// Sort: score desc, then pubDate desc, then id alphabetical for determinism
	scored.sort(
		(a, b) =>
			b.score - a.score ||
			b.post.data.pubDate.getTime() - a.post.data.pubDate.getTime() ||
			a.post.id.localeCompare(b.post.id),
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
