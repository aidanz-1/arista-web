<script lang="ts">
	let {
		open = false,
		summary,
		content,
		children
	}: {
		open?: boolean;
		summary?: import("svelte").Snippet;
		content?: import("svelte").Snippet;
		children?: import("svelte").Snippet;
	} = $props();
</script>

<details class="accordion-item" {open}>
	<summary>
		<span class="accordion-item__title">
			{#if summary}
				{@render summary()}
			{:else}
				{@render children?.()}
			{/if}
		</span>
		<span class="accordion-item__icon" aria-hidden="true">
			<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
		</span>
	</summary>
	{#if content}
		<div class="accordion-item__body">
			{@render content()}
		</div>
	{/if}
</details>

<style>
	.accordion-item {
		border-bottom: 1px solid var(--line);
		interpolate-size: allow-keywords;
	}
	/* Browsers that support it animate the panel open; others simply show it. */
	.accordion-item::details-content {
		height: 0;
		overflow: clip;
		transition:
			height var(--dur-3) var(--ease-out),
			content-visibility var(--dur-3) allow-discrete;
	}
	.accordion-item[open]::details-content {
		height: auto;
	}
	summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		min-height: 3.75rem;
		padding: 0.9rem 0.25rem;
		list-style: none;
		cursor: pointer;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	summary:hover .accordion-item__icon {
		background: var(--wash);
	}
	.accordion-item__title :global(h3),
	.accordion-item__title :global(h4) {
		color: var(--ink);
		font-family: var(--font-text);
		font-size: var(--text-md);
		font-weight: 600;
		letter-spacing: 0;
		line-height: 1.4;
	}
	.accordion-item__icon {
		display: grid;
		flex: 0 0 auto;
		place-items: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 50%;
		color: var(--muted);
		transition:
			background-color var(--dur-2) var(--ease-out),
			transform var(--dur-3) var(--ease-out);
	}
	.accordion-item[open] .accordion-item__icon {
		transform: rotate(45deg);
	}
	.accordion-item__icon svg {
		width: 1.1rem;
		height: 1.1rem;
		fill: none;
		stroke: currentcolor;
		stroke-linecap: round;
		stroke-width: 2;
	}
	.accordion-item__body {
		max-width: 46rem;
		padding: 0 0.25rem 1.5rem;
		color: var(--muted);
		line-height: 1.7;
	}
	.accordion-item__body :global(p) {
		margin: 0 0 0.85rem;
	}
	.accordion-item__body :global(h4) {
		margin: 1rem 0 0.35rem;
		color: var(--ink);
		font-size: var(--text-base);
		font-weight: 650;
	}
	.accordion-item__body :global(ul) {
		margin: 0.35rem 0 0.85rem;
		padding-left: 1.2rem;
		list-style: disc;
	}
	.accordion-item__body :global(ol) {
		margin: 0.35rem 0 0.85rem;
		padding-left: 1.2rem;
		list-style: decimal;
	}
	.accordion-item__body :global(li) {
		margin: 0.3rem 0;
	}
	.accordion-item__body :global(a) {
		color: var(--link);
		font-weight: 600;
	}
	.accordion-item__body :global(strong),
	.accordion-item__body :global(.font-bold) {
		color: var(--ink);
	}
	.accordion-item__body :global(.underline) {
		text-decoration: none;
	}
</style>
