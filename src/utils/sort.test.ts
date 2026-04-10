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

	it('preserves extra fields on entries', () => {
		const entry = { data: { pubDate: new Date('2024-01-01'), title: 'Hello' }, id: 'abc' };
		const result = sortByPubDateDesc([entry]);
		expect(result[0]).toBe(entry);
		expect((result[0] as typeof entry).id).toBe('abc');
		expect((result[0] as typeof entry).data.title).toBe('Hello');
	});

	it('maintains stable order for entries with identical dates', () => {
		// Create entries with the same date but different identifiers
		const a = { data: { pubDate: new Date('2024-06-01') }, id: 'a' };
		const b = { data: { pubDate: new Date('2024-06-01') }, id: 'b' };
		const c = { data: { pubDate: new Date('2024-06-01') }, id: 'c' };
		const result = sortByPubDateDesc([a, b, c]);
		// Array.sort is stable in V8, so original order should be preserved
		expect((result[0] as typeof a).id).toBe('a');
		expect((result[1] as typeof b).id).toBe('b');
		expect((result[2] as typeof c).id).toBe('c');
	});

	it('handles dates spanning centuries', () => {
		const old = makeEntry(new Date('1900-01-01'));
		const mid = makeEntry(new Date('2000-06-15'));
		const future = makeEntry(new Date('2100-12-31'));
		const result = sortByPubDateDesc([old, future, mid]);
		expect(result[0]).toBe(future);
		expect(result[1]).toBe(mid);
		expect(result[2]).toBe(old);
	});

	it('handles a large array correctly', () => {
		const entries = Array.from({ length: 100 }, (_, i) => {
			const date = new Date(`2024-01-01`);
			date.setDate(date.getDate() + i);
			return makeEntry(date);
		});
		const result = sortByPubDateDesc(entries);
		expect(result).toHaveLength(100);
		// First should be the newest (day 99)
		expect(result[0].data.pubDate.getTime()).toBeGreaterThan(result[99].data.pubDate.getTime());
	});
});
