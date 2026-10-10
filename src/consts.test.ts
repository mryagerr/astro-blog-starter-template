import { describe, it, expect } from 'vitest';
import { SITE_TITLE, SITE_DESCRIPTION, AUTHOR_NAME, AUTHOR_PATH, AUTHOR_SAME_AS } from './consts';

describe('site constants', () => {
	it('SITE_TITLE is "Low Hanging Data"', () => {
		expect(SITE_TITLE).toBe('Low Hanging Data');
	});

	it('SITE_DESCRIPTION is a non-empty string', () => {
		expect(typeof SITE_DESCRIPTION).toBe('string');
		expect(SITE_DESCRIPTION.length).toBeGreaterThan(0);
	});

	it('SITE_DESCRIPTION matches the expected value', () => {
		expect(SITE_DESCRIPTION).toBe(
			'Data analysis should be concise, transparent, and focused on the low hanging fruit first.',
		);
	});
});

describe('author constants', () => {
	it('AUTHOR_NAME is the full author name', () => {
		expect(AUTHOR_NAME).toBe('Michael Petrillo');
	});

	it('AUTHOR_PATH points at the About page with a trailing slash', () => {
		expect(AUTHOR_PATH).toBe('/about/');
	});

	it('AUTHOR_SAME_AS contains only absolute https URLs', () => {
		expect(AUTHOR_SAME_AS.length).toBeGreaterThan(0);
		for (const url of AUTHOR_SAME_AS) {
			expect(url.startsWith('https://')).toBe(true);
		}
	});
});
