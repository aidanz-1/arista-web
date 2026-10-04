<script lang="ts">
	import { onMount } from "svelte";
	import { browser } from "$app/environment";
	let platform = $state<"ios" | "android" | "other">("other");
	onMount(() => {
		if (!browser) return;
		const ua = navigator.userAgent.toLowerCase();
		platform = /iphone|ipad|ipod/.test(ua) ? "ios" : /android/.test(ua) ? "android" : "other";
	});
</script>

<svelte:head><title>Add ARISTA to your home screen</title></svelte:head>

<main class="page install">
	<header class="page-header">
		<div>
			<h1>Keep ARISTA on your home screen.</h1>
			<p>It opens like an app, so tutoring, events, and credits are one tap away.</p>
		</div>
	</header>

	<section class="install__options" aria-label="How to add ARISTA">
		<article class:current={platform === "ios"}>
			<h2>iPhone or iPad</h2>
			{#if platform === "ios"}<span class="badge badge--success">Your device</span>{/if}
			<ol>
				<li>Open this page in Safari.</li>
				<li>Tap the Share button.</li>
				<li>Choose Add to Home Screen.</li>
				<li>Tap Add.</li>
			</ol>
		</article>
		<article class:current={platform === "android"}>
			<h2>Android</h2>
			{#if platform === "android"}<span class="badge badge--success">Your device</span>{/if}
			<ol>
				<li>Open this page in Chrome.</li>
				<li>Open the menu in the top corner.</li>
				<li>Choose Install app or Add to Home screen.</li>
				<li>Confirm.</li>
			</ol>
		</article>
	</section>
</main>

<style>
	.install__options {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
	}
	article {
		display: grid;
		align-content: start;
		justify-items: start;
		gap: 0.75rem;
		padding: clamp(1.25rem, 3vw, 1.75rem);
		border: 1px solid var(--line);
		border-radius: var(--radius-panel);
		background: var(--surface);
	}
	article.current {
		border-color: transparent;
		background: var(--wash);
	}
	h2 {
		font-size: var(--text-lg);
	}
	ol {
		display: grid;
		gap: 0.5rem;
		margin: 0.25rem 0 0;
		padding-left: 1.25rem;
		color: var(--muted);
		list-style: decimal;
	}
	@media (max-width: 640px) {
		.install__options {
			grid-template-columns: 1fr;
		}
	}
</style>
