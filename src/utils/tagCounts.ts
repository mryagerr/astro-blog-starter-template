import type { Tag } from './contentSchema';

/**
 * Counts how many articles carry each tag, incrementing once per tag occurrence.
 *
 * Each article is counted under EVERY tag it lists, so an article tagged
 * ['culture', 'career'] increments both 'culture' and 'career'. This matches
 * what /category/{slug}/ actually shows (filter by `tags.includes(tag)`), and
 * what the per-tag chip on /article/ promises ("Career (N)" = number of
 * articles you'll see when you click Career).
 *
 * Consequence: when articles carry multiple tags, the per-tag counts sum to
 * MORE than the total article count. That is intentional — the "All (N)"
 * count is `articles.length`, not the sum of the per-tag counts.
 */
export function countArticlesByTag<T extends { data: { tags?: readonly Tag[] } }>(
	articles: readonly T[],
): Map<Tag, number> {
	const counts = new Map<Tag, number>();
	for (const article of articles) {
		for (const tag of article.data.tags ?? []) {
			counts.set(tag, (counts.get(tag) ?? 0) + 1);
		}
	}
	return counts;
}
