<script lang="ts">
	import { getPageSeo, organizationSchema, publicPages, SITE_NAME, SOCIAL_IMAGE } from "$lib/seo";

	let {
		url,
		status = 200,
		signedIn = false
	}: { url: URL; status?: number; signedIn?: boolean } = $props();
	const seo = $derived(getPageSeo(url, status, signedIn));
	// Escape '<' even if future metadata includes user-supplied text.
	const structuredData = JSON.stringify(organizationSchema).replaceAll("<", "\\u003c");
</script>

<svelte:head>
	<title>{seo.title}</title>
	<meta name="description" content={seo.description} />
	<meta
		name="robots"
		content={seo.indexable ? "index, follow, max-image-preview:large" : "noindex, nofollow"}
	/>
	{#if (url.pathname === "/" || url.pathname === "/about") && !(url.pathname === "/" && signedIn) && status === 200}
		{@html `<script type="application/ld+json">${structuredData}</script>`}
	{/if}
	{#if Object.hasOwn(publicPages, url.pathname) && status === 200 && !(url.pathname === "/" && signedIn)}
		<link rel="canonical" href={seo.canonical} />
	{/if}
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:locale" content="en_US" />
	<meta property="og:title" content={seo.title} />
	<meta property="og:description" content={seo.description} />
	<meta property="og:url" content={seo.canonical} />
	<meta property="og:image" content={SOCIAL_IMAGE} />
	<meta property="og:image:width" content="1730" />
	<meta property="og:image:height" content="763" />
	<meta property="og:image:alt" content="Stuyvesant ARISTA members gathered for a group photo." />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={seo.title} />
	<meta name="twitter:description" content={seo.description} />
	<meta name="twitter:image" content={SOCIAL_IMAGE} />
	<meta name="twitter:image:alt" content="Stuyvesant ARISTA members gathered for a group photo." />
</svelte:head>
