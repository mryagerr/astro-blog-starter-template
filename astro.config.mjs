// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import cloudflare from "@astrojs/cloudflare";

/** @type {() => import('unified').Plugin} */
function rehypeResponsiveImages() {
	return function (tree) {
		/** @param {any} node */
		function visit(node) {
			if (node.type === "element" && node.tagName === "img") {
				node.properties.loading ??= "lazy";
				node.properties.decoding ??= "async";
			}
			if (node.children) {
				node.children.forEach(visit);
			}
		}
		visit(tree);
	};
}

// https://astro.build/config
export default defineConfig({
	site: "https://lowhangingdata.com",
	trailingSlash: "always",
	integrations: [mdx(), sitemap()],
	markdown: {
		rehypePlugins: [rehypeResponsiveImages],
	},
	adapter: cloudflare({
		platformProxy: {
			enabled: true,
		},
	}),
});
