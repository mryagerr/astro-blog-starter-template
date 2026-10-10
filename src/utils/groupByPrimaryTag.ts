import { VALID_TAGS, type Tag } from './contentSchema';
import { sortByPubDateDesc } from './sort';

export interface TagGroup<T> {
	tag: Tag | null;
	entries: T[];
}

/**
 * Groups articles by their FIRST tag (the primary category), so each article
 * appears exactly once. Groups follow VALID_TAGS order; entries within a group
 * are newest first. Untagged articles land in a trailing `tag: null` group.
 * Empty groups are omitted.
 */
export function groupByPrimaryTag<T extends { data: { pubDate: Date; tags?: readonly Tag[] } }>(
	articles: readonly T[],
): TagGroup<T>[] {
	const sorted = sortByPubDateDesc([...articles]);
	const groups: TagGroup<T>[] = [];
	for (const tag of VALID_TAGS) {
		const entries = sorted.filter((a) => a.data.tags?.[0] === tag);
		if (entries.length > 0) groups.push({ tag, entries });
	}
	const untagged = sorted.filter((a) => !a.data.tags || a.data.tags.length === 0);
	if (untagged.length > 0) groups.push({ tag: null, entries: untagged });
	return groups;
}
