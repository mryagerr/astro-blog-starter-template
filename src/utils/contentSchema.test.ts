import { describe, it, expect } from 'vitest';
import { articleSchema } from './contentSchema';

describe('articleSchema', () => {
	describe('required fields', () => {
		it('accepts valid minimal frontmatter', () => {
			const result = articleSchema.safeParse({
				title: 'Test Article',
				description: 'A test.',
				pubDate: '2024-03-15',
			});
			expect(result.success).toBe(true);
		});

		it('rejects missing title', () => {
			const result = articleSchema.safeParse({
				description: 'Test',
				pubDate: '2024-03-15',
			});
			expect(result.success).toBe(false);
		});

		it('rejects missing description', () => {
			const result = articleSchema.safeParse({
				title: 'Test',
				pubDate: '2024-03-15',
			});
			expect(result.success).toBe(false);
		});

		it('rejects missing pubDate', () => {
			const result = articleSchema.safeParse({
				title: 'Test',
				description: 'Test',
			});
			expect(result.success).toBe(false);
		});
	});

	describe('pubDate coercion', () => {
		it('coerces pubDate from an ISO date string', () => {
			const result = articleSchema.safeParse({
				title: 'Test',
				description: 'Test',
				pubDate: '2024-03-15',
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.pubDate).toBeInstanceOf(Date);
			}
		});

		it('coerces pubDate from a human-readable date string', () => {
			const result = articleSchema.safeParse({
				title: 'Test',
				description: 'Test',
				pubDate: 'Mar 15 2024',
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.pubDate).toBeInstanceOf(Date);
			}
		});

		it('rejects an unparseable pubDate string', () => {
			const result = articleSchema.safeParse({
				title: 'Test',
				description: 'Test',
				pubDate: 'not-a-date',
			});
			expect(result.success).toBe(false);
		});
	});

	describe('optional fields', () => {
		it('accepts frontmatter without updatedDate', () => {
			const result = articleSchema.safeParse({
				title: 'Test',
				description: 'Test',
				pubDate: '2024-03-15',
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.updatedDate).toBeUndefined();
			}
		});

		it('coerces updatedDate from a string when provided', () => {
			const result = articleSchema.safeParse({
				title: 'Test',
				description: 'Test',
				pubDate: '2024-03-15',
				updatedDate: '2024-03-20',
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.updatedDate).toBeInstanceOf(Date);
			}
		});

		it('accepts frontmatter without heroImage', () => {
			const result = articleSchema.safeParse({
				title: 'Test',
				description: 'Test',
				pubDate: '2024-03-15',
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.heroImage).toBeUndefined();
			}
		});

		it('accepts frontmatter without difficulty', () => {
			const result = articleSchema.safeParse({
				title: 'Test',
				description: 'Test',
				pubDate: '2024-03-15',
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.difficulty).toBeUndefined();
			}
		});
	});

	describe('difficulty enum', () => {
		it('accepts difficulty: low', () => {
			const result = articleSchema.safeParse({
				title: 'Test',
				description: 'Test',
				pubDate: '2024-03-15',
				difficulty: 'low',
			});
			expect(result.success).toBe(true);
		});

		it('accepts difficulty: high', () => {
			const result = articleSchema.safeParse({
				title: 'Test',
				description: 'Test',
				pubDate: '2024-03-15',
				difficulty: 'high',
			});
			expect(result.success).toBe(true);
		});

		it('rejects difficulty: medium', () => {
			const result = articleSchema.safeParse({
				title: 'Test',
				description: 'Test',
				pubDate: '2024-03-15',
				difficulty: 'medium',
			});
			expect(result.success).toBe(false);
		});

		it('rejects arbitrary difficulty string', () => {
			const result = articleSchema.safeParse({
				title: 'Test',
				description: 'Test',
				pubDate: '2024-03-15',
				difficulty: 'easy',
			});
			expect(result.success).toBe(false);
		});
	});

	describe('tags', () => {
		it('accepts valid tags array', () => {
			const result = articleSchema.safeParse({
				title: 'Test',
				description: 'Test',
				pubDate: '2024-03-15',
				tags: ['collection', 'analysis'],
			});
			expect(result.success).toBe(true);
		});

		it('accepts empty tags array', () => {
			const result = articleSchema.safeParse({
				title: 'Test',
				description: 'Test',
				pubDate: '2024-03-15',
				tags: [],
			});
			expect(result.success).toBe(true);
		});

		it('accepts frontmatter without tags', () => {
			const result = articleSchema.safeParse({
				title: 'Test',
				description: 'Test',
				pubDate: '2024-03-15',
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.tags).toBeUndefined();
			}
		});

		it('rejects invalid tag values', () => {
			const result = articleSchema.safeParse({
				title: 'Test',
				description: 'Test',
				pubDate: '2024-03-15',
				tags: ['invalid-tag'],
			});
			expect(result.success).toBe(false);
		});

		it('accepts all valid tag values', () => {
			const result = articleSchema.safeParse({
				title: 'Test',
				description: 'Test',
				pubDate: '2024-03-15',
				tags: ['collection', 'preparation', 'pipelines', 'analysis', 'culture', 'career'],
			});
			expect(result.success).toBe(true);
		});
	});

	describe('full frontmatter', () => {
		it('accepts all fields populated', () => {
			const result = articleSchema.safeParse({
				title: 'Full Article',
				description: 'A complete test article.',
				pubDate: '2024-03-15',
				updatedDate: '2024-03-20',
				heroImage: '/blog-placeholder-1.png',
				difficulty: 'low',
				tags: ['collection', 'preparation'],
			});
			expect(result.success).toBe(true);
		});
	});

	describe('edge cases', () => {
		it('accepts a Date object for pubDate (not just strings)', () => {
			const result = articleSchema.safeParse({
				title: 'Test',
				description: 'Test',
				pubDate: new Date('2024-03-15'),
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.pubDate).toBeInstanceOf(Date);
			}
		});

		it('accepts a leap year date', () => {
			const result = articleSchema.safeParse({
				title: 'Test',
				description: 'Test',
				pubDate: '2024-02-29',
			});
			expect(result.success).toBe(true);
		});

		it('accepts a very long title', () => {
			const result = articleSchema.safeParse({
				title: 'A'.repeat(1000),
				description: 'Test',
				pubDate: '2024-03-15',
			});
			expect(result.success).toBe(true);
		});

		it('accepts unicode characters in title and description', () => {
			const result = articleSchema.safeParse({
				title: 'Test with emojis 🚀🎉 and Unicode àáâ',
				description: 'Description with 日本語 characters',
				pubDate: '2024-03-15',
			});
			expect(result.success).toBe(true);
		});

		it('rejects non-string title', () => {
			const result = articleSchema.safeParse({
				title: 123,
				description: 'Test',
				pubDate: '2024-03-15',
			});
			expect(result.success).toBe(false);
		});

		it('rejects non-string description', () => {
			const result = articleSchema.safeParse({
				title: 'Test',
				description: 42,
				pubDate: '2024-03-15',
			});
			expect(result.success).toBe(false);
		});

		it('strips unknown fields (strict by default)', () => {
			const result = articleSchema.safeParse({
				title: 'Test',
				description: 'Test',
				pubDate: '2024-03-15',
				unknownField: 'should be stripped',
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect((result.data as Record<string, unknown>)['unknownField']).toBeUndefined();
			}
		});
	});
});
