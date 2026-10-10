import { describe, it, expect } from 'vitest';
import { buildPersonSchema, buildArticleSchema } from './structuredData';

const SITE = 'https://lowhangingdata.com';

describe('buildPersonSchema', () => {
	it('names the author and points url at the About page', () => {
		const person = buildPersonSchema(SITE);
		expect(person['@type']).toBe('Person');
		expect(person.name).toBe('Michael Petrillo');
		expect(person.url).toBe('https://lowhangingdata.com/about/');
	});

	it('includes the LinkedIn and GitHub profiles in sameAs', () => {
		const { sameAs } = buildPersonSchema(SITE);
		expect(sameAs).toContain('https://www.linkedin.com/in/michealpetrillo');
		expect(sameAs).toContain('https://github.com/mryagerr');
	});

	it('returns a fresh sameAs array each call', () => {
		const a = buildPersonSchema(SITE);
		a.sameAs.push('https://example.com');
		expect(buildPersonSchema(SITE).sameAs).not.toContain('https://example.com');
	});

	it('accepts an override name', () => {
		expect(buildPersonSchema(SITE, 'Guest').name).toBe('Guest');
	});
});

describe('buildArticleSchema', () => {
	const base = {
		site: SITE,
		canonicalURL: 'https://lowhangingdata.com/article/foo/',
		title: 'Foo',
		description: 'About foo.',
		image: '/blog-foo.png',
		pubDate: new Date('2026-03-01T00:00:00Z'),
	};

	it('produces an Article with headline, datePublished, image, and mainEntityOfPage', () => {
		const a = buildArticleSchema(base);
		expect(a['@type']).toBe('Article');
		expect(a.headline).toBe('Foo');
		expect(a.datePublished).toBe('2026-03-01T00:00:00.000Z');
		expect(a.image).toBe('https://lowhangingdata.com/blog-foo.png');
		expect(a.mainEntityOfPage).toEqual({ '@type': 'WebPage', '@id': 'https://lowhangingdata.com/article/foo/' });
	});

	it('omits dateModified when updatedDate is not set', () => {
		expect(buildArticleSchema(base)).not.toHaveProperty('dateModified');
	});

	it('emits dateModified when updatedDate is set', () => {
		const a = buildArticleSchema({ ...base, updatedDate: new Date('2026-10-10T00:00:00Z') });
		expect(a.dateModified).toBe('2026-10-10T00:00:00.000Z');
	});

	it('embeds a Person author', () => {
		const a = buildArticleSchema(base);
		expect(a.author).toMatchObject({ '@type': 'Person', name: 'Michael Petrillo', url: 'https://lowhangingdata.com/about/' });
	});

	it('includes wordCount only when provided', () => {
		expect(buildArticleSchema(base)).not.toHaveProperty('wordCount');
		expect(buildArticleSchema({ ...base, wordCount: 1234 }).wordCount).toBe(1234);
	});
});
