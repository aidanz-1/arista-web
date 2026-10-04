<script lang="ts">
	let {
		checked = $bindable(false),
		name,
		active: _active,
		class: className = "",
		children,
		onclick,
		disabled = false,
		...rest
	}: {
		checked?: boolean;
		name?: string;
		active?: string;
		class?: string;
		children?: import("svelte").Snippet;
		onclick?: (event: MouseEvent) => void;
		disabled?: boolean;
		[key: string]: unknown;
	} = $props();

	function toggle(event: MouseEvent) {
		if (disabled) return;
		checked = !checked;
		onclick?.(event);
	}
</script>

<div class={`slide-toggle inline-flex items-center gap-3 ${className}`}>
	<input
		class="sr-only"
		type="checkbox"
		bind:checked
		{name}
		tabindex="-1"
		aria-hidden="true"
		{...rest}
	/>
	<button
		type="button"
		role="switch"
		aria-checked={checked}
		aria-label={name}
		class:slide-toggle-checked={checked}
		class="slide-toggle-control"
		{disabled}
		onclick={toggle}
	>
		<span class="slide-toggle-thumb"></span>
	</button>
	{#if children}
		<span class="slide-toggle-label">{@render children()}</span>
	{/if}
</div>

<style>
	.slide-toggle-control {
		appearance: none;
		display: inline-flex;
		align-items: center;
		width: 2.5rem;
		height: 1.5rem;
		min-width: 2.5rem !important;
		min-height: 1.5rem !important;
		padding: 0.1875rem;
		border: 0;
		border-radius: var(--radius-pill);
		background-color: var(--line-strong) !important;
		cursor: pointer;
		transition: background-color var(--dur-2) var(--ease-out);
	}
	.slide-toggle-control.slide-toggle-checked {
		background-color: var(--action) !important;
	}
	.slide-toggle-control:focus-visible {
		outline: 2px solid var(--focus);
		outline-offset: 2px;
	}
	.slide-toggle-control:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}
	.slide-toggle-thumb {
		display: block;
		width: 1.125rem;
		height: 1.125rem;
		border-radius: 50%;
		background: #fff;
		box-shadow: 0 1px 2px rgb(0 0 0 / 20%);
		transition: transform var(--dur-3) var(--ease-out);
	}
	.slide-toggle-checked .slide-toggle-thumb {
		transform: translateX(1rem);
	}
	.slide-toggle-label {
		min-width: 0;
	}
</style>
