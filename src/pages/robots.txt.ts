import type { APIRoute } from "astro";

export const prerender = true;

const robotsTxt = `
User-agent: *
Disallow: /_astro/

Sitemap: https://cloudac7.tomori.xyz/sitemap-index.xml
`.trim();

export const GET: APIRoute = () => {
	return new Response(robotsTxt, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
		},
	});
};
