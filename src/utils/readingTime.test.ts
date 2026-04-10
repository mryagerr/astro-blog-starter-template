import { describe, it, expect } from 'vitest';
import { calculateReadingTime } from './readingTime';

describe('calculateReadingTime', () => {
	it('returns 1 minute for a very short article', () => {
		expect(calculateReadingTime('Hello world')).toBe(1);
	});

	it('returns 1 minute for exactly 200 words', () => {
		const words = Array(200).fill('word').join(' ');
		expect(calculateReadingTime(words)).toBe(1);
	});

	it('returns 2 minutes for 201 words', () => {
		const words = Array(201).fill('word').join(' ');
		expect(calculateReadingTime(words)).toBe(2);
	});

	it('returns 5 minutes for 1000 words', () => {
		const words = Array(1000).fill('word').join(' ');
		expect(calculateReadingTime(words)).toBe(5);
	});

	it('rounds up to the next minute', () => {
		const words = Array(401).fill('word').join(' ');
		// 401 / 200 = 2.005, ceil = 3
		expect(calculateReadingTime(words)).toBe(3);
	});

	it('returns 1 minute for an empty string', () => {
		expect(calculateReadingTime('')).toBe(1);
	});

	it('returns 1 minute for null body', () => {
		expect(calculateReadingTime(null)).toBe(1);
	});

	it('returns 1 minute for undefined body', () => {
		expect(calculateReadingTime(undefined)).toBe(1);
	});

	it('handles multiple spaces between words', () => {
		const text = 'word   word   word';
		// filter(Boolean) should handle multiple spaces correctly
		expect(calculateReadingTime(text)).toBe(1);
	});

	it('handles tabs and newlines as whitespace', () => {
		const words = Array(400).fill('word').join('\t');
		expect(calculateReadingTime(words)).toBe(2);
	});

	it('handles text with leading/trailing whitespace', () => {
		const text = '   ' + Array(200).fill('word').join(' ') + '   ';
		expect(calculateReadingTime(text)).toBe(1);
	});

	it('handles mixed whitespace (spaces, tabs, newlines)', () => {
		const words = Array(600).fill('word').join('\n');
		expect(calculateReadingTime(words)).toBe(3);
	});
});
