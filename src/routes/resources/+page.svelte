<script lang="ts">
	import { page } from "$app/state";
	import { currentUser } from "$lib/pocketbase";
	import ExternalLinkIcon from "$lib/components/ExternalLinkIcon.svelte";
	import { getPageSeo } from "$lib/seo";

	type ResourceSection = "guides" | "cram" | "freshman";

	const sections = [
		{ key: "guides", label: "Study guides" },
		{ key: "cram", label: "Cram Central" },
		{ key: "freshman", label: "For freshmen" }
	] as const;

	const links = {
		guides: "https://drive.google.com/drive/folders/1be4chwo7CKO5FMtIEnk-M9HyczaV9zUb",
		cram: "https://docs.google.com/document/d/1MaEsfssTqSrw0O6xE4KWCzx4eMzBZgJWugvleDJmfMs/edit?usp=sharing",
		slides:
			"https://docs.google.com/presentation/d/175Cbn57TR8R3gi4jjRrRfUrOjPmYV83ZF9zkv4qLWAY/edit?usp=sharing",
		video: "https://drive.google.com/file/d/1VLqBZd2xlR37_qT4ZtN8xzGCrJArUhmF/view?usp=sharing",
		submit: "https://docs.google.com/forms/d/1AKZOa2zRA1-7KYSGudO5oQfU3oe-_DoGfoI5woJpzR8/viewform"
	};

	// Once the visible embed loads, mount the other sections too (hidden) so
	// switching tabs is instant and nothing reloads.
	let warmEmbeds = $state(false);
	let slidesWrap: HTMLDivElement | undefined = $state();
	let videoWrap: HTMLDivElement | undefined = $state();
	// iPhones can't put an iframe into real full screen, so fall back to a
	// fixed overlay that fills the viewport.
	let expanded: "slides" | "video" | null = $state(null);

	type FullscreenElement = HTMLElement & { webkitRequestFullscreen?: () => void };

	function goFullscreen(wrap: HTMLDivElement | undefined, key: "slides" | "video") {
		const el = wrap as FullscreenElement | undefined;
		if (!el) return;
		if (el.requestFullscreen && document.fullscreenEnabled) {
			el.requestFullscreen().catch(() => (expanded = key));
		} else if (el.webkitRequestFullscreen) {
			el.webkitRequestFullscreen();
		} else {
			expanded = key;
		}
	}

	$effect(() => {
		if (!expanded) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") expanded = null;
		};
		window.addEventListener("keydown", onKey);
		// Lift the page's scroll area above the navbar while the overlay is open.
		document.documentElement.classList.add("embed-open");
		return () => {
			window.removeEventListener("keydown", onKey);
			document.documentElement.classList.remove("embed-open");
		};
	});

	function warmInactiveEmbeds() {
		warmEmbeds = true;
	}

	const activeSection = $derived(
		(sections.some((section) => section.key === page.url.searchParams.get("section"))
			? page.url.searchParams.get("section")
			: "guides") as ResourceSection
	);
</script>

<svelte:head>
	<title>{getPageSeo(page.url).title}</title>
	<link rel="preconnect" href="https://docs.google.com" />
	<link rel="preconnect" href="https://drive.google.com" />
</svelte:head>

