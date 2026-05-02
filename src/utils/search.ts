/**
 * Fuzzy match scoring: returns a relevance score (higher = better match).
 * All query terms are checked against the text; word-boundary matches get a bonus.
 */
export function fuzzyScore(text: string, terms: string[]): number {
	const lower = text.toLowerCase();
	let score = 0;
	for (const term of terms) {
		if (lower.includes(term)) {
			score += term.length / lower.length * 10;
			// Bonus for word-boundary match
			if (lower.includes(' ' + term) || lower.startsWith(term)) {
				score += 2;
			}
		}
	}
	return score;
}

/**
 * Build a case-insensitive regex matching any term in the query, with regex
 * special characters escaped. Returns null when the query has no usable terms.
 * Hoist this out of render loops — `new RegExp` per result is the dominant
 * cost in /search/.
 */
export function buildHighlightRegex(queryStr: string): RegExp | null {
	if (!queryStr) return null;
	const terms = queryStr.toLowerCase().split(/\s+/).filter(Boolean);
	if (terms.length === 0) return null;
	const escaped = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
	return new RegExp(`(${escaped.join('|')})`, 'gi');
}

/**
 * Highlight matching query terms in text by wrapping them in <mark> tags.
 * Query terms are regex-escaped to prevent injection.
 */
export function highlightMatch(text: string, queryStr: string): string {
	const regex = buildHighlightRegex(queryStr);
	if (!regex) return text;
	return text.replace(regex, '<mark>$1</mark>');
}
