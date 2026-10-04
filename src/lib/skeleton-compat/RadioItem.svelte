<script lang="ts">
	let {
		group = $bindable(),
		name,
		value,
		children
	}: {
		group?: string;
		name?: string;
		value?: string;
		children?: import("svelte").Snippet;
	} = $props();
</script>

<label class:radio-item-selected={group === value} class="radio-item">
	<input class="radio-item-input" type="radio" bind:group {name} {value} />
	<span class="radio-item-label">{@render children?.()}</span>
</label>

<style>
	.radio-item {
		position: relative;
		display: flex;
		flex: 1 1 0;
		min-width: 0;
		border-radius: var(--radius-pill);
		color: var(--muted);
		cursor: pointer;
		transition:
			background-color var(--dur-2) var(--ease-out),
			color var(--dur-2) var(--ease-out);
	}
	:global(.radio-group-vertical) .radio-item {
		border-radius: var(--radius-field);
	}
	.radio-item-label {
		position: relative;
		z-index: 1;
		display: block;
		width: 100%;
		padding: 0.45rem 1rem;
		font-size: var(--text-sm);
		font-weight: 600;
		text-align: center;
		pointer-events: none;
	}
	.radio-item:hover:not(.radio-item-selected) {
		color: var(--ink);
	}
	.radio-item.radio-item-selected {
		background: var(--surface);
		color: var(--ink);
		box-shadow:
			0 1px 2px rgb(22 39 90 / 12%),
			0 0 0 1px var(--line);
	}
	.radio-item:has(input:focus-visible) {
		outline: 2px solid var(--focus);
		outline-offset: 2px;
	}
	.radio-item-input {
		position: absolute;
		inset: 0;
		width: 100% !important;
		height: 100% !important;
		margin: 0;
		opacity: 0;
		cursor: pointer;
	}
</style>
