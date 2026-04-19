import { z } from 'astro/zod';

/**
 * Shared Zod schema for both content collections (blog and posts).
 * Extracted here so it can be imported and tested independently of Astro's
 * virtual modules (astro:content, astro/loaders).
 */
export const VALID_TAGS = [
	'collection',
	'preparation',
	'pipelines',
	'analysis',
	'culture',
	'career',
] as const;

export type Tag = typeof VALID_TAGS[number];

export const TAG_LABELS: Record<Tag, string> = {
	collection: 'Collection',
	preparation: 'Preparation',
	pipelines: 'Pipelines',
	analysis: 'Analysis',
	culture: 'Culture & Communication',
	career: 'Career',
};

export const TAG_SLUGS: Record<Tag, string> = {
	collection: 'collection',
	preparation: 'preparation',
	pipelines: 'pipelines',
	analysis: 'analysis',
	culture: 'culture-and-communication',
	career: 'career',
};

export const TAG_DESCRIPTIONS: Record<Tag, string> = {
	collection: 'How to gather raw data from APIs, web scraping, streaming sources, and open data repositories.',
	preparation: 'Cleaning, reshaping, and validating data so it is ready for analysis or storage.',
	pipelines: 'Building, scheduling, and maintaining automated workflows that move data reliably from source to destination.',
	analysis: 'Extracting insight from clean data — from SQL aggregation and visualization to KPI design and ML experiments.',
	culture: 'The human side of analytics: communicating findings, building trust in your numbers, and driving real decisions.',
	career: 'Navigating the professional side of data work — roles, growth paths, and how to position yourself for impact.',
};

export const SLUG_TO_TAG: Record<string, Tag> = Object.fromEntries(
	Object.entries(TAG_SLUGS).map(([tag, slug]) => [slug, tag as Tag]),
) as Record<string, Tag>;

export const articleSchema = z.object({
	title: z.string(),
	description: z.string(),
	pubDate: z.coerce.date(),
	updatedDate: z.coerce.date().optional(),
	heroImage: z.string().optional(),
	difficulty: z.enum(['low', 'high']).optional(),
	tags: z.array(z.enum(VALID_TAGS)).optional(),
});

export type ArticleData = z.infer<typeof articleSchema>;
