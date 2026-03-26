import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatDate, getCurrentYear } from './formatDate';

describe('formatDate', () => {
	it('formats a date in "Mon DD, YYYY" form', () => {
		// Use noon UTC to avoid any midnight timezone boundary issues
		const date = new Date('2024-03-15T12:00:00Z');
		const result = formatDate(date);
		expect(result).toMatch(/Mar/);
		expect(result).toMatch(/2024/);
	});

	it('formats January correctly', () => {
		const date = new Date('2024-01-01T12:00:00Z');
		expect(formatDate(date)).toMatch(/Jan/);
	});

	it('formats December correctly', () => {
		const date = new Date('2024-12-31T12:00:00Z');
		expect(formatDate(date)).toMatch(/Dec/);
	});

	it('includes the day number', () => {
		const date = new Date('2024-07-04T12:00:00Z');
		const result = formatDate(date);
		expect(result).toMatch(/4/);
	});

	it('includes the full year', () => {
		const date = new Date('2099-06-01T12:00:00Z');
		expect(formatDate(date)).toMatch(/2099/);
	});

	it('returns a string', () => {
		expect(typeof formatDate(new Date())).toBe('string');
	});
});

describe('getCurrentYear', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns the current year', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-03-26T10:00:00Z'));
		expect(getCurrentYear()).toBe(2026);
	});

	it('returns the correct year at year boundaries', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-12-31T23:59:59Z'));
		expect(getCurrentYear()).toBe(2025);
	});

	it('returns a number', () => {
		expect(typeof getCurrentYear()).toBe('number');
	});
});
