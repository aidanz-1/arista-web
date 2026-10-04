import { renderRobots } from "$lib/seo";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = ({ url }) =>
	new Response(renderRobots(url), {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Cache-Control": "public, max-age=3600"
		}
	});
