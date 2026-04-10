// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import cloudflare from "@astrojs/cloudflare";
import { rehypeResponsiveImages } from "./src/utils/rehypeResponsiveImages.ts";

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
