/**
 * Calculates estimated reading time in minutes based on word count.
 * Assumes ~200 words per minute. Always returns at least 1 minute.
 */
export function calculateReadingTime(body: string | null | undefined): number {
	const wordCount = (body ?? '').split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.ceil(wordCount / 200));
}
