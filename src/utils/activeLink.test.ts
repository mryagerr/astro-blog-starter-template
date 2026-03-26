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
});
