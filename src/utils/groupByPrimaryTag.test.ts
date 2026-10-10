import { describe, it, expect } from 'vitest';
import { groupByPrimaryTag } from './groupByPrimaryTag';
import type { Tag } from './contentSchema';

const entry = (id: string, date: string, tags?: Tag[]) => ({ id, data: { pubDate: new Date(date), tags } });

describe('groupByPrimaryTag', () => {
	it('places each article under its first tag only', () => {
		const groups = groupByPrimaryTag([entry('a', '2026-01-01', ['culture', 'career'])]);
		expect(groups).toHaveLength(1);
		expect(groups[0].tag).toBe('culture');
	});

	it('orders groups by VALID_TAGS order', () => {
		const groups = groupByPrimaryTag([
			entry('a', '2026-01-01', ['career']),
			entry('b', '2026-01-01', ['collection']),
		]);
		expect(groups.map((g) => g.tag)).toEqual(['collection', 'career']);
	});

	it('sorts entries newest first within a group', () => {
		const groups = groupByPrimaryTag([
			entry('old', '2025-01-01', ['analysis']),
			entry('new', '2026-01-01', ['analysis']),
		]);
		expect(groups[0].entries.map((e) => e.id)).toEqual(['new', 'old']);
	});

	it('puts untagged articles in a trailing null group', () => {
		const groups = groupByPrimaryTag([entry('x', '2026-01-01'), entry('y', '2026-01-01', ['pipelines'])]);
		expect(groups.map((g) => g.tag)).toEqual(['pipelines', null]);
	});

	it('returns an empty array for no input', () => {
		expect(groupByPrimaryTag([])).toEqual([]);
	});

	it('accounts for every article exactly once', () => {
		const input = [
			entry('a', '2026-01-01', ['culture']),
			entry('b', '2026-02-01', ['analysis', 'culture']),
			entry('c', '2026-03-01'),
		];
		const total = groupByPrimaryTag(input).reduce((n, g) => n + g.entries.length, 0);
		expect(total).toBe(input.length);
	});
});
