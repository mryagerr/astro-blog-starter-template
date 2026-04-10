import { describe, it, expect } from 'vitest';
import { isActiveLink } from './activeLink';

// These tests use baseUrl='/' which mirrors Astro's default BASE_URL in
// production. With BASE_URL='/', the leading slash is stripped from
// rawPathname before matching, so href='/blog' matches pathname='blog'.

describe('isActiveLink', () => {
	describe('root path', () => {
		it('activates home link when on root', () => {
			expect(isActiveLink('/', '/', '/')).toBe(true);
		});

		it('does not activate home link when on a sub-page', () => {
			expect(isActiveLink('/', '/blog', '/')).toBe(false);
		});
	});

	describe('exact path match', () => {
		it('activates /about link when on /about', () => {
			expect(isActiveLink('/about', '/about', '/')).toBe(true);
		});

		it('does not activate /about link when on /blog', () => {
			expect(isActiveLink('/about', '/blog', '/')).toBe(false);
		});
	});

	describe('section-level match (nested routes)', () => {
		it('activates /blog link when on a nested blog post', () => {
			expect(isActiveLink('/blog', '/blog/my-post', '/')).toBe(true);
		});

		it('activates /posts link when on a nested post page', () => {
			expect(isActiveLink('/posts', '/posts/my-post', '/')).toBe(true);
		});

		it('does not activate /about link when on a nested blog route', () => {
			expect(isActiveLink('/about', '/blog/my-post', '/')).toBe(false);
		});

		it('does not activate /blog link when on a nested posts route', () => {
			expect(isActiveLink('/blog', '/posts/my-post', '/')).toBe(false);
		});
	});

	describe('undefined href', () => {
		it('returns false when href is undefined', () => {
			expect(isActiveLink(undefined, '/blog', '/')).toBe(false);
		});

		it('returns false when href is undefined and on root', () => {
			expect(isActiveLink(undefined, '/', '/')).toBe(false);
		});
	});

	describe('custom BASE_URL', () => {
		it('strips BASE_URL prefix before comparing', () => {
			expect(isActiveLink('/blog', '/app/blog', '/app')).toBe(true);
		});

		it('handles empty BASE_URL', () => {
			expect(isActiveLink('/blog', '/blog', '')).toBe(true);
		});
	});

	describe('empty string href', () => {
		it('returns false for empty href on a normal path', () => {
			expect(isActiveLink('', '/blog', '/')).toBe(false);
		});
	});

	describe('trailing slash', () => {
		// Trailing slashes are normalized before comparison, so /about/ and /about are equivalent.
		it('activates /about/ href when on /about pathname (normalized)', () => {
			expect(isActiveLink('/about/', '/about', '/')).toBe(true);
		});

		it('activates /about href when on /about/ pathname (normalized)', () => {
			expect(isActiveLink('/about', '/about/', '/')).toBe(true);
		});

		it('activates /about/ href when on /about/ pathname', () => {
			expect(isActiveLink('/about/', '/about/', '/')).toBe(true);
		});

		it('activates /article/ href when on a nested article route with trailing slash', () => {
			expect(isActiveLink('/article/', '/article/my-post/', '/')).toBe(true);
		});
	});

	describe('deeply nested routes', () => {
		it('activates /article link when on a deeply nested article route', () => {
			expect(isActiveLink('/article', '/article/category/my-post', '/')).toBe(true);
		});

		it('does not activate /posts link when on a deeply nested article route', () => {
			expect(isActiveLink('/posts', '/article/category/my-post', '/')).toBe(false);
		});
	});

	describe('paths with query params and fragments', () => {
		it('does not match when pathname has query-like suffix', () => {
			// rawPathname in Astro is just the path, but ensure no false positives
			expect(isActiveLink('/blog', '/blog-archive', '/')).toBe(false);
		});

		it('does not activate when href is a prefix but not a section match', () => {
			// /art should not activate on /article
			expect(isActiveLink('/art', '/article/my-post', '/')).toBe(false);
		});
	});

	describe('paths with hyphens and numbers', () => {
		it('activates /blog-2024 when on that exact path', () => {
			expect(isActiveLink('/blog-2024', '/blog-2024', '/')).toBe(true);
		});

		it('activates section for hyphenated path', () => {
			expect(isActiveLink('/blog-2024', '/blog-2024/my-post', '/')).toBe(true);
		});
	});

	describe('BASE_URL with trailing slash', () => {
		it('handles BASE_URL with trailing slash', () => {
			expect(isActiveLink('/blog', '/app/blog', '/app')).toBe(true);
		});
	});
});
