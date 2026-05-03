import { describe, it, expect } from 'vitest';
import { countArticlesByTag } from './tagCounts';
import type { Tag } from './contentSchema';

function article(tags: Tag[] | undefined) {
	return { data: { tags } };
}

describe('countArticlesByTag', () => {
	it('returns an empty map for no articles', () => {
		expect(countArticlesByTag([])).toEqual(new Map());
	});

	it('counts a single-tag article once', () => {
		const counts = countArticlesByTag([article(['culture'])]);
		expect(counts.get('culture')).toBe(1);
		expect(counts.size).toBe(1);
	});

	it('increments every tag on a multi-tag article', () => {
		const counts = countArticlesByTag([article(['culture', 'career'])]);
		expect(counts.get('culture')).toBe(1);
		expect(counts.get('career')).toBe(1);
	});

	it('sums the same tag across articles', () => {
		const counts = countArticlesByTag([
			article(['analysis']),
			article(['analysis']),
			article(['analysis']),
		]);
		expect(counts.get('analysis')).toBe(3);
	});

	it('per-tag totals can exceed the article count when tags overlap', () => {
		const articles = [
			article(['culture', 'career']),
			article(['culture']),
			article(['analysis', 'culture']),
		];
		const counts = countArticlesByTag(articles);
		const sum = [...counts.values()].reduce((a, b) => a + b, 0);
		expect(sum).toBe(5);
		expect(articles.length).toBe(3);
	});

	it('skips articles with no tags', () => {
		const counts = countArticlesByTag([article(undefined), article(['analysis'])]);
		expect(counts.get('analysis')).toBe(1);
		expect(counts.size).toBe(1);
	});

	it('skips articles with an empty tag array', () => {
		const counts = countArticlesByTag([article([]), article(['pipelines'])]);
		expect(counts.get('pipelines')).toBe(1);
		expect(counts.size).toBe(1);
	});

	it('does not mutate the input articles', () => {
		const tags: Tag[] = ['collection', 'preparation'];
		const input = [{ data: { tags } }];
		countArticlesByTag(input);
		expect(input[0].data.tags).toEqual(['collection', 'preparation']);
	});

	it('only emits keys for tags that actually appear', () => {
		const counts = countArticlesByTag([article(['career'])]);
		expect(counts.has('culture')).toBe(false);
		expect(counts.has('collection')).toBe(false);
	});
});
