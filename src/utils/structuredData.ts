import { AUTHOR_NAME, AUTHOR_PATH, AUTHOR_SAME_AS } from '../consts';

/**
 * schema.org builders for JSON-LD. Kept as plain functions so the output shape
 * can be unit-tested without rendering Astro components.
 */

export interface PersonSchema {
	'@type': 'Person';
	name: string;
	url: string;
	sameAs: string[];
}

export function buildPersonSchema(site: URL | string, name: string = AUTHOR_NAME): PersonSchema {
	return {
		'@type': 'Person',
		name,
		url: new URL(AUTHOR_PATH, site).toString(),
		sameAs: [...AUTHOR_SAME_AS],
	};
}

export interface ArticleSchemaInput {
	site: URL | string;
	canonicalURL: URL | string;
	title: string;
	description: string;
	image: string;
	pubDate: Date;
	updatedDate?: Date;
	author?: string;
	wordCount?: number;
}

export function buildArticleSchema(input: ArticleSchemaInput): Record<string, unknown> {
	const { site, canonicalURL, title, description, image, pubDate, updatedDate, author, wordCount } = input;
	return {
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: title,
		description,
		image: new URL(image, site).toString(),
		datePublished: pubDate.toISOString(),
		// Only emitted when the article was substantively revised (updatedDate set).
		...(updatedDate ? { dateModified: updatedDate.toISOString() } : {}),
		author: buildPersonSchema(site, author ?? AUTHOR_NAME),
		publisher: {
			'@type': 'Organization',
			name: 'Low Hanging Data',
			url: new URL('/', site).toString(),
			logo: {
				'@type': 'ImageObject',
				url: new URL('/favicon.svg', site).toString(),
			},
		},
		mainEntityOfPage: {
			'@type': 'WebPage',
			'@id': canonicalURL.toString(),
		},
		...(wordCount !== undefined ? { wordCount } : {}),
	};
}
