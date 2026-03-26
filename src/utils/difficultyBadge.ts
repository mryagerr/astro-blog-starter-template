export type Difficulty = 'low' | 'high';

/**
 * Returns the human-readable label for a difficulty level.
 */
export function getDifficultyLabel(difficulty: Difficulty): string {
	return difficulty === 'low' ? '🍎 Low Hanging Fruit' : '🌳 High Hanging Fruit';
}

/**
 * Returns the CSS class string for a difficulty badge.
 */
export function getDifficultyClass(difficulty: Difficulty): string {
	return `difficulty-badge difficulty-${difficulty}`;
}
