import { renderSitemap } from "$lib/seo";
import type { RequestHandler } from "./$types";

export const prerender = true;

export const GET: RequestHandler = () =>
	new Response(renderSitemap(), {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control": "public, max-age=3600"
		}
	});
