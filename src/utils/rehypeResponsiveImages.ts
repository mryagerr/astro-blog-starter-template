/**
 * Rehype plugin that adds loading="lazy" and decoding="async" to all
 * <img> elements in the Markdown/MDX AST. Uses nullish coalescing
 * assignment (??=) so it never overrides existing attributes.
 */
export interface HastNode {
	type: string;
	tagName?: string;
	properties?: Record<string, unknown>;
	children?: HastNode[];
}

export function rehypeResponsiveImages() {
	return function (tree: HastNode) {
		function visit(node: HastNode) {
			if (node.type === 'element' && node.tagName === 'img') {
				node.properties ??= {};
				node.properties.loading ??= 'lazy';
				node.properties.decoding ??= 'async';
			}
			if (node.children) {
				node.children.forEach(visit);
			}
		}
		visit(tree);
	};
}
