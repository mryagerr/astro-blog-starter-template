import { describe, it, expect } from 'vitest';
import { sortByPubDateDesc } from './sort';

function makeEntry(pubDate: Date) {
	return { data: { pubDate } };
}

describe('sortByPubDateDesc', () => {
	it('sorts two entries newest first', () => {
		const older = makeEntry(new Date('2024-01-01'));
		const newer = makeEntry(new Date('2024-06-01'));
		const result = sortByPubDateDesc([older, newer]);
		expect(result[0]).toBe(newer);
		expect(result[1]).toBe(older);
	});

	it('sorts three entries newest first', () => {
		const a = makeEntry(new Date('2023-01-01'));
		const b = makeEntry(new Date('2024-06-01'));
		const c = makeEntry(new Date('2024-01-15'));
		const result = sortByPubDateDesc([a, b, c]);
		expect(result[0]).toBe(b);
		expect(result[1]).toBe(c);
		expect(result[2]).toBe(a);
	});

	it('does not mutate the original array', () => {
		const older = makeEntry(new Date('2024-01-01'));
		const newer = makeEntry(new Date('2024-06-01'));
		const original = [older, newer];
		sortByPubDateDesc(original);
		expect(original[0]).toBe(older);
		expect(original[1]).toBe(newer);
	});

	it('handles an empty array', () => {
		expect(sortByPubDateDesc([])).toEqual([]);
	});

	it('handles a single entry', () => {
		const post = makeEntry(new Date('2024-01-01'));
		const result = sortByPubDateDesc([post]);
		expect(result).toHaveLength(1);
		expect(result[0]).toBe(post);
	});

	it('handles entries with the same pubDate', () => {
		const a = makeEntry(new Date('2024-01-01'));
		const b = makeEntry(new Date('2024-01-01'));
		const result = sortByPubDateDesc([a, b]);
		expect(result).toHaveLength(2);
	});

	it('handles dates far in the future', () => {
		const past = makeEntry(new Date('2020-01-01'));
		const future = makeEntry(new Date('2099-12-31'));
		const result = sortByPubDateDesc([past, future]);
		expect(result[0]).toBe(future);
	});
});
