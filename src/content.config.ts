import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { articleSchema } from "./utils/contentSchema";

const blog = defineCollection({
	loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
	schema: articleSchema,
});

const posts = defineCollection({
	loader: glob({ base: "./src/content/posts", pattern: "**/*.{md,mdx}" }),
	schema: articleSchema,
});

export const collections = { blog, posts };
