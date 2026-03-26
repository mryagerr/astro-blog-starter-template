/**
 * Formats a Date into human-readable form: "Mar 15, 2024"
 * Uses the en-US locale for consistent output across environments.
 */
export function formatDate(date: Date): string {
	return date.toLocaleDateString('en-us', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
}

/**
 * Returns the current calendar year.
 * Extracted for testability (can be mocked via vi.useFakeTimers).
 */
export function getCurrentYear(): number {
	return new Date().getFullYear();
}
