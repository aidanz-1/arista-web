<script lang="ts">
	let {
		header,
		children
	}: {
		header?: import("svelte").Snippet;
		children?: import("svelte").Snippet;
	} = $props();
</script>

<div class="app-shell h-screen min-h-0 flex flex-col text-token">
	{#if header}
		{@render header()}
	{/if}
	<main class="flex flex-1 min-h-0 flex-col overflow-y-auto overflow-x-hidden">
		{@render children?.()}
	</main>
</div>
