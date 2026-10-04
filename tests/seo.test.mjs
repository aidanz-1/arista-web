import assert from "node:assert/strict";
import { test } from "node:test";
import {
	getPageSeo,
	isIndexablePage,
	isProductionSite,
	organizationSchema,
	renderRobots,
	renderSitemap,
	sitemapUrls,
	SITE_ORIGIN
} from "../src/lib/seo.ts";

test("public production pages have canonical URLs and indexable metadata", () => {
	for (const path of ["/", "/about", "/resources", "/faq", "/annual-report", "/install"]) {
		const seo = getPageSeo(new URL(path, SITE_ORIGIN));
		assert.equal(seo.indexable, true);
		assert.equal(seo.canonical, new URL(path, SITE_ORIGIN).href);
		assert.ok(seo.title.length > 0);
		assert.ok(seo.description.length > 0);
	}
});

test("canonicals retain meaningful resource tabs and remove tracking parameters", () => {
	for (const section of ["cram", "freshman"]) {
		const seo = getPageSeo(new URL(`/resources?section=${section}&utm_source=test`, SITE_ORIGIN));
		assert.equal(seo.canonical, `${SITE_ORIGIN}/resources?section=${section}`);
	}
	for (const section of ["guides", "unknown", "__proto__"]) {
		assert.equal(
			getPageSeo(new URL(`/resources?section=${section}`, SITE_ORIGIN)).canonical,
			`${SITE_ORIGIN}/resources`
		);
	}
});

test("private, auth, preview, and error pages are not indexable", () => {
	for (const path of [
		"/login",
		"/register",
		"/forgot-password",
		"/settings",
		"/admin",
		"/admin/credits",
		"/admin/permissions",
		"/tutoring",
		"/tutoring/guide",
		"/events",
		"/events/view/example",
		"/apply",
		"/leaderboard",
		"/mockups",
		"/api/leaderboard",
		"/missing"
	]) {
		assert.equal(isIndexablePage(new URL(path, SITE_ORIGIN)), false, path);
	}
	assert.equal(isIndexablePage(new URL("/", SITE_ORIGIN), 200, true), false);
	assert.equal(isIndexablePage(new URL("/about", SITE_ORIGIN), 404), false);
	assert.equal(isIndexablePage(new URL("/about", SITE_ORIGIN), 500), false);
	assert.equal(isIndexablePage(new URL("http://localhost:5173/")), false);
	assert.equal(isIndexablePage(new URL("https://arista-preview.vercel.app/")), false);
	assert.equal(isProductionSite(new URL("https://stuyarista.org/")), true);
	assert.equal(isProductionSite(new URL("https://www.stuyarista.org.example.com/")), false);
});

test("sitemap contains only unique canonical public pages", () => {
	assert.equal(new Set(sitemapUrls).size, sitemapUrls.length);
	for (const url of sitemapUrls) {
		assert.equal(getPageSeo(new URL(url)).indexable, true);
		assert.equal(getPageSeo(new URL(url)).canonical, url);
	}
	assert.match(
		renderSitemap(),
		/<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/
	);
	assert.equal((renderSitemap().match(/<loc>/g) ?? []).length, sitemapUrls.length);
	assert.equal(organizationSchema["@graph"][1].publisher["@id"], `${SITE_ORIGIN}/#organization`);
});

test("production robots allows crawling and advertises the sitemap; previews do not", () => {
	assert.equal(
		renderRobots(new URL(SITE_ORIGIN)),
		`User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`
	);
	assert.equal(renderRobots(new URL("http://127.0.0.1:5173/")), "User-agent: *\nDisallow: /\n");
	assert.equal(
		renderRobots(new URL("https://arista-preview.vercel.app/")),
		"User-agent: *\nDisallow: /\n"
	);
});
