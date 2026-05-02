import { describe, it, expect } from 'vitest';
import { fuzzyScore, highlightMatch, buildHighlightRegex } from './search';

describe('fuzzyScore', () => {
	it('returns 0 when no terms match', () => {
		expect(fuzzyScore('Hello World', ['xyz'])).toBe(0);
	});

	it('returns a positive score when a term matches', () => {
		expect(fuzzyScore('Data Pipeline Tutorial', ['data'])).toBeGreaterThan(0);
	});

	it('gives a higher score for longer matching terms', () => {
		const shortMatch = fuzzyScore('Data Pipeline', ['da']);
		const longMatch = fuzzyScore('Data Pipeline', ['data']);
		expect(longMatch).toBeGreaterThan(shortMatch);
	});

	it('gives a word-boundary bonus when term starts the text', () => {
		const startsWithScore = fuzzyScore('data pipeline', ['data']);
		const midWordScore = fuzzyScore('metadata pipeline', ['data']);
		expect(startsWithScore).toBeGreaterThan(midWordScore);
	});

	it('gives a word-boundary bonus when term follows a space', () => {
		const wordBoundaryScore = fuzzyScore('my data pipeline', ['data']);
		const midWordScore = fuzzyScore('metadata pipeline', ['data']);
		expect(wordBoundaryScore).toBeGreaterThan(midWordScore);
	});

	it('is case-insensitive', () => {
		expect(fuzzyScore('DATA PIPELINE', ['data'])).toBeGreaterThan(0);
		expect(fuzzyScore('Data Pipeline', ['DATA'])).toBe(0); // terms should be pre-lowercased
	});

	it('handles multiple terms', () => {
		const score = fuzzyScore('Data Pipeline Tutorial', ['data', 'tutorial']);
		const singleScore = fuzzyScore('Data Pipeline Tutorial', ['data']);
		expect(score).toBeGreaterThan(singleScore);
	});

	it('returns 0 for empty terms array', () => {
		expect(fuzzyScore('Hello World', [])).toBe(0);
	});

	it('returns 0 for empty text', () => {
		expect(fuzzyScore('', ['data'])).toBe(0);
	});

	it('handles substring matching (e.g., "pipe" in "pipeline")', () => {
		expect(fuzzyScore('Data Pipeline', ['pipe'])).toBeGreaterThan(0);
	});

	it('scores proportionally to term length relative to text length', () => {
		// Same term in shorter text should score higher per-term
		const shortText = fuzzyScore('data', ['data']);
		const longText = fuzzyScore('data analysis and processing pipeline', ['data']);
		expect(shortText).toBeGreaterThan(longText);
	});

	it('handles terms with no word-boundary match', () => {
		// "ipe" is inside "pipeline" but not at a word boundary
		const score = fuzzyScore('Data Pipeline', ['ipe']);
		expect(score).toBeGreaterThan(0);
		// No word-boundary bonus, so just the base score
		const boundaryScore = fuzzyScore('Data Pipeline', ['pipeline']);
		expect(boundaryScore).toBeGreaterThan(score);
	});
});

describe('highlightMatch', () => {
	it('returns original text when query is empty', () => {
		expect(highlightMatch('Hello World', '')).toBe('Hello World');
	});

	it('wraps matching terms in <mark> tags', () => {
		expect(highlightMatch('Data Pipeline', 'data')).toBe('<mark>Data</mark> Pipeline');
	});

	it('is case-insensitive but preserves original case', () => {
		expect(highlightMatch('Data Pipeline', 'DATA')).toBe('<mark>Data</mark> Pipeline');
	});

	it('highlights multiple occurrences', () => {
		const result = highlightMatch('data about data', 'data');
		expect(result).toBe('<mark>data</mark> about <mark>data</mark>');
	});

	it('highlights multiple different terms', () => {
		const result = highlightMatch('Data Pipeline Tutorial', 'data tutorial');
		expect(result).toBe('<mark>Data</mark> Pipeline <mark>Tutorial</mark>');
	});

	it('escapes regex special characters in query', () => {
		// Should not throw or behave unexpectedly with regex chars
		const result = highlightMatch('price is $100 (USD)', '$100');
		expect(result).toBe('price is <mark>$100</mark> (USD)');
	});

	it('escapes parentheses in query', () => {
		const result = highlightMatch('function(x)', '(x)');
		expect(result).toBe('function<mark>(x)</mark>');
	});

	it('handles query with only whitespace', () => {
		// Whitespace-only query should return original text unchanged
		expect(highlightMatch('Hello World', '   ')).toBe('Hello World');
	});

	it('does not alter text when no terms match', () => {
		expect(highlightMatch('Hello World', 'xyz')).toBe('Hello World');
	});

	it('handles text that already contains HTML tags', () => {
		const result = highlightMatch('<p>Hello World</p>', 'hello');
		expect(result).toContain('<mark>Hello</mark>');
	});

	it('handles dot in query', () => {
		const result = highlightMatch('file.txt and file2txt', 'file.txt');
		// The dot should be escaped, so only "file.txt" matches literally
		expect(result).toBe('<mark>file.txt</mark> and file2txt');
	});

	it('handles pipe character in query', () => {
		const result = highlightMatch('a|b or c', 'a|b');
		expect(result).toBe('<mark>a|b</mark> or c');
	});
});

describe('buildHighlightRegex', () => {
	it('returns null for empty query', () => {
		expect(buildHighlightRegex('')).toBeNull();
	});

	it('returns null for whitespace-only query', () => {
		expect(buildHighlightRegex('   ')).toBeNull();
	});

	it('returns a case-insensitive global regex matching any term', () => {
		const regex = buildHighlightRegex('data tutorial');
		expect(regex).not.toBeNull();
		expect(regex!.flags).toContain('g');
		expect(regex!.flags).toContain('i');
		expect('Data and tutorial'.replace(regex!, '<m>$1</m>')).toBe(
			'<m>Data</m> and <m>tutorial</m>',
		);
	});

	it('escapes regex metacharacters in terms', () => {
		const regex = buildHighlightRegex('$100');
		expect('price $100 (USD)'.replace(regex!, '<m>$1</m>')).toBe(
			'price <m>$100</m> (USD)',
		);
	});

	it('can be reused across many texts without rebuilding', () => {
		const regex = buildHighlightRegex('data');
		expect('data one'.replace(regex!, '<m>$1</m>')).toBe('<m>data</m> one');
		expect('two data'.replace(regex!, '<m>$1</m>')).toBe('two <m>data</m>');
	});
});
