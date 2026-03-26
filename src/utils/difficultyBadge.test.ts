import { describe, it, expect } from 'vitest';
import { getDifficultyLabel, getDifficultyClass } from './difficultyBadge';

describe('getDifficultyLabel', () => {
	it('returns the low label for "low"', () => {
		expect(getDifficultyLabel('low')).toBe('🍎 Low Hanging Fruit');
	});

	it('returns the high label for "high"', () => {
		expect(getDifficultyLabel('high')).toBe('🌳 High Hanging Fruit');
	});

	it('returns a non-empty string for each value', () => {
		expect(getDifficultyLabel('low').length).toBeGreaterThan(0);
		expect(getDifficultyLabel('high').length).toBeGreaterThan(0);
	});

	it('labels are distinct', () => {
		expect(getDifficultyLabel('low')).not.toBe(getDifficultyLabel('high'));
	});
});

describe('getDifficultyClass', () => {
	it('returns the low class for "low"', () => {
		expect(getDifficultyClass('low')).toBe('difficulty-badge difficulty-low');
	});

	it('returns the high class for "high"', () => {
		expect(getDifficultyClass('high')).toBe('difficulty-badge difficulty-high');
	});

	it('always includes the base difficulty-badge class', () => {
		expect(getDifficultyClass('low')).toContain('difficulty-badge');
		expect(getDifficultyClass('high')).toContain('difficulty-badge');
	});

	it('includes the difficulty-specific suffix', () => {
		expect(getDifficultyClass('low')).toContain('difficulty-low');
		expect(getDifficultyClass('high')).toContain('difficulty-high');
	});
});
