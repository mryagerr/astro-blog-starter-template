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
		// href with trailing slash does NOT match because neither the exact check
		// ('/about/' !== 'about') nor the section check ('/about/' !== '/about') passes.
		it('does not activate /about/ href when on /about pathname', () => {
			expect(isActiveLink('/about/', '/about', '/')).toBe(false);
		});

		// pathname with trailing slash DOES match via the section-level rule:
		// the first path segment of '/about/' is still 'about', so href '/about' matches.
		it('activates /about href when on /about/ pathname (section-level match)', () => {
			expect(isActiveLink('/about', '/about/', '/')).toBe(true);
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
});
