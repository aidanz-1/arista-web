<script lang="ts">
	let {
		class: className = "",
		flexDirection = "flex-row",
		children
	}: {
		class?: string;
		flexDirection?: "flex-row" | "flex-col";
		children?: import("svelte").Snippet;
		[key: string]: unknown;
	} = $props();
</script>

<div
	class:radio-group-vertical={flexDirection === "flex-col"}
	class={`radio-group ${className}`}
	role="radiogroup"
>
	{@render children?.()}
</div>

<style>
	.radio-group {
		display: inline-flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		padding: 0.25rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-pill);
		background: var(--surface-sunken);
	}
	.radio-group.radio-group-vertical {
		display: flex;
		width: 100%;
		flex-direction: column;
		align-items: stretch;
		border-radius: var(--radius-panel);
	}
</style>
