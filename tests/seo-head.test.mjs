import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { compile } from "svelte/compiler";
import { render } from "svelte/server";
import { SITE_ORIGIN } from "../src/lib/seo.ts";

const source = readFileSync(new URL("../src/lib/components/Seo.svelte", import.meta.url), "utf8");
const code = compile(source, { generate: "server", filename: "Seo.svelte" })
	.js.code.replace(
		/from (["'])(svelte(?:\/[^"']+)?)\1/g,
		(_, quote, name) => `from ${JSON.stringify(import.meta.resolve(name))}`
	)
	.replace(
		'from "$lib/seo"',
		`from ${JSON.stringify(new URL("../src/lib/seo.ts", import.meta.url).href)}`
	);
const { default: Seo } = await import(
	`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
);

test("production HTML includes a canonical, social previews, and valid organization data", async () => {
	const result = await render(Seo, { props: { url: new URL(SITE_ORIGIN) } });
	const head = result.head;
	assert.match(head, /name="robots" content="index, follow, max-image-preview:large"/);
	assert.match(head, /rel="canonical" href="https:\/\/www.stuyarista.org\/"/);
	assert.match(head, /property="og:image"/);
	assert.match(head, /name="twitter:card" content="summary_large_image"/);
	assert.equal((head.match(/name="description"/g) ?? []).length, 1);
	const structured = JSON.parse(
		head.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]
	);
	assert.equal(structured["@graph"][0]["@type"], "Organization");
	assert.equal(structured["@graph"][1]["@type"], "WebSite");
});

test("resource tab titles, canonicals, and sharing titles agree", async () => {
	const { head } = await render(Seo, {
		props: { url: new URL("/resources?section=cram", SITE_ORIGIN) }
	});
	assert.match(head, /<title>Cram Central \| Stuyvesant ARISTA<\/title>/);
	assert.match(head, /property="og:title" content="Cram Central \| Stuyvesant ARISTA"/);
	assert.match(
		head,
		/rel="canonical" href="https:\/\/www.stuyarista.org\/resources\?section=cram"/
	);
});

test("account pages and signed-in home do not emit public canonical or organization data", async () => {
	for (const props of [
		{ url: new URL("/settings", SITE_ORIGIN) },
		{ url: new URL(SITE_ORIGIN), signedIn: true },
		{ url: new URL("/about", SITE_ORIGIN), status: 500 }
	]) {
		const { head } = await render(Seo, { props });
		assert.match(head, /name="robots" content="noindex, nofollow"/);
		assert.doesNotMatch(head, /rel="canonical"/);
		assert.doesNotMatch(head, /application\/ld\+json/);
	}
});
