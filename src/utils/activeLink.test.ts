import { describe, it, expect } from 'vitest';
import { isActiveLink } from './activeLink';

// These tests use baseUrl='/' which mirrors Astro's default BASE_URL in
// production. With BASE_URL='/', the leading slash is stripped from
// rawPathname before matching, so href='/article' matches pathname='article'.

describe('isActiveLink', () => {
	describe('root path', () => {
		it('activates home link when on root', () => {
			expect(isActiveLink('/', '/', '/')).toBe(true);
		});

		it('does not activate home link when on a sub-page', () => {
			expect(isActiveLink('/', '/article', '/')).toBe(false);
		});
	});

	describe('exact path match', () => {
		it('activates /about link when on /about', () => {
			expect(isActiveLink('/about', '/about', '/')).toBe(true);
		});

		it('does not activate /about link when on /article', () => {
			expect(isActiveLink('/about', '/article', '/')).toBe(false);
		});
	});

	describe('section-level match (nested routes)', () => {
		it('activates /article link when on a nested article page', () => {
			expect(isActiveLink('/article', '/article/my-article', '/')).toBe(true);
		});

		it('does not activate /about link when on a nested article route', () => {
			expect(isActiveLink('/about', '/article/my-article', '/')).toBe(false);
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
			expect(isActiveLink('/article', '/app/article', '/app')).toBe(true);
		});

		it('handles empty BASE_URL', () => {
			expect(isActiveLink('/article', '/article', '')).toBe(true);
		});
	});
});