<main class="page resources">
	<header class="page-header">
		<div>
			<h1>Resources</h1>
		</div>
	</header>

	<nav class="tabs" aria-label="Resource sections">
		{#each sections as section}
			<a
				href={`/resources?section=${section.key}`}
				class:active={activeSection === section.key}
				aria-current={activeSection === section.key ? "page" : undefined}
				data-sveltekit-noscroll
				data-sveltekit-replacestate>{section.label}</a
			>
		{/each}
	</nav>

	<!-- Every section stays mounted once the first embed has loaded, and inactive
	     ones are only hidden, so switching tabs never reloads a document. -->
	<section class="resource" aria-label="Resource">
		{#if activeSection === "guides" || warmEmbeds}
			<div class="resource__section" hidden={activeSection !== "guides"}>
				<div class="resource__head">
					<div>
						<h2>Study guides</h2>
						<p>
							Notes, Quizlets, Kahoots, and review docs for courses across every grade, organized by
							subject.
						</p>
					</div>
					<a class="btn btn-primary" href={links.guides} target="_blank" rel="noreferrer"
						>Open in Google Drive <ExternalLinkIcon /></a
					>
				</div>
				<div class="embed">
					<iframe
						src="https://drive.google.com/embeddedfolderview?id=1be4chwo7CKO5FMtIEnk-M9HyczaV9zUb#grid"
						title="ARISTA study guide library"
						onload={warmInactiveEmbeds}
					></iframe>
				</div>
				<div class="notice member-note">
					<p>
						{#if $currentUser?.member}
							Made a study guide? Submit it for "other" credits. Each guide can earn up to 1 credit,
							depending on quality.
						{:else}
							Made a study guide that helped you? Submit it, and it may be added to the library for
							other students.
						{/if}
						Every format counts, including Quizlets, Kahoots, and handwritten notes.
					</p>
					<a class="btn" href={links.submit} target="_blank" rel="noreferrer"
						>Submit a study guide <ExternalLinkIcon /></a
					>
				</div>
			</div>
		{/if}

		{#if activeSection === "cram" || warmEmbeds}
			<div class="resource__section" hidden={activeSection !== "cram"}>
				<div class="resource__head">
					<h2>Cram Central</h2>
					<a class="btn btn-primary" href={links.cram} target="_blank" rel="noreferrer"
						>Open in Google Docs <ExternalLinkIcon /></a
					>
				</div>
				<div class="embed">
					<iframe
						src="https://docs.google.com/document/d/1MaEsfssTqSrw0O6xE4KWCzx4eMzBZgJWugvleDJmfMs/preview"
						title="Cram Central"
						onload={warmInactiveEmbeds}
					></iframe>
				</div>
			</div>
		{/if}

		{#if activeSection === "freshman" || warmEmbeds}
			<div class="resource__section" hidden={activeSection !== "freshman"}>
				<div class="resource__head">
					<h2>For freshmen</h2>
				</div>
				<div class="freshman">
					<article>
						<div class="freshman__head">
							<div>
								<h3>Orientation slides</h3>
							</div>
							<div class="freshman__actions">
								<button
									type="button"
									class="btn btn-sm"
									onclick={() => goFullscreen(slidesWrap, "slides")}
								>
									<svg viewBox="0 0 24 24" aria-hidden="true"
										><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg
									>
									Full screen
								</button>
								<a class="btn btn-sm" href={links.slides} target="_blank" rel="noreferrer"
									>Open in Slides <ExternalLinkIcon /></a
								>
							</div>
						</div>
						<div
							class="embed embed--wide"
							class:embed--expanded={expanded === "slides"}
							bind:this={slidesWrap}
						>
							{#if expanded === "slides"}
								<button type="button" class="embed__close" onclick={() => (expanded = null)}
									>Close</button
								>
							{/if}
							<iframe
								src="https://docs.google.com/presentation/d/175Cbn57TR8R3gi4jjRrRfUrOjPmYV83ZF9zkv4qLWAY/embed?start=false&loop=false&delayms=3000"
								title="Freshman orientation slides"
								allow="fullscreen"
								allowfullscreen
								onload={warmInactiveEmbeds}
							></iframe>
						</div>
					</article>
					<article>
						<div class="freshman__head">
							<div>
								<h3>Organizing your email</h3>
								<p>A short video on keeping a school inbox under control.</p>
							</div>
							<div class="freshman__actions">
								<button
									type="button"
									class="btn btn-sm"
									onclick={() => goFullscreen(videoWrap, "video")}
								>
									<svg viewBox="0 0 24 24" aria-hidden="true"
										><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg
									>
									Full screen
								</button>
								<a class="btn btn-sm" href={links.video} target="_blank" rel="noreferrer"
									>Open in Drive <ExternalLinkIcon /></a
								>
							</div>
						</div>
						<div
							class="embed embed--wide"
							class:embed--expanded={expanded === "video"}
							bind:this={videoWrap}
						>
							{#if expanded === "video"}
								<button type="button" class="embed__close" onclick={() => (expanded = null)}
									>Close</button
								>
							{/if}
							<iframe
								src="https://drive.google.com/file/d/1VLqBZd2xlR37_qT4ZtN8xzGCrJArUhmF/preview"
								title="Organizing your email video"
								allow="autoplay; fullscreen"
								allowfullscreen
							></iframe>
						</div>
					</article>
				</div>
			</div>
		{/if}
	</section>
</main>

<style>
	.resources {
		width: min(var(--tool-width), 100% - 2 * var(--gutter));
	}
	.tabs {
		display: inline-flex;
		gap: 0.25rem;
		max-width: 100%;
		padding: 0.3rem;
		overflow-x: auto;
		overflow-y: hidden;
		overscroll-behavior-x: contain;
		border: 1px solid var(--line);
		border-radius: var(--radius-pill);
		background: var(--surface-sunken);
	}
	.tabs a {
		display: inline-flex;
		align-items: center;
		min-height: 2.5rem;
		padding: 0.4rem 1.1rem;
		border-radius: var(--radius-pill);
		color: var(--muted);
		font-size: 0.9375rem;
		font-weight: 600;
		text-decoration: none;
		white-space: nowrap;
		transition:
			background-color var(--dur-2) var(--ease-out),
			color var(--dur-2) var(--ease-out);
	}
	.tabs a:hover {
		color: var(--ink);
	}
	/* All three sections fit on a phone instead of the last one scrolling away. */
	@media (max-width: 520px) {
		.tabs {
			display: flex;
			gap: 0;
			overflow: visible;
		}
		.tabs a {
			flex: 1 1 0;
			justify-content: center;
			padding: 0.4rem 0.45rem;
			font-size: var(--text-sm);
		}
	}
	.tabs a.active {
		background: var(--surface);
		color: var(--ink);
		box-shadow:
			0 1px 2px rgb(22 39 90 / 12%),
			0 0 0 1px var(--line);
	}

	.resource {
		margin-top: clamp(1.75rem, 4vw, 2.5rem);
		animation: resource-in var(--dur-3) var(--ease-out);
	}
	@keyframes resource-in {
		from {
			opacity: 0;
		}
	}
	.resource__head {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		justify-content: space-between;
		gap: 1rem 2rem;
	}
	.resource__head h2 {
		font-size: clamp(1.75rem, 3vw, var(--text-2xl));
	}
	.resource__head p {
		max-width: 40rem;
		margin: 0.5rem 0 0;
		color: var(--muted);
		font-size: var(--text-md);
	}
	.resource__head .btn :global(.external-link-icon),
	.freshman :global(.external-link-icon) {
		width: 0.95rem;
		height: 0.95rem;
	}

	.embed {
		height: clamp(24rem, 60vw, 42rem);
		margin-top: 1.5rem;
		overflow: hidden;
		border: 1px solid var(--line);
		border-radius: var(--radius-panel);
		background: #fff;
	}
	.embed iframe {
		display: block;
		width: 100%;
		height: 100%;
		border: 0;
	}
	/* Slides and video are 16:9; size the frame to the content, not a guess. */
	.embed--wide {
		height: auto;
		aspect-ratio: 16 / 9;
		margin-top: 0.85rem;
		background: #000;
	}
	.embed:fullscreen {
		border: 0;
		border-radius: 0;
		aspect-ratio: auto;
	}
	.embed--expanded {
		position: fixed;
		inset: 0;
		z-index: 200;
		height: 100dvh;
		margin: 0;
		padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom)
			env(safe-area-inset-left);
		border: 0;
		border-radius: 0;
		aspect-ratio: auto;
	}
	:global(html.embed-open .app-shell__scroll) {
		position: relative;
		z-index: 60;
	}
	.embed__close {
		position: absolute;
		top: calc(env(safe-area-inset-top) + 0.75rem);
		left: calc(env(safe-area-inset-left) + 0.75rem);
		z-index: 1;
		padding: 0.5rem 1rem;
		border: 0;
		border-radius: var(--radius-pill);
		background: rgb(0 0 0 / 70%);
		color: #fff;
		font-weight: 600;
	}
	.member-note {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem 1.25rem;
		margin: 1rem 0 0;
	}
	.member-note p {
		max-width: 60ch;
		margin: 0;
	}

	.freshman {
		display: grid;
		gap: clamp(1.5rem, 3vw, 2.5rem);
		margin-top: 1.75rem;
	}
	.freshman article {
		padding-top: clamp(1.5rem, 3vw, 2.25rem);
		border-top: 1px solid var(--line);
	}
	.freshman__head {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		justify-content: space-between;
		gap: 0.75rem 1.5rem;
	}
	.freshman h3 {
		font-size: var(--text-lg);
	}
	.freshman__head p {
		margin: 0.3rem 0 0;
		color: var(--muted);
	}
	.freshman__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	.freshman__actions svg {
		width: 1rem;
		height: 1rem;
		fill: none;
		stroke: currentcolor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 2;
	}
	.resource__section[hidden] {
		display: none;
	}
</style>
