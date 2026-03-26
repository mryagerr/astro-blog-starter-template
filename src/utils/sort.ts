/**
 * Sorts an array of content entries by pubDate descending (newest first).
 * Returns a new array; does not mutate the input.
 */
export function sortByPubDateDesc<T extends { data: { pubDate: Date } }>(entries: T[]): T[] {
	return [...entries].sort(
		(a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
	);
}
