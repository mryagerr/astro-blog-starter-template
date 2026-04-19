import { describe, it, expect } from 'vitest';
import { findRelatedPosts, CATEGORY_ADJACENCY, type RelatedPostInput } from './relatedPosts';

function makePost(id: string, pubDate: string, tags: string[] = []): RelatedPostInput {
	return {
		id,
		data: {
			title: `Post ${id}`,
			description: `Description for ${id}`,
			pubDate: new Date(pubDate),
			tags,
		},
	};
}

describe('findRelatedPosts', () => {
	it('excludes the current post from results', () => {
		const posts = [
			makePost('a', '2024-01-01'),
			makePost('b', '2024-02-01'),
		];
		const results = findRelatedPosts('a', [], posts, '/article/');
		expect(results.every((r) => r.id !== 'a')).toBe(true);
	});

	it('returns up to 3 posts by default', () => {
		const posts = [
			makePost('current', '2024-01-01'),
			makePost('a', '2024-02-01'),
			makePost('b', '2024-03-01'),
			makePost('c', '2024-04-01'),
			makePost('d', '2024-05-01'),
		];
		const results = findRelatedPosts('current', [], posts, '/article/');
		expect(results).toHaveLength(3);
	});

	it('respects custom limit', () => {
		const posts = [
			makePost('current', '2024-01-01'),
			makePost('a', '2024-02-01'),
			makePost('b', '2024-03-01'),
			makePost('c', '2024-04-01'),
		];
		const results = findRelatedPosts('current', [], posts, '/article/', 2);
		expect(results).toHaveLength(2);
	});

	it('returns fewer posts when not enough are available', () => {
		const posts = [
			makePost('current', '2024-01-01'),
			makePost('a', '2024-02-01'),
		];
		const results = findRelatedPosts('current', [], posts, '/article/');
		expect(results).toHaveLength(1);
	});

	it('returns empty array when current post is the only one', () => {
		const posts = [makePost('current', '2024-01-01')];
		const results = findRelatedPosts('current', [], posts, '/article/');
		expect(results).toHaveLength(0);
	});

	it('returns empty array when posts array is empty', () => {
		const results = findRelatedPosts('current', [], [], '/article/');
		expect(results).toHaveLength(0);
	});

	it('prefers posts with more shared tags', () => {
		const posts = [
			makePost('current', '2024-01-01', ['analysis', 'pipelines']),
			makePost('a', '2024-02-01', ['analysis', 'pipelines']), // 2 shared
			makePost('b', '2024-03-01', ['analysis']),               // 1 shared
			makePost('c', '2024-04-01', []),                          // 0 shared
		];
		const results = findRelatedPosts('current', ['analysis', 'pipelines'], posts, '/article/');
		expect(results[0].id).toBe('a');
		expect(results[1].id).toBe('b');
		expect(results[2].id).toBe('c');
	});

	it('falls back to pubDate descending when tag counts are equal', () => {
		const posts = [
			makePost('current', '2024-01-01', ['analysis']),
			makePost('a', '2024-02-01', ['analysis']),  // 1 shared, older
			makePost('b', '2024-06-01', ['analysis']),  // 1 shared, newer
		];
		const results = findRelatedPosts('current', ['analysis'], posts, '/article/');
		expect(results[0].id).toBe('b'); // newer first
		expect(results[1].id).toBe('a');
	});

	it('sorts by recency when no tags overlap', () => {
		const posts = [
			makePost('current', '2024-01-01'),
			makePost('old', '2023-01-01'),
			makePost('new', '2024-06-01'),
			makePost('mid', '2024-03-01'),
		];
		const results = findRelatedPosts('current', [], posts, '/article/');
		expect(results[0].id).toBe('new');
		expect(results[1].id).toBe('mid');
		expect(results[2].id).toBe('old');
	});

	it('generates correct href with the given prefix', () => {
		const posts = [
			makePost('current', '2024-01-01'),
			makePost('my-post', '2024-02-01'),
		];
		const results = findRelatedPosts('current', [], posts, '/article/');
		expect(results[0].href).toBe('/article/my-post/');
	});

	it('maps post data fields correctly', () => {
		const posts = [
			makePost('current', '2024-01-01'),
			{
				id: 'detailed',
				data: {
					title: 'Detailed Post',
					description: 'A detailed description',
					pubDate: new Date('2024-06-01'),
					heroImage: '/hero.svg',
					tags: [] as string[],
				},
			},
		];
		const results = findRelatedPosts('current', [], posts, '/posts/');
		expect(results[0]).toEqual({
			id: 'detailed',
			title: 'Detailed Post',
			description: 'A detailed description',
			pubDate: new Date('2024-06-01'),
			heroImage: '/hero.svg',
			href: '/posts/detailed/',
		});
	});

	it('handles posts with no tags when current has tags', () => {
		const posts = [
			makePost('current', '2024-01-01', ['analysis']),
			makePost('a', '2024-06-01'), // no tags
			makePost('b', '2024-05-01'), // no tags
		];
		const results = findRelatedPosts('current', ['analysis'], posts, '/article/');
		// Both have 0 shared tags, so sort by date
		expect(results[0].id).toBe('a');
		expect(results[1].id).toBe('b');
	});

	it('handles current post with no tags when others have tags', () => {
		const posts = [
			makePost('current', '2024-01-01'),
			makePost('a', '2024-02-01', ['analysis', 'pipelines']),
			makePost('b', '2024-03-01', ['collection']),
		];
		const results = findRelatedPosts('current', [], posts, '/article/');
		// No tags to match, so all get 0 shared tags — sort by date
		expect(results[0].id).toBe('b'); // newer
		expect(results[1].id).toBe('a');
	});

	it('prefers adjacent-category articles over completely unrelated ones', () => {
		const posts = [
			makePost('current', '2024-01-01', ['collection']),
			makePost('same', '2024-02-01', ['collection']),        // direct match
			makePost('adj', '2024-01-15', ['preparation']),         // adjacent (collection ↔ preparation)
			makePost('unrelated', '2024-06-01', ['career']),        // no relation, newer
		];
		const results = findRelatedPosts('current', ['collection'], posts, '/article/');
		expect(results[0].id).toBe('same');      // 2 pts (direct)
		expect(results[1].id).toBe('adj');       // 1 pt (adjacent), newer than same
		expect(results[2].id).toBe('unrelated'); // 0 pts
	});

	it('breaks ties by pubDate desc then id alphabetical', () => {
		const posts = [
			makePost('current', '2024-01-01', ['analysis']),
			makePost('b-post', '2024-06-01', ['analysis']),
			makePost('a-post', '2024-06-01', ['analysis']),
		];
		const results = findRelatedPosts('current', ['analysis'], posts, '/article/');
		// Same score, same date → alphabetical by id
		expect(results[0].id).toBe('a-post');
		expect(results[1].id).toBe('b-post');
	});

	it('has the expected adjacency pairs in CATEGORY_ADJACENCY', () => {
		expect(CATEGORY_ADJACENCY['collection']).toContain('preparation');
		expect(CATEGORY_ADJACENCY['preparation']).toContain('collection');
		expect(CATEGORY_ADJACENCY['pipelines']).toContain('analysis');
		expect(CATEGORY_ADJACENCY['analysis']).toContain('pipelines');
		expect(CATEGORY_ADJACENCY['culture']).toContain('career');
		expect(CATEGORY_ADJACENCY['career']).toContain('culture');
	});
});
