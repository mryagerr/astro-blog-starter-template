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
 * Highlight matching query terms in text by wrapping them in <mark> tags.
 * Query terms are regex-escaped to prevent injection.
 */
export function highlightMatch(text: string, queryStr: string): string {
	if (!queryStr) return text;
	const terms = queryStr.toLowerCase().split(/\s+/).filter(Boolean);
	if (terms.length === 0) return text;
	// Build regex matching any term
	const escaped = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
	const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
	return text.replace(regex, '<mark>$1</mark>');
}
