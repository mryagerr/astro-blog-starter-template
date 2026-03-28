import { z } from 'astro/zod';

/**
 * Shared Zod schema for both content collections (blog and posts).
 * Extracted here so it can be imported and tested independently of Astro's
 * virtual modules (astro:content, astro/loaders).
 */
export const articleSchema = z.object({
	title: z.string(),
	description: z.string(),
	pubDate: z.coerce.date(),
	updatedDate: z.coerce.date().optional(),
	heroImage: z.string().optional(),
	difficulty: z.enum(['low', 'high']).optional(),
});

export type ArticleData = z.infer<typeof articleSchema>;
