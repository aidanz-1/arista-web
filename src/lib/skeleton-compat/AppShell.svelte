<script lang="ts">
	let {
		header,
		children
	}: {
		header?: import("svelte").Snippet;
		children?: import("svelte").Snippet;
	} = $props();
</script>

<a class="skip-link" href="#content">Skip to content</a>
<div class="app-shell h-screen min-h-0 flex flex-col text-token">
	{#if header}
		{@render header()}
	{/if}
	<div
		id="content"
		tabindex="-1"
		class="app-shell__scroll flex flex-1 min-h-0 flex-col overflow-y-auto overflow-x-hidden"
	>
		{@render children?.()}
	</div>
</div>

<style>
	.skip-link {
		position: fixed;
		top: 0.5rem;
		left: 0.5rem;
		z-index: 100;
		padding: 0.6rem 1rem;
		border-radius: var(--radius-pill);
		background: var(--surface);
		color: var(--ink);
		font-weight: 600;
		transform: translateY(-200%);
	}
	.skip-link:focus {
		transform: none;
	}
	#content:focus {
		outline: none;
	}
</style>
