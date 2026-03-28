import { describe, it, expect } from 'vitest';
import { SITE_TITLE, SITE_DESCRIPTION } from './consts';

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
