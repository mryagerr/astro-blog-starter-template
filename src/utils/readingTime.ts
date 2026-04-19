export function calculateWordCount(body: string | null | undefined): number {
	return (body ?? '').split(/\s+/).filter(Boolean).length;
}

/**
 * Calculates estimated reading time in minutes based on word count.
 * Assumes ~200 words per minute. Always returns at least 1 minute.
 */
export function calculateReadingTime(body: string | null | undefined): number {
	return Math.max(1, Math.ceil(calculateWordCount(body) / 200));
}
